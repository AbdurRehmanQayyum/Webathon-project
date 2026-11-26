using System.Security.Claims;
using CampusConnect.Application.Features.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace CampusConnect.Api.Auth;

public sealed class SessionCookieEvents(IAuthService auth) : CookieAuthenticationEvents
{
    // Deactivation, password changes and role changes apply on the next request
    public override async Task ValidatePrincipal(CookieValidatePrincipalContext context)
    {
        var principal = context.Principal;
        var session = int.TryParse(principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)
            ? await auth.FindActiveSessionAsync(userId, context.HttpContext.RequestAborted)
            : null;

        if (principal is null
            || session is null
            || session.SecurityStamp.ToString() != principal.FindFirstValue(SessionPrincipal.SecurityStampClaim))
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return;
        }

        var currentRoles = principal.FindAll(ClaimTypes.Role).Select(c => c.Value);
        if (!currentRoles.ToHashSet().SetEquals(session.Roles))
        {
            context.ReplacePrincipal(SessionPrincipal.Create(session));
            context.ShouldRenew = true;
        }
    }

    public override Task RedirectToLogin(RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    }

    public override Task RedirectToAccessDenied(RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    }
}
