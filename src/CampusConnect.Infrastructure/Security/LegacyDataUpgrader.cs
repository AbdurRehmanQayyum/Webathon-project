using System.Linq.Expressions;
using CampusConnect.Application.Common.Content;
using CampusConnect.Domain.Entities;
using CampusConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusConnect.Infrastructure.Security;

// Encrypts rows written before encryption was enabled and converts old plain text to markup
public sealed class LegacyDataUpgrader(CampusConnectDbContext db, ILogger<LegacyDataUpgrader> logger)
{
    private const int BatchSize = 200;

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        await UpgradeAsync<Post>("Posts", "Body", p => p.Body, p => p.Body = ToMarkup(p.Body), cancellationToken);
        await UpgradeAsync<Comment>(
            "Comments", "Body", c => c.Body, c => c.Body = ToMarkup(c.Body)!, cancellationToken);
        await UpgradeAsync<Announcement>(
            "Announcements", "Body", a => a.Body, a => a.Body = ToMarkup(a.Body)!, cancellationToken);
        await UpgradeAsync<User>("Users", "Bio", u => u.Bio, _ => { }, cancellationToken);
        await UpgradeAsync<ClubRequest>(
            "ClubRequests", "Justification", r => r.Justification, _ => { }, cancellationToken);
        await UpgradeAsync<Notification>("Notifications", "Message", n => n.Message, _ => { }, cancellationToken);
    }

    private static string? ToMarkup(string? value) =>
        value is null || value.TrimStart().StartsWith('<') ? value : RichText.FromPlainText(value);

    private async Task UpgradeAsync<TEntity>(
        string table,
        string column,
        Expression<Func<TEntity, string?>> property,
        Action<TEntity> convert,
        CancellationToken cancellationToken)
        where TEntity : class
    {
        // Table and column names are the constants above, never user input
        var sql = $"SELECT Id AS Value FROM dbo.{table} WHERE {column} IS NOT NULL "
            + $"AND {column} NOT LIKE N'{AesFieldCipher.Prefix}%'";
        var ids = await db.Database.SqlQueryRaw<int>(sql).ToListAsync(cancellationToken);

        foreach (var batch in ids.Chunk(BatchSize))
        {
            var rows = await db.Set<TEntity>()
                .Where(row => batch.Contains(EF.Property<int>(row, "Id")))
                .ToListAsync(cancellationToken);
            foreach (var row in rows)
            {
                convert(row);
                db.Entry(row).Property(property).IsModified = true;
            }

            await db.SaveChangesAsync(cancellationToken);
            db.ChangeTracker.Clear();
        }

        if (ids.Count > 0)
        {
            logger.LogInformation("Encrypted {Count} existing values in {Table}", ids.Count, table);
        }
    }
}
