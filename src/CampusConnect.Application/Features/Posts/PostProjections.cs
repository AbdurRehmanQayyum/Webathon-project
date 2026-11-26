using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;

namespace CampusConnect.Application.Features.Posts;

public static class PostProjections
{
    public const int PreviewLength = 320;

    public static IQueryable<PostDto> ToDto(
        this IQueryable<Post> posts, int userId, bool isAdmin, int bodyLimit = PreviewLength) =>
        posts.Select(p => new PostDto
        {
            Id = p.Id,
            Type = (PostType)p.Type,
            Title = p.Title,
            Body = p.Body != null && p.Body.Length > bodyLimit ? p.Body.Substring(0, bodyLimit) : p.Body,
            IsBodyTruncated = p.Body != null && p.Body.Length > bodyLimit,
            LinkUrl = p.LinkUrl,
            Status = (ContentStatus)p.Status,
            IsPinned = p.IsPinned,
            ModerationReason = p.ModerationReason,
            Club = new ClubReferenceDto(
                p.ClubId, p.Club.Name, p.Club.Slug, p.Club.Category.IconKey, p.Club.LogoFileId),
            Author = new UserSummaryDto(p.AuthorId, p.Author.FullName, p.Author.Title, p.Author.AvatarFileId),
            CreatedAtUtc = p.CreatedAtUtc,
            EditedAtUtc = p.EditedAtUtc,
            Score = p.PostVotes.Sum(v => (int)v.Value),
            MyVote = p.PostVotes.Where(v => v.UserId == userId).Select(v => (int)v.Value).FirstOrDefault(),
            CommentCount = p.Comments.Count(c => c.Status == (byte)ContentStatus.Published),
            IsBookmarked = p.Bookmarks.Any(b => b.UserId == userId),
            Attachments = p.Attachments
                .Where(a => !a.IsDeleted)
                .OrderBy(a => a.Id)
                .Select(a => new AttachmentDto(a.Id, a.OriginalFileName, a.ContentType, a.FileSize))
                .ToList(),
            CanEdit = p.AuthorId == userId
                && p.Status == (byte)ContentStatus.Published
                && p.Club.Status == (byte)ClubStatus.Active,
            CanDelete = p.Status == (byte)ContentStatus.Published
                && (p.AuthorId == userId || isAdmin || p.Club.ClubModerators.Any(m => m.UserId == userId)),
            CanModerate = isAdmin || p.Club.ClubModerators.Any(m => m.UserId == userId),
            CanComment = p.Status == (byte)ContentStatus.Published
                && p.Club.Status == (byte)ClubStatus.Active
                && (isAdmin || p.Club.ClubMembers.Any(m => m.UserId == userId))
        });
}
