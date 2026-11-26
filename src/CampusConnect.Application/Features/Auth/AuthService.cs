using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Users;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CampusConnect.Application.Features.Auth;

public interface IAuthService
{
    Task<SessionIdentity> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<SessionIdentity> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<SessionIdentity> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken);
    Task<SessionIdentity?> FindActiveSessionAsync(int userId, CancellationToken cancellationToken);
    Task<CurrentUserDto> GetCurrentUserAsync(CancellationToken cancellationToken);
}

public sealed class AuthService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IPasswordService passwords,
    IOptions<RegistrationOptions> registration,
    TimeProvider clock,
    ILogger<AuthService> logger) : IAuthService
{
    private const int MaxFailedLogins = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private const string InvalidCredentials = "Incorrect email or password.";

    public async Task<SessionIdentity> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var registrationNumber = request.RegistrationNumber.Trim().ToUpperInvariant();
        EnsureAllowedDomain(email);
        await Accounts.EnsureUniqueAsync(db, email, registrationNumber, cancellationToken);

        var studentRole = await db.Roles.SingleAsync(r => r.Id == RoleIds.Student, cancellationToken);
        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Username = await Accounts.NewUsernameAsync(db, email, cancellationToken),
            RegistrationNumber = registrationNumber,
            Semester = request.Semester,
            Bio = request.Bio?.Trim(),
            PasswordHash = passwords.Hash(request.Password),
            SecurityStamp = Guid.NewGuid(),
            IsActive = true,
            LastLoginAtUtc = clock.GetUtcNow().UtcDateTime
        };
        user.Roles.Add(studentRole);
        await Accounts.SetInterestsAsync(db, user, request.InterestIds ?? [], cancellationToken);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Student account {UserId} registered", user.Id);

        return await RequireSessionAsync(user.Id, cancellationToken);
    }

    // Authentication
    public async Task<SessionIdentity> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, cancellationToken)
            ?? throw new AuthenticationFailedException(InvalidCredentials);

        var now = clock.GetUtcNow().UtcDateTime;
        if (user.LockoutEndsAtUtc > now)
        {
            throw new AuthenticationFailedException("Too many failed attempts. Try again in a few minutes.");
        }

        var check = passwords.Verify(user.PasswordHash, request.Password);
        if (check == PasswordCheck.Failed)
        {
            await RecordFailedLoginAsync(user, now, cancellationToken);
            throw new AuthenticationFailedException(InvalidCredentials);
        }

        if (!user.IsActive)
        {
            throw new AuthenticationFailedException("This account is deactivated. Contact a department administrator.");
        }

        if (check == PasswordCheck.SuccessRehashNeeded)
        {
            user.PasswordHash = passwords.Hash(request.Password);
        }

        user.FailedLoginCount = 0;
        user.LockoutEndsAtUtc = null;
        user.LastLoginAtUtc = now;
        await db.SaveChangesAsync(cancellationToken);

        return await RequireSessionAsync(user.Id, cancellationToken);
    }

    public async Task<SessionIdentity> ChangePasswordAsync(
        ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleAsync(u => u.Id == currentUser.Id, cancellationToken);
        if (passwords.Verify(user.PasswordHash, request.CurrentPassword) == PasswordCheck.Failed)
        {
            throw new RequestValidationException("currentPassword", "Your current password is incorrect.");
        }

        user.PasswordHash = passwords.Hash(request.NewPassword);
        user.SecurityStamp = Guid.NewGuid();
        user.MustChangePassword = false;
        await db.SaveChangesAsync(cancellationToken);

        return await RequireSessionAsync(user.Id, cancellationToken);
    }

    public async Task<SessionIdentity?> FindActiveSessionAsync(int userId, CancellationToken cancellationToken)
    {
        var account = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId && u.IsActive)
            .Select(u => new
            {
                u.FullName,
                u.Email,
                u.SecurityStamp,
                u.MustChangePassword,
                Roles = u.Roles.Select(r => r.Name).ToList(),
                RoleIdList = u.Roles.Select(r => r.Id).ToList()
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (account is null)
        {
            return null;
        }

        return new SessionIdentity(
            userId,
            account.FullName,
            account.Email,
            account.SecurityStamp,
            account.Roles,
            await PermissionsAsync(account.RoleIdList, cancellationToken),
            account.MustChangePassword);
    }

    public async Task<CurrentUserDto> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new CurrentUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Username = u.Username,
                Email = u.Email,
                RegistrationNumber = u.RegistrationNumber,
                Semester = u.Semester,
                Title = u.Title,
                Bio = u.Bio,
                AvatarFileId = u.AvatarFileId,
                CreatedAtUtc = u.CreatedAtUtc,
                MustChangePassword = u.MustChangePassword,
                Roles = u.Roles.Select(r => r.Name).ToList(),
                InterestIds = u.Categories.Select(c => c.Id).ToList(),
                ModeratedClubs = u.ClubModeratorUsers
                    .OrderBy(m => m.Club.Name)
                    .Select(m => new ClubReferenceDto(
                        m.ClubId, m.Club.Name, m.Club.Slug, m.Club.Category.IconKey, m.Club.LogoFileId))
                    .ToList(),
                JoinedClubCount = u.ClubMembers.Count
            })
            .SingleAsync(cancellationToken);

        var session = await RequireSessionAsync(userId, cancellationToken);
        return user with { Permissions = session.Permissions };
    }

    private async Task<SessionIdentity> RequireSessionAsync(int userId, CancellationToken cancellationToken) =>
        await FindActiveSessionAsync(userId, cancellationToken)
        ?? throw new AuthenticationFailedException("Sign in to continue.");

    private async Task<IReadOnlyList<string>> PermissionsAsync(
        List<int> roleIds, CancellationToken cancellationToken)
    {
        if (roleIds.Contains(RoleIds.Admin))
        {
            return [.. PermissionCatalog.All.Select(p => p.Key)];
        }

        return await db.RolePermissions.AsNoTracking()
            .Where(p => roleIds.Contains(p.RoleId))
            .Select(p => p.Permission)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    private async Task RecordFailedLoginAsync(User user, DateTime now, CancellationToken cancellationToken)
    {
        user.FailedLoginCount++;
        if (user.FailedLoginCount >= MaxFailedLogins)
        {
            user.FailedLoginCount = 0;
            user.LockoutEndsAtUtc = now.Add(LockoutDuration);
            logger.LogWarning("Account {UserId} locked after repeated failed logins", user.Id);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    // Enrollment restriction
    private void EnsureAllowedDomain(string email)
    {
        var domains = registration.Value.AllowedEmailDomains;
        if (domains.Length > 0
            && !domains.Any(domain => email.EndsWith($"@{domain}", StringComparison.OrdinalIgnoreCase)))
        {
            throw new RequestValidationException(
                "email", $"Register with an email from: {string.Join(", ", domains)}.");
        }
    }
}
