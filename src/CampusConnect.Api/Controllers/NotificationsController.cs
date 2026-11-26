using CampusConnect.Application.Features.Notifications;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/notifications")]
public sealed class NotificationsController(INotificationService notifications) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<NotificationFeedDto>> List(
        [FromQuery] NotificationQuery query, CancellationToken cancellationToken) =>
        await notifications.ListAsync(query, cancellationToken);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await notifications.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpDelete("read")]
    public async Task<IActionResult> DeleteRead(CancellationToken cancellationToken)
    {
        await notifications.DeleteReadAsync(cancellationToken);
        return NoContent();
    }

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
