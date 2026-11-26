using System.Net;
using System.Net.Http.Headers;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using Microsoft.Extensions.Options;

namespace CampusConnect.Infrastructure.Storage;

// Cloudflare R2 (or any S3-compatible service) with a private bucket
public sealed class S3StorageService(IOptions<ObjectStorageOptions> options) : IFileStorageService, IDisposable
{
    private readonly ObjectStorageOptions _settings = options.Value;
    private AmazonS3Client? _client;

    public string ProviderName => ObjectStorageOptions.S3Provider;

    private AmazonS3Client Client => _client ??= CreateClient();

    public Task UploadAsync(
        string objectKey, Stream content, string contentType, CancellationToken cancellationToken) =>
        GuardAsync(() => Client.PutObjectAsync(
            new PutObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = objectKey,
                InputStream = content,
                ContentType = contentType,
                AutoCloseStream = false,
                // R2 does not support the SDK's streaming SigV4 or default checksums
                DisablePayloadSigning = true,
                DisableDefaultChecksumValidation = true
            },
            cancellationToken));

    public Task<Stream?> DownloadAsync(string objectKey, CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            try
            {
                var response = await Client.GetObjectAsync(_settings.BucketName, objectKey, cancellationToken);
                return (Stream?)response.ResponseStream;
            }
            catch (AmazonS3Exception exception) when (exception.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
        });

    public Task DeleteAsync(string objectKey, CancellationToken cancellationToken) =>
        GuardAsync(() => Client.DeleteObjectAsync(_settings.BucketName, objectKey, cancellationToken));

    public Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            try
            {
                await Client.GetObjectMetadataAsync(_settings.BucketName, objectKey, cancellationToken);
                return true;
            }
            catch (AmazonS3Exception exception) when (exception.StatusCode == HttpStatusCode.NotFound)
            {
                return false;
            }
        });

    public Task<Uri?> GetPresignedUrlAsync(
        string objectKey, StoredObjectResponse response, TimeSpan lifetime, CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            var disposition = new ContentDispositionHeaderValue(response.Inline ? "inline" : "attachment")
            {
                FileNameStar = response.DownloadName
            };
            var url = await Client.GetPreSignedURLAsync(new GetPreSignedUrlRequest
            {
                BucketName = _settings.BucketName,
                Key = objectKey,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.Add(lifetime),
                ResponseHeaderOverrides = new ResponseHeaderOverrides
                {
                    ContentType = response.ContentType,
                    ContentDisposition = disposition.ToString()
                }
            });
            return (Uri?)new Uri(url);
        });

    public void Dispose() => _client?.Dispose();

    private AmazonS3Client CreateClient()
    {
        if (!_settings.IsS3Configured)
        {
            throw new StorageUnavailableException("File storage is not configured. See docs/STORAGE.md.");
        }

        return new AmazonS3Client(
            new BasicAWSCredentials(_settings.AccessKeyId, _settings.SecretAccessKey),
            new AmazonS3Config
            {
                ServiceURL = _settings.Endpoint,
                AuthenticationRegion = _settings.Region,
                ForcePathStyle = true,
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED
            });
    }

    private static async Task<T> GuardAsync<T>(Func<Task<T>> operation)
    {
        try
        {
            return await operation();
        }
        catch (Exception exception) when (exception is AmazonServiceException or AmazonClientException
            or HttpRequestException)
        {
            throw new StorageUnavailableException();
        }
    }
}
