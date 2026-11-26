USE [master];
GO

IF DB_ID(N'CampusConnectDB') IS NULL
    CREATE DATABASE [CampusConnectDB];
GO

IF EXISTS (SELECT 1 FROM sys.databases WHERE name = N'CampusConnectDB' AND is_read_committed_snapshot_on = 0)
    ALTER DATABASE [CampusConnectDB] SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO
