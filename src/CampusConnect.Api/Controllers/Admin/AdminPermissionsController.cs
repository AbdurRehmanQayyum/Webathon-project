using CampusConnect.Application.Features.Permissions;
using CampusConnect.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers.Admin;

[Authorize(Policy = PermissionKeys.ManagePermissions)]
[Route("api/admin/permissions")]
public sealed class AdminPermissionsController(IPermissionService permissions) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<PermissionMatrixDto>> Get(CancellationToken cancellationToken) =>
        await permissions.GetMatrixAsync(cancellationToken);

    [HttpPut("{roleId:int}")]
    public async Task<IActionResult> Update(
        int roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        await permissions.UpdateRoleAsync(roleId, request, cancellationToken);
        return NoContent();
    }
}
