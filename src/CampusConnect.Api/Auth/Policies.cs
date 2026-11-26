using CampusConnect.Domain.Constants;

namespace CampusConnect.Api.Auth;

public static class Policies
{
    public const string Admin = "Admin";
    public const string Moderation = "Moderation";
    public const string SensitiveRateLimit = "sensitive";

    public static readonly string[] ModerationRoles = [RoleNames.Admin, RoleNames.Moderator];
}
