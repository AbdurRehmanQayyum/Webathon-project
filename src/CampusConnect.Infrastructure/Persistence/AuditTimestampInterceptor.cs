using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace CampusConnect.Infrastructure.Persistence;

public sealed class AuditTimestampInterceptor(TimeProvider clock) : SaveChangesInterceptor
{
    private const string UpdatedAt = "UpdatedAtUtc";

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is { } context)
        {
            var now = clock.GetUtcNow().UtcDateTime;
            var modified = context.ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Modified && e.Metadata.FindProperty(UpdatedAt) is not null);

            foreach (var entry in modified)
            {
                entry.Property(UpdatedAt).CurrentValue = now;
            }
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
