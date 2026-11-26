using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Content;
using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;

namespace CampusConnect.Application.Features.Posts;

public static class PostProjections
{
    private const int PreviewLength = 280;

    // Lists carry a plain-text excerpt; the detail view also carries the rich body
    public static IQueryable<PostDto> ToDto(
        this IQueryable<Post> posts, ICurrentUser user, bool includeBody = false)
    {
        var userId = user.Id;
        var isAdmin = user.IsAdmin;
        var mayEdit = user.Has(PermissionKeys.CreatePosts);
        var mayRemove = user.Has(PermissionKeys.ModeratePosts);
        var mayPin = user.Has(PermissionKeys.PinPosts);
        var mayComment = user.Has(PermissionKeys.CreateComments);
        var mayReact = user.Has(PermissionKeys.ReactToPosts);

        return posts.Select(p => new PostDto
        {
            Id = p.Id,
            Type = (PostType)p.Type,
            Title = p.Title,
            Body = BodyWhen(p.Body, includeBody),
            Excerpt = RichText.Preview(p.Body, PreviewLength),
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
            Tags = p.Tags.OrderBy(t => t.Name).Select(t => t.Name).ToList(),
            Attachments = p.Attachments
                .Where(a => !a.IsDeleted)
                .OrderBy(a => a.Id)
                .Select(a => new AttachmentDto(a.Id, a.OriginalFileName, a.ContentType, a.FileSize))
                .ToList(),
            CanEdit = mayEdit
                && p.AuthorId == userId
                && p.Status == (byte)ContentStatus.Published
                && p.Club.Status == (byte)ClubStatus.Active,
            CanDelete = p.Status == (byte)ContentStatus.Published
                && (p.AuthorId == userId
                    || isAdmin
                    || (mayRemove && p.Club.ClubModerators.Any(m => m.UserId == userId))),
            CanModerate = isAdmin || (mayRemove && p.Club.ClubModerators.Any(m => m.UserId == userId)),
            CanPin = isAdmin || (mayPin && p.Club.ClubModerators.Any(m => m.UserId == userId)),
            CanComment = mayComment
                && p.Status == (byte)ContentStatus.Published
                && p.Club.Status == (byte)ClubStatus.Active
                && (isAdmin || p.Club.ClubMembers.Any(m => m.UserId == userId)),
            CanReact = mayReact && p.Status == (byte)ContentStatus.Published
        });
    }

    private static string? BodyWhen(string? body, bool include) => include ? body : null;
}
