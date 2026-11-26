USE [CampusConnectDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

INSERT INTO dbo.Roles (Id, Name)
SELECT Source.Id, Source.Name
FROM (VALUES (1, N'Admin'), (2, N'Moderator'), (3, N'Student')) AS Source (Id, Name)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Roles AS Target WHERE Target.Id = Source.Id);
GO

INSERT INTO dbo.ClubCategories (Name, IconKey, SortOrder)
SELECT Source.Name, Source.IconKey, Source.SortOrder
FROM (VALUES
    (N'Artificial Intelligence', N'ai', 1),
    (N'Software Development', N'code', 2),
    (N'Cybersecurity', N'security', 3),
    (N'Competitive Programming', N'competition', 4),
    (N'Data Science', N'data', 5),
    (N'Game Development', N'games', 6),
    (N'Open Source', N'opensource', 7),
    (N'Academics', N'academics', 8)
) AS Source (Name, IconKey, SortOrder)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ClubCategories AS Target WHERE Target.Name = Source.Name);
GO
