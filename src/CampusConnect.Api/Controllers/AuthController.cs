using CampusConnect.Api.Auth;
using CampusConnect.Application.Features.Auth;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CampusConnect.Api.Controllers;

public sealed record CsrfTokenResponse(string Token);

[Route("api/auth")]
public sealed class AuthController(IAuthService auth, IAntiforgery antiforgery, SessionTokenService sessions)
    : ApiController
{
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
        SignIn(await auth.RegisterAsync(request, cancellationToken), rememberMe: false);
        return Created("/api/auth/me", await auth.GetCurrentUserAsync(cancellationToken));
    }

    [AllowAnonymous]
    [EnableRateLimiting(Policies.SensitiveRateLimit)]
    [HttpPost("login")]
    public async Task<ActionResult<CurrentUserDto>> Login(
        LoginRequest request, CancellationToken cancellationToken)
    {
        SignIn(await auth.LoginAsync(request, cancellationToken), request.RememberMe);
        return await auth.GetCurrentUserAsync(cancellationToken);
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        sessions.Clear(HttpContext);
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
        SignIn(await auth.ChangePasswordAsync(request, cancellationToken), rememberMe: false);
        return NoContent();
    }

    private void SignIn(SessionIdentity identity, bool rememberMe)
    {
        sessions.Issue(HttpContext, identity, rememberMe);
        HttpContext.User = SessionPrincipal.Create(identity);
    }
}
