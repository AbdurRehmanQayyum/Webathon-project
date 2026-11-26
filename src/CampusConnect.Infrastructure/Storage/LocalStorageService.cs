using CampusConnect.Application.Common.Abstractions;
using Microsoft.Extensions.Options;

namespace CampusConnect.Infrastructure.Storage;

// Development provider: private files on disk, streamed by the API after authorization
public sealed class LocalStorageService(IOptions<ObjectStorageOptions> options) : IFileStorageService
{
    private readonly string _root = Path.GetFullPath(options.Value.LocalRootPath);

    public string ProviderName => ObjectStorageOptions.LocalProvider;

    public async Task UploadAsync(
        string objectKey, Stream content, string contentType, CancellationToken cancellationToken)
    {
        var path = Resolve(objectKey);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var target = new FileStream(path, FileMode.CreateNew);
        await content.CopyToAsync(target, cancellationToken);
    }

    public Task<Stream?> DownloadAsync(string objectKey, CancellationToken cancellationToken)
    {
        var path = Resolve(objectKey);
        return Task.FromResult<Stream?>(File.Exists(path) ? File.OpenRead(path) : null);
    }

    public Task DeleteAsync(string objectKey, CancellationToken cancellationToken)
    {
        var path = Resolve(objectKey);
        if (File.Exists(path))
        {
            File.Delete(path);
        }

        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken) =>
        Task.FromResult(File.Exists(Resolve(objectKey)));

    public Task<Uri?> GetPresignedUrlAsync(
        string objectKey, StoredObjectResponse response, TimeSpan lifetime, CancellationToken cancellationToken) =>
        Task.FromResult<Uri?>(null);

    // Path traversal guard
    private string Resolve(string objectKey)
    {
        var path = Path.GetFullPath(Path.Combine(_root, objectKey));
        return path.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal)
            ? path
            : throw new InvalidOperationException("Invalid object key.");
    }
}
