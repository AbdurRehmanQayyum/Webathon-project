USE [CampusConnectDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Identity
IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
CREATE TABLE dbo.Roles
(
    Id   int          NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
    Name nvarchar(30) NOT NULL CONSTRAINT UQ_Roles_Name UNIQUE
);
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
CREATE TABLE dbo.Users
(
    Id                 int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
    FullName           nvarchar(100)     NOT NULL,
    Email              nvarchar(256)     NOT NULL,
    RegistrationNumber nvarchar(30)      NULL,
    Semester           tinyint           NULL,
    Title              nvarchar(60)      NULL,
    Bio                nvarchar(500)     NULL,
    PasswordHash       nvarchar(256)     NOT NULL,
    SecurityStamp      uniqueidentifier  NOT NULL CONSTRAINT DF_Users_SecurityStamp DEFAULT NEWID(),
    IsActive           bit               NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    FailedLoginCount   int               NOT NULL CONSTRAINT DF_Users_FailedLoginCount DEFAULT 0,
    LockoutEndsAtUtc   datetime2(3)      NULL,
    LastLoginAtUtc     datetime2(3)      NULL,
    CreatedAtUtc       datetime2(3)      NOT NULL CONSTRAINT DF_Users_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc       datetime2(3)      NULL,
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT CK_Users_Semester CHECK (Semester BETWEEN 1 AND 8)
);
GO

IF OBJECT_ID(N'dbo.UserRoles', N'U') IS NULL
CREATE TABLE dbo.UserRoles
(
    UserId int NOT NULL CONSTRAINT FK_UserRoles_Users REFERENCES dbo.Users (Id),
    RoleId int NOT NULL CONSTRAINT FK_UserRoles_Roles REFERENCES dbo.Roles (Id),
    CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId)
);
GO

-- Clubs
IF OBJECT_ID(N'dbo.ClubCategories', N'U') IS NULL
CREATE TABLE dbo.ClubCategories
(
    Id        int IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClubCategories PRIMARY KEY,
    Name      nvarchar(60)      NOT NULL CONSTRAINT UQ_ClubCategories_Name UNIQUE,
    IconKey   nvarchar(30)      NOT NULL,
    SortOrder int               NOT NULL CONSTRAINT DF_ClubCategories_SortOrder DEFAULT 0
);
GO

IF OBJECT_ID(N'dbo.Clubs', N'U') IS NULL
CREATE TABLE dbo.Clubs
(
    Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Clubs PRIMARY KEY,
    CategoryId      int               NOT NULL CONSTRAINT FK_Clubs_ClubCategories REFERENCES dbo.ClubCategories (Id),
    Name            nvarchar(80)      NOT NULL CONSTRAINT UQ_Clubs_Name UNIQUE,
    Slug            nvarchar(100)     NOT NULL CONSTRAINT UQ_Clubs_Slug UNIQUE,
    Description     nvarchar(500)     NOT NULL,
    Rules           nvarchar(2000)    NULL,
    Status          tinyint           NOT NULL CONSTRAINT DF_Clubs_Status DEFAULT 1,
    CreatedByUserId int               NOT NULL CONSTRAINT FK_Clubs_CreatedByUser REFERENCES dbo.Users (Id),
    CreatedAtUtc    datetime2(3)      NOT NULL CONSTRAINT DF_Clubs_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc    datetime2(3)      NULL,
    CONSTRAINT CK_Clubs_Status CHECK (Status IN (1, 2))
);
GO

IF OBJECT_ID(N'dbo.ClubMembers', N'U') IS NULL
CREATE TABLE dbo.ClubMembers
(
    ClubId      int          NOT NULL CONSTRAINT FK_ClubMembers_Clubs REFERENCES dbo.Clubs (Id),
    UserId      int          NOT NULL CONSTRAINT FK_ClubMembers_Users REFERENCES dbo.Users (Id),
    JoinedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_ClubMembers_JoinedAtUtc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ClubMembers PRIMARY KEY (ClubId, UserId)
);
GO

IF OBJECT_ID(N'dbo.ClubModerators', N'U') IS NULL
CREATE TABLE dbo.ClubModerators
(
    ClubId           int          NOT NULL CONSTRAINT FK_ClubModerators_Clubs REFERENCES dbo.Clubs (Id),
    UserId           int          NOT NULL CONSTRAINT FK_ClubModerators_Users REFERENCES dbo.Users (Id),
    AssignedByUserId int          NOT NULL CONSTRAINT FK_ClubModerators_AssignedByUser REFERENCES dbo.Users (Id),
    AssignedAtUtc    datetime2(3) NOT NULL CONSTRAINT DF_ClubModerators_AssignedAtUtc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ClubModerators PRIMARY KEY (ClubId, UserId)
);
GO

IF OBJECT_ID(N'dbo.ClubRequests', N'U') IS NULL
CREATE TABLE dbo.ClubRequests
(
    Id                int IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClubRequests PRIMARY KEY,
    RequestedByUserId int               NOT NULL CONSTRAINT FK_ClubRequests_RequestedByUser REFERENCES dbo.Users (Id),
    CategoryId        int               NOT NULL CONSTRAINT FK_ClubRequests_ClubCategories REFERENCES dbo.ClubCategories (Id),
    ProposedName      nvarchar(80)      NOT NULL,
    Description       nvarchar(500)     NOT NULL,
    Justification     nvarchar(1000)    NOT NULL,
    Status            tinyint           NOT NULL CONSTRAINT DF_ClubRequests_Status DEFAULT 1,
    RejectionReason   nvarchar(500)     NULL,
    ReviewedByUserId  int               NULL CONSTRAINT FK_ClubRequests_ReviewedByUser REFERENCES dbo.Users (Id),
    ReviewedAtUtc     datetime2(3)      NULL,
    CreatedClubId     int               NULL CONSTRAINT FK_ClubRequests_CreatedClub REFERENCES dbo.Clubs (Id),
    CreatedAtUtc      datetime2(3)      NOT NULL CONSTRAINT DF_ClubRequests_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc      datetime2(3)      NULL,
    CONSTRAINT CK_ClubRequests_Review CHECK
    (
        (Status = 1 AND ReviewedByUserId IS NULL AND CreatedClubId IS NULL)
        OR (Status = 2 AND ReviewedByUserId IS NOT NULL AND CreatedClubId IS NOT NULL)
        OR (Status = 3 AND ReviewedByUserId IS NOT NULL AND RejectionReason IS NOT NULL AND CreatedClubId IS NULL)
    )
);
GO

-- Discussions
IF OBJECT_ID(N'dbo.Posts', N'U') IS NULL
CREATE TABLE dbo.Posts
(
    Id                int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Posts PRIMARY KEY,
    ClubId            int               NOT NULL CONSTRAINT FK_Posts_Clubs REFERENCES dbo.Clubs (Id),
    AuthorId          int               NOT NULL CONSTRAINT FK_Posts_Author REFERENCES dbo.Users (Id),
    Type              tinyint           NOT NULL,
    Title             nvarchar(200)     NOT NULL,
    Body              nvarchar(max)     NULL,
    LinkUrl           nvarchar(2048)    NULL,
    Status            tinyint           NOT NULL CONSTRAINT DF_Posts_Status DEFAULT 1,
    IsPinned          bit               NOT NULL CONSTRAINT DF_Posts_IsPinned DEFAULT 0,
    ModeratedByUserId int               NULL CONSTRAINT FK_Posts_ModeratedByUser REFERENCES dbo.Users (Id),
    ModerationReason  nvarchar(500)     NULL,
    CreatedAtUtc      datetime2(3)      NOT NULL CONSTRAINT DF_Posts_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc      datetime2(3)      NULL,
    EditedAtUtc       datetime2(3)      NULL,
    CONSTRAINT CK_Posts_Type CHECK (Type IN (1, 2)),
    CONSTRAINT CK_Posts_Status CHECK (Status IN (1, 2, 3)),
    CONSTRAINT CK_Posts_Content CHECK ((Type = 1 AND Body IS NOT NULL) OR (Type = 2 AND LinkUrl IS NOT NULL))
);
GO

IF OBJECT_ID(N'dbo.Comments', N'U') IS NULL
CREATE TABLE dbo.Comments
(
    Id                int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Comments PRIMARY KEY,
    PostId            int               NOT NULL CONSTRAINT FK_Comments_Posts REFERENCES dbo.Posts (Id),
    AuthorId          int               NOT NULL CONSTRAINT FK_Comments_Author REFERENCES dbo.Users (Id),
    ParentCommentId   int               NULL CONSTRAINT FK_Comments_ParentComment REFERENCES dbo.Comments (Id),
    Body              nvarchar(4000)    NOT NULL,
    Status            tinyint           NOT NULL CONSTRAINT DF_Comments_Status DEFAULT 1,
    ModeratedByUserId int               NULL CONSTRAINT FK_Comments_ModeratedByUser REFERENCES dbo.Users (Id),
    CreatedAtUtc      datetime2(3)      NOT NULL CONSTRAINT DF_Comments_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc      datetime2(3)      NULL,
    EditedAtUtc       datetime2(3)      NULL,
    CONSTRAINT CK_Comments_Status CHECK (Status IN (1, 2, 3)),
    CONSTRAINT CK_Comments_Parent CHECK (ParentCommentId IS NULL OR ParentCommentId <> Id)
);
GO

IF OBJECT_ID(N'dbo.PostVotes', N'U') IS NULL
CREATE TABLE dbo.PostVotes
(
    PostId       int          NOT NULL CONSTRAINT FK_PostVotes_Posts REFERENCES dbo.Posts (Id),
    UserId       int          NOT NULL CONSTRAINT FK_PostVotes_Users REFERENCES dbo.Users (Id),
    Value        smallint     NOT NULL,
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_PostVotes_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc datetime2(3) NULL,
    CONSTRAINT PK_PostVotes PRIMARY KEY (PostId, UserId),
    CONSTRAINT CK_PostVotes_Value CHECK (Value IN (-1, 1))
);
GO

IF OBJECT_ID(N'dbo.Bookmarks', N'U') IS NULL
CREATE TABLE dbo.Bookmarks
(
    UserId       int          NOT NULL CONSTRAINT FK_Bookmarks_Users REFERENCES dbo.Users (Id),
    PostId       int          NOT NULL CONSTRAINT FK_Bookmarks_Posts REFERENCES dbo.Posts (Id),
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_Bookmarks_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Bookmarks PRIMARY KEY (UserId, PostId)
);
GO

-- Department content
IF OBJECT_ID(N'dbo.Announcements', N'U') IS NULL
CREATE TABLE dbo.Announcements
(
    Id             int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Announcements PRIMARY KEY,
    AuthorId       int               NOT NULL CONSTRAINT FK_Announcements_Author REFERENCES dbo.Users (Id),
    Title          nvarchar(200)     NOT NULL,
    Body           nvarchar(max)     NOT NULL,
    LinkUrl        nvarchar(2048)    NULL,
    LinkLabel      nvarchar(100)     NULL,
    Priority       tinyint           NOT NULL CONSTRAINT DF_Announcements_Priority DEFAULT 1,
    IsPublished    bit               NOT NULL CONSTRAINT DF_Announcements_IsPublished DEFAULT 0,
    PublishedAtUtc datetime2(3)      NULL,
    IsDeleted      bit               NOT NULL CONSTRAINT DF_Announcements_IsDeleted DEFAULT 0,
    CreatedAtUtc   datetime2(3)      NOT NULL CONSTRAINT DF_Announcements_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc   datetime2(3)      NULL,
    CONSTRAINT CK_Announcements_Priority CHECK (Priority IN (1, 2)),
    CONSTRAINT CK_Announcements_Publication CHECK (IsPublished = 0 OR PublishedAtUtc IS NOT NULL)
);
GO

IF OBJECT_ID(N'dbo.Events', N'U') IS NULL
CREATE TABLE dbo.Events
(
    Id                 int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Events PRIMARY KEY,
    CreatedByUserId    int               NOT NULL CONSTRAINT FK_Events_CreatedByUser REFERENCES dbo.Users (Id),
    Title              nvarchar(200)     NOT NULL,
    Description        nvarchar(4000)    NOT NULL,
    Venue              nvarchar(200)     NOT NULL,
    Category           tinyint           NOT NULL,
    StartsAtUtc        datetime2(0)      NOT NULL,
    EndsAtUtc          datetime2(0)      NOT NULL,
    Status             tinyint           NOT NULL CONSTRAINT DF_Events_Status DEFAULT 1,
    CancellationReason nvarchar(500)     NULL,
    CreatedAtUtc       datetime2(3)      NOT NULL CONSTRAINT DF_Events_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc       datetime2(3)      NULL,
    CONSTRAINT CK_Events_Category CHECK (Category BETWEEN 1 AND 5),
    CONSTRAINT CK_Events_Status CHECK (Status IN (1, 2)),
    CONSTRAINT CK_Events_Schedule CHECK (EndsAtUtc > StartsAtUtc),
    CONSTRAINT CK_Events_Cancellation CHECK (Status = 1 OR CancellationReason IS NOT NULL)
);
GO

IF OBJECT_ID(N'dbo.Attachments', N'U') IS NULL
CREATE TABLE dbo.Attachments
(
    Id               int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Attachments PRIMARY KEY,
    UploadedByUserId int               NOT NULL CONSTRAINT FK_Attachments_UploadedByUser REFERENCES dbo.Users (Id),
    PostId           int               NULL CONSTRAINT FK_Attachments_Posts REFERENCES dbo.Posts (Id),
    AnnouncementId   int               NULL CONSTRAINT FK_Attachments_Announcements REFERENCES dbo.Announcements (Id),
    OriginalFileName nvarchar(255)     NOT NULL,
    StoredFileName   nvarchar(100)     NOT NULL CONSTRAINT UQ_Attachments_StoredFileName UNIQUE,
    ContentType      nvarchar(100)     NOT NULL,
    SizeBytes        bigint            NOT NULL,
    CreatedAtUtc     datetime2(3)      NOT NULL CONSTRAINT DF_Attachments_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Attachments_Size CHECK (SizeBytes > 0 AND SizeBytes <= 10485760),
    CONSTRAINT CK_Attachments_Owner CHECK
    (
        (PostId IS NOT NULL AND AnnouncementId IS NULL) OR (PostId IS NULL AND AnnouncementId IS NOT NULL)
    )
);
GO

IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
CREATE TABLE dbo.Notifications
(
    Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY,
    RecipientUserId int               NOT NULL CONSTRAINT FK_Notifications_Recipient REFERENCES dbo.Users (Id),
    Type            tinyint           NOT NULL,
    Message         nvarchar(300)     NOT NULL,
    LinkPath        nvarchar(200)     NOT NULL,
    IsRead          bit               NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
    CreatedAtUtc    datetime2(3)      NOT NULL CONSTRAINT DF_Notifications_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Notifications_Type CHECK (Type BETWEEN 1 AND 6)
);
GO
