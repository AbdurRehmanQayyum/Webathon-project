using System.Security.Cryptography;
using System.Text.Json;

namespace CampusConnect.Api.Setup;

// Gives each development machine its own keys, in a file that is never committed
public static class DevelopmentKeys
{
    private const string FileName = "appsettings.Local.json";
    private static readonly JsonSerializerOptions Indented = new() { WriteIndented = true };

    public static void Load(ConfigurationManager configuration, string contentRoot)
    {
        var path = Path.Combine(contentRoot, FileName);
        if (!File.Exists(path))
        {
            var keys = new { Jwt = new { Key = NewKey(64) }, Encryption = new { Key = NewKey(32) } };
            File.WriteAllText(path, JsonSerializer.Serialize(keys, Indented));
        }

        configuration.AddJsonFile(path, optional: false, reloadOnChange: false);
    }

    private static string NewKey(int bytes) => Convert.ToBase64String(RandomNumberGenerator.GetBytes(bytes));
}
