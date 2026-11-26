using CampusConnect.Application.Common.Abstractions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CampusConnect.Infrastructure.Persistence;

// Hand-written additions kept apart from the scaffolded context
public partial class CampusConnectDbContext : IAppDbContext
{
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
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
