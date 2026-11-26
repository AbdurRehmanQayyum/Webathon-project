USE [CampusConnectDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Users_RegistrationNumber')
    CREATE UNIQUE INDEX UX_Users_RegistrationNumber ON dbo.Users (RegistrationNumber) WHERE RegistrationNumber IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_FullName')
    CREATE INDEX IX_Users_FullName ON dbo.Users (FullName);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_UserRoles_RoleId')
    CREATE INDEX IX_UserRoles_RoleId ON dbo.UserRoles (RoleId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Clubs_CategoryId_Status')
    CREATE INDEX IX_Clubs_CategoryId_Status ON dbo.Clubs (CategoryId, Status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ClubMembers_UserId')
    CREATE INDEX IX_ClubMembers_UserId ON dbo.ClubMembers (UserId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ClubModerators_UserId')
    CREATE INDEX IX_ClubModerators_UserId ON dbo.ClubModerators (UserId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ClubRequests_Status_CreatedAtUtc')
    CREATE INDEX IX_ClubRequests_Status_CreatedAtUtc ON dbo.ClubRequests (Status, CreatedAtUtc DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ClubRequests_RequestedByUserId')
    CREATE INDEX IX_ClubRequests_RequestedByUserId ON dbo.ClubRequests (RequestedByUserId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_ClubRequests_PendingName')
    CREATE UNIQUE INDEX UX_ClubRequests_PendingName ON dbo.ClubRequests (ProposedName) WHERE Status = 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_ClubId_Status_CreatedAtUtc')
    CREATE INDEX IX_Posts_ClubId_Status_CreatedAtUtc ON dbo.Posts (ClubId, Status, CreatedAtUtc DESC) INCLUDE (IsPinned, AuthorId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_Status_CreatedAtUtc')
    CREATE INDEX IX_Posts_Status_CreatedAtUtc ON dbo.Posts (Status, CreatedAtUtc DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_AuthorId')
    CREATE INDEX IX_Posts_AuthorId ON dbo.Posts (AuthorId, CreatedAtUtc DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Comments_PostId_CreatedAtUtc')
    CREATE INDEX IX_Comments_PostId_CreatedAtUtc ON dbo.Comments (PostId, CreatedAtUtc);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Comments_ParentCommentId')
    CREATE INDEX IX_Comments_ParentCommentId ON dbo.Comments (ParentCommentId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Comments_AuthorId')
    CREATE INDEX IX_Comments_AuthorId ON dbo.Comments (AuthorId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PostVotes_UserId')
    CREATE INDEX IX_PostVotes_UserId ON dbo.PostVotes (UserId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Bookmarks_UserId_CreatedAtUtc')
    CREATE INDEX IX_Bookmarks_UserId_CreatedAtUtc ON dbo.Bookmarks (UserId, CreatedAtUtc DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Bookmarks_PostId')
    CREATE INDEX IX_Bookmarks_PostId ON dbo.Bookmarks (PostId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Announcements_Publication')
    CREATE INDEX IX_Announcements_Publication ON dbo.Announcements (IsDeleted, IsPublished, PublishedAtUtc DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Events_StartsAtUtc')
    CREATE INDEX IX_Events_StartsAtUtc ON dbo.Events (StartsAtUtc) INCLUDE (EndsAtUtc, Status, Category);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Attachments_PostId')
    CREATE INDEX IX_Attachments_PostId ON dbo.Attachments (PostId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Attachments_AnnouncementId')
    CREATE INDEX IX_Attachments_AnnouncementId ON dbo.Attachments (AnnouncementId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Notifications_Recipient')
    CREATE INDEX IX_Notifications_Recipient ON dbo.Notifications (RecipientUserId, IsRead, CreatedAtUtc DESC);
GO
