using CampusConnect.Api.Auth;
using CampusConnect.Application.Features.Administration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers.Admin;

[Authorize(Policy = Policies.Admin)]
[Route("api/admin/overview")]
public sealed class AdminOverviewController(IOverviewService overview) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<AdminOverviewDto>> Get(CancellationToken cancellationToken) =>
        await overview.GetAsync(cancellationToken);
}
