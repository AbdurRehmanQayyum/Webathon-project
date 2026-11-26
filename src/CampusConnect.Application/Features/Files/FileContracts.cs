using CampusConnect.Domain.Enums;

namespace CampusConnect.Application.Features.Files;

public sealed record FileUpload(string FileName, string? ContentType, long Length, Stream Content);

public sealed record FileDownload(
    Uri? RedirectUrl,
    Stream? Content,
    string ContentType,
    string FileName,
    bool IsCommunityImage);

public sealed record FilePolicyDto(
    long MaxFileSize,
    IReadOnlyList<string> AllowedExtensions,
    IReadOnlyList<string> ImageExtensions,
    long QuotaBytes,
    long UsedBytes);

public sealed class FileUploadOptions
{
    public const string SectionName = "Storage";

    // Matches the database check constraint
    public const long HardSizeLimit = 10 * 1024 * 1024;

    public long MaxFileSize { get; set; } = 5 * 1024 * 1024;
    public long UserQuota { get; set; } = 100 * 1024 * 1024;
    public string[] AllowedFileTypes { get; set; } = [];
    public int PresignedUrlExpirationMinutes { get; set; } = 5;

    public long EffectiveMaxFileSize => Math.Min(MaxFileSize, HardSizeLimit);
}

public static class FilePurposeRules
{
    public static bool IsCommunityImage(FilePurpose purpose) =>
        purpose is FilePurpose.Avatar or FilePurpose.ClubLogo or FilePurpose.ClubCover;

    // Predictable, collision-resistant object keys
    public static string ObjectKey(FilePurpose purpose, int ownerId, string fileId) => purpose switch
    {
        FilePurpose.Avatar => $"users/{ownerId}/avatars/{fileId}",
        FilePurpose.ClubLogo => $"clubs/{ownerId}/logos/{fileId}",
        FilePurpose.ClubCover => $"clubs/{ownerId}/covers/{fileId}",
        FilePurpose.PostAttachment => $"posts/{ownerId}/attachments/{fileId}",
        FilePurpose.AnnouncementAttachment => $"announcements/{ownerId}/attachments/{fileId}",
        FilePurpose.EventAttachment => $"events/{ownerId}/attachments/{fileId}",
        _ => throw new ArgumentOutOfRangeException(nameof(purpose))
    };
}
