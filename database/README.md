# Database scripts

SQL scripts are the authoritative schema for `CampusConnectDB`. Run them in order; each is safe to
run again.

| Script | Purpose |
| --- | --- |
| `01_CreateDatabase.sql` | Creates the database |
| `02_CreateTables.sql` | Tables, keys and constraints |
| `03_CreateIndexes.sql` | Search, filter and uniqueness indexes |
| `04_SeedReferenceData.sql` | Roles and club categories |
| `05_AddObjectStorageMetadata.sql` | Stored-file metadata for object storage |
| `06_AddCommunityFeatures.sql` | Usernames, comment votes, tags, interests, role permissions |

**Servers:** `scripts/publish.ps1` also builds `campusconnect-db.exe`, an EF Core migration bundle
that runs these scripts (see [DEPLOYMENT.md](../docs/DEPLOYMENT.md)). A new script needs a matching
class in `tools/CampusConnect.DbMigrator/Migrations`.

**SSMS:** connect to your instance, open each file and press F5.

**Command line (Windows authentication):**

```powershell
Get-ChildItem database\*.sql | Sort-Object Name | ForEach-Object { sqlcmd -S .\SQLEXPRESS -E -C -b -I -i $_.FullName }
```

For SQL Server authentication replace `-E` with `-U <user>`; `sqlcmd` prompts for the password.
Keep the `-I` flag: filtered indexes require quoted identifiers.

On a hosted service that provides an existing database, skip script 01 and change the
`USE [CampusConnectDB]` line to that database name.
