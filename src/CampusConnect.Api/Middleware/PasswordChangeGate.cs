using CampusConnect.Api.Auth;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Middleware;

// Accounts with a temporary password can only sign in, out and change it
public sealed class PasswordChangeGate(RequestDelegate next, IProblemDetailsService problems)
{
    public const string ErrorCode = "password_change_required";

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path;
        if (context.User.HasClaim(c => c.Type == SessionPrincipal.PasswordChangeClaim)
            && (path.StartsWithSegments("/api") || path.StartsWithSegments("/hubs"))
            && !path.StartsWithSegments("/api/auth"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Change your temporary password to continue."
            };
            problem.Extensions["code"] = ErrorCode;
            await problems.WriteAsync(new ProblemDetailsContext { HttpContext = context, ProblemDetails = problem });
            return;
        }

        await next(context);
    }
}
