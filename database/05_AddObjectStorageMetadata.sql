USE [CampusConnectDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Attachments becomes the central stored-file metadata table
-- Only the first run replaces the original constraints
IF COL_LENGTH(N'dbo.Attachments', N'SizeBytes') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Attachments_Owner')
        ALTER TABLE dbo.Attachments DROP CONSTRAINT CK_Attachments_Owner;
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Attachments_Size')
        ALTER TABLE dbo.Attachments DROP CONSTRAINT CK_Attachments_Size;
END
GO

IF COL_LENGTH(N'dbo.Attachments', N'SizeBytes') IS NOT NULL
    EXEC sp_rename N'dbo.Attachments.SizeBytes', N'FileSize', N'COLUMN';
GO

IF COL_LENGTH(N'dbo.Attachments', N'ObjectKey') IS NULL
    ALTER TABLE dbo.Attachments ADD ObjectKey nvarchar(300) NULL;
IF COL_LENGTH(N'dbo.Attachments', N'FileExtension') IS NULL
    ALTER TABLE dbo.Attachments ADD FileExtension nvarchar(10) NULL;
IF COL_LENGTH(N'dbo.Attachments', N'StorageProvider') IS NULL
    ALTER TABLE dbo.Attachments ADD StorageProvider nvarchar(20) NULL;
IF COL_LENGTH(N'dbo.Attachments', N'Purpose') IS NULL
    ALTER TABLE dbo.Attachments ADD Purpose tinyint NULL;
IF COL_LENGTH(N'dbo.Attachments', N'EventId') IS NULL
    ALTER TABLE dbo.Attachments ADD EventId int NULL CONSTRAINT FK_Attachments_Events REFERENCES dbo.Events (Id);
IF COL_LENGTH(N'dbo.Attachments', N'UpdatedAtUtc') IS NULL
    ALTER TABLE dbo.Attachments ADD UpdatedAtUtc datetime2(3) NULL;
IF COL_LENGTH(N'dbo.Attachments', N'IsDeleted') IS NULL
    ALTER TABLE dbo.Attachments ADD IsDeleted bit NOT NULL CONSTRAINT DF_Attachments_IsDeleted DEFAULT 0;
GO

-- Existing local files keep their flat key
UPDATE dbo.Attachments
SET ObjectKey = StoredFileName,
    FileExtension = CASE WHEN CHARINDEX(N'.', StoredFileName) > 0
                         THEN RIGHT(StoredFileName, CHARINDEX(N'.', REVERSE(StoredFileName)))
                         ELSE N'' END,
    StorageProvider = N'Local',
    Purpose = CASE WHEN PostId IS NOT NULL THEN 4 ELSE 5 END
WHERE ObjectKey IS NULL;
GO

ALTER TABLE dbo.Attachments ALTER COLUMN ObjectKey nvarchar(300) NOT NULL;
ALTER TABLE dbo.Attachments ALTER COLUMN FileExtension nvarchar(10) NOT NULL;
ALTER TABLE dbo.Attachments ALTER COLUMN StorageProvider nvarchar(20) NOT NULL;
GO

IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID(N'dbo.Attachments') AND name = N'Purpose' AND is_nullable = 1)
    ALTER TABLE dbo.Attachments ALTER COLUMN Purpose tinyint NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Attachments_Size')
    ALTER TABLE dbo.Attachments ADD CONSTRAINT CK_Attachments_Size
        CHECK (FileSize > 0 AND FileSize <= 10485760);
GO

-- 1 avatar, 2 club logo, 3 club cover, 4 post, 5 announcement, 6 event
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Attachments_Owner')
    ALTER TABLE dbo.Attachments ADD CONSTRAINT CK_Attachments_Owner CHECK
    (
        (Purpose IN (1, 2, 3) AND PostId IS NULL AND AnnouncementId IS NULL AND EventId IS NULL)
        OR (Purpose = 4 AND PostId IS NOT NULL AND AnnouncementId IS NULL AND EventId IS NULL)
        OR (Purpose = 5 AND AnnouncementId IS NOT NULL AND PostId IS NULL AND EventId IS NULL)
        OR (Purpose = 6 AND EventId IS NOT NULL AND PostId IS NULL AND AnnouncementId IS NULL)
    );
GO

IF COL_LENGTH(N'dbo.Users', N'AvatarFileId') IS NULL
    ALTER TABLE dbo.Users ADD AvatarFileId int NULL
        CONSTRAINT FK_Users_AvatarFile REFERENCES dbo.Attachments (Id);
IF COL_LENGTH(N'dbo.Clubs', N'LogoFileId') IS NULL
    ALTER TABLE dbo.Clubs ADD LogoFileId int NULL
        CONSTRAINT FK_Clubs_LogoFile REFERENCES dbo.Attachments (Id);
IF COL_LENGTH(N'dbo.Clubs', N'CoverFileId') IS NULL
    ALTER TABLE dbo.Clubs ADD CoverFileId int NULL
        CONSTRAINT FK_Clubs_CoverFile REFERENCES dbo.Attachments (Id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Attachments_ObjectKey')
    CREATE UNIQUE INDEX UX_Attachments_ObjectKey ON dbo.Attachments (ObjectKey);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Attachments_UploadedByUserId')
    CREATE INDEX IX_Attachments_UploadedByUserId ON dbo.Attachments (UploadedByUserId, IsDeleted) INCLUDE (FileSize);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Attachments_EventId')
    CREATE INDEX IX_Attachments_EventId ON dbo.Attachments (EventId);
GO
