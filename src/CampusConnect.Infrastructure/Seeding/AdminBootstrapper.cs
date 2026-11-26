using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CampusConnect.Infrastructure.Seeding;

public sealed class AdminBootstrapOptions
{
    public const string SectionName = "AdminBootstrap";

    public string? Email { get; set; }
    public string? Password { get; set; }
    public string FullName { get; set; } = "Department Administrator";
}

// Creates the first administrator from deployment secrets when none exists
public sealed class AdminBootstrapper(
    CampusConnectDbContext db,
    IPasswordService passwords,
    IOptions<AdminBootstrapOptions> options,
    ILogger<AdminBootstrapper> logger)
{
    private const int MinimumPasswordLength = 12;

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.Email) || string.IsNullOrWhiteSpace(settings.Password))
        {
            return;
        }

        if (settings.Password.Length < MinimumPasswordLength)
        {
            logger.LogWarning(
                "Administrator bootstrap skipped: the password needs {Length} or more characters",
                MinimumPasswordLength);
            return;
        }

        if (await db.Users.AnyAsync(u => u.Roles.Any(r => r.Id == RoleIds.Admin), cancellationToken))
        {
            return;
        }

        var admin = new User
        {
            FullName = settings.FullName,
            Email = settings.Email.Trim().ToLowerInvariant(),
            PasswordHash = passwords.Hash(settings.Password),
            SecurityStamp = Guid.NewGuid(),
            IsActive = true
        };
        admin.Roles.Add(await db.Roles.SingleAsync(r => r.Id == RoleIds.Admin, cancellationToken));
        db.Users.Add(admin);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Initial administrator account created");
    }
}
