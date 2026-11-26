using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Features.Files;
using CampusConnect.Infrastructure.Persistence;
using CampusConnect.Infrastructure.Security;
using CampusConnect.Infrastructure.Seeding;
using CampusConnect.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CampusConnect.Infrastructure;

public static class DependencyInjection
{
    private const string ConnectionName = "CampusConnect";

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<AuditTimestampInterceptor>();
        services.AddDbContext<CampusConnectDbContext>((provider, options) =>
        {
            var connectionString = provider.GetRequiredService<IConfiguration>()
                .GetConnectionString(ConnectionName)
                ?? throw new InvalidOperationException(
                    $"Connection string '{ConnectionName}' is not configured. See docs/SETUP.md.");

            options
                .UseSqlServer(connectionString, sql => sql
                    .EnableRetryOnFailure()
                    .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))
                .AddInterceptors(provider.GetRequiredService<AuditTimestampInterceptor>());
        });
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<CampusConnectDbContext>());

        services.AddSingleton<IPasswordService, PasswordService>();
        services.AddObjectStorage(configuration);

        services.Configure<SeedOptions>(configuration.GetSection(SeedOptions.SectionName));
        services.Configure<AdminBootstrapOptions>(configuration.GetSection(AdminBootstrapOptions.SectionName));
        services.AddScoped<DemoDataSeeder>();
        services.AddScoped<AdminBootstrapper>();

        return services;
    }

    // The active storage provider is chosen by configuration
    private static void AddObjectStorage(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ObjectStorageOptions>(configuration.GetSection(ObjectStorageOptions.SectionName));
        services.Configure<FileUploadOptions>(configuration.GetSection(FileUploadOptions.SectionName));
        services.AddSingleton<IFileStorageService>(provider =>
        {
            var settings = provider.GetRequiredService<IOptions<ObjectStorageOptions>>();
            if (settings.Value.UsesS3)
            {
                return new S3StorageService(settings);
            }

            return settings.Value.Provider.Equals(
                ObjectStorageOptions.LocalProvider, StringComparison.OrdinalIgnoreCase)
                ? new LocalStorageService(settings)
                : throw new InvalidOperationException("Storage:Provider must be 'Local' or 'S3'.");
        });
    }
}
