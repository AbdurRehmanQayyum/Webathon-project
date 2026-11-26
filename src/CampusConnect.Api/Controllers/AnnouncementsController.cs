using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Announcements;
using CampusConnect.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/announcements")]
public sealed class AnnouncementsController(IAnnouncementService announcements) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<AnnouncementDto>>> List(
        [FromQuery] AnnouncementQuery query, CancellationToken cancellationToken) =>
        await announcements.ListAsync(query, cancellationToken);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AnnouncementDto>> Get(int id, CancellationToken cancellationToken) =>
        await announcements.GetAsync(id, cancellationToken);

    [Authorize(Policy = PermissionKeys.ManageAnnouncements)]
    [HttpPost]
    public async Task<ActionResult<CreatedResponse>> Create(
        SaveAnnouncementRequest request, CancellationToken cancellationToken) =>
        CreatedId("/api/announcements", await announcements.CreateAsync(request, cancellationToken));

    [Authorize(Policy = PermissionKeys.ManageAnnouncements)]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id, SaveAnnouncementRequest request, CancellationToken cancellationToken)
    {
        await announcements.UpdateAsync(id, request, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = PermissionKeys.ManageAnnouncements)]
    [HttpPut("{id:int}/publication")]
    public async Task<IActionResult> SetPublication(
        int id, SetPublicationRequest request, CancellationToken cancellationToken)
    {
        await announcements.SetPublicationAsync(id, request, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = PermissionKeys.ManageAnnouncements)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await announcements.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
