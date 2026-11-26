namespace CampusConnect.Api.Middleware;

public static class SecurityHeaders
{
    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder app, bool enforceContentPolicy, string? storageOrigin)
    {
        // Presigned downloads redirect media and previews to the storage origin
        var contentSecurityPolicy =
            $"default-src 'self'; img-src 'self' data: blob: {storageOrigin}; " +
            $"media-src 'self' blob: {storageOrigin}; frame-src 'self' blob: {storageOrigin}; " +
            "style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; " +
            "worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; ";

        return app.Use((context, next) =>
        {
            // The app may frame its own files to preview documents; nothing else may be framed
            var isFile = context.Request.Path.StartsWithSegments("/api/files");
            var headers = context.Response.Headers;
            headers.XContentTypeOptions = "nosniff";
            headers.XFrameOptions = isFile ? "SAMEORIGIN" : "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

            if (enforceContentPolicy)
            {
                headers.ContentSecurityPolicy =
                    contentSecurityPolicy + $"frame-ancestors {(isFile ? "'self'" : "'none'")}";
            }

            return next(context);
        });
    }
}
