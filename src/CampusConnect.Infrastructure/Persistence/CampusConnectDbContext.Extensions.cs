using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Domain.Entities;
using CampusConnect.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CampusConnect.Infrastructure.Persistence;

// Hand-written additions kept apart from the scaffolded context
public partial class CampusConnectDbContext : IAppDbContext
{
    private readonly IFieldCipher? _cipher;

    public CampusConnectDbContext(DbContextOptions<CampusConnectDbContext> options, IFieldCipher cipher)
        : this(options) => _cipher = cipher;

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
    }

    // Encryption at rest
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        if (_cipher is not { } cipher)
        {
            return;
        }

        ValueConverter encrypted = new ValueConverter<string, string>(
            value => cipher.Encrypt(value), value => cipher.Decrypt(value));

        modelBuilder.Entity<Post>().Property(p => p.Body).HasConversion(encrypted);
        modelBuilder.Entity<Comment>().Property(c => c.Body).HasConversion(encrypted);
        modelBuilder.Entity<Announcement>().Property(a => a.Body).HasConversion(encrypted);
        modelBuilder.Entity<User>().Property(u => u.Bio).HasConversion(encrypted);
        modelBuilder.Entity<ClubRequest>().Property(r => r.Justification).HasConversion(encrypted);
        modelBuilder.Entity<Notification>().Property(n => n.Message).HasConversion(encrypted);
    }

    // Transactions
    public Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken) =>
        Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            ChangeTracker.Clear();
            await using var transaction = await Database.BeginTransactionAsync(cancellationToken);
            await operation();
            await transaction.CommitAsync(cancellationToken);
        });

    // All stored timestamps are UTC
    private sealed class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
        value => value,
        value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
}
