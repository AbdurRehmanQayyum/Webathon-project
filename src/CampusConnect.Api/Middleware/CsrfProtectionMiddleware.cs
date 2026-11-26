using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Middleware;

// CSRF protection for cookie-authenticated state-changing API requests
public sealed class CsrfProtectionMiddleware(
    RequestDelegate next,
    IAntiforgery antiforgery,
    IProblemDetailsService problems)
{
    public const string ErrorCode = "invalid_csrf_token";

    public async Task InvokeAsync(HttpContext context)
    {
        var request = context.Request;
        var isStateChanging = !HttpMethods.IsGet(request.Method)
            && !HttpMethods.IsHead(request.Method)
            && !HttpMethods.IsOptions(request.Method);

        if (isStateChanging && request.Path.StartsWithSegments("/api"))
        {
            try
            {
                await antiforgery.ValidateRequestAsync(context);
            }
            catch (AntiforgeryValidationException)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Your session token expired. Try again."
                };
                problem.Extensions["code"] = ErrorCode;
                await problems.WriteAsync(new ProblemDetailsContext
                {
                    HttpContext = context,
                    ProblemDetails = problem
                });
                return;
            }
        }

        await next(context);
    }
}
