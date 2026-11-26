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
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;

namespace CampusConnect.Api.Setup;

public static class ServiceRegistration
{
    public static IServiceCollection AddWebApi(
        this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        // Production cookies require HTTPS
        var cookieSecurity = environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

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

        services.AddCookieAuthentication(cookieSecurity);
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            options.Cookie.Name = "campusconnect.csrf";
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.SecurePolicy = cookieSecurity;
        });
        services.AddSensitiveRateLimit();

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
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keysPath));
        }

        return services;
    }

    // Authentication and authorization
    private static void AddCookieAuthentication(
        this IServiceCollection services, CookieSecurePolicy cookieSecurity)
    {
        services.AddScoped<SessionCookieEvents>();
        services
            .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = "campusconnect.session";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Strict;
                options.Cookie.SecurePolicy = cookieSecurity;
                options.ExpireTimeSpan = TimeSpan.FromHours(8);
                options.SlidingExpiration = true;
                options.EventsType = typeof(SessionCookieEvents);
            });

        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())
            .AddPolicy(Policies.Admin, policy => policy.RequireRole(RoleNames.Admin))
            .AddPolicy(Policies.Moderation, policy => policy.RequireRole(Policies.ModerationRoles));
    }

    private static void AddSensitiveRateLimit(this IServiceCollection services) =>
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(Policies.SensitiveRateLimit, context =>
            {
                var limit = context.RequestServices.GetRequiredService<IConfiguration>()
                    .GetValue("RateLimiting:SensitivePermitsPerMinute", 20);
                var client = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(
                    $"{client}:{context.GetEndpoint()?.DisplayName}",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = limit,
                        Window = TimeSpan.FromMinutes(1)
                    });
            });
        });
}
