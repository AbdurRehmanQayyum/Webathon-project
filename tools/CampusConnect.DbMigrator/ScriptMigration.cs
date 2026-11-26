using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore.Migrations;

namespace CampusConnect.DbMigrator;

// Runs one embedded script, batch by batch, inside the migration transaction
public abstract partial class ScriptMigration : Migration
{
    protected abstract string Script { get; }

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var batch in Batches(Script))
        {
            migrationBuilder.Sql(batch);
        }
    }

    private static IEnumerable<string> Batches(string script)
    {
        using var stream = typeof(ScriptMigration).Assembly.GetManifestResourceStream(script)
            ?? throw new InvalidOperationException($"Script '{script}' is not embedded.");
        using var reader = new StreamReader(stream);

        // The target database comes from the connection string, so USE lines are dropped
        var sql = UseStatement().Replace(reader.ReadToEnd(), string.Empty);
        return BatchSeparator().Split(sql).Where(batch => !string.IsNullOrWhiteSpace(batch));
    }

    [GeneratedRegex(@"^\s*USE\s+\[?\w+\]?\s*;?\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase)]
    private static partial Regex UseStatement();

    [GeneratedRegex(@"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase)]
    private static partial Regex BatchSeparator();
}
