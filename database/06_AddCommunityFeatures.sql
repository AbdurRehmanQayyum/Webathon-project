USE [CampusConnectDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Usernames for mentions and forced password change for provisioned accounts
IF COL_LENGTH(N'dbo.Users', N'Username') IS NULL
    ALTER TABLE dbo.Users ADD Username nvarchar(40) NULL;
IF COL_LENGTH(N'dbo.Users', N'MustChangePassword') IS NULL
    ALTER TABLE dbo.Users ADD MustChangePassword bit NOT NULL CONSTRAINT DF_Users_MustChangePassword DEFAULT 0;
GO

WITH Handles AS
(
    SELECT Id,
           LOWER(LEFT(Email, CHARINDEX(N'@', Email + N'@') - 1)) AS LocalPart
    FROM dbo.Users
    WHERE Username IS NULL
)
UPDATE Target
SET Username = CASE
        WHEN LEN(Source.LocalPart) BETWEEN 3 AND 30
             AND Source.LocalPart NOT LIKE N'%[^a-z0-9._]%'
             AND NOT EXISTS (SELECT 1 FROM Handles AS Other
                             WHERE Other.LocalPart = Source.LocalPart AND Other.Id < Source.Id)
             AND NOT EXISTS (SELECT 1 FROM dbo.Users AS Taken WHERE Taken.Username = Source.LocalPart)
        THEN Source.LocalPart
        ELSE CONCAT(N'member', Source.Id)
    END
FROM dbo.Users AS Target
INNER JOIN Handles AS Source ON Source.Id = Target.Id;
GO

IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'Username' AND is_nullable = 1)
    ALTER TABLE dbo.Users ALTER COLUMN Username nvarchar(40) NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Users_Username')
    CREATE UNIQUE INDEX UX_Users_Username ON dbo.Users (Username);
GO

-- Encrypted columns hold ciphertext, which is longer than the original text
IF COL_LENGTH(N'dbo.Users', N'Bio') <> -1
    ALTER TABLE dbo.Users ALTER COLUMN Bio nvarchar(max) NULL;
IF COL_LENGTH(N'dbo.Comments', N'Body') <> -1
    ALTER TABLE dbo.Comments ALTER COLUMN Body nvarchar(max) NOT NULL;
IF COL_LENGTH(N'dbo.ClubRequests', N'Justification') <> -1
    ALTER TABLE dbo.ClubRequests ALTER COLUMN Justification nvarchar(max) NOT NULL;
IF COL_LENGTH(N'dbo.Notifications', N'Message') <> -1
    ALTER TABLE dbo.Notifications ALTER COLUMN Message nvarchar(max) NOT NULL;
GO

-- Comment threads: the root id makes thread pagination efficient
IF COL_LENGTH(N'dbo.Comments', N'RootCommentId') IS NULL
    ALTER TABLE dbo.Comments ADD RootCommentId int NULL
        CONSTRAINT FK_Comments_RootComment REFERENCES dbo.Comments (Id);
GO

WITH Thread AS
(
    SELECT Id, Id AS RootId FROM dbo.Comments WHERE ParentCommentId IS NULL
    UNION ALL
    SELECT Child.Id, Thread.RootId
    FROM dbo.Comments AS Child
    INNER JOIN Thread ON Child.ParentCommentId = Thread.Id
)
UPDATE Target
SET RootCommentId = Thread.RootId
FROM dbo.Comments AS Target
INNER JOIN Thread ON Thread.Id = Target.Id
WHERE Target.ParentCommentId IS NOT NULL AND Target.RootCommentId IS NULL
OPTION (MAXRECURSION 0);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Comments_RootCommentId')
    CREATE INDEX IX_Comments_RootCommentId ON dbo.Comments (RootCommentId);
GO

IF OBJECT_ID(N'dbo.CommentVotes', N'U') IS NULL
CREATE TABLE dbo.CommentVotes
(
    CommentId    int          NOT NULL CONSTRAINT FK_CommentVotes_Comments REFERENCES dbo.Comments (Id),
    UserId       int          NOT NULL CONSTRAINT FK_CommentVotes_Users REFERENCES dbo.Users (Id),
    Value        smallint     NOT NULL,
    CreatedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_CommentVotes_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc datetime2(3) NULL,
    CONSTRAINT PK_CommentVotes PRIMARY KEY (CommentId, UserId),
    CONSTRAINT CK_CommentVotes_Value CHECK (Value IN (-1, 1))
);
GO

-- Tags
IF OBJECT_ID(N'dbo.Tags', N'U') IS NULL
CREATE TABLE dbo.Tags
(
    Id           int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tags PRIMARY KEY,
    Name         nvarchar(30)      NOT NULL CONSTRAINT UQ_Tags_Name UNIQUE,
    CreatedAtUtc datetime2(3)      NOT NULL CONSTRAINT DF_Tags_CreatedAtUtc DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.PostTags', N'U') IS NULL
CREATE TABLE dbo.PostTags
(
    PostId int NOT NULL CONSTRAINT FK_PostTags_Posts REFERENCES dbo.Posts (Id),
    TagId  int NOT NULL CONSTRAINT FK_PostTags_Tags REFERENCES dbo.Tags (Id),
    CONSTRAINT PK_PostTags PRIMARY KEY (PostId, TagId)
);
GO

IF OBJECT_ID(N'dbo.CommentTags', N'U') IS NULL
CREATE TABLE dbo.CommentTags
(
    CommentId int NOT NULL CONSTRAINT FK_CommentTags_Comments REFERENCES dbo.Comments (Id),
    TagId     int NOT NULL CONSTRAINT FK_CommentTags_Tags REFERENCES dbo.Tags (Id),
    CONSTRAINT PK_CommentTags PRIMARY KEY (CommentId, TagId)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PostTags_TagId')
    CREATE INDEX IX_PostTags_TagId ON dbo.PostTags (TagId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CommentTags_TagId')
    CREATE INDEX IX_CommentTags_TagId ON dbo.CommentTags (TagId);
GO

-- Interests drive club recommendations
IF OBJECT_ID(N'dbo.UserInterests', N'U') IS NULL
CREATE TABLE dbo.UserInterests
(
    UserId     int NOT NULL CONSTRAINT FK_UserInterests_Users REFERENCES dbo.Users (Id),
    CategoryId int NOT NULL CONSTRAINT FK_UserInterests_ClubCategories REFERENCES dbo.ClubCategories (Id),
    CONSTRAINT PK_UserInterests PRIMARY KEY (UserId, CategoryId)
);
GO

-- Role permissions managed by administrators
IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermissions
    (
        RoleId     int          NOT NULL CONSTRAINT FK_RolePermissions_Roles REFERENCES dbo.Roles (Id),
        Permission nvarchar(60) NOT NULL,
        CONSTRAINT PK_RolePermissions PRIMARY KEY (RoleId, Permission)
    );

    INSERT INTO dbo.RolePermissions (RoleId, Permission)
    VALUES
        (3, N'posts.create'), (3, N'posts.react'), (3, N'comments.create'), (3, N'comments.react'),
        (3, N'clubs.join'), (3, N'clubs.request'), (3, N'files.upload'),
        (2, N'moderation.posts'), (2, N'moderation.comments'), (2, N'moderation.pin');
END
GO

-- Richer notifications
IF COL_LENGTH(N'dbo.Notifications', N'ActorUserId') IS NULL
    ALTER TABLE dbo.Notifications ADD ActorUserId int NULL
        CONSTRAINT FK_Notifications_Actor REFERENCES dbo.Users (Id);
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = N'CK_Notifications_Type' AND definition NOT LIKE N'%(10)%')
BEGIN
    ALTER TABLE dbo.Notifications DROP CONSTRAINT CK_Notifications_Type;
    ALTER TABLE dbo.Notifications ADD CONSTRAINT CK_Notifications_Type CHECK (Type >= 1 AND Type <= 10);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Notifications_Recipient_Created')
    CREATE INDEX IX_Notifications_Recipient_Created ON dbo.Notifications (RecipientUserId, CreatedAtUtc DESC);
GO

-- Video and audio need a higher hard limit; per-type limits are enforced by the application
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = N'CK_Attachments_Size' AND definition NOT LIKE N'%104857600%')
BEGIN
    ALTER TABLE dbo.Attachments DROP CONSTRAINT CK_Attachments_Size;
    ALTER TABLE dbo.Attachments ADD CONSTRAINT CK_Attachments_Size
        CHECK (FileSize > 0 AND FileSize <= 104857600);
END
GO
