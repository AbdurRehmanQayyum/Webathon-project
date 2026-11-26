using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Administration;

public sealed record ClubActivityDto(int Id, string Name, string Slug, int MemberCount, int PostCount);

public sealed record AdminOverviewDto
{
    public required int ActiveStudents { get; init; }
    public required int DeactivatedUsers { get; init; }
    public required int Moderators { get; init; }
    public required int ActiveClubs { get; init; }
    public required int PendingClubRequests { get; init; }
    public required int PublishedPosts { get; init; }
    public required int PublishedComments { get; init; }
    public required int UpcomingEvents { get; init; }
    public required int DraftAnnouncements { get; init; }
    public required IReadOnlyList<ClubActivityDto> LargestClubs { get; init; }
}

public interface IOverviewService
{
    Task<AdminOverviewDto> GetAsync(CancellationToken cancellationToken);
}

public sealed class OverviewService(IAppDbContext db, TimeProvider clock) : IOverviewService
{
    private const int LargestClubCount = 5;

    public async Task<AdminOverviewDto> GetAsync(CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow().UtcDateTime;

        return new AdminOverviewDto
        {
            ActiveStudents = await db.Users.CountAsync(
                u => u.IsActive && u.Roles.Any(r => r.Id == RoleIds.Student), cancellationToken),
            DeactivatedUsers = await db.Users.CountAsync(u => !u.IsActive, cancellationToken),
            Moderators = await db.ClubModerators.Select(m => m.UserId).Distinct().CountAsync(cancellationToken),
            ActiveClubs = await db.Clubs.CountAsync(
                c => c.Status == (byte)ClubStatus.Active, cancellationToken),
            PendingClubRequests = await db.ClubRequests.CountAsync(
                r => r.Status == (byte)ClubRequestStatus.Pending, cancellationToken),
            PublishedPosts = await db.Posts.CountAsync(
                p => p.Status == (byte)ContentStatus.Published, cancellationToken),
            PublishedComments = await db.Comments.CountAsync(
                c => c.Status == (byte)ContentStatus.Published, cancellationToken),
            UpcomingEvents = await db.Events.CountAsync(
                e => e.Status == (byte)EventStatus.Scheduled && e.EndsAtUtc >= now, cancellationToken),
            DraftAnnouncements = await db.Announcements.CountAsync(
                a => !a.IsDeleted && !a.IsPublished, cancellationToken),
            LargestClubs = await db.Clubs.AsNoTracking()
                .Where(c => c.Status == (byte)ClubStatus.Active)
                .OrderByDescending(c => c.ClubMembers.Count)
                .ThenBy(c => c.Name)
                .Take(LargestClubCount)
                .Select(c => new ClubActivityDto(
                    c.Id,
                    c.Name,
                    c.Slug,
                    c.ClubMembers.Count,
                    c.Posts.Count(p => p.Status == (byte)ContentStatus.Published)))
                .ToListAsync(cancellationToken)
        };
    }
}
