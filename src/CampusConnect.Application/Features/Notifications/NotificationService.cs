using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Notifications;

public enum NotificationCategory
{
    All,
    Mentions,
    Replies,
    Clubs,
    Moderation,
    Department
}

public sealed record NotificationQuery : PageQuery
{
    public NotificationCategory Category { get; init; } = NotificationCategory.All;
    public bool UnreadOnly { get; init; }
}

public sealed record NotificationDto(
    int Id,
    NotificationType Type,
    string Message,
    string LinkPath,
    bool IsRead,
    DateTime CreatedAtUtc,
    UserSummaryDto? Actor);

public sealed record NotificationFeedDto(PagedResult<NotificationDto> Page, int UnreadCount);

public interface INotificationService
{
    // Queued on the context; the calling workflow saves it with its own changes
    void Queue(int recipientUserId, NotificationType type, string message, string linkPath);
    Task BroadcastAsync(NotificationType type, string message, string linkPath, CancellationToken cancellationToken);
    Task<NotificationFeedDto> ListAsync(NotificationQuery query, CancellationToken cancellationToken);
    Task MarkReadAsync(int notificationId, CancellationToken cancellationToken);
    Task MarkAllReadAsync(CancellationToken cancellationToken);
    Task DeleteAsync(int notificationId, CancellationToken cancellationToken);
    Task DeleteReadAsync(CancellationToken cancellationToken);
}

public sealed class NotificationService(
    IAppDbContext db,
    ICurrentUser currentUser,
    ILiveUpdates liveUpdates) : INotificationService
{
    private const int MaxMessageLength = 300;

    public void Queue(int recipientUserId, NotificationType type, string message, string linkPath)
    {
        if (recipientUserId == currentUser.Id)
        {
            return;
        }

        db.Notifications.Add(Create(recipientUserId, type, message, linkPath));
        liveUpdates.NotificationsChanged(recipientUserId);
    }

    // Department-wide notices reach every active account
    public async Task BroadcastAsync(
        NotificationType type, string message, string linkPath, CancellationToken cancellationToken)
    {
        var recipients = await db.Users
            .Where(u => u.IsActive && u.Id != currentUser.Id)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        db.Notifications.AddRange(recipients.Select(id => Create(id, type, message, linkPath)));
        await db.SaveChangesAsync(cancellationToken);
        liveUpdates.NotificationsChangedForEveryone();
    }

    public async Task<NotificationFeedDto> ListAsync(
        NotificationQuery query, CancellationToken cancellationToken)
    {
        var mine = Mine().AsNoTracking();
        var unreadCount = await mine.CountAsync(n => !n.IsRead, cancellationToken);

        if (query.UnreadOnly)
        {
            mine = mine.Where(n => !n.IsRead);
        }

        if (query.Category != NotificationCategory.All)
        {
            var types = TypesIn(query.Category);
            mine = mine.Where(n => types.Contains(n.Type));
        }

        var page = await mine
            .OrderByDescending(n => n.CreatedAtUtc)
            .ThenByDescending(n => n.Id)
            .ToPagedResultAsync(
                query,
                items => items.Select(n => new NotificationDto(
                    n.Id,
                    (NotificationType)n.Type,
                    n.Message,
                    n.LinkPath,
                    n.IsRead,
                    n.CreatedAtUtc,
                    n.ActorUser == null
                        ? null
                        : new UserSummaryDto(
                            n.ActorUser.Id,
                            n.ActorUser.FullName,
                            n.ActorUser.Title,
                            n.ActorUser.AvatarFileId))),
                cancellationToken);

        return new NotificationFeedDto(page, unreadCount);
    }

    public async Task MarkReadAsync(int notificationId, CancellationToken cancellationToken)
    {
        var updated = await Mine()
            .Where(n => n.Id == notificationId)
            .ExecuteUpdateAsync(set => set.SetProperty(n => n.IsRead, true), cancellationToken);

        if (updated == 0)
        {
            throw new NotFoundException("Notification");
        }
    }

    public Task MarkAllReadAsync(CancellationToken cancellationToken) =>
        Mine()
            .Where(n => !n.IsRead)
            .ExecuteUpdateAsync(set => set.SetProperty(n => n.IsRead, true), cancellationToken);

    public async Task DeleteAsync(int notificationId, CancellationToken cancellationToken)
    {
        if (await Mine().Where(n => n.Id == notificationId).ExecuteDeleteAsync(cancellationToken) == 0)
        {
            throw new NotFoundException("Notification");
        }
    }

    public Task DeleteReadAsync(CancellationToken cancellationToken) =>
        Mine().Where(n => n.IsRead).ExecuteDeleteAsync(cancellationToken);

    private IQueryable<Notification> Mine()
    {
        var userId = currentUser.Id;
        return db.Notifications.Where(n => n.RecipientUserId == userId);
    }

    private Notification Create(int recipientUserId, NotificationType type, string message, string linkPath) =>
        new()
        {
            RecipientUserId = recipientUserId,
            ActorUserId = currentUser.Id,
            Type = (byte)type,
            Message = message.Length > MaxMessageLength ? message[..MaxMessageLength] : message,
            LinkPath = linkPath
        };

    private static List<byte> TypesIn(NotificationCategory category)
    {
        NotificationType[] types = category switch
        {
            NotificationCategory.Mentions => [NotificationType.Mention],
            NotificationCategory.Replies => [NotificationType.CommentOnPost, NotificationType.ReplyToComment],
            NotificationCategory.Clubs =>
            [
                NotificationType.ClubRequestApproved,
                NotificationType.ClubRequestRejected,
                NotificationType.ModeratorAssigned
            ],
            NotificationCategory.Moderation => [NotificationType.ContentRemoved],
            _ =>
            [
                NotificationType.AnnouncementPublished,
                NotificationType.EventScheduled,
                NotificationType.EventCancelled
            ]
        };

        return [.. types.Select(t => (byte)t)];
    }
}
