using CampusConnect.Domain.Enums;

namespace CampusConnect.Application.Features.Files;

public enum FileKind
{
    Image,
    Document,
    Audio,
    Video
}

public sealed record FileUpload(string FileName, string? ContentType, long Length, Stream Content);

public sealed record FileDownload(
    Uri? RedirectUrl,
    Stream? Content,
    string ContentType,
    string FileName,
    bool Inline,
    bool IsCommunityImage);

public sealed record FileTypeDto(string Extension, FileKind Kind, long MaxSize);

public sealed record FilePolicyDto(
    IReadOnlyList<FileTypeDto> Types,
    int MaxAttachments,
    long QuotaBytes,
    long UsedBytes);

public sealed class FileUploadOptions
{
    public const string SectionName = "Storage";

    // Matches the database check constraint
    public const long HardSizeLimit = 100 * 1024 * 1024;

    public long MaxImageSize { get; set; } = 5 * 1024 * 1024;
    public long MaxDocumentSize { get; set; } = 10 * 1024 * 1024;
    public long MaxAudioSize { get; set; } = 20 * 1024 * 1024;
    public long MaxVideoSize { get; set; } = 50 * 1024 * 1024;
    public long UserQuota { get; set; } = 500 * 1024 * 1024;
    public string[] AllowedFileTypes { get; set; } = [];
    public int PresignedUrlExpirationMinutes { get; set; } = 5;

    public long LimitFor(FileKind kind) => Math.Min(
        kind switch
        {
            FileKind.Image => MaxImageSize,
            FileKind.Audio => MaxAudioSize,
            FileKind.Video => MaxVideoSize,
            _ => MaxDocumentSize
        },
        HardSizeLimit);
}

public static class FilePurposeRules
{
    public const int MaxAttachmentsPerItem = 6;

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
