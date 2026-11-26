using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusConnect.Application.Features.Permissions;

public sealed record RolePermissionsDto(int RoleId, string Role, bool IsLocked, IReadOnlyList<string> Permissions);

public sealed record PermissionMatrixDto(
    IReadOnlyList<PermissionDefinition> Permissions,
    IReadOnlyList<RolePermissionsDto> Roles);

public sealed record UpdateRolePermissionsRequest(IReadOnlyList<string> Permissions);

public interface IPermissionService
{
    Task<PermissionMatrixDto> GetMatrixAsync(CancellationToken cancellationToken);
    Task UpdateRoleAsync(int roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken);
}

public sealed class PermissionService(IAppDbContext db, ILogger<PermissionService> logger) : IPermissionService
{
    public async Task<PermissionMatrixDto> GetMatrixAsync(CancellationToken cancellationToken)
    {
        var roles = await db.Roles.AsNoTracking()
            .OrderBy(r => r.Id)
            .Select(r => new { r.Id, r.Name, Permissions = r.RolePermissions.Select(p => p.Permission).ToList() })
            .ToListAsync(cancellationToken);

        return new PermissionMatrixDto(
            PermissionCatalog.All,
            [
                .. roles.Select(r => r.Id == RoleIds.Admin
                    ? new RolePermissionsDto(r.Id, r.Name, true, [.. PermissionCatalog.All.Select(p => p.Key)])
                    : new RolePermissionsDto(r.Id, r.Name, false, r.Permissions))
            ]);
    }

    public Task UpdateRoleAsync(
        int roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        // Administrators always keep every permission, so nobody can be locked out
        if (roleId == RoleIds.Admin)
        {
            throw new ConflictException("Administrator permissions cannot be changed.");
        }

        var assignable = PermissionCatalog.All.Where(p => !p.AdminOnly).Select(p => p.Key).ToHashSet();
        var requested = (request.Permissions ?? []).Distinct().ToList();
        if (requested.Any(key => !assignable.Contains(key)))
        {
            throw new RequestValidationException("permissions", "One of the permissions cannot be assigned.");
        }

        return db.ExecuteInTransactionAsync(async () =>
        {
            if (!await db.Roles.AnyAsync(r => r.Id == roleId, cancellationToken))
            {
                throw new NotFoundException("Role");
            }

            await db.RolePermissions.Where(p => p.RoleId == roleId).ExecuteDeleteAsync(cancellationToken);
            db.RolePermissions.AddRange(
                requested.Select(key => new RolePermission { RoleId = roleId, Permission = key }));
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Permissions updated for role {RoleId}", roleId);
        }, cancellationToken);
    }
}
