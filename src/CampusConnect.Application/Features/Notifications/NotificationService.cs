using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Notifications;

public sealed record NotificationDto(
    int Id,
    NotificationType Type,
    string Message,
    string LinkPath,
    bool IsRead,
    DateTime CreatedAtUtc);

public sealed record NotificationFeedDto(IReadOnlyList<NotificationDto> Items, int UnreadCount);

public interface INotificationService
{
    // Queued on the context; the calling workflow saves it with its own changes
    void Queue(int recipientUserId, NotificationType type, string message, string linkPath);
    Task<NotificationFeedDto> GetLatestAsync(CancellationToken cancellationToken);
    Task MarkReadAsync(int notificationId, CancellationToken cancellationToken);
    Task MarkAllReadAsync(CancellationToken cancellationToken);
}

public sealed class NotificationService(
    IAppDbContext db,
    ICurrentUser currentUser,
    ILiveUpdates liveUpdates) : INotificationService
{
    private const int FeedSize = 20;
    private const int MaxMessageLength = 300;

    public void Queue(int recipientUserId, NotificationType type, string message, string linkPath)
    {
        if (recipientUserId == currentUser.Id)
        {
            return;
        }

        db.Notifications.Add(new Notification
        {
            RecipientUserId = recipientUserId,
            Type = (byte)type,
            Message = message.Length > MaxMessageLength ? message[..MaxMessageLength] : message,
            LinkPath = linkPath
        });
        liveUpdates.NotificationsChanged(recipientUserId);
    }

    public async Task<NotificationFeedDto> GetLatestAsync(CancellationToken cancellationToken)
    {
        var mine = db.Notifications.AsNoTracking().Where(n => n.RecipientUserId == currentUser.Id);

        var items = await mine
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(FeedSize)
            .Select(n => new NotificationDto(
                n.Id, (NotificationType)n.Type, n.Message, n.LinkPath, n.IsRead, n.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        var unreadCount = await mine.CountAsync(n => !n.IsRead, cancellationToken);

        return new NotificationFeedDto(items, unreadCount);
    }

    public async Task MarkReadAsync(int notificationId, CancellationToken cancellationToken)
    {
        var updated = await db.Notifications
            .Where(n => n.Id == notificationId && n.RecipientUserId == currentUser.Id)
            .ExecuteUpdateAsync(set => set.SetProperty(n => n.IsRead, true), cancellationToken);

        if (updated == 0)
        {
            throw new NotFoundException("Notification");
        }
    }

    public Task MarkAllReadAsync(CancellationToken cancellationToken) =>
        db.Notifications
            .Where(n => n.RecipientUserId == currentUser.Id && !n.IsRead)
            .ExecuteUpdateAsync(set => set.SetProperty(n => n.IsRead, true), cancellationToken);
}
