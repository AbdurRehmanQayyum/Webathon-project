using CampusConnect.Api.Auth;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Events;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusConnect.Api.Controllers;

[Route("api/events")]
public sealed class EventsController(IEventService events) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<EventDto>>> List(
        [FromQuery] EventQuery query, CancellationToken cancellationToken) =>
        await events.ListAsync(query, cancellationToken);

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EventDto>> Get(int id, CancellationToken cancellationToken) =>
        await events.GetAsync(id, cancellationToken);

    [Authorize(Policy = Policies.Admin)]
    [HttpPost]
    public async Task<ActionResult<CreatedResponse>> Create(
        SaveEventRequest request, CancellationToken cancellationToken) =>
        CreatedId("/api/events", await events.CreateAsync(request, cancellationToken));

    [Authorize(Policy = Policies.Admin)]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id, SaveEventRequest request, CancellationToken cancellationToken)
    {
        await events.UpdateAsync(id, request, cancellationToken);
        return NoContent();
    }

    [Authorize(Policy = Policies.Admin)]
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(
        int id, CancelEventRequest request, CancellationToken cancellationToken)
    {
        await events.CancelAsync(id, request, cancellationToken);
        return NoContent();
    }
}
