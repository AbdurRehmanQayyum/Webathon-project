using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Files;

// Resource-level authorization for every upload, download and deletion
public sealed class FileAccessPolicy(IAppDbContext db, ICurrentUser currentUser, IClubAccess clubAccess)
{
    public async Task EnsureCanUploadAsync(FilePurpose purpose, int ownerId, CancellationToken cancellationToken)
    {
        switch (purpose)
        {
            case FilePurpose.Avatar:
                currentUser.Require(PermissionKeys.UploadFiles);
                if (ownerId != currentUser.Id)
                {
                    throw new ForbiddenException("You can only change your own picture.");
                }

                break;

            case FilePurpose.ClubLogo or FilePurpose.ClubCover:
                await EnsureExistsAsync(db.Clubs.Where(c => c.Id == ownerId), "Club", cancellationToken);
                await EnsureCanBrandAsync(ownerId, cancellationToken);
                break;

            case FilePurpose.PostAttachment:
                await EnsurePostAuthorAsync(ownerId, cancellationToken);
                break;

            case FilePurpose.AnnouncementAttachment:
                currentUser.Require(PermissionKeys.ManageAnnouncements);
                await EnsureExistsAsync(
                    db.Announcements.Where(a => a.Id == ownerId && !a.IsDeleted),
                    "Announcement",
                    cancellationToken);
                break;

            case FilePurpose.EventAttachment:
                currentUser.Require(PermissionKeys.ManageEvents);
                await EnsureExistsAsync(db.Events.Where(e => e.Id == ownerId), "Event", cancellationToken);
                break;

            default:
                throw new ForbiddenException();
        }
    }

    // Files follow the visibility of their parent content
    public async Task EnsureCanViewAsync(int fileId, CancellationToken cancellationToken)
    {
        var userId = currentUser.Id;
        var isAdmin = currentUser.IsAdmin;
        var seesDrafts = currentUser.Has(PermissionKeys.ManageAnnouncements);

        var isVisible = await db.Attachments
            .Where(a => a.Id == fileId && !a.IsDeleted)
            .AnyAsync(
                a => a.Purpose <= (byte)FilePurpose.ClubCover
                    || a.EventId != null
                    || (a.Post != null
                        && (a.Post.Status == (byte)ContentStatus.Published
                            || (a.Post.Status == (byte)ContentStatus.Removed
                                && (isAdmin
                                    || a.Post.AuthorId == userId
                                    || a.Post.Club.ClubModerators.Any(m => m.UserId == userId)))))
                    || (a.Announcement != null
                        && !a.Announcement.IsDeleted
                        && (a.Announcement.IsPublished || seesDrafts)),
                cancellationToken);

        if (!isVisible)
        {
            throw new NotFoundException("File");
        }
    }

    public async Task EnsureCanDeleteAsync(Attachment file, CancellationToken cancellationToken)
    {
        switch ((FilePurpose)file.Purpose)
        {
            case FilePurpose.Avatar:
                if (file.UploadedByUserId != currentUser.Id)
                {
                    EnsureAdmin();
                }

                break;

            case FilePurpose.ClubLogo or FilePurpose.ClubCover:
                var clubId = await db.Clubs
                    .Where(c => c.LogoFileId == file.Id || c.CoverFileId == file.Id)
                    .Select(c => (int?)c.Id)
                    .SingleOrDefaultAsync(cancellationToken)
                    ?? throw new NotFoundException("File");
                await EnsureCanBrandAsync(clubId, cancellationToken);
                break;

            case FilePurpose.PostAttachment:
                var post = await db.Posts
                    .Where(p => p.Id == file.PostId)
                    .Select(p => new { p.AuthorId, p.ClubId })
                    .SingleAsync(cancellationToken);
                if (post.AuthorId != currentUser.Id)
                {
                    await clubAccess.EnsureCanModerateAsync(
                        post.ClubId, PermissionKeys.ModeratePosts, cancellationToken);
                }

                break;

            case FilePurpose.AnnouncementAttachment:
                currentUser.Require(PermissionKeys.ManageAnnouncements);
                break;

            default:
                currentUser.Require(PermissionKeys.ManageEvents);
                break;
        }
    }

    // Club images belong to club managers and the assigned moderators
    private async Task EnsureCanBrandAsync(int clubId, CancellationToken cancellationToken)
    {
        if (!currentUser.Has(PermissionKeys.ManageClubs)
            && !await clubAccess.IsAssignedModeratorAsync(clubId, cancellationToken))
        {
            throw new ForbiddenException("Only the club's moderators can change its images.");
        }
    }

    private async Task EnsurePostAuthorAsync(int postId, CancellationToken cancellationToken)
    {
        currentUser.Require(PermissionKeys.UploadFiles);
        var post = await db.Posts
            .Where(p => p.Id == postId && p.Status == (byte)ContentStatus.Published)
            .Select(p => new { p.AuthorId, p.ClubId })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Post");

        if (post.AuthorId != currentUser.Id)
        {
            throw new ForbiddenException("Only the author can attach files to this post.");
        }

        await clubAccess.EnsureCanParticipateAsync(post.ClubId, cancellationToken);
    }

    private void EnsureAdmin()
    {
        if (!currentUser.IsAdmin)
        {
            throw new ForbiddenException("Only administrators can manage this file.");
        }
    }

    private static async Task EnsureExistsAsync<T>(
        IQueryable<T> query, string resource, CancellationToken cancellationToken)
    {
        if (!await query.AnyAsync(cancellationToken))
        {
            throw new NotFoundException(resource);
        }
    }
}
