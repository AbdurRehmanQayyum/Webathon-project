using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CampusConnect.Application.Features.Files;

public interface IFileService
{
    Task<FilePolicyDto> GetPolicyAsync(CancellationToken cancellationToken);
    Task<AttachmentDto> UploadAsync(
        FilePurpose purpose, int ownerId, FileUpload file, CancellationToken cancellationToken);
    Task<FileDownload> DownloadAsync(int fileId, CancellationToken cancellationToken);
    Task DeleteAsync(int fileId, CancellationToken cancellationToken);
}

public sealed class FileService(
    IAppDbContext db,
    ICurrentUser currentUser,
    FileAccessPolicy access,
    IFileStorageService storage,
    IOptions<FileUploadOptions> options,
    ILogger<FileService> logger) : IFileService
{
    private const int MaxAttachmentsPerItem = 4;

    public async Task<FilePolicyDto> GetPolicyAsync(CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var allowed = FileValidation.AllowedExtensions(settings);

        return new FilePolicyDto(
            settings.EffectiveMaxFileSize,
            allowed,
            [.. allowed.Where(FileValidation.IsImage)],
            settings.UserQuota,
            await GetUsedBytesAsync(cancellationToken));
    }

    public async Task<AttachmentDto> UploadAsync(
        FilePurpose purpose, int ownerId, FileUpload file, CancellationToken cancellationToken)
    {
        await access.EnsureCanUploadAsync(purpose, ownerId, cancellationToken);

        var isCommunityImage = FilePurposeRules.IsCommunityImage(purpose);
        var validated = await FileValidation.ValidateAsync(
            file, options.Value, isCommunityImage, cancellationToken);

        if (await GetUsedBytesAsync(cancellationToken) + file.Length > options.Value.UserQuota)
        {
            throw new ConflictException("You have reached your storage limit. Remove some files first.", "file");
        }

        if (!isCommunityImage)
        {
            await EnsureAttachmentSlotAsync(purpose, ownerId, cancellationToken);
        }

        var fileId = Guid.NewGuid().ToString("N");
        var objectKey = FilePurposeRules.ObjectKey(purpose, ownerId, fileId);
        await storage.UploadAsync(objectKey, file.Content, validated.ContentType, cancellationToken);

        Attachment attachment = null!;
        string? replacedKey = null;
        try
        {
            await db.ExecuteInTransactionAsync(async () =>
            {
                attachment = new Attachment
                {
                    UploadedByUserId = currentUser.Id,
                    OriginalFileName = validated.DisplayName,
                    StoredFileName = fileId,
                    ObjectKey = objectKey,
                    ContentType = validated.ContentType,
                    FileExtension = validated.Extension,
                    FileSize = file.Length,
                    StorageProvider = storage.ProviderName,
                    Purpose = (byte)purpose,
                    PostId = purpose == FilePurpose.PostAttachment ? ownerId : null,
                    AnnouncementId = purpose == FilePurpose.AnnouncementAttachment ? ownerId : null,
                    EventId = purpose == FilePurpose.EventAttachment ? ownerId : null
                };
                db.Attachments.Add(attachment);
                await db.SaveChangesAsync(cancellationToken);

                replacedKey = await ReplaceImageAsync(purpose, ownerId, attachment.Id, cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
            }, cancellationToken);
        }
        catch
        {
            // Compensating cleanup keeps storage free of orphans
            await TryDeleteObjectAsync(objectKey);
            throw;
        }

        if (replacedKey is not null)
        {
            await TryDeleteObjectAsync(replacedKey);
        }

        return new AttachmentDto(
            attachment.Id, attachment.OriginalFileName, attachment.ContentType, attachment.FileSize);
    }

    public async Task<FileDownload> DownloadAsync(int fileId, CancellationToken cancellationToken)
    {
        await access.EnsureCanViewAsync(fileId, cancellationToken);
        var file = await db.Attachments.AsNoTracking().SingleAsync(a => a.Id == fileId, cancellationToken);

        var isImage = FileValidation.IsImage(file.FileExtension);
        var isCommunityImage = FilePurposeRules.IsCommunityImage((FilePurpose)file.Purpose);
        var url = await storage.GetPresignedUrlAsync(
            file.ObjectKey,
            new StoredObjectResponse(file.OriginalFileName, file.ContentType, isImage),
            TimeSpan.FromMinutes(options.Value.PresignedUrlExpirationMinutes),
            cancellationToken);

        if (url is not null)
        {
            return new FileDownload(url, null, file.ContentType, file.OriginalFileName, isCommunityImage);
        }

        var content = await storage.DownloadAsync(file.ObjectKey, cancellationToken)
            ?? throw new NotFoundException("File");
        return new FileDownload(null, content, file.ContentType, file.OriginalFileName, isCommunityImage);
    }

    public async Task DeleteAsync(int fileId, CancellationToken cancellationToken)
    {
        var file = await db.Attachments.SingleOrDefaultAsync(
            a => a.Id == fileId && !a.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("File");
        await access.EnsureCanDeleteAsync(file, cancellationToken);

        // Detach image references, then soft delete the metadata in one save
        foreach (var user in await db.Users.Where(u => u.AvatarFileId == fileId).ToListAsync(cancellationToken))
        {
            user.AvatarFileId = null;
        }

        var clubs = await db.Clubs
            .Where(c => c.LogoFileId == fileId || c.CoverFileId == fileId)
            .ToListAsync(cancellationToken);
        foreach (var club in clubs)
        {
            club.LogoFileId = club.LogoFileId == fileId ? null : club.LogoFileId;
            club.CoverFileId = club.CoverFileId == fileId ? null : club.CoverFileId;
        }

        file.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        await TryDeleteObjectAsync(file.ObjectKey);
    }

    private Task<long> GetUsedBytesAsync(CancellationToken cancellationToken) =>
        db.Attachments
            .Where(a => a.UploadedByUserId == currentUser.Id && !a.IsDeleted)
            .SumAsync(a => a.FileSize, cancellationToken);

    private async Task EnsureAttachmentSlotAsync(
        FilePurpose purpose, int ownerId, CancellationToken cancellationToken)
    {
        var siblings = db.Attachments.Where(a => !a.IsDeleted && a.Purpose == (byte)purpose);
        siblings = purpose switch
        {
            FilePurpose.PostAttachment => siblings.Where(a => a.PostId == ownerId),
            FilePurpose.AnnouncementAttachment => siblings.Where(a => a.AnnouncementId == ownerId),
            _ => siblings.Where(a => a.EventId == ownerId)
        };

        if (await siblings.CountAsync(cancellationToken) >= MaxAttachmentsPerItem)
        {
            throw new ConflictException($"You can attach up to {MaxAttachmentsPerItem} files.", "file");
        }
    }

    // Avatars, logos and covers hold a single file; returns the key being replaced
    private async Task<string?> ReplaceImageAsync(
        FilePurpose purpose, int ownerId, int newFileId, CancellationToken cancellationToken)
    {
        int? previousId = null;

        if (purpose == FilePurpose.Avatar)
        {
            var user = await db.Users.SingleAsync(u => u.Id == ownerId, cancellationToken);
            previousId = user.AvatarFileId;
            user.AvatarFileId = newFileId;
        }
        else if (purpose is FilePurpose.ClubLogo or FilePurpose.ClubCover)
        {
            var club = await db.Clubs.SingleAsync(c => c.Id == ownerId, cancellationToken);
            if (purpose == FilePurpose.ClubLogo)
            {
                previousId = club.LogoFileId;
                club.LogoFileId = newFileId;
            }
            else
            {
                previousId = club.CoverFileId;
                club.CoverFileId = newFileId;
            }
        }

        if (previousId is null)
        {
            return null;
        }

        var previous = await db.Attachments.SingleAsync(a => a.Id == previousId, cancellationToken);
        previous.IsDeleted = true;
        return previous.ObjectKey;
    }

    private async Task TryDeleteObjectAsync(string objectKey)
    {
        try
        {
            await storage.DeleteAsync(objectKey, CancellationToken.None);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Stored object {ObjectKey} could not be deleted", objectKey);
        }
    }
}
