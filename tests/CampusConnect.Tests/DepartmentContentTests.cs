using System.Net;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Announcements;
using CampusConnect.Application.Features.Events;
using CampusConnect.Domain.Enums;
using CampusConnect.Tests.Support;

namespace CampusConnect.Tests;

[Collection(ApiCollection.Name)]
public sealed class DepartmentContentTests(CampusConnectApp app)
{
    [Fact]
    public async Task Announcements_reach_students_only_when_published()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var student = await ApiSession.LoginAsync(app, "student");
        var title = $"Notice {ApiSession.Unique()}";
        var draft = new SaveAnnouncementRequest(
            title, "The full announcement text.", "https://example.com/form", "Form",
            AnnouncementPriority.Important, false);

        await student.PostAsync("/api/announcements", draft, HttpStatusCode.Forbidden);
        var id = await admin.CreateAsync("/api/announcements", draft);
        await admin.UploadAsync(
            $"/api/announcements/{id}/attachments", "notice.txt", "details"u8.ToArray(), HttpStatusCode.Created);
        Assert.Equal(HttpStatusCode.NotFound, (await student.RawGetAsync($"/api/announcements/{id}")).StatusCode);

        await admin.PutAsync($"/api/announcements/{id}/publication", new SetPublicationRequest(true));
        var published = await student.GetAsync<AnnouncementDto>($"/api/announcements/{id}");
        Assert.NotNull(published.PublishedAtUtc);
        var file = Assert.Single(published.Attachments);
        Assert.Equal(HttpStatusCode.OK, (await student.RawGetAsync($"/api/files/{file.Id}")).StatusCode);

        await admin.PutAsync($"/api/announcements/{id}/publication", new SetPublicationRequest(false));
        Assert.Equal(
            HttpStatusCode.NotFound, (await student.RawGetAsync($"/api/files/{file.Id}")).StatusCode);
        await admin.DeleteAsync($"/api/announcements/{id}");
    }

    [Fact]
    public async Task Events_can_be_created_updated_and_cancelled_without_disappearing()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var student = await ApiSession.LoginAsync(app, "student");
        var title = $"Seminar {ApiSession.Unique()}";
        var startsAt = DateTimeOffset.UtcNow.AddDays(3);
        var request = new SaveEventRequest(
            title, "A department seminar.", "Room 1", EventCategory.Seminar, startsAt, startsAt.AddHours(2));

        await student.PostAsync("/api/events", request, HttpStatusCode.Forbidden);
        await admin.PostAsync(
            "/api/events", request with { EndsAt = startsAt.AddHours(-1) }, HttpStatusCode.BadRequest);
        var id = await admin.CreateAsync("/api/events", request);
        await admin.PutAsync($"/api/events/{id}", request with { Venue = "Room 2" });
        await admin.PostAsync($"/api/events/{id}/cancel", new CancelEventRequest("Venue unavailable."));
        await admin.PutAsync($"/api/events/{id}", request, HttpStatusCode.Conflict);

        var upcoming = await student.GetAsync<PagedResult<EventDto>>($"/api/events?scope=Upcoming&search={title}");
        var cancelled = Assert.Single(upcoming.Items);
        Assert.Equal(EventStatus.Cancelled, cancelled.Status);
        Assert.Equal("Room 2", cancelled.Venue);
        var past = await student.GetAsync<PagedResult<EventDto>>($"/api/events?scope=Past&search={title}");
        Assert.Empty(past.Items);
    }

    [Fact]
    public async Task Past_events_are_listed_separately()
    {
        var student = await ApiSession.LoginAsync(app, "student");

        var past = await student.GetAsync<PagedResult<EventDto>>("/api/events?scope=Past");

        Assert.NotEmpty(past.Items);
        Assert.All(past.Items, e => Assert.True(e.EndsAtUtc < DateTime.UtcNow));
    }
}
