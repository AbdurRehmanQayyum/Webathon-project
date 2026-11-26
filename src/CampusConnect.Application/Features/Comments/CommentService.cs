using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Comments;

public sealed record CreateCommentRequest(string Body, int? ParentCommentId);

public sealed record UpdateCommentRequest(string Body);

public sealed record CommentDto
{
    public required int Id { get; init; }
    public required int PostId { get; init; }
    public int? ParentCommentId { get; init; }
    public string? Body { get; init; }
    public required ContentStatus Status { get; init; }
    public required UserSummaryDto Author { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public DateTime? EditedAtUtc { get; init; }
    public required bool CanEdit { get; init; }
    public required bool CanDelete { get; init; }
}

public sealed class CreateCommentRequestValidator : AbstractValidator<CreateCommentRequest>
{
    public CreateCommentRequestValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MaximumLength(4000);
    }
}

public sealed class UpdateCommentRequestValidator : AbstractValidator<UpdateCommentRequest>
{
    public UpdateCommentRequestValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MaximumLength(4000);
    }
}

public interface ICommentService
{
    Task<IReadOnlyList<CommentDto>> ListAsync(int postId, CancellationToken cancellationToken);
    Task<int> CreateAsync(int postId, CreateCommentRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int commentId, UpdateCommentRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(int commentId, CancellationToken cancellationToken);
}

public sealed class CommentService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IClubAccess clubAccess,
    INotificationService notifications,
    ILiveUpdates liveUpdates,
    TimeProvider clock) : ICommentService
{
    private const int ThreadLimit = 1000;

    // Flat list; the client assembles the reply tree from ParentCommentId
    public async Task<IReadOnlyList<CommentDto>> ListAsync(int postId, CancellationToken cancellationToken)
    {
        var post = await db.Posts
            .Where(p => p.Id == postId && p.Status != (byte)ContentStatus.Deleted)
            .Select(p => new { p.ClubId, p.AuthorId, p.Status })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Post");

        var canModerate = await clubAccess.CanModerateAsync(post.ClubId, cancellationToken);
        if (post.Status == (byte)ContentStatus.Removed && !canModerate && post.AuthorId != currentUser.Id)
        {
            throw new NotFoundException("Post");
        }

        var userId = currentUser.Id;
        return await db.Comments.AsNoTracking()
            .Where(c => c.PostId == postId)
            .OrderBy(c => c.CreatedAtUtc)
            .ThenBy(c => c.Id)
            .Take(ThreadLimit)
            .Select(c => new CommentDto
            {
                Id = c.Id,
                PostId = c.PostId,
                ParentCommentId = c.ParentCommentId,
                Body = c.Status == (byte)ContentStatus.Published ? c.Body : null,
                Status = (ContentStatus)c.Status,
                Author = new UserSummaryDto(c.AuthorId, c.Author.FullName, c.Author.Title, c.Author.AvatarFileId),
                CreatedAtUtc = c.CreatedAtUtc,
                EditedAtUtc = c.EditedAtUtc,
                CanEdit = c.Status == (byte)ContentStatus.Published
                    && c.AuthorId == userId
                    && c.Post.Club.Status == (byte)ClubStatus.Active,
                CanDelete = c.Status == (byte)ContentStatus.Published
                    && (c.AuthorId == userId || canModerate)
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CreateAsync(
        int postId, CreateCommentRequest request, CancellationToken cancellationToken)
    {
        var post = await db.Posts
            .Where(p => p.Id == postId && p.Status == (byte)ContentStatus.Published)
            .Select(p => new { p.ClubId, p.AuthorId, p.Title })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Post");

        await clubAccess.EnsureCanParticipateAsync(post.ClubId, cancellationToken);

        int? parentAuthorId = null;
        if (request.ParentCommentId is { } parentId)
        {
            parentAuthorId = await db.Comments
                .Where(c => c.Id == parentId
                    && c.PostId == postId
                    && c.Status == (byte)ContentStatus.Published)
                .Select(c => (int?)c.AuthorId)
                .SingleOrDefaultAsync(cancellationToken)
                ?? throw new RequestValidationException(
                    "parentCommentId", "The comment you are replying to is no longer available.");
        }

        var comment = new Comment
        {
            PostId = postId,
            AuthorId = currentUser.Id,
            ParentCommentId = request.ParentCommentId,
            Body = request.Body.Trim(),
            Status = (byte)ContentStatus.Published
        };
        db.Comments.Add(comment);

        // Notifications
        if (parentAuthorId is { } replyRecipient)
        {
            notifications.Queue(
                replyRecipient,
                NotificationType.ReplyToComment,
                $"Someone replied to your comment on \"{post.Title}\".",
                $"/posts/{postId}");
        }

        if (post.AuthorId != parentAuthorId)
        {
            notifications.Queue(
                post.AuthorId,
                NotificationType.CommentOnPost,
                $"New comment on your post \"{post.Title}\".",
                $"/posts/{postId}");
        }

        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.CommentsChanged(postId);
        return comment.Id;
    }

    public async Task UpdateAsync(
        int commentId, UpdateCommentRequest request, CancellationToken cancellationToken)
    {
        var (comment, clubId) = await FindPublishedAsync(commentId, cancellationToken);
        if (comment.AuthorId != currentUser.Id)
        {
            throw new ForbiddenException("Only the author can edit this comment.");
        }

        await clubAccess.EnsureCanParticipateAsync(clubId, cancellationToken);

        comment.Body = request.Body.Trim();
        comment.EditedAtUtc = clock.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.CommentsChanged(comment.PostId);
    }

    public async Task DeleteAsync(int commentId, CancellationToken cancellationToken)
    {
        var (comment, clubId) = await FindPublishedAsync(commentId, cancellationToken);
        if (comment.AuthorId == currentUser.Id)
        {
            comment.Status = (byte)ContentStatus.Deleted;
        }
        else
        {
            await clubAccess.EnsureCanModerateAsync(clubId, cancellationToken);
            comment.Status = (byte)ContentStatus.Removed;
            comment.ModeratedByUserId = currentUser.Id;
        }

        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.CommentsChanged(comment.PostId);
    }

    private async Task<(Comment Comment, int ClubId)> FindPublishedAsync(
        int commentId, CancellationToken cancellationToken)
    {
        var match = await db.Comments
            .Where(c => c.Id == commentId
                && c.Status == (byte)ContentStatus.Published
                && c.Post.Status == (byte)ContentStatus.Published)
            .Select(c => new { Comment = c, c.Post.ClubId })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Comment");

        return (match.Comment, match.ClubId);
    }
}
