using CampusConnect.Application.Features.Administration;
using CampusConnect.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers.Admin;

[Authorize(Policy = PermissionKeys.ViewDashboard)]
[Route("api/admin/overview")]
public sealed class AdminOverviewController(IOverviewService overview) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<AdminOverviewDto>> Get(CancellationToken cancellationToken) =>
        await overview.GetAsync(cancellationToken);
}
