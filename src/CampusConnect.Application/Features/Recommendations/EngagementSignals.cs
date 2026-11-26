using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Recommendations;

// What a member has shown interest in: chosen categories, upvotes, comments and memberships
public sealed record EngagementSignals(
    List<int> InterestCategoryIds,
    List<int> JoinedCategoryIds,
    List<int> LikedClubIds,
    List<int> CommentedClubIds,
    List<int> DislikedClubIds,
    List<int> LikedTagIds)
{
    public static async Task<EngagementSignals> LoadAsync(
        IAppDbContext db, int userId, CancellationToken cancellationToken)
    {
        var upvotes = db.PostVotes.Where(v => v.UserId == userId && v.Value > 0);
        var comments = db.Comments.Where(c => c.AuthorId == userId && c.Status == (byte)ContentStatus.Published);

        return new EngagementSignals(
            await db.Users.Where(u => u.Id == userId)
                .SelectMany(u => u.Categories)
                .Select(c => c.Id)
                .ToListAsync(cancellationToken),
            await db.ClubMembers.Where(m => m.UserId == userId)
                .Select(m => m.Club.CategoryId)
                .ToListAsync(cancellationToken),
            await upvotes.Select(v => v.Post.ClubId).Distinct().ToListAsync(cancellationToken),
            await comments.Select(c => c.Post.ClubId).Distinct().ToListAsync(cancellationToken),
            await db.PostVotes.Where(v => v.UserId == userId && v.Value < 0)
                .Select(v => v.Post.ClubId)
                .Distinct()
                .ToListAsync(cancellationToken),
            await upvotes.SelectMany(v => v.Post.Tags)
                .Select(t => t.Id)
                .Distinct()
                .ToListAsync(cancellationToken));
    }
}
