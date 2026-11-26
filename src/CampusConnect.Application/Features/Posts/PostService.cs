using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Posts;

public interface IPostService
{
    Task<PagedResult<PostDto>> ListAsync(PostQuery query, CancellationToken cancellationToken);
    Task<PagedResult<PostDto>> ListBookmarkedAsync(PageQuery query, CancellationToken cancellationToken);
    Task<PostDto> GetAsync(int postId, CancellationToken cancellationToken);
    Task<int> CreateAsync(CreatePostRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int postId, UpdatePostRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(int postId, CancellationToken cancellationToken);
}

public sealed class PostService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IClubAccess clubAccess,
    TimeProvider clock) : IPostService
{
    public Task<PagedResult<PostDto>> ListAsync(PostQuery query, CancellationToken cancellationToken)
    {
        var posts = db.Posts.AsNoTracking().Where(p => p.Status == (byte)ContentStatus.Published);

        // Query filters
        posts = query.ClubId is { } clubId
            ? posts.Where(p => p.ClubId == clubId)
            : posts.Where(p => p.Club.Status == (byte)ClubStatus.Active);

        if (query.JoinedOnly)
        {
            posts = posts.Where(p => p.Club.ClubMembers.Any(m => m.UserId == currentUser.Id));
        }

        if (query.AuthorId is { } authorId)
        {
            posts = posts.Where(p => p.AuthorId == authorId);
        }

        if (query.Search is { } search)
        {
            posts = posts.Where(p => p.Title.Contains(search) || (p.Body != null && p.Body.Contains(search)));
        }

        // Pinned posts lead only inside their own club feed
        var ordered = query.ClubId.HasValue
            ? posts.OrderByDescending(p => p.IsPinned)
            : posts.OrderBy(p => 0);

        if (query.Sort == PostSort.Popular)
        {
            ordered = ordered.ThenByDescending(p => p.PostVotes.Sum(v => (int)v.Value));
        }

        return ordered
            .ThenByDescending(p => p.CreatedAtUtc)
            .ThenByDescending(p => p.Id)
            .ToDto(currentUser.Id, currentUser.IsAdmin)
            .ToPagedResultAsync(query, cancellationToken);
    }

    public Task<PagedResult<PostDto>> ListBookmarkedAsync(PageQuery query, CancellationToken cancellationToken)
    {
        var bookmarks = db.Bookmarks.AsNoTracking()
            .Where(b => b.UserId == currentUser.Id && b.Post.Status == (byte)ContentStatus.Published);

        if (query.Search is { } search)
        {
            bookmarks = bookmarks.Where(b => b.Post.Title.Contains(search));
        }

        return bookmarks
            .OrderByDescending(b => b.CreatedAtUtc)
            .ThenByDescending(b => b.PostId)
            .Select(b => b.Post)
            .ToDto(currentUser.Id, currentUser.IsAdmin)
            .ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<PostDto> GetAsync(int postId, CancellationToken cancellationToken)
    {
        var post = await db.Posts.AsNoTracking()
            .Where(p => p.Id == postId && p.Status != (byte)ContentStatus.Deleted)
            .ToDto(currentUser.Id, currentUser.IsAdmin, int.MaxValue)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Post");

        var isHidden = post.Status == ContentStatus.Removed
            && !post.CanModerate
            && post.Author.Id != currentUser.Id;

        return isHidden ? throw new NotFoundException("Post") : post;
    }

    public async Task<int> CreateAsync(CreatePostRequest request, CancellationToken cancellationToken)
    {
        await clubAccess.EnsureCanParticipateAsync(request.ClubId, cancellationToken);

        var post = new Post
        {
            ClubId = request.ClubId,
            AuthorId = currentUser.Id,
            Type = (byte)request.Type,
            Title = request.Title.Trim(),
            Body = Normalize(request.Body),
            LinkUrl = request.Type == PostType.Link ? Normalize(request.LinkUrl) : null,
            Status = (byte)ContentStatus.Published
        };
        db.Posts.Add(post);
        await db.SaveChangesAsync(cancellationToken);
        return post.Id;
    }

    public async Task UpdateAsync(int postId, UpdatePostRequest request, CancellationToken cancellationToken)
    {
        var post = await FindPublishedAsync(postId, cancellationToken);
        if (post.AuthorId != currentUser.Id)
        {
            throw new ForbiddenException("Only the author can edit this post.");
        }

        await clubAccess.EnsureCanParticipateAsync(post.ClubId, cancellationToken);

        var body = Normalize(request.Body);
        var link = Normalize(request.LinkUrl);
        if (post.Type == (byte)PostType.Text && body is null)
        {
            throw new RequestValidationException("body", "Write something in your post.");
        }

        if (post.Type == (byte)PostType.Link && link is null)
        {
            throw new RequestValidationException("linkUrl", "A link post needs a web address.");
        }

        post.Title = request.Title.Trim();
        post.Body = body;
        post.LinkUrl = post.Type == (byte)PostType.Link ? link : null;
        post.EditedAtUtc = clock.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync(cancellationToken);
    }

    // Soft delete: authors delete their own, moderators remove
    public async Task DeleteAsync(int postId, CancellationToken cancellationToken)
    {
        var post = await FindPublishedAsync(postId, cancellationToken);
        if (post.AuthorId == currentUser.Id)
        {
            post.Status = (byte)ContentStatus.Deleted;
        }
        else
        {
            await clubAccess.EnsureCanModerateAsync(post.ClubId, cancellationToken);
            post.Status = (byte)ContentStatus.Removed;
            post.ModeratedByUserId = currentUser.Id;
        }

        post.IsPinned = false;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<Post> FindPublishedAsync(int postId, CancellationToken cancellationToken) =>
        await db.Posts.SingleOrDefaultAsync(
            p => p.Id == postId && p.Status == (byte)ContentStatus.Published, cancellationToken)
        ?? throw new NotFoundException("Post");

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
