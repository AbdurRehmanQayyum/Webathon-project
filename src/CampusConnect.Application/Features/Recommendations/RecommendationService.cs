using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Recommendations;

public sealed record ClubRecommendationDto(ClubDto Club, string Reason);

public interface IRecommendationService
{
    Task<IReadOnlyList<ClubRecommendationDto>> RecommendClubsAsync(CancellationToken cancellationToken);
}

// A transparent weighted score; no external services or model training
public sealed class RecommendationService(IAppDbContext db, ICurrentUser currentUser) : IRecommendationService
{
    private const int ResultCount = 4;

    public async Task<IReadOnlyList<ClubRecommendationDto>> RecommendClubsAsync(
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        var signals = await EngagementSignals.LoadAsync(db, userId, cancellationToken);
        var likedTags = signals.LikedTagIds;

        var candidates = await db.Clubs.AsNoTracking()
            .Where(c => c.Status == (byte)ClubStatus.Active && !c.ClubMembers.Any(m => m.UserId == userId))
            .Select(c => new
            {
                c.Id,
                c.CategoryId,
                Category = c.Category.Name,
                Members = c.ClubMembers.Count,
                TagMatches = c.Posts
                    .Where(p => p.Status == (byte)ContentStatus.Published)
                    .SelectMany(p => p.Tags)
                    .Count(t => likedTags.Contains(t.Id))
            })
            .ToListAsync(cancellationToken);

        var ranked = candidates
            .Select(club =>
            {
                List<(double Weight, string Reason)> factors =
                [
                    (signals.InterestCategoryIds.Contains(club.CategoryId) ? 6 : 0,
                        $"Matches your interest in {club.Category}"),
                    (signals.LikedClubIds.Contains(club.Id) ? 4 : 0, "You upvoted posts from this club"),
                    (signals.CommentedClubIds.Contains(club.Id) ? 3 : 0, "You joined its discussions"),
                    (signals.JoinedCategoryIds.Count(id => id == club.CategoryId) * 2,
                        $"Similar to clubs you joined in {club.Category}"),
                    (Math.Min(club.TagMatches, 5), "Covers tags you engage with")
                ];
                var penalty = signals.DislikedClubIds.Contains(club.Id) ? 5 : 0;
                var best = factors.MaxBy(f => f.Weight);

                return new
                {
                    club.Id,
                    Score = factors.Sum(f => f.Weight) - penalty + (club.Members * 0.1),
                    Reason = best.Weight > 0 ? best.Reason : "Popular in your department"
                };
            })
            .OrderByDescending(c => c.Score)
            .Take(ResultCount)
            .ToList();

        var ids = ranked.Select(r => r.Id).ToList();
        var clubs = await db.Clubs.AsNoTracking()
            .Where(c => ids.Contains(c.Id))
            .ToDto(userId, currentUser.IsAdmin)
            .ToListAsync(cancellationToken);

        return
        [
            .. ranked.Select(r => new ClubRecommendationDto(clubs.Single(c => c.Id == r.Id), r.Reason))
        ];
    }
}
