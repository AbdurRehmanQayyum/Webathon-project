namespace CampusConnect.Application.Common.Abstractions;

// Real-time change signals, delivered only after the request succeeds
public interface ILiveUpdates
{
    void NotificationsChanged(int userId);
    void CommentsChanged(int postId);
}
