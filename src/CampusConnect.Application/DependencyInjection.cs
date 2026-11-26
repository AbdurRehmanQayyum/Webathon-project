using CampusConnect.Application.Features.Administration;
using CampusConnect.Application.Features.Announcements;
using CampusConnect.Application.Features.Auth;
using CampusConnect.Application.Features.ClubRequests;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Comments;
using CampusConnect.Application.Features.Events;
using CampusConnect.Application.Features.Files;
using CampusConnect.Application.Features.Moderation;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Application.Features.Posts;
using CampusConnect.Application.Features.Users;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace CampusConnect.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddSingleton(TimeProvider.System);

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUserAdministrationService, UserAdministrationService>();
        services.AddScoped<IClubAccess, ClubAccess>();
        services.AddScoped<ClubCreator>();
        services.AddScoped<IClubService, ClubService>();
        services.AddScoped<IClubManagementService, ClubManagementService>();
        services.AddScoped<IClubRequestService, ClubRequestService>();
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<IPostEngagementService, PostEngagementService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IModerationService, ModerationService>();
        services.AddScoped<FileAccessPolicy>();
        services.AddScoped<IFileService, FileService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IOverviewService, OverviewService>();

        return services;
    }
}
