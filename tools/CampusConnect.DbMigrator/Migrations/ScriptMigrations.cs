using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace CampusConnect.DbMigrator.Migrations;

// Add one class here for every new script in database/

[DbContext(typeof(MigratorDbContext))]
[Migration("202611260001_DatabaseOptions")]
public sealed class DatabaseOptions : Migration
{
    // Cannot run inside a transaction
    protected override void Up(MigrationBuilder migrationBuilder) =>
        migrationBuilder.Sql(
            """
            IF EXISTS (SELECT 1 FROM sys.databases WHERE database_id = DB_ID() AND is_read_committed_snapshot_on = 0)
                ALTER DATABASE CURRENT SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
            """,
            suppressTransaction: true);
}

[DbContext(typeof(MigratorDbContext))]
[Migration("202611260002_CreateTables")]
public sealed class CreateTables : ScriptMigration
{
    protected override string Script => "02_CreateTables.sql";
}

[DbContext(typeof(MigratorDbContext))]
[Migration("202611260003_CreateIndexes")]
public sealed class CreateIndexes : ScriptMigration
{
    protected override string Script => "03_CreateIndexes.sql";
}

[DbContext(typeof(MigratorDbContext))]
[Migration("202611260004_SeedReferenceData")]
public sealed class SeedReferenceData : ScriptMigration
{
    protected override string Script => "04_SeedReferenceData.sql";
}

[DbContext(typeof(MigratorDbContext))]
[Migration("202611260005_AddObjectStorageMetadata")]
public sealed class AddObjectStorageMetadata : ScriptMigration
{
    protected override string Script => "05_AddObjectStorageMetadata.sql";
}

[DbContext(typeof(MigratorDbContext))]
[Migration("202611260006_AddCommunityFeatures")]
public sealed class AddCommunityFeatures : ScriptMigration
{
    protected override string Script => "06_AddCommunityFeatures.sql";
}
