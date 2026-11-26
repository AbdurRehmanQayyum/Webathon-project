using CampusConnect.Application.Features.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.JsonWebTokens;

namespace CampusConnect.Api.Auth;

public sealed class SessionTokenEvents(IAuthService auth, SessionTokenService tokens, TimeProvider clock)
    : JwtBearerEvents
{
    public override Task MessageReceived(MessageReceivedContext context)
    {
        context.Token = context.Request.Cookies[SessionTokenService.CookieName];
        return Task.CompletedTask;
    }

    // Deactivation, password, role and permission changes apply on the next request
    public override async Task TokenValidated(TokenValidatedContext context)
    {
        var token = context.SecurityToken as JsonWebToken;
        var session = token is not null && int.TryParse(token.Subject, out var userId)
            ? await auth.FindActiveSessionAsync(userId, context.HttpContext.RequestAborted)
            : null;

        if (session is null
            || !token!.TryGetPayloadValue<string>(SessionTokenService.StampClaim, out var stamp)
            || stamp != session.SecurityStamp.ToString())
        {
            tokens.Clear(context.HttpContext);
            context.Fail("The session has ended.");
            return;
        }

        context.Principal = SessionPrincipal.Create(session);

        // Sliding expiration
        var remember = token.TryGetPayloadValue<string>(SessionTokenService.RememberClaim, out var flag)
            && flag == "1";
        if (token.ValidTo - clock.GetUtcNow().UtcDateTime < tokens.Lifetime(remember) / 2)
        {
            tokens.Issue(context.HttpContext, session, remember);
        }
    }
}
