using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Clubs;

public interface IClubAccess
{
    Task<bool> CanModerateAsync(int clubId, CancellationToken cancellationToken);
    Task EnsureCanModerateAsync(int clubId, CancellationToken cancellationToken);
    Task EnsureCanParticipateAsync(int clubId, CancellationToken cancellationToken);
}

// Resource-level authorization backed by club assignments
public sealed class ClubAccess(IAppDbContext db, ICurrentUser currentUser) : IClubAccess
{
    public async Task<bool> CanModerateAsync(int clubId, CancellationToken cancellationToken) =>
        currentUser.IsAdmin
        || await db.ClubModerators.AnyAsync(
            m => m.ClubId == clubId && m.UserId == currentUser.Id, cancellationToken);

    public async Task EnsureCanModerateAsync(int clubId, CancellationToken cancellationToken)
    {
        if (!await CanModerateAsync(clubId, cancellationToken))
        {
            throw new ForbiddenException("You can only moderate clubs you are assigned to.");
        }
    }

    public async Task EnsureCanParticipateAsync(int clubId, CancellationToken cancellationToken)
    {
        var club = await db.Clubs
            .Where(c => c.Id == clubId)
            .Select(c => new { c.Status, IsMember = c.ClubMembers.Any(m => m.UserId == currentUser.Id) })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Club");

        if (club.Status != (byte)ClubStatus.Active)
        {
            throw new ConflictException("This club is archived and read-only.");
        }

        if (!club.IsMember && !currentUser.IsAdmin)
        {
            throw new ForbiddenException("Join this club to take part in its discussions.");
        }
    }
}
