using CampusConnect.Application.Features.Notifications;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/notifications")]
public sealed class NotificationsController(INotificationService notifications) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<NotificationFeedDto>> Latest(CancellationToken cancellationToken) =>
        await notifications.GetLatestAsync(cancellationToken);

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken cancellationToken)
    {
        await notifications.MarkReadAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        await notifications.MarkAllReadAsync(cancellationToken);
        return NoContent();
    }
}
