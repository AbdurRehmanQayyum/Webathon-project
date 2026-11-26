namespace CampusConnect.Domain.Constants;

public static class PermissionKeys
{
    public const string CreatePosts = "posts.create";
    public const string ReactToPosts = "posts.react";
    public const string CreateComments = "comments.create";
    public const string ReactToComments = "comments.react";
    public const string JoinClubs = "clubs.join";
    public const string RequestClubs = "clubs.request";
    public const string UploadFiles = "files.upload";
    public const string ModeratePosts = "moderation.posts";
    public const string ModerateComments = "moderation.comments";
    public const string PinPosts = "moderation.pin";
    public const string ManageAnnouncements = "announcements.manage";
    public const string ManageEvents = "events.manage";
    public const string ManageClubs = "clubs.manage";
    public const string ReviewClubRequests = "clubrequests.review";
    public const string AssignModerators = "moderators.assign";
    public const string ManageUsers = "users.manage";
    public const string ViewDashboard = "dashboard.view";
    public const string ManagePermissions = "permissions.manage";
}

public sealed record PermissionDefinition(
    string Key, string Group, string Label, string Description, bool AdminOnly = false);

public static class PermissionCatalog
{
    public static readonly IReadOnlyList<PermissionDefinition> All =
    [
        new(PermissionKeys.CreatePosts, "Participation", "Create posts", "Publish posts in joined clubs."),
        new(PermissionKeys.ReactToPosts, "Participation", "Vote on posts", "Upvote and downvote posts."),
        new(PermissionKeys.CreateComments, "Participation", "Comment and reply", "Take part in discussions."),
        new(PermissionKeys.ReactToComments, "Participation", "Vote on comments", "Upvote and downvote comments."),
        new(PermissionKeys.JoinClubs, "Participation", "Join clubs", "Become a member of clubs."),
        new(PermissionKeys.RequestClubs, "Participation", "Request clubs", "Propose new clubs for review."),
        new(PermissionKeys.UploadFiles, "Participation", "Upload files", "Attach media and documents."),
        new(PermissionKeys.ModeratePosts, "Moderation", "Remove posts", "Remove and restore posts in assigned clubs."),
        new(PermissionKeys.ModerateComments, "Moderation", "Remove comments",
            "Remove and restore comments in assigned clubs."),
        new(PermissionKeys.PinPosts, "Moderation", "Pin posts", "Pin posts in assigned clubs."),
        new(PermissionKeys.ManageAnnouncements, "Administration", "Manage announcements",
            "Write, publish and delete official announcements."),
        new(PermissionKeys.ManageEvents, "Administration", "Manage events", "Create, update and cancel events."),
        new(PermissionKeys.ManageClubs, "Administration", "Manage clubs", "Create, edit and archive clubs."),
        new(PermissionKeys.ReviewClubRequests, "Administration", "Review club requests",
            "Approve or reject proposed clubs."),
        new(PermissionKeys.AssignModerators, "Administration", "Assign moderators",
            "Assign and remove club moderators."),
        new(PermissionKeys.ManageUsers, "Administration", "Manage users",
            "Create student accounts and change account status."),
        new(PermissionKeys.ViewDashboard, "Administration", "View dashboard", "See platform statistics."),
        new(PermissionKeys.ManagePermissions, "Administration", "Manage permissions",
            "Change what each role can do.", AdminOnly: true)
    ];
}
