using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Application.Features.Posts;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusConnect.Application.Features.Moderation;

public interface IModerationService
{
    Task<IReadOnlyList<ModeratedClubDto>> GetClubsAsync(CancellationToken cancellationToken);
    Task<PagedResult<PostDto>> GetPostsAsync(int clubId, ModerationQuery query, CancellationToken cancellationToken);
    Task<PagedResult<ModerationCommentDto>> GetCommentsAsync(
        int clubId, ModerationQuery query, CancellationToken cancellationToken);
    Task SetPinnedAsync(int postId, SetPinnedRequest request, CancellationToken cancellationToken);
    Task RemovePostAsync(int postId, RemoveContentRequest request, CancellationToken cancellationToken);
    Task RestorePostAsync(int postId, CancellationToken cancellationToken);
    Task RemoveCommentAsync(int commentId, CancellationToken cancellationToken);
    Task RestoreCommentAsync(int commentId, CancellationToken cancellationToken);
}

public sealed class ModerationService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IClubAccess clubAccess,
    INotificationService notifications,
    ILiveUpdates liveUpdates,
    ILogger<ModerationService> logger) : IModerationService
{
    private const int MaxPinnedPerClub = 3;

    public async Task<IReadOnlyList<ModeratedClubDto>> GetClubsAsync(CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        var isAdmin = currentUser.IsAdmin;

        return await db.Clubs.AsNoTracking()
            .Where(c => isAdmin || c.ClubModerators.Any(m => m.UserId == userId))
            .OrderBy(c => c.Name)
            .Select(c => new ModeratedClubDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                IconKey = c.Category.IconKey,
                LogoFileId = c.LogoFileId,
                MemberCount = c.ClubMembers.Count,
                PublishedPostCount = c.Posts.Count(p => p.Status == (byte)ContentStatus.Published),
                RemovedPostCount = c.Posts.Count(p => p.Status == (byte)ContentStatus.Removed),
                PinnedPostCount = c.Posts.Count(p => p.IsPinned)
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<PostDto>> GetPostsAsync(
        int clubId, ModerationQuery query, CancellationToken cancellationToken)
    {
        await clubAccess.EnsureCanModerateAsync(clubId, cancellationToken);

        var posts = db.Posts.AsNoTracking()
            .Where(p => p.ClubId == clubId && p.Status != (byte)ContentStatus.Deleted);

        if (query.Status is { } status)
        {
            posts = posts.Where(p => p.Status == (byte)status);
        }

        if (query.Search is { } search)
        {
            posts = posts.Where(p => p.Title.Contains(search) || p.Author.FullName.Contains(search));
        }

        return await posts
            .OrderByDescending(p => p.IsPinned)
            .ThenByDescending(p => p.CreatedAtUtc)
            .ThenByDescending(p => p.Id)
            .ToDto(currentUser.Id, currentUser.IsAdmin)
            .ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<PagedResult<ModerationCommentDto>> GetCommentsAsync(
        int clubId, ModerationQuery query, CancellationToken cancellationToken)
    {
        await clubAccess.EnsureCanModerateAsync(clubId, cancellationToken);

        var comments = db.Comments.AsNoTracking()
            .Where(c => c.Post.ClubId == clubId
                && c.Status != (byte)ContentStatus.Deleted
                && c.Post.Status != (byte)ContentStatus.Deleted);

        if (query.Status is { } status)
        {
            comments = comments.Where(c => c.Status == (byte)status);
        }

        if (query.Search is { } search)
        {
            comments = comments.Where(c => c.Body.Contains(search) || c.Author.FullName.Contains(search));
        }

        return await comments
            .OrderByDescending(c => c.CreatedAtUtc)
            .ThenByDescending(c => c.Id)
            .Select(c => new ModerationCommentDto
            {
                Id = c.Id,
                PostId = c.PostId,
                PostTitle = c.Post.Title,
                Body = c.Body,
                Status = (ContentStatus)c.Status,
                Author = new UserSummaryDto(
                    c.AuthorId, c.Author.FullName, c.Author.Title, c.Author.AvatarFileId),
                CreatedAtUtc = c.CreatedAtUtc
            })
            .ToPagedResultAsync(query, cancellationToken);
    }

    public async Task SetPinnedAsync(int postId, SetPinnedRequest request, CancellationToken cancellationToken)
    {
        var post = await FindModeratedPostAsync(postId, cancellationToken);

        if (request.IsPinned)
        {
            if (post.Status != (byte)ContentStatus.Published)
            {
                throw new ConflictException("Only published posts can be pinned.");
            }

            var pinned = await db.Posts.CountAsync(
                p => p.ClubId == post.ClubId && p.IsPinned && p.Id != postId, cancellationToken);
            if (pinned >= MaxPinnedPerClub)
            {
                throw new ConflictException($"A club can pin up to {MaxPinnedPerClub} posts. Unpin one first.");
            }
        }

        post.IsPinned = request.IsPinned;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RemovePostAsync(
        int postId, RemoveContentRequest request, CancellationToken cancellationToken)
    {
        var post = await FindModeratedPostAsync(postId, cancellationToken);
        EnsureStatus(post.Status, ContentStatus.Published, "This post is already removed.");

        post.Status = (byte)ContentStatus.Removed;
        post.IsPinned = false;
        post.ModeratedByUserId = currentUser.Id;
        post.ModerationReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        notifications.Queue(
            post.AuthorId,
            NotificationType.ContentRemoved,
            $"A moderator removed your post \"{post.Title}\".",
            $"/posts/{post.Id}");
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Post {PostId} removed by {UserId}", postId, currentUser.Id);
    }

    public async Task RestorePostAsync(int postId, CancellationToken cancellationToken)
    {
        var post = await FindModeratedPostAsync(postId, cancellationToken);
        EnsureStatus(post.Status, ContentStatus.Removed, "Only removed posts can be restored.");

        post.Status = (byte)ContentStatus.Published;
        post.ModeratedByUserId = null;
        post.ModerationReason = null;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveCommentAsync(int commentId, CancellationToken cancellationToken)
    {
        var comment = await FindModeratedCommentAsync(commentId, cancellationToken);
        EnsureStatus(comment.Status, ContentStatus.Published, "This comment is already removed.");

        comment.Status = (byte)ContentStatus.Removed;
        comment.ModeratedByUserId = currentUser.Id;
        notifications.Queue(
            comment.AuthorId,
            NotificationType.ContentRemoved,
            "A moderator removed one of your comments.",
            $"/posts/{comment.PostId}");
        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.CommentsChanged(comment.PostId);
        logger.LogInformation("Comment {CommentId} removed by {UserId}", commentId, currentUser.Id);
    }

    public async Task RestoreCommentAsync(int commentId, CancellationToken cancellationToken)
    {
        var comment = await FindModeratedCommentAsync(commentId, cancellationToken);
        EnsureStatus(comment.Status, ContentStatus.Removed, "Only removed comments can be restored.");

        comment.Status = (byte)ContentStatus.Published;
        comment.ModeratedByUserId = null;
        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.CommentsChanged(comment.PostId);
    }

    private async Task<Post> FindModeratedPostAsync(int postId, CancellationToken cancellationToken)
    {
        var post = await db.Posts.SingleOrDefaultAsync(
            p => p.Id == postId && p.Status != (byte)ContentStatus.Deleted, cancellationToken)
            ?? throw new NotFoundException("Post");

        await clubAccess.EnsureCanModerateAsync(post.ClubId, cancellationToken);
        return post;
    }

    private async Task<Comment> FindModeratedCommentAsync(int commentId, CancellationToken cancellationToken)
    {
        var match = await db.Comments
            .Where(c => c.Id == commentId && c.Status != (byte)ContentStatus.Deleted)
            .Select(c => new { Comment = c, c.Post.ClubId })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Comment");

        await clubAccess.EnsureCanModerateAsync(match.ClubId, cancellationToken);
        return match.Comment;
    }

    private static void EnsureStatus(byte actual, ContentStatus expected, string message)
    {
        if (actual != (byte)expected)
        {
            throw new ConflictException(message);
        }
    }
}
