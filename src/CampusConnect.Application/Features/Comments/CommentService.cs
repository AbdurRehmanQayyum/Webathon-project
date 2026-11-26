using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Content;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Application.Features.Posts;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Comments;

public enum CommentSort
{
    Recent,
    Oldest,
    Popular
}

// Pages count top-level threads; every reply of a listed thread is included
public sealed record CommentQuery : PageQuery
{
    public CommentSort Sort { get; init; } = CommentSort.Recent;
}

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
    public required string AuthorUsername { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public DateTime? EditedAtUtc { get; init; }
    public required int Score { get; init; }
    public required int MyVote { get; init; }
    public required bool CanEdit { get; init; }
    public required bool CanDelete { get; init; }
    public required bool CanReact { get; init; }
}

public static class CommentRules
{
    public const int MaxTextLength = 4_000;
    public const int MaxMarkupLength = 16_000;
}

public sealed class CreateCommentRequestValidator : AbstractValidator<CreateCommentRequest>
{
    public CreateCommentRequestValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MaximumLength(CommentRules.MaxMarkupLength);
    }
}

public sealed class UpdateCommentRequestValidator : AbstractValidator<UpdateCommentRequest>
{
    public UpdateCommentRequestValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MaximumLength(CommentRules.MaxMarkupLength);
    }
}

public interface ICommentService
{
    Task<PagedResult<CommentDto>> ListAsync(int postId, CommentQuery query, CancellationToken cancellationToken);
    Task<int> CreateAsync(int postId, CreateCommentRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int commentId, UpdateCommentRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(int commentId, CancellationToken cancellationToken);
    Task<VoteResultDto> VoteAsync(int commentId, VoteRequest request, CancellationToken cancellationToken);
}

public sealed class CommentService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IClubAccess clubAccess,
    ContentProcessor content,
    INotificationService notifications,
    ILiveUpdates liveUpdates,
    TimeProvider clock) : ICommentService
{
    public async Task<PagedResult<CommentDto>> ListAsync(
        int postId, CommentQuery query, CancellationToken cancellationToken)
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

        // Removed threads stay listed only while they still have visible replies
        var roots = db.Comments.AsNoTracking()
            .Where(c => c.PostId == postId
                && c.ParentCommentId == null
                && (c.Status == (byte)ContentStatus.Published
                    || c.InverseRootComment.Any(r => r.Status == (byte)ContentStatus.Published)));

        // Ids break ties between comments created within the same second
        var ordered = query.Sort switch
        {
            CommentSort.Popular => roots
                .OrderByDescending(c => c.CommentVotes.Sum(v => (int)v.Value))
                .ThenByDescending(c => c.CreatedAtUtc)
                .ThenByDescending(c => c.Id),
            CommentSort.Oldest => roots.OrderBy(c => c.CreatedAtUtc).ThenBy(c => c.Id),
            _ => roots.OrderByDescending(c => c.CreatedAtUtc).ThenByDescending(c => c.Id)
        };
        var page = await ordered.ToPagedResultAsync(
            query, items => items.Select(c => c.Id), cancellationToken);
        var rootIds = page.Items.ToList();

        var userId = currentUser.Id;
        var canRemove = currentUser.IsAdmin
            || (canModerate && currentUser.Has(PermissionKeys.ModerateComments));
        var canReact = currentUser.Has(PermissionKeys.ReactToComments);

        var comments = await db.Comments.AsNoTracking()
            .Where(c => rootIds.Contains(c.Id)
                || (c.RootCommentId != null && rootIds.Contains(c.RootCommentId.Value)))
            .OrderBy(c => c.CreatedAtUtc)
            .ThenBy(c => c.Id)
            .Select(c => new CommentDto
            {
                Id = c.Id,
                PostId = c.PostId,
                ParentCommentId = c.ParentCommentId,
                Body = c.Status == (byte)ContentStatus.Published ? c.Body : null,
                Status = (ContentStatus)c.Status,
                Author = new UserSummaryDto(c.AuthorId, c.Author.FullName, c.Author.Title, c.Author.AvatarFileId),
                AuthorUsername = c.Author.Username,
                CreatedAtUtc = c.CreatedAtUtc,
                EditedAtUtc = c.EditedAtUtc,
                Score = c.CommentVotes.Sum(v => (int)v.Value),
                MyVote = c.CommentVotes.Where(v => v.UserId == userId).Select(v => (int)v.Value).FirstOrDefault(),
                CanEdit = c.Status == (byte)ContentStatus.Published
                    && c.AuthorId == userId
                    && c.Post.Club.Status == (byte)ClubStatus.Active,
                CanDelete = c.Status == (byte)ContentStatus.Published
                    && (c.AuthorId == userId || canRemove),
                CanReact = canReact && c.Status == (byte)ContentStatus.Published
            })
            .ToListAsync(cancellationToken);

        // Threads keep the requested order; replies stay chronological
        var sorted = comments
            .OrderBy(c => c.ParentCommentId is null ? rootIds.IndexOf(c.Id) : int.MaxValue)
            .ToList();

        return new PagedResult<CommentDto>(sorted, page.PageNumber, page.PageSize, page.TotalCount);
    }

    public async Task<int> CreateAsync(
        int postId, CreateCommentRequest request, CancellationToken cancellationToken)
    {
        currentUser.Require(PermissionKeys.CreateComments);
        var post = await db.Posts
            .Where(p => p.Id == postId && p.Status == (byte)ContentStatus.Published)
            .Select(p => new { p.ClubId, p.AuthorId, p.Title })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Post");

        await clubAccess.EnsureCanParticipateAsync(post.ClubId, cancellationToken);

        var parent = request.ParentCommentId is not { } parentId
            ? null
            : await db.Comments
                .Where(c => c.Id == parentId
                    && c.PostId == postId
                    && c.Status == (byte)ContentStatus.Published)
                .Select(c => new { c.Id, c.AuthorId, c.RootCommentId })
                .SingleOrDefaultAsync(cancellationToken)
                ?? throw new RequestValidationException(
                    "parentCommentId", "The comment you are replying to is no longer available.");

        var processed = await ProcessAsync(request.Body, cancellationToken);
        var comment = new Comment
        {
            PostId = postId,
            AuthorId = currentUser.Id,
            ParentCommentId = parent?.Id,
            RootCommentId = parent is null ? null : parent.RootCommentId ?? parent.Id,
            Body = processed.Html,
            Status = (byte)ContentStatus.Published,
            Tags = [.. processed.Tags]
        };
        db.Comments.Add(comment);

        // Notifications: each person hears about a comment once
        var link = $"/posts/{postId}";
        var notified = new HashSet<int>();
        if (parent is not null && notified.Add(parent.AuthorId))
        {
            notifications.Queue(
                parent.AuthorId,
                NotificationType.ReplyToComment,
                $"Replied to your comment on \"{post.Title}\".",
                link);
        }

        foreach (var userId in processed.NewMentions(null).Where(notified.Add))
        {
            notifications.Queue(
                userId, NotificationType.Mention, $"You were mentioned in a comment on \"{post.Title}\".", link);
        }

        if (notified.Add(post.AuthorId))
        {
            notifications.Queue(
                post.AuthorId, NotificationType.CommentOnPost, $"Commented on your post \"{post.Title}\".", link);
        }

        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.CommentsChanged(postId);
        return comment.Id;
    }

    public async Task UpdateAsync(
        int commentId, UpdateCommentRequest request, CancellationToken cancellationToken)
    {
        currentUser.Require(PermissionKeys.CreateComments);
        var (comment, clubId) = await FindPublishedAsync(commentId, cancellationToken);
        if (comment.AuthorId != currentUser.Id)
        {
            throw new ForbiddenException("Only the author can edit this comment.");
        }

        await clubAccess.EnsureCanParticipateAsync(clubId, cancellationToken);

        var processed = await ProcessAsync(request.Body, cancellationToken);
        foreach (var userId in processed.NewMentions(comment.Body))
        {
            notifications.Queue(
                userId, NotificationType.Mention, "You were mentioned in a comment.", $"/posts/{comment.PostId}");
        }

        await db.Comments.Entry(comment).Collection(c => c.Tags).LoadAsync(cancellationToken);
        comment.Tags.Clear();
        foreach (var tag in processed.Tags)
        {
            comment.Tags.Add(tag);
        }

        comment.Body = processed.Html;
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
            await clubAccess.EnsureCanModerateAsync(
                clubId, PermissionKeys.ModerateComments, cancellationToken);
            comment.Status = (byte)ContentStatus.Removed;
            comment.ModeratedByUserId = currentUser.Id;
        }

        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.CommentsChanged(comment.PostId);
    }

    public async Task<VoteResultDto> VoteAsync(
        int commentId, VoteRequest request, CancellationToken cancellationToken)
    {
        currentUser.Require(PermissionKeys.ReactToComments);
        var (comment, _) = await FindPublishedAsync(commentId, cancellationToken);
        var userId = currentUser.Id;
        var vote = await db.CommentVotes.SingleOrDefaultAsync(
            v => v.CommentId == commentId && v.UserId == userId, cancellationToken);

        if (request.Value == 0)
        {
            if (vote is not null)
            {
                db.CommentVotes.Remove(vote);
            }
        }
        else if (vote is null)
        {
            db.CommentVotes.Add(new CommentVote
            {
                CommentId = commentId,
                UserId = userId,
                Value = (short)request.Value
            });
        }
        else
        {
            vote.Value = (short)request.Value;
        }

        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.CommentsChanged(comment.PostId);

        var score = await db.CommentVotes
            .Where(v => v.CommentId == commentId)
            .SumAsync(v => (int)v.Value, cancellationToken);

        return new VoteResultDto(score, request.Value);
    }

    private async Task<ProcessedContent> ProcessAsync(string body, CancellationToken cancellationToken)
    {
        var processed = await content.ProcessAsync(
            body, "body", CommentRules.MaxTextLength, null, cancellationToken);

        return processed.IsBlank
            ? throw new RequestValidationException("body", "Write a comment first.")
            : processed;
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
