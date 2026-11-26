namespace CampusConnect.Infrastructure.Storage;

public sealed class ObjectStorageOptions
{
    public const string SectionName = "Storage";
    public const string LocalProvider = "Local";
    public const string S3Provider = "S3";

    public string Provider { get; set; } = LocalProvider;
    public string? Endpoint { get; set; }
    public string Region { get; set; } = "auto";
    public string? BucketName { get; set; }
    public string? AccessKeyId { get; set; }
    public string? SecretAccessKey { get; set; }
    public string LocalRootPath { get; set; } = "App_Data/uploads";

    public bool UsesS3 => Provider.Equals(S3Provider, StringComparison.OrdinalIgnoreCase);

    public bool IsS3Configured =>
        Uri.TryCreate(Endpoint, UriKind.Absolute, out var endpoint)
        && endpoint.Scheme == Uri.UriSchemeHttps
        && !string.IsNullOrWhiteSpace(BucketName)
        && !string.IsNullOrWhiteSpace(AccessKeyId)
        && !string.IsNullOrWhiteSpace(SecretAccessKey);
}
