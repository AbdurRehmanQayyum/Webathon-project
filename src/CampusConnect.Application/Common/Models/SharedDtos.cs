namespace CampusConnect.Application.Common.Models;

public sealed record UserSummaryDto(int Id, string FullName, string? Title, int? AvatarFileId);

public sealed record ClubReferenceDto(int Id, string Name, string Slug, string IconKey, int? LogoFileId);

public sealed record AttachmentDto(int Id, string FileName, string ContentType, long SizeBytes);
