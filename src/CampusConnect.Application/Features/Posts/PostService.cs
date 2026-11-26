using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Content;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Application.Features.Recommendations;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Posts;

public interface IPostService
{
    Task<PagedResult<PostDto>> ListAsync(PostQuery query, CancellationToken cancellationToken);
    Task<PagedResult<PostDto>> ListBookmarkedAsync(PageQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<TagDto>> PopularTagsAsync(string? search, CancellationToken cancellationToken);
    Task<PostDto> GetAsync(int postId, CancellationToken cancellationToken);
    Task<int> CreateAsync(CreatePostRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int postId, UpdatePostRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(int postId, CancellationToken cancellationToken);
}

public sealed class PostService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IClubAccess clubAccess,
    ContentProcessor content,
    INotificationService notifications,
    TimeProvider clock) : IPostService
{
    private const int TagResults = 10;

    public async Task<PagedResult<PostDto>> ListAsync(PostQuery query, CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        var posts = db.Posts.AsNoTracking().Where(p => p.Status == (byte)ContentStatus.Published);

        // Query filters
        posts = query.ClubId is { } clubId
            ? posts.Where(p => p.ClubId == clubId)
            : posts.Where(p => p.Club.Status == (byte)ClubStatus.Active);

        if (query.JoinedOnly)
        {
            posts = posts.Where(p => p.Club.ClubMembers.Any(m => m.UserId == userId));
        }

        if (query.AuthorId is { } authorId)
        {
            posts = posts.Where(p => p.AuthorId == authorId);
        }

        if (!string.IsNullOrWhiteSpace(query.Tag))
        {
            var tag = query.Tag.Trim().TrimStart('#');
            posts = posts.Where(p => p.Tags.Any(t => t.Name == tag));
        }

        // Bodies are encrypted at rest, so text search covers titles, tags and clubs
        if (query.Search is { } search)
        {
            var term = search.TrimStart('#');
            posts = search.StartsWith('#')
                ? posts.Where(p => p.Tags.Any(t => t.Name == term))
                : posts.Where(p => p.Title.Contains(term)
                    || p.Club.Name.Contains(term)
                    || p.Tags.Any(t => t.Name.Contains(term)));
        }

        // Pinned posts lead only inside their own club feed
        var ordered = query.ClubId.HasValue
            ? posts.OrderByDescending(p => p.IsPinned)
            : posts.OrderBy(p => 0);

        if (query.Sort == PostSort.Popular)
        {
            ordered = ordered.ThenByDescending(p => p.PostVotes.Sum(v => (int)v.Value));
        }
        else if (query.Sort == PostSort.ForYou)
        {
            var signals = await EngagementSignals.LoadAsync(db, userId, cancellationToken);
            var interests = signals.InterestCategoryIds;
            var liked = signals.LikedClubIds.Concat(signals.CommentedClubIds).Distinct().ToList();
            var tags = signals.LikedTagIds;
            ordered = ordered.ThenByDescending(p =>
                (p.Club.ClubMembers.Any(m => m.UserId == userId) ? 3 : 0)
                + (interests.Contains(p.Club.CategoryId) ? 3 : 0)
                + (liked.Contains(p.ClubId) ? 2 : 0)
                + (p.Tags.Count(t => tags.Contains(t.Id)) * 2)
                - (p.PostVotes.Any(v => v.UserId == userId && v.Value < 0) ? 20 : 0));
        }

        return await ordered
            .ThenByDescending(p => p.CreatedAtUtc)
            .ThenByDescending(p => p.Id)
            .ToPagedResultAsync(query, page => page.ToDto(currentUser), cancellationToken);
    }

    public Task<PagedResult<PostDto>> ListBookmarkedAsync(PageQuery query, CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        var bookmarks = db.Bookmarks.AsNoTracking()
            .Where(b => b.UserId == userId && b.Post.Status == (byte)ContentStatus.Published);

        if (query.Search is { } search)
        {
            bookmarks = bookmarks.Where(b => b.Post.Title.Contains(search));
        }

        return bookmarks
            .OrderByDescending(b => b.CreatedAtUtc)
            .ThenByDescending(b => b.PostId)
            .Select(b => b.Post)
            .ToPagedResultAsync(query, page => page.ToDto(currentUser), cancellationToken);
    }

    public async Task<IReadOnlyList<TagDto>> PopularTagsAsync(string? search, CancellationToken cancellationToken)
    {
        var tags = db.Tags.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().TrimStart('#');
            tags = tags.Where(t => t.Name.StartsWith(term));
        }

        return await tags
            .Select(t => new
            {
                t.Name,
                Count = t.Posts.Count(p => p.Status == (byte)ContentStatus.Published)
            })
            .OrderByDescending(t => t.Count)
            .ThenBy(t => t.Name)
            .Take(TagResults)
            .Select(t => new TagDto(t.Name, t.Count))
            .ToListAsync(cancellationToken);
    }

    public async Task<PostDto> GetAsync(int postId, CancellationToken cancellationToken)
    {
        var post = await db.Posts.AsNoTracking()
            .Where(p => p.Id == postId && p.Status != (byte)ContentStatus.Deleted)
            .ToDto(currentUser, includeBody: true)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Post");

        var isHidden = post.Status == ContentStatus.Removed
            && !post.CanModerate
            && post.Author.Id != currentUser.Id;

        return isHidden ? throw new NotFoundException("Post") : post;
    }

    public async Task<int> CreateAsync(CreatePostRequest request, CancellationToken cancellationToken)
    {
        currentUser.Require(PermissionKeys.CreatePosts);
        await clubAccess.EnsureCanParticipateAsync(request.ClubId, cancellationToken);
        var processed = await ProcessAsync(request.Body, request.Tags, request.Type, cancellationToken);

        var post = new Post
        {
            ClubId = request.ClubId,
            AuthorId = currentUser.Id,
            Type = (byte)request.Type,
            Title = request.Title.Trim(),
            Body = processed.IsBlank ? null : processed.Html,
            LinkUrl = request.Type == PostType.Link ? request.LinkUrl?.Trim() : null,
            Status = (byte)ContentStatus.Published,
            Tags = [.. processed.Tags]
        };
        db.Posts.Add(post);
        await db.SaveChangesAsync(cancellationToken);

        await NotifyMentionsAsync(post, processed.NewMentions(null), cancellationToken);
        return post.Id;
    }

    public async Task UpdateAsync(int postId, UpdatePostRequest request, CancellationToken cancellationToken)
    {
        currentUser.Require(PermissionKeys.CreatePosts);
        var post = await db.Posts.Include(p => p.Tags).SingleOrDefaultAsync(
            p => p.Id == postId && p.Status == (byte)ContentStatus.Published, cancellationToken)
            ?? throw new NotFoundException("Post");
        if (post.AuthorId != currentUser.Id)
        {
            throw new ForbiddenException("Only the author can edit this post.");
        }

        await clubAccess.EnsureCanParticipateAsync(post.ClubId, cancellationToken);

        var link = string.IsNullOrWhiteSpace(request.LinkUrl) ? null : request.LinkUrl.Trim();
        if (post.Type == (byte)PostType.Link && link is null)
        {
            throw new RequestValidationException("linkUrl", "A link post needs a web address.");
        }

        var processed = await ProcessAsync(request.Body, request.Tags, (PostType)post.Type, cancellationToken);
        var mentions = processed.NewMentions(post.Body).ToList();

        post.Title = request.Title.Trim();
        post.Body = processed.IsBlank ? null : processed.Html;
        post.LinkUrl = post.Type == (byte)PostType.Link ? link : null;
        post.EditedAtUtc = clock.GetUtcNow().UtcDateTime;
        post.Tags.Clear();
        foreach (var tag in processed.Tags)
        {
            post.Tags.Add(tag);
        }

        await db.SaveChangesAsync(cancellationToken);
        await NotifyMentionsAsync(post, mentions, cancellationToken);
    }

    // Soft delete: authors delete their own, moderators remove
    public async Task DeleteAsync(int postId, CancellationToken cancellationToken)
    {
        var post = await db.Posts.SingleOrDefaultAsync(
            p => p.Id == postId && p.Status == (byte)ContentStatus.Published, cancellationToken)
            ?? throw new NotFoundException("Post");

        if (post.AuthorId == currentUser.Id)
        {
            post.Status = (byte)ContentStatus.Deleted;
        }
        else
        {
            await clubAccess.EnsureCanModerateAsync(
                post.ClubId, PermissionKeys.ModeratePosts, cancellationToken);
            post.Status = (byte)ContentStatus.Removed;
            post.ModeratedByUserId = currentUser.Id;
        }

        post.IsPinned = false;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<ProcessedContent> ProcessAsync(
        string? body, IReadOnlyList<string>? tags, PostType type, CancellationToken cancellationToken)
    {
        var processed = await content.ProcessAsync(
            body, "body", PostRules.MaxTextLength, tags, cancellationToken);

        return type == PostType.Text && processed.IsBlank
            ? throw new RequestValidationException("body", "Write something in your post.")
            : processed;
    }

    private async Task NotifyMentionsAsync(
        Post post, IEnumerable<int> userIds, CancellationToken cancellationToken)
    {
        foreach (var userId in userIds)
        {
            notifications.Queue(
                userId,
                NotificationType.Mention,
                $"You were mentioned in \"{post.Title}\".",
                $"/posts/{post.Id}");
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
