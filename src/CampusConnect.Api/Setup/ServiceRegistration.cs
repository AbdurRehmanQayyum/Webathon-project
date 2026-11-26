using System.IO.Compression;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using CampusConnect.Api.Auth;
using CampusConnect.Api.Errors;
using CampusConnect.Api.Filters;
using CampusConnect.Api.Health;
using CampusConnect.Api.Realtime;
using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Features.Auth;
using CampusConnect.Domain.Constants;
using CampusConnect.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;

namespace CampusConnect.Api.Setup;

public static class ServiceRegistration
{
    public static IServiceCollection AddWebApi(
        this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services
            .AddControllers(options =>
            {
                options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
                options.Filters.Add<ValidationFilter>();
                options.Filters.Add<LiveUpdateFilter>();
            })
            .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
        services.ConfigureHttpJsonOptions(
            options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddOpenApi();
        services.AddSignalR();
        services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<LiveUpdateQueue>();
        services.AddScoped<ILiveUpdates>(provider => provider.GetRequiredService<LiveUpdateQueue>());
        services.Configure<RegistrationOptions>(configuration.GetSection(RegistrationOptions.SectionName));

        // Relative storage paths resolve against the application folder, also as a Windows service
        services.PostConfigure<ObjectStorageOptions>(options =>
            options.LocalRootPath = Path.GetFullPath(options.LocalRootPath, environment.ContentRootPath));

        services.AddSessionAuthentication(configuration);
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            options.Cookie.Name = "campusconnect.csrf";
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.SecurePolicy = environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
        });
        services.AddRequestLimits();

        // Static assets compress well; API responses stay uncompressed
        services.AddResponseCompression(options => options.EnableForHttps = true);
        services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);

        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        services.AddCors(options => options.AddDefaultPolicy(policy => policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

        services.Configure<ForwardedHeadersOptions>(options =>
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);

        var dataProtection = services.AddDataProtection().SetApplicationName("CampusConnect");
        if (configuration["DataProtection:KeysPath"] is { Length: > 0 } keysPath)
        {
            dataProtection.PersistKeysToFileSystem(
                new DirectoryInfo(Path.GetFullPath(keysPath, environment.ContentRootPath)));
        }

        return services;
    }

    // Authentication and authorization
    private static void AddSessionAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<SessionTokenService>();
        services.AddScoped<SessionTokenEvents>();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<SessionTokenService>((options, tokens) =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = tokens.ValidationParameters;
                options.EventsType = typeof(SessionTokenEvents);
            });

        var authorization = services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())
            .AddPolicy(Policies.Moderation, policy => policy.RequireClaim(
                SessionPrincipal.PermissionClaim,
                PermissionKeys.ModeratePosts,
                PermissionKeys.ModerateComments,
                PermissionKeys.PinPosts))
            .AddPolicy(Policies.ClubDirectory, policy => policy.RequireClaim(
                SessionPrincipal.PermissionClaim,
                PermissionKeys.ManageClubs,
                PermissionKeys.AssignModerators));

        foreach (var permission in PermissionCatalog.All)
        {
            authorization.AddPolicy(
                permission.Key,
                policy => policy.RequireClaim(SessionPrincipal.PermissionClaim, permission.Key));
        }
    }

    // Rate limits: a generous ceiling for the API and a tight one for sensitive actions
    private static void AddRequestLimits(this IServiceCollection services) =>
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
                await context.HttpContext.Response.WriteAsJsonAsync(
                    new ProblemDetails
                    {
                        Status = StatusCodes.Status429TooManyRequests,
                        Title = "Too many requests. Wait a moment and try again."
                    },
                    options: null,
                    contentType: "application/problem+json",
                    cancellationToken);

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                context.Request.Path.StartsWithSegments("/api")
                    ? Window(context, ClientKey(context), "RateLimiting:RequestsPerMinute", 600)
                    : RateLimitPartition.GetNoLimiter("static"));

            options.AddPolicy(Policies.SensitiveRateLimit, context => Window(
                context,
                $"{ClientKey(context)}:{context.GetEndpoint()?.DisplayName}",
                "RateLimiting:SensitivePermitsPerMinute",
                20));
        });

    private static string ClientKey(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static RateLimitPartition<string> Window(
        HttpContext context, string key, string setting, int fallback)
    {
        var limit = context.RequestServices.GetRequiredService<IConfiguration>().GetValue(setting, fallback);
        return RateLimitPartition.GetFixedWindowLimiter(
            key, _ => new FixedWindowRateLimiterOptions { PermitLimit = limit, Window = TimeSpan.FromMinutes(1) });
    }
}
