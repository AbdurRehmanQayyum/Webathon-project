namespace CampusConnect.Api.Middleware;

public static class SecurityHeaders
{
    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder app, bool enforceContentPolicy, string? storageOrigin)
    {
        // Presigned image downloads redirect to the storage origin
        var contentSecurityPolicy =
            $"default-src 'self'; img-src 'self' data: blob: {storageOrigin}; " +
            "style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; " +
            "worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

        return app.Use((context, next) =>
        {
            var headers = context.Response.Headers;
            headers.XContentTypeOptions = "nosniff";
            headers.XFrameOptions = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            if (enforceContentPolicy)
            {
                headers.ContentSecurityPolicy = contentSecurityPolicy;
            }

            return next(context);
        });
    }
}
