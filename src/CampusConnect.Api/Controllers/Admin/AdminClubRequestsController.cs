using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.ClubRequests;
using CampusConnect.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers.Admin;

[Authorize(Policy = PermissionKeys.ReviewClubRequests)]
[Route("api/admin/club-requests")]
public sealed class AdminClubRequestsController(IClubRequestService requests) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ClubRequestDto>>> List(
        [FromQuery] ClubRequestQuery query, CancellationToken cancellationToken) =>
        await requests.ListAllAsync(query, cancellationToken);

    [HttpPost("{requestId:int}/approve")]
    public async Task<IActionResult> Approve(int requestId, CancellationToken cancellationToken)
    {
        await requests.ApproveAsync(requestId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{requestId:int}/reject")]
    public async Task<IActionResult> Reject(
        int requestId, RejectClubRequestRequest request, CancellationToken cancellationToken)
    {
        await requests.RejectAsync(requestId, request, cancellationToken);
        return NoContent();
    }
}
