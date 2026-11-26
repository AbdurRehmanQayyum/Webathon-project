using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Clubs;

public interface IClubAccess
{
    Task<bool> CanModerateAsync(int clubId, CancellationToken cancellationToken);
    Task EnsureCanModerateAsync(int clubId, string permission, CancellationToken cancellationToken);
    Task<bool> IsAssignedModeratorAsync(int clubId, CancellationToken cancellationToken);
    Task EnsureCanParticipateAsync(int clubId, CancellationToken cancellationToken);
}

// Resource-level authorization: role permission plus a database-backed club assignment
public sealed class ClubAccess(IAppDbContext db, ICurrentUser currentUser) : IClubAccess
{
    private static readonly string[] ModerationPermissions =
        [PermissionKeys.ModeratePosts, PermissionKeys.ModerateComments, PermissionKeys.PinPosts];

    public async Task<bool> CanModerateAsync(int clubId, CancellationToken cancellationToken) =>
        currentUser.IsAdmin
        || (ModerationPermissions.Any(currentUser.Has)
            && await IsAssignedModeratorAsync(clubId, cancellationToken));

    public async Task EnsureCanModerateAsync(int clubId, string permission, CancellationToken cancellationToken)
    {
        if (currentUser.IsAdmin)
        {
            return;
        }

        if (!await IsAssignedModeratorAsync(clubId, cancellationToken))
        {
            throw new ForbiddenException("You can only moderate clubs you are assigned to.");
        }

        currentUser.Require(permission);
    }

    public Task<bool> IsAssignedModeratorAsync(int clubId, CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        return db.ClubModerators.AnyAsync(m => m.ClubId == clubId && m.UserId == userId, cancellationToken);
    }

    public async Task EnsureCanParticipateAsync(int clubId, CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        var club = await db.Clubs
            .Where(c => c.Id == clubId)
            .Select(c => new { c.Status, IsMember = c.ClubMembers.Any(m => m.UserId == userId) })
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
