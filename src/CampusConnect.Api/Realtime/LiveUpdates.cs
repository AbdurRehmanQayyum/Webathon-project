using CampusConnect.Application.Common.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.SignalR;

namespace CampusConnect.Api.Realtime;

public sealed class LiveUpdateQueue(IHubContext<LiveHub, ILiveClient> hub) : ILiveUpdates
{
    private readonly HashSet<int> _users = [];
    private readonly HashSet<int> _posts = [];
    private bool _everyone;

    public void NotificationsChanged(int userId) => _users.Add(userId);

    public void NotificationsChangedForEveryone() => _everyone = true;

    public void CommentsChanged(int postId) => _posts.Add(postId);

    public async Task FlushAsync()
    {
        if (_everyone)
        {
            await hub.Clients.All.NotificationsChanged();
        }
        else
        {
            foreach (var userId in _users)
            {
                await hub.Clients.User(userId.ToString()).NotificationsChanged();
            }
        }

        foreach (var postId in _posts)
        {
            await hub.Clients.Group(LiveHub.PostGroup(postId)).CommentsChanged(postId);
        }

        _users.Clear();
        _posts.Clear();
        _everyone = false;
    }
}

// Sends queued signals once the action has committed successfully
public sealed class LiveUpdateFilter(LiveUpdateQueue queue) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        if (executed.Exception is null)
        {
            await queue.FlushAsync();
        }
    }
}
