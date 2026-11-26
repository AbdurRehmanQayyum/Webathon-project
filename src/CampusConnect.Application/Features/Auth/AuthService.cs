using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
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

        if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            throw new ConflictException("An account with this email already exists.", "email");
        }

        if (await db.Users.AnyAsync(u => u.RegistrationNumber == registrationNumber, cancellationToken))
        {
            throw new ConflictException("This registration number is already in use.", "registrationNumber");
        }

        var studentRole = await db.Roles.SingleAsync(r => r.Id == RoleIds.Student, cancellationToken);
        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            RegistrationNumber = registrationNumber,
            Semester = request.Semester,
            Bio = request.Bio?.Trim(),
            PasswordHash = passwords.Hash(request.Password),
            SecurityStamp = Guid.NewGuid(),
            IsActive = true,
            LastLoginAtUtc = clock.GetUtcNow().UtcDateTime
        };
        user.Roles.Add(studentRole);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Student account {UserId} registered", user.Id);

        return ToIdentity(user);
    }

    // Authentication
    public async Task<SessionIdentity> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.Include(u => u.Roles).SingleOrDefaultAsync(u => u.Email == email, cancellationToken)
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

        return ToIdentity(user);
    }

    public async Task<SessionIdentity> ChangePasswordAsync(
        ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Users.Include(u => u.Roles).SingleAsync(u => u.Id == currentUser.Id, cancellationToken);
        if (passwords.Verify(user.PasswordHash, request.CurrentPassword) == PasswordCheck.Failed)
        {
            throw new RequestValidationException("currentPassword", "Your current password is incorrect.");
        }

        user.PasswordHash = passwords.Hash(request.NewPassword);
        user.SecurityStamp = Guid.NewGuid();
        await db.SaveChangesAsync(cancellationToken);

        return ToIdentity(user);
    }

    public Task<SessionIdentity?> FindActiveSessionAsync(int userId, CancellationToken cancellationToken) =>
        db.Users.AsNoTracking()
            .Where(u => u.Id == userId && u.IsActive)
            .Select(u => new SessionIdentity(
                u.Id, u.FullName, u.Email, u.SecurityStamp, u.Roles.Select(r => r.Name).ToList()))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<CurrentUserDto> GetCurrentUserAsync(CancellationToken cancellationToken) =>
        db.Users.AsNoTracking()
            .Where(u => u.Id == currentUser.Id)
            .Select(u => new CurrentUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                RegistrationNumber = u.RegistrationNumber,
                Semester = u.Semester,
                Title = u.Title,
                Bio = u.Bio,
                AvatarFileId = u.AvatarFileId,
                CreatedAtUtc = u.CreatedAtUtc,
                Roles = u.Roles.Select(r => r.Name).ToList(),
                ModeratedClubs = u.ClubModeratorUsers
                    .OrderBy(m => m.Club.Name)
                    .Select(m => new ClubReferenceDto(
                        m.ClubId, m.Club.Name, m.Club.Slug, m.Club.Category.IconKey, m.Club.LogoFileId))
                    .ToList(),
                JoinedClubCount = u.ClubMembers.Count
            })
            .SingleAsync(cancellationToken);

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

    private static SessionIdentity ToIdentity(User user) =>
        new(user.Id, user.FullName, user.Email, user.SecurityStamp, [.. user.Roles.Select(r => r.Name)]);
}
