using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusConnect.Application.Features.Users;

public interface IUserAdministrationService
{
    Task<PagedResult<AdminUserDto>> ListAsync(AdminUserQuery query, CancellationToken cancellationToken);
    Task SetStatusAsync(int userId, SetUserStatusRequest request, CancellationToken cancellationToken);
    Task SetAdminRoleAsync(int userId, SetAdminRoleRequest request, CancellationToken cancellationToken);
}

public sealed class UserAdministrationService(
    IAppDbContext db,
    ICurrentUser currentUser,
    ILogger<UserAdministrationService> logger) : IUserAdministrationService
{
    public Task<PagedResult<AdminUserDto>> ListAsync(AdminUserQuery query, CancellationToken cancellationToken)
    {
        var users = db.Users.AsNoTracking();

        // Query filters
        if (query.Search is { } search)
        {
            users = users.Where(u => u.FullName.Contains(search)
                || u.Email.Contains(search)
                || (u.RegistrationNumber != null && u.RegistrationNumber.Contains(search)));
        }

        if (!string.IsNullOrEmpty(query.Role))
        {
            users = users.Where(u => u.Roles.Any(r => r.Name == query.Role));
        }

        if (query.IsActive is { } isActive)
        {
            users = users.Where(u => u.IsActive == isActive);
        }

        return users
            .OrderBy(u => u.FullName)
            .ThenBy(u => u.Id)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                AvatarFileId = u.AvatarFileId,
                Email = u.Email,
                RegistrationNumber = u.RegistrationNumber,
                Semester = u.Semester,
                Title = u.Title,
                IsActive = u.IsActive,
                CreatedAtUtc = u.CreatedAtUtc,
                LastLoginAtUtc = u.LastLoginAtUtc,
                Roles = u.Roles.Select(r => r.Name).ToList()
            })
            .ToPagedResultAsync(query, cancellationToken);
    }

    public async Task SetStatusAsync(int userId, SetUserStatusRequest request, CancellationToken cancellationToken)
    {
        var user = await FindOtherUserAsync(userId, cancellationToken);
        user.IsActive = request.IsActive;
        user.SecurityStamp = Guid.NewGuid();
        user.FailedLoginCount = 0;
        user.LockoutEndsAtUtc = null;
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("User {UserId} active state set to {IsActive}", userId, request.IsActive);
    }

    public async Task SetAdminRoleAsync(int userId, SetAdminRoleRequest request, CancellationToken cancellationToken)
    {
        var user = await FindOtherUserAsync(userId, cancellationToken);
        var existing = user.Roles.SingleOrDefault(r => r.Id == RoleIds.Admin);

        if (request.IsAdmin && existing is null)
        {
            user.Roles.Add(await db.Roles.SingleAsync(r => r.Id == RoleIds.Admin, cancellationToken));
        }
        else if (!request.IsAdmin && existing is not null)
        {
            user.Roles.Remove(existing);
        }

        user.Title = request.IsAdmin && !string.IsNullOrWhiteSpace(request.Title) ? request.Title.Trim() : null;
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("User {UserId} administrator access set to {IsAdmin}", userId, request.IsAdmin);
    }

    private async Task<User> FindOtherUserAsync(int userId, CancellationToken cancellationToken)
    {
        if (userId == currentUser.Id)
        {
            throw new ConflictException("You cannot change your own access. Ask another administrator.");
        }

        return await db.Users.Include(u => u.Roles).SingleOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User");
    }
}
