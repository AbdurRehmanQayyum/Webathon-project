using CampusConnect.Api.Middleware;
using CampusConnect.Api.Realtime;
using CampusConnect.Infrastructure.Seeding;
using CampusConnect.Infrastructure.Storage;
using Microsoft.Extensions.Options;

namespace CampusConnect.Api.Setup;

public static class RequestPipeline
{
    public static WebApplication UseWebApi(this WebApplication app)
    {
        var isDevelopment = app.Environment.IsDevelopment();

        app.UseForwardedHeaders();
        app.UseExceptionHandler();
        app.UseStatusCodePages();

        if (!isDevelopment)
        {
            app.UseHsts();
            app.UseHttpsRedirection();
        }

        var storage = app.Services.GetRequiredService<IOptions<ObjectStorageOptions>>().Value;
        if (storage.UsesS3 && !storage.IsS3Configured)
        {
            app.Logger.LogWarning("S3 storage is selected but incomplete; file features are unavailable");
        }

        app.UseSecurityHeaders(
            enforceContentPolicy: !isDevelopment,
            storage.UsesS3 && storage.IsS3Configured
                ? new Uri(storage.Endpoint!).GetLeftPart(UriPartial.Authority)
                : null);

        // Production React build
        var staticFiles = new StaticFileOptions
        {
            OnPrepareResponse = response => response.Context.Response.Headers.CacheControl =
                response.Context.Request.Path.StartsWithSegments("/assets")
                    ? "public, max-age=31536000, immutable"
                    : "no-cache"
        };
        app.UseDefaultFiles();
        app.UseStaticFiles(staticFiles);

        app.UseRouting();
        app.UseCors();
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseMiddleware<CsrfProtectionMiddleware>();
        app.UseAuthorization();

        app.MapControllers();
        app.MapHub<LiveHub>(LiveHub.Path);
        app.MapHealthChecks("/health").AllowAnonymous();

        if (isDevelopment)
        {
            app.MapOpenApi().AllowAnonymous();
        }

        app.Map("/api/{**path}", () => Results.Problem(
                statusCode: StatusCodes.Status404NotFound, title: "Endpoint not found."))
            .AllowAnonymous();
        app.MapFallbackToFile("index.html", staticFiles).AllowAnonymous();

        return app;
    }

    public static async Task InitializeDataAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();

        try
        {
            await scope.ServiceProvider.GetRequiredService<AdminBootstrapper>().RunAsync();

            if (app.Environment.IsDevelopment())
            {
                await scope.ServiceProvider.GetRequiredService<DemoDataSeeder>().RunAsync();
            }
        }
        catch (Exception exception)
        {
            app.Logger.LogError(exception, "Startup data initialization failed. Check the database setup.");
        }
    }
}
