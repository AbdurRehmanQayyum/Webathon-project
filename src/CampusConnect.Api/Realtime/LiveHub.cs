using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CampusConnect.Api.Realtime;

public interface ILiveClient
{
    Task NotificationsChanged();
    Task CommentsChanged(int postId);
}

// Carries change signals only; clients re-read data through the authorized REST API
[Authorize]
public sealed class LiveHub : Hub<ILiveClient>
{
    public const string Path = "/hubs/live";

    public static string PostGroup(int postId) => $"post:{postId}";

    public Task WatchPost(int postId) => Groups.AddToGroupAsync(Context.ConnectionId, PostGroup(postId));

    public Task UnwatchPost(int postId) => Groups.RemoveFromGroupAsync(Context.ConnectionId, PostGroup(postId));
}
