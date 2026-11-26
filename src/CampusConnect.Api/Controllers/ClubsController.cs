using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/clubs")]
public sealed class ClubsController(IClubService clubs) : ApiController
{
    [HttpGet("categories")]
    public async Task<ActionResult<IReadOnlyList<ClubCategoryDto>>> Categories(
        CancellationToken cancellationToken) =>
        Ok(await clubs.GetCategoriesAsync(cancellationToken));

    [HttpGet]
    public async Task<ActionResult<PagedResult<ClubDto>>> List(
        [FromQuery] ClubQuery query, CancellationToken cancellationToken) =>
        await clubs.ListAsync(query, cancellationToken);

    [HttpGet("{slug}")]
    public async Task<ActionResult<ClubDto>> Get(string slug, CancellationToken cancellationToken) =>
        await clubs.GetBySlugAsync(slug, cancellationToken);

    [HttpPost("{clubId:int}/membership")]
    public async Task<IActionResult> Join(int clubId, CancellationToken cancellationToken)
    {
        await clubs.JoinAsync(clubId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{clubId:int}/membership")]
    public async Task<IActionResult> Leave(int clubId, CancellationToken cancellationToken)
    {
        await clubs.LeaveAsync(clubId, cancellationToken);
        return NoContent();
    }
}
