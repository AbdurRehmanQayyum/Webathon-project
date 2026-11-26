using System.Security.Claims;
using CampusConnect.Application.Features.Auth;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace CampusConnect.Api.Auth;

public static class SessionPrincipal
{
    public const string SecurityStampClaim = "security_stamp";

    public static ClaimsPrincipal Create(SessionIdentity identity)
    {
        List<Claim> claims =
        [
            new(ClaimTypes.NameIdentifier, identity.UserId.ToString()),
            new(ClaimTypes.Name, identity.FullName),
            new(ClaimTypes.Email, identity.Email),
            new(SecurityStampClaim, identity.SecurityStamp.ToString()),
            .. identity.Roles.Select(role => new Claim(ClaimTypes.Role, role))
        ];

        return new ClaimsPrincipal(
            new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
    }
}
