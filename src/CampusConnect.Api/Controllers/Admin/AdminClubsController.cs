using CampusConnect.Api.Auth;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers.Admin;

[Authorize(Policy = Policies.Admin)]
[Route("api/admin/clubs")]
public sealed class AdminClubsController(IClubManagementService clubs) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ClubDto>>> List(
        [FromQuery] ClubQuery query, CancellationToken cancellationToken) =>
        await clubs.ListAsync(query, cancellationToken);

    [HttpPost]
    public async Task<ActionResult<ClubDto>> Create(
        SaveClubRequest request, CancellationToken cancellationToken)
    {
        var club = await clubs.CreateAsync(request, cancellationToken);
        return Created($"/api/clubs/{club.Slug}", club);
    }

    [HttpPut("{clubId:int}")]
    public async Task<IActionResult> Update(
        int clubId, SaveClubRequest request, CancellationToken cancellationToken)
    {
        await clubs.UpdateAsync(clubId, request, cancellationToken);
        return NoContent();
    }

    [HttpPut("{clubId:int}/status")]
    public async Task<IActionResult> SetStatus(
        int clubId, SetClubStatusRequest request, CancellationToken cancellationToken)
    {
        await clubs.SetStatusAsync(clubId, request, cancellationToken);
        return NoContent();
    }

    [HttpPut("{clubId:int}/moderators/{userId:int}")]
    public async Task<IActionResult> AssignModerator(
        int clubId, int userId, CancellationToken cancellationToken)
    {
        await clubs.AssignModeratorAsync(clubId, userId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{clubId:int}/moderators/{userId:int}")]
    public async Task<IActionResult> RemoveModerator(
        int clubId, int userId, CancellationToken cancellationToken)
    {
        await clubs.RemoveModeratorAsync(clubId, userId, cancellationToken);
        return NoContent();
    }
}
