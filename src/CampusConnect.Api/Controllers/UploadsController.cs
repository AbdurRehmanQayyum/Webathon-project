using CampusConnect.Api.Auth;
using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Files;
using CampusConnect.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CampusConnect.Api.Controllers;

// Backend-mediated uploads; authorization is enforced per resource by the file service
[Route("api")]
[EnableRateLimiting(Policies.SensitiveRateLimit)]
[RequestSizeLimit(FileUploadOptions.HardSizeLimit + 64 * 1024)]
public sealed class UploadsController(IFileService files, ICurrentUser currentUser) : ApiController
{
    [HttpPost("users/me/avatar")]
    public Task<ActionResult<AttachmentDto>> Avatar(IFormFile file, CancellationToken cancellationToken) =>
        StoreAsync(FilePurpose.Avatar, currentUser.Id, file, cancellationToken);

    [HttpPost("clubs/{clubId:int}/logo")]
    public Task<ActionResult<AttachmentDto>> ClubLogo(
        int clubId, IFormFile file, CancellationToken cancellationToken) =>
        StoreAsync(FilePurpose.ClubLogo, clubId, file, cancellationToken);

    [HttpPost("clubs/{clubId:int}/cover")]
    public Task<ActionResult<AttachmentDto>> ClubCover(
        int clubId, IFormFile file, CancellationToken cancellationToken) =>
        StoreAsync(FilePurpose.ClubCover, clubId, file, cancellationToken);

    [HttpPost("posts/{postId:int}/attachments")]
    public Task<ActionResult<AttachmentDto>> PostAttachment(
        int postId, IFormFile file, CancellationToken cancellationToken) =>
        StoreAsync(FilePurpose.PostAttachment, postId, file, cancellationToken);

    [HttpPost("announcements/{announcementId:int}/attachments")]
    public Task<ActionResult<AttachmentDto>> AnnouncementAttachment(
        int announcementId, IFormFile file, CancellationToken cancellationToken) =>
        StoreAsync(FilePurpose.AnnouncementAttachment, announcementId, file, cancellationToken);

    [HttpPost("events/{eventId:int}/attachments")]
    public Task<ActionResult<AttachmentDto>> EventAttachment(
        int eventId, IFormFile file, CancellationToken cancellationToken) =>
        StoreAsync(FilePurpose.EventAttachment, eventId, file, cancellationToken);

    private async Task<ActionResult<AttachmentDto>> StoreAsync(
        FilePurpose purpose, int ownerId, IFormFile file, CancellationToken cancellationToken)
    {
        await using var content = file.OpenReadStream();
        var stored = await files.UploadAsync(
            purpose,
            ownerId,
            new FileUpload(file.FileName, file.ContentType, file.Length, content),
            cancellationToken);
        return Created($"/api/files/{stored.Id}", stored);
    }
}
