using CampusConnect.Application.Features.Files;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/files")]
public sealed class FilesController(IFileService files) : ApiController
{
    [HttpGet("policy")]
    public async Task<ActionResult<FilePolicyDto>> Policy(CancellationToken cancellationToken) =>
        await files.GetPolicyAsync(cancellationToken);

    [HttpGet("{fileId:int}")]
    [Produces("application/octet-stream")]
    public async Task<IActionResult> Download(
        int fileId, [FromQuery] bool download, CancellationToken cancellationToken)
    {
        var file = await files.DownloadAsync(fileId, download, cancellationToken);

        // Profile and club images may be cached briefly; attachments never
        Response.Headers.CacheControl = file.IsCommunityImage ? "private, max-age=60" : "private, no-store";

        if (file.RedirectUrl is { } url)
        {
            return Redirect(url.AbsoluteUri);
        }

        // Range requests let audio and video seek
        return file.Inline
            ? File(file.Content!, file.ContentType, enableRangeProcessing: true)
            : File(file.Content!, file.ContentType, file.FileName, enableRangeProcessing: true);
    }

    [HttpDelete("{fileId:int}")]
    public async Task<IActionResult> Delete(int fileId, CancellationToken cancellationToken)
    {
        await files.DeleteAsync(fileId, cancellationToken);
        return NoContent();
    }
}
