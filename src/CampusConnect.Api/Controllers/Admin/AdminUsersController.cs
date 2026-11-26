using CampusConnect.Api.Auth;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers.Admin;

[Authorize(Policy = Policies.Admin)]
[Route("api/admin/users")]
public sealed class AdminUsersController(IUserAdministrationService users) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> List(
        [FromQuery] AdminUserQuery query, CancellationToken cancellationToken) =>
        await users.ListAsync(query, cancellationToken);

    [HttpPut("{userId:int}/status")]
    public async Task<IActionResult> SetStatus(
        int userId, SetUserStatusRequest request, CancellationToken cancellationToken)
    {
        await users.SetStatusAsync(userId, request, cancellationToken);
        return NoContent();
    }

    [HttpPut("{userId:int}/admin-role")]
    public async Task<IActionResult> SetAdminRole(
        int userId, SetAdminRoleRequest request, CancellationToken cancellationToken)
    {
        await users.SetAdminRoleAsync(userId, request, cancellationToken);
        return NoContent();
    }
}
