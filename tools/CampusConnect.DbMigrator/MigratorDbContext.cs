using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace CampusConnect.DbMigrator;

// Holds no entities; the schema is owned by the SQL scripts
public sealed class MigratorDbContext(DbContextOptions<MigratorDbContext> options) : DbContext(options);

public sealed class MigratorDbContextFactory : IDesignTimeDbContextFactory<MigratorDbContext>
{
    // Windows authentication against the default instance; override with --connection
    public const string DefaultConnection =
        "Server=.;Database=CampusConnectDB;Trusted_Connection=True;TrustServerCertificate=True";

    public MigratorDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<MigratorDbContext>()
            .UseSqlServer(DefaultConnection, sql => sql.CommandTimeout(300))
            .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning))
            .Options);
}
