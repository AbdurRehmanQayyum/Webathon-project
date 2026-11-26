using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusConnect.Application.Features.Clubs;

public interface IClubManagementService
{
    Task<PagedResult<ClubDto>> ListAsync(ClubQuery query, CancellationToken cancellationToken);
    Task<ClubDto> CreateAsync(SaveClubRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int clubId, SaveClubRequest request, CancellationToken cancellationToken);
    Task SetStatusAsync(int clubId, SetClubStatusRequest request, CancellationToken cancellationToken);
    Task AssignModeratorAsync(int clubId, int userId, CancellationToken cancellationToken);
    Task RemoveModeratorAsync(int clubId, int userId, CancellationToken cancellationToken);
    Task<PagedResult<ClubMemberDto>> ListMembersAsync(
        int clubId, PageQuery query, CancellationToken cancellationToken);
}

public sealed class ClubManagementService(
    IAppDbContext db,
    ICurrentUser currentUser,
    ClubCreator clubCreator,
    INotificationService notifications,
    ILogger<ClubManagementService> logger) : IClubManagementService
{
    public Task<PagedResult<ClubDto>> ListAsync(ClubQuery query, CancellationToken cancellationToken)
    {
        var clubs = db.Clubs.AsNoTracking();

        if (query.Status is { } status)
        {
            clubs = clubs.Where(c => c.Status == (byte)status);
        }

        return clubs.ApplyFilters(query)
            .ToDto(currentUser.Id, currentUser.IsAdmin)
            .ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<PagedResult<ClubMemberDto>> ListMembersAsync(
        int clubId, PageQuery query, CancellationToken cancellationToken)
    {
        if (!await db.Clubs.AnyAsync(c => c.Id == clubId, cancellationToken))
        {
            throw new NotFoundException("Club");
        }

        var showEmail = currentUser.IsAdmin || currentUser.Has(PermissionKeys.ManageUsers);
        var members = db.ClubMembers.AsNoTracking().Where(m => m.ClubId == clubId);

        if (query.Search is { } search)
        {
            members = members.Where(m => m.User.FullName.Contains(search)
                || m.User.Username.Contains(search)
                || (m.User.RegistrationNumber != null && m.User.RegistrationNumber.Contains(search)));
        }

        return await members
            .OrderBy(m => m.User.FullName)
            .ThenBy(m => m.UserId)
            .ToPagedResultAsync(
                query,
                page => page.Select(m => new ClubMemberDto
                {
                    Id = m.UserId,
                    FullName = m.User.FullName,
                    Username = m.User.Username,
                    AvatarFileId = m.User.AvatarFileId,
                    Email = showEmail ? m.User.Email : null,
                    RegistrationNumber = m.User.RegistrationNumber,
                    Semester = m.User.Semester,
                    IsModerator = m.Club.ClubModerators.Any(x => x.UserId == m.UserId),
                    IsActive = m.User.IsActive,
                    JoinedAtUtc = m.JoinedAtUtc
                }),
                cancellationToken);
    }

    public async Task<ClubDto> CreateAsync(SaveClubRequest request, CancellationToken cancellationToken)
    {
        var club = await clubCreator.AddAsync(request, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Club {ClubId} created", club.Id);

        return await db.Clubs.AsNoTracking()
            .Where(c => c.Id == club.Id)
            .ToDto(currentUser.Id, currentUser.IsAdmin)
            .SingleAsync(cancellationToken);
    }

    public async Task UpdateAsync(int clubId, SaveClubRequest request, CancellationToken cancellationToken)
    {
        var club = await FindClubAsync(clubId, cancellationToken);
        var name = request.Name.Trim();
        await clubCreator.EnsureNameAvailableAsync(name, clubId, cancellationToken);
        await clubCreator.EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        // The slug stays stable so shared links keep working
        club.Name = name;
        club.CategoryId = request.CategoryId;
        club.Description = request.Description.Trim();
        club.Rules = string.IsNullOrWhiteSpace(request.Rules) ? null : request.Rules.Trim();
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task SetStatusAsync(
        int clubId, SetClubStatusRequest request, CancellationToken cancellationToken)
    {
        var club = await FindClubAsync(clubId, cancellationToken);
        club.Status = (byte)request.Status;
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Club {ClubId} status set to {Status}", clubId, request.Status);
    }

    // Moderator assignment
    public Task AssignModeratorAsync(int clubId, int userId, CancellationToken cancellationToken) =>
        db.ExecuteInTransactionAsync(async () =>
        {
            var club = await FindClubAsync(clubId, cancellationToken);
            var user = await db.Users.Include(u => u.Roles)
                .SingleOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken)
                ?? throw new NotFoundException("Active user");

            if (await db.ClubModerators.AnyAsync(m => m.ClubId == clubId && m.UserId == userId, cancellationToken))
            {
                throw new ConflictException("This user already moderates the club.");
            }

            if (!await db.ClubMembers.AnyAsync(m => m.ClubId == clubId && m.UserId == userId, cancellationToken))
            {
                db.ClubMembers.Add(new ClubMember { ClubId = clubId, UserId = userId });
            }

            db.ClubModerators.Add(new ClubModerator
            {
                ClubId = clubId,
                UserId = userId,
                AssignedByUserId = currentUser.Id
            });

            if (user.Roles.All(r => r.Id != RoleIds.Moderator))
            {
                user.Roles.Add(await db.Roles.SingleAsync(r => r.Id == RoleIds.Moderator, cancellationToken));
            }

            notifications.Queue(
                userId,
                NotificationType.ModeratorAssigned,
                $"You are now a moderator of {club.Name}.",
                $"/clubs/{club.Slug}");

            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("User {UserId} assigned to moderate club {ClubId}", userId, clubId);
        }, cancellationToken);

    public Task RemoveModeratorAsync(int clubId, int userId, CancellationToken cancellationToken) =>
        db.ExecuteInTransactionAsync(async () =>
        {
            var assignment = await db.ClubModerators.SingleOrDefaultAsync(
                m => m.ClubId == clubId && m.UserId == userId, cancellationToken)
                ?? throw new NotFoundException("Moderator assignment");

            db.ClubModerators.Remove(assignment);

            if (!await db.ClubModerators.AnyAsync(
                m => m.UserId == userId && m.ClubId != clubId, cancellationToken))
            {
                var user = await db.Users.Include(u => u.Roles)
                    .SingleAsync(u => u.Id == userId, cancellationToken);
                var role = user.Roles.SingleOrDefault(r => r.Id == RoleIds.Moderator);
                if (role is not null)
                {
                    user.Roles.Remove(role);
                }
            }

            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("User {UserId} removed as moderator of club {ClubId}", userId, clubId);
        }, cancellationToken);

    private async Task<Club> FindClubAsync(int clubId, CancellationToken cancellationToken) =>
        await db.Clubs.SingleOrDefaultAsync(c => c.Id == clubId, cancellationToken)
        ?? throw new NotFoundException("Club");
}
