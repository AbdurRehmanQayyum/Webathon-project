using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Posts;

public interface IPostEngagementService
{
    Task<VoteResultDto> VoteAsync(int postId, VoteRequest request, CancellationToken cancellationToken);
    Task SetBookmarkAsync(int postId, bool isBookmarked, CancellationToken cancellationToken);
}

public sealed class PostEngagementService(IAppDbContext db, ICurrentUser currentUser) : IPostEngagementService
{
    // One vote per user and post; zero withdraws it
    public async Task<VoteResultDto> VoteAsync(
        int postId, VoteRequest request, CancellationToken cancellationToken)
    {
        currentUser.Require(PermissionKeys.ReactToPosts);
        await EnsurePublishedAsync(postId, cancellationToken);

        var userId = currentUser.Id;
        var vote = await db.PostVotes.SingleOrDefaultAsync(
            v => v.PostId == postId && v.UserId == userId, cancellationToken);

        if (request.Value == 0)
        {
            if (vote is not null)
            {
                db.PostVotes.Remove(vote);
            }
        }
        else if (vote is null)
        {
            db.PostVotes.Add(new PostVote { PostId = postId, UserId = userId, Value = (short)request.Value });
        }
        else
        {
            vote.Value = (short)request.Value;
        }

        await db.SaveChangesAsync(cancellationToken);

        var score = await db.PostVotes
            .Where(v => v.PostId == postId)
            .SumAsync(v => (int)v.Value, cancellationToken);

        return new VoteResultDto(score, request.Value);
    }

    public async Task SetBookmarkAsync(int postId, bool isBookmarked, CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        var mine = db.Bookmarks.Where(b => b.PostId == postId && b.UserId == userId);

        if (!isBookmarked)
        {
            await mine.ExecuteDeleteAsync(cancellationToken);
            return;
        }

        await EnsurePublishedAsync(postId, cancellationToken);
        if (!await mine.AnyAsync(cancellationToken))
        {
            db.Bookmarks.Add(new Bookmark { PostId = postId, UserId = userId });
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task EnsurePublishedAsync(int postId, CancellationToken cancellationToken)
    {
        if (!await db.Posts.AnyAsync(
            p => p.Id == postId && p.Status == (byte)ContentStatus.Published, cancellationToken))
        {
            throw new NotFoundException("Post");
        }
    }
}
