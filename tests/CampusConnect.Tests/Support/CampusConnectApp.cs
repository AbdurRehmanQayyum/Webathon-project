using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace CampusConnect.Tests.Support;

// Runs the real API against a dedicated SQL Server test database built from the schema scripts
public sealed partial class CampusConnectApp : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string DemoPassword = "Integration-Test-2026";
    private const string SourceDatabase = "CampusConnectDB";
    private const string TestDatabase = "CampusConnectDB_Tests";

    private readonly Dictionary<string, string?> _overrides;

    public CampusConnectApp() : this([])
    {
    }

    private CampusConnectApp(Dictionary<string, string?> overrides) => _overrides = overrides;

    public static CampusConnectApp With(params (string Key, string Value)[] settings) =>
        new(settings.ToDictionary(s => s.Key, s => (string?)s.Value));

    private static string ConnectionString =>
        Environment.GetEnvironmentVariable("CAMPUSCONNECT_TEST_CONNECTION")
        ?? $@"Server=.\SQLEXPRESS;Database={TestDatabase};Trusted_Connection=True;TrustServerCertificate=True";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration(configuration => configuration
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CampusConnect"] = ConnectionString,
                ["Seed:Enabled"] = "true",
                ["Seed:DemoPassword"] = DemoPassword,
                ["RateLimiting:SensitivePermitsPerMinute"] = "10000",
                ["Storage:Provider"] = "Local",
                ["Storage:LocalRootPath"] = Path.Combine(Path.GetTempPath(), "campusconnect-tests"),
                // Tests never reach a real bucket, whatever the machine's own settings say
                ["Storage:Endpoint"] = "",
                ["Storage:BucketName"] = "",
                ["Storage:AccessKeyId"] = "",
                ["Storage:SecretAccessKey"] = ""
            })
            .AddInMemoryCollection(_overrides));
    }

    public async Task InitializeAsync()
    {
        var master = new SqlConnectionStringBuilder(ConnectionString) { InitialCatalog = "master" };
        await using var connection = new SqlConnection(master.ConnectionString);
        await connection.OpenAsync();

        var scripts = Directory.GetFiles(FindDatabaseFolder(), "*.sql").Order();
        foreach (var script in scripts)
        {
            var sql = (await File.ReadAllTextAsync(script)).Replace(SourceDatabase, TestDatabase);
            foreach (var batch in BatchSeparator().Split(sql).Where(b => !string.IsNullOrWhiteSpace(b)))
            {
                await using var command = new SqlCommand(batch, connection);
                await command.ExecuteNonQueryAsync();
            }
        }
    }

    Task IAsyncLifetime.DisposeAsync() => DisposeAsync().AsTask();

    private static string FindDatabaseFolder()
    {
        var folder = new DirectoryInfo(AppContext.BaseDirectory);
        while (folder is not null && !File.Exists(Path.Combine(folder.FullName, "CampusConnect.sln")))
        {
            folder = folder.Parent;
        }

        return Path.Combine(
            folder?.FullName ?? throw new InvalidOperationException("Solution folder not found."), "database");
    }

    [GeneratedRegex(@"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase)]
    private static partial Regex BatchSeparator();
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<CampusConnectApp>
{
    public const string Name = "api";
}
