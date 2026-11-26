using CampusConnect.Api.Auth;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.ClubRequests;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CampusConnect.Api.Controllers;

[Route("api/club-requests")]
public sealed class ClubRequestsController(IClubRequestService requests) : ApiController
{
    [HttpGet("mine")]
    public async Task<ActionResult<PagedResult<ClubRequestDto>>> Mine(
        [FromQuery] ClubRequestQuery query, CancellationToken cancellationToken) =>
        await requests.ListMineAsync(query, cancellationToken);

    [EnableRateLimiting(Policies.SensitiveRateLimit)]
    [HttpPost]
    public async Task<ActionResult<CreatedResponse>> Submit(
        CreateClubRequestRequest request, CancellationToken cancellationToken) =>
        CreatedId("/api/club-requests", await requests.SubmitAsync(request, cancellationToken));
}
