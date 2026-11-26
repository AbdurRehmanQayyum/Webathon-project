namespace CampusConnect.Domain.Enums;

public enum PostType : byte
{
    Text = 1,
    Link = 2
}

public enum ContentStatus : byte
{
    Published = 1,
    Deleted = 2,
    Removed = 3
}

public enum ClubStatus : byte
{
    Active = 1,
    Archived = 2
}

public enum ClubRequestStatus : byte
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}

public enum AnnouncementPriority : byte
{
    Normal = 1,
    Important = 2
}

public enum EventCategory : byte
{
    Academic = 1,
    Workshop = 2,
    Competition = 3,
    Seminar = 4,
    Social = 5
}

public enum EventStatus : byte
{
    Scheduled = 1,
    Cancelled = 2
}

public enum FilePurpose : byte
{
    Avatar = 1,
    ClubLogo = 2,
    ClubCover = 3,
    PostAttachment = 4,
    AnnouncementAttachment = 5,
    EventAttachment = 6
}

public enum NotificationType : byte
{
    CommentOnPost = 1,
    ReplyToComment = 2,
    ClubRequestApproved = 3,
    ClubRequestRejected = 4,
    ModeratorAssigned = 5,
    ContentRemoved = 6,
    Mention = 7,
    AnnouncementPublished = 8,
    EventScheduled = 9,
    EventCancelled = 10
}
