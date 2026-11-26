namespace CampusConnect.Application.Common.Abstractions;

public sealed record StoredObjectResponse(string DownloadName, string ContentType, bool Inline);

// Provider-independent object storage addressed by permanent object keys
public interface IFileStorageService
{
    string ProviderName { get; }

    Task UploadAsync(string objectKey, Stream content, string contentType, CancellationToken cancellationToken);
    Task<Stream?> DownloadAsync(string objectKey, CancellationToken cancellationToken);
    Task DeleteAsync(string objectKey, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken);

    // Null when the provider cannot issue direct links and the API must stream the object
    Task<Uri?> GetPresignedUrlAsync(
        string objectKey, StoredObjectResponse response, TimeSpan lifetime, CancellationToken cancellationToken);
}
