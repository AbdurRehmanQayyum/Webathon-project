using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusConnect.Application.Features.Events;

public enum EventScope
{
    All,
    Upcoming,
    Past
}

public sealed record EventQuery : PageQuery
{
    public EventScope Scope { get; init; } = EventScope.All;
    public EventCategory? Category { get; init; }
    public EventStatus? Status { get; init; }
    public DateTimeOffset? From { get; init; }
    public DateTimeOffset? To { get; init; }
}

public sealed record SaveEventRequest(
    string Title,
    string Description,
    string Venue,
    EventCategory Category,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt);

public sealed record CancelEventRequest(string Reason);

public sealed record EventDto
{
    public required int Id { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Venue { get; init; }
    public required EventCategory Category { get; init; }
    public required DateTime StartsAtUtc { get; init; }
    public required DateTime EndsAtUtc { get; init; }
    public required EventStatus Status { get; init; }
    public string? CancellationReason { get; init; }
    public required UserSummaryDto Organizer { get; init; }
    public required IReadOnlyList<AttachmentDto> Attachments { get; init; }
}

public sealed class SaveEventRequestValidator : AbstractValidator<SaveEventRequest>
{
    private static readonly TimeSpan MaxDuration = TimeSpan.FromDays(14);

    public SaveEventRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().Length(5, 200);
        RuleFor(x => x.Description).NotEmpty().Length(10, 4000);
        RuleFor(x => x.Venue).NotEmpty().Length(2, 200);
        RuleFor(x => x.Category).IsInEnum();
        RuleFor(x => x.StartsAt).NotEmpty();
        RuleFor(x => x.EndsAt)
            .GreaterThan(x => x.StartsAt).WithMessage("The event must end after it starts.")
            .Must((request, endsAt) => endsAt - request.StartsAt <= MaxDuration)
            .WithMessage("Events can last up to 14 days.");
    }
}

public sealed class CancelEventRequestValidator : AbstractValidator<CancelEventRequest>
{
    public CancelEventRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().Length(5, 500);
    }
}

public interface IEventService
{
    Task<PagedResult<EventDto>> ListAsync(EventQuery query, CancellationToken cancellationToken);
    Task<EventDto> GetAsync(int id, CancellationToken cancellationToken);
    Task<int> CreateAsync(SaveEventRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(int id, SaveEventRequest request, CancellationToken cancellationToken);
    Task CancelAsync(int id, CancelEventRequest request, CancellationToken cancellationToken);
}

public sealed class EventService(
    IAppDbContext db,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<EventService> logger) : IEventService
{
    public Task<PagedResult<EventDto>> ListAsync(EventQuery query, CancellationToken cancellationToken)
    {
        var events = db.Events.AsNoTracking();
        var now = clock.GetUtcNow().UtcDateTime;

        // Query filters
        events = query.Scope switch
        {
            EventScope.Upcoming => events.Where(e => e.EndsAtUtc >= now),
            EventScope.Past => events.Where(e => e.EndsAtUtc < now),
            _ => events
        };

        if (query.From is { } from)
        {
            var fromUtc = from.UtcDateTime;
            events = events.Where(e => e.EndsAtUtc >= fromUtc);
        }

        if (query.To is { } to)
        {
            var toUtc = to.UtcDateTime;
            events = events.Where(e => e.StartsAtUtc < toUtc);
        }

        if (query.Category is { } category)
        {
            events = events.Where(e => e.Category == (byte)category);
        }

        if (query.Status is { } status)
        {
            events = events.Where(e => e.Status == (byte)status);
        }

        if (query.Search is { } search)
        {
            events = events.Where(e => e.Title.Contains(search) || e.Venue.Contains(search));
        }

        var ordered = query.Scope == EventScope.Past
            ? events.OrderByDescending(e => e.StartsAtUtc)
            : events.OrderBy(e => e.StartsAtUtc);

        return Project(ordered.ThenBy(e => e.Id)).ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<EventDto> GetAsync(int id, CancellationToken cancellationToken) =>
        await Project(db.Events.AsNoTracking().Where(e => e.Id == id)).SingleOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException("Event");

    public async Task<int> CreateAsync(SaveEventRequest request, CancellationToken cancellationToken)
    {
        var departmentEvent = new Event
        {
            CreatedByUserId = currentUser.Id,
            Status = (byte)EventStatus.Scheduled
        };
        Apply(departmentEvent, request);
        db.Events.Add(departmentEvent);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Event {EventId} created", departmentEvent.Id);
        return departmentEvent.Id;
    }

    public async Task UpdateAsync(int id, SaveEventRequest request, CancellationToken cancellationToken)
    {
        var departmentEvent = await FindScheduledAsync(id, cancellationToken);
        Apply(departmentEvent, request);
        await db.SaveChangesAsync(cancellationToken);
    }

    // Cancelled events stay visible with their reason
    public async Task CancelAsync(int id, CancelEventRequest request, CancellationToken cancellationToken)
    {
        var departmentEvent = await FindScheduledAsync(id, cancellationToken);
        departmentEvent.Status = (byte)EventStatus.Cancelled;
        departmentEvent.CancellationReason = request.Reason.Trim();
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Event {EventId} cancelled", id);
    }

    private async Task<Event> FindScheduledAsync(int id, CancellationToken cancellationToken)
    {
        var departmentEvent = await db.Events.SingleOrDefaultAsync(e => e.Id == id, cancellationToken)
            ?? throw new NotFoundException("Event");

        return departmentEvent.Status == (byte)EventStatus.Scheduled
            ? departmentEvent
            : throw new ConflictException("A cancelled event can no longer be changed.");
    }

    private static void Apply(Event departmentEvent, SaveEventRequest request)
    {
        departmentEvent.Title = request.Title.Trim();
        departmentEvent.Description = request.Description.Trim();
        departmentEvent.Venue = request.Venue.Trim();
        departmentEvent.Category = (byte)request.Category;
        departmentEvent.StartsAtUtc = request.StartsAt.UtcDateTime;
        departmentEvent.EndsAtUtc = request.EndsAt.UtcDateTime;
    }

    private static IQueryable<EventDto> Project(IQueryable<Event> events) =>
        events.Select(e => new EventDto
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            Venue = e.Venue,
            Category = (EventCategory)e.Category,
            StartsAtUtc = e.StartsAtUtc,
            EndsAtUtc = e.EndsAtUtc,
            Status = (EventStatus)e.Status,
            CancellationReason = e.CancellationReason,
            Organizer = new UserSummaryDto(
                e.CreatedByUserId,
                e.CreatedByUser.FullName,
                e.CreatedByUser.Title,
                e.CreatedByUser.AvatarFileId),
            Attachments = e.Attachments
                .Where(a => !a.IsDeleted)
                .OrderBy(a => a.Id)
                .Select(a => new AttachmentDto(a.Id, a.OriginalFileName, a.ContentType, a.FileSize))
                .ToList()
        });
}
