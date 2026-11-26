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
    Task<int> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken);
    Task SetStatusAsync(int userId, SetUserStatusRequest request, CancellationToken cancellationToken);
    Task SetAdminRoleAsync(int userId, SetAdminRoleRequest request, CancellationToken cancellationToken);
}

public sealed class UserAdministrationService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IPasswordService passwords,
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
                || u.Username.Contains(search)
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
            .ToPagedResultAsync(
                query,
                page => page.Select(u => new AdminUserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username,
                    AvatarFileId = u.AvatarFileId,
                    Email = u.Email,
                    RegistrationNumber = u.RegistrationNumber,
                    Semester = u.Semester,
                    Title = u.Title,
                    IsActive = u.IsActive,
                    MustChangePassword = u.MustChangePassword,
                    CreatedAtUtc = u.CreatedAtUtc,
                    LastLoginAtUtc = u.LastLoginAtUtc,
                    Roles = u.Roles.Select(r => r.Name).ToList()
                }),
                cancellationToken);
    }

    // Provisioned accounts must replace the temporary password at first sign-in
    public async Task<int> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var isAdmin = request.Role == RoleNames.Admin;
        if (isAdmin && !currentUser.IsAdmin)
        {
            throw new ForbiddenException("Only administrators can create administrator accounts.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var registrationNumber = string.IsNullOrWhiteSpace(request.RegistrationNumber)
            ? null
            : request.RegistrationNumber.Trim().ToUpperInvariant();
        await Accounts.EnsureUniqueAsync(db, email, registrationNumber, cancellationToken);

        var roleId = isAdmin ? RoleIds.Admin : RoleIds.Student;
        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Username = await Accounts.NewUsernameAsync(db, email, cancellationToken),
            RegistrationNumber = registrationNumber,
            Semester = request.Semester,
            Title = isAdmin && !string.IsNullOrWhiteSpace(request.Title) ? request.Title.Trim() : null,
            PasswordHash = passwords.Hash(request.TemporaryPassword),
            SecurityStamp = Guid.NewGuid(),
            IsActive = true,
            MustChangePassword = true
        };
        user.Roles.Add(await db.Roles.SingleAsync(r => r.Id == roleId, cancellationToken));

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Account {UserId} created by {ActorId}", user.Id, currentUser.Id);
        return user.Id;
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
        if (!currentUser.IsAdmin)
        {
            throw new ForbiddenException("Only administrators can change administrator access.");
        }

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

        var user = await db.Users.Include(u => u.Roles)
            .SingleOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User");

        // Delegated user managers can never alter an administrator
        return !currentUser.IsAdmin && user.Roles.Any(r => r.Id == RoleIds.Admin)
            ? throw new ForbiddenException("Only administrators can manage administrator accounts.")
            : user;
    }
}
