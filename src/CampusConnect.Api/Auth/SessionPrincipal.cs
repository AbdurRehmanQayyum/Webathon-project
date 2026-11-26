using System.Security.Claims;
using CampusConnect.Application.Features.Auth;

namespace CampusConnect.Api.Auth;

public static class SessionPrincipal
{
    public const string PermissionClaim = "permission";
    public const string PasswordChangeClaim = "password_change";
    private const string AuthenticationType = "Session";

    public static ClaimsPrincipal Create(SessionIdentity identity)
    {
        List<Claim> claims =
        [
            new(ClaimTypes.NameIdentifier, identity.UserId.ToString()),
            new(ClaimTypes.Name, identity.FullName),
            new(ClaimTypes.Email, identity.Email),
            .. identity.Roles.Select(role => new Claim(ClaimTypes.Role, role)),
            .. identity.Permissions.Select(permission => new Claim(PermissionClaim, permission))
        ];

        if (identity.MustChangePassword)
        {
            claims.Add(new Claim(PasswordChangeClaim, "required"));
        }

        return new ClaimsPrincipal(new ClaimsIdentity(claims, AuthenticationType));
    }
}
