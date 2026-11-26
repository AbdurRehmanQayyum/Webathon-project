using CampusConnect.Api.Auth;
using CampusConnect.Application.Features.Auth;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CampusConnect.Api.Controllers;

public sealed record CsrfTokenResponse(string Token);

[Route("api/auth")]
public sealed class AuthController(IAuthService auth, IAntiforgery antiforgery) : ApiController
{
    private static readonly TimeSpan RememberDuration = TimeSpan.FromDays(14);

    [AllowAnonymous]
    [HttpGet("csrf")]
    public ActionResult<CsrfTokenResponse> GetCsrfToken() =>
        new CsrfTokenResponse(antiforgery.GetAndStoreTokens(HttpContext).RequestToken!);

    [AllowAnonymous]
    [EnableRateLimiting(Policies.SensitiveRateLimit)]
    [HttpPost("register")]
    public async Task<ActionResult<CurrentUserDto>> Register(
        RegisterRequest request, CancellationToken cancellationToken)
    {
        await SignInAsync(await auth.RegisterAsync(request, cancellationToken), rememberMe: false);
        return Created("/api/auth/me", await auth.GetCurrentUserAsync(cancellationToken));
    }

    [AllowAnonymous]
    [EnableRateLimiting(Policies.SensitiveRateLimit)]
    [HttpPost("login")]
    public async Task<ActionResult<CurrentUserDto>> Login(
        LoginRequest request, CancellationToken cancellationToken)
    {
        await SignInAsync(await auth.LoginAsync(request, cancellationToken), request.RememberMe);
        return await auth.GetCurrentUserAsync(cancellationToken);
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync();
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserDto>> Me(CancellationToken cancellationToken) =>
        await auth.GetCurrentUserAsync(cancellationToken);

    [EnableRateLimiting(Policies.SensitiveRateLimit)]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        await SignInAsync(await auth.ChangePasswordAsync(request, cancellationToken), rememberMe: false);
        return NoContent();
    }

    private async Task SignInAsync(SessionIdentity identity, bool rememberMe)
    {
        var principal = SessionPrincipal.Create(identity);
        var properties = new AuthenticationProperties { IsPersistent = rememberMe };
        if (rememberMe)
        {
            properties.ExpiresUtc = DateTimeOffset.UtcNow.Add(RememberDuration);
        }

        await HttpContext.SignInAsync(principal, properties);
        HttpContext.User = principal;
    }
}
