using CampusConnect.Api.Auth;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers.Admin;

[Route("api/admin/clubs")]
public sealed class AdminClubsController(IClubManagementService clubs) : ApiController
{
    [Authorize(Policy = Policies.ClubDirectory)]
    [HttpGet]
    public async Task<ActionResult<PagedResult<ClubDto>>> List(
        [FromQuery] ClubQuery query, CancellationToken cancellationToken) =>
        await clubs.ListAsync(query, cancellationToken);

    [Authorize(Policy = Policies.ClubDirectory)]
    [HttpGet("{clubId:int}/members")]
    public async Task<ActionResult<PagedResult<ClubMemberDto>>> Members(
        int clubId, [FromQuery] PageQuery query, CancellationToken cancellationToken) =>
        await clubs.ListMembersAsync(clubId, query, cancellationToken);

    [Authorize(Policy = PermissionKeys.ManageClubs)]
    [HttpPost]
    public async Task<ActionResult<ClubDto>> Create(
        SaveClubRequest request, CancellationToken cancellationToken)
    {
        var club = await clubs.CreateAsync(request, cancellationToken);
        return Created($"/api/clubs/{club.Slug}", club);
    }

    [Authorize(Policy = PermissionKeys.ManageClubs)]
    [HttpPut("{clubId:int}")]
    public async Task<IActionResult> Update(
        int clubId, SaveClubRequest request, CancellationToken cancellationToken)
    {
        await clubs.UpdateAsync(clubId, request, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = PermissionKeys.ManageClubs)]
    [HttpPut("{clubId:int}/status")]
    public async Task<IActionResult> SetStatus(
        int clubId, SetClubStatusRequest request, CancellationToken cancellationToken)
    {
        await clubs.SetStatusAsync(clubId, request, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = PermissionKeys.AssignModerators)]
    [HttpPut("{clubId:int}/moderators/{userId:int}")]
    public async Task<IActionResult> AssignModerator(
        int clubId, int userId, CancellationToken cancellationToken)
    {
        await clubs.AssignModeratorAsync(clubId, userId, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = PermissionKeys.AssignModerators)]
    [HttpDelete("{clubId:int}/moderators/{userId:int}")]
    public async Task<IActionResult> RemoveModerator(
        int clubId, int userId, CancellationToken cancellationToken)
    {
        await clubs.RemoveModeratorAsync(clubId, userId, cancellationToken);
        return NoContent();
    }
}
