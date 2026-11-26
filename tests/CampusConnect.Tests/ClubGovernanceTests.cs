using System.Net;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.ClubRequests;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Moderation;
using CampusConnect.Application.Features.Posts;
using CampusConnect.Domain.Enums;
using CampusConnect.Tests.Support;

namespace CampusConnect.Tests;

[Collection(ApiCollection.Name)]
public sealed class ClubGovernanceTests(CampusConnectApp app)
{
    [Fact]
    public async Task Approving_a_request_creates_the_club_and_enrols_the_requester()
    {
        var student = await ApiSession.RegisterStudentAsync(app);
        var admin = await ApiSession.LoginAsync(app, "headcr");
        var name = $"Robotics Circle {ApiSession.Unique()}";
        var requestId = await student.CreateAsync("/api/club-requests", NewRequest(name));

        await student.PostAsync(
            $"/api/admin/club-requests/{requestId}/approve", expected: HttpStatusCode.Forbidden);
        await admin.PostAsync($"/api/admin/club-requests/{requestId}/approve");
        await admin.PostAsync(
            $"/api/admin/club-requests/{requestId}/approve", expected: HttpStatusCode.Conflict);

        var mine = await student.GetAsync<PagedResult<ClubRequestDto>>("/api/club-requests/mine");
        var approved = mine.Items.Single(r => r.Id == requestId);
        Assert.Equal(ClubRequestStatus.Approved, approved.Status);
        var club = await student.GetAsync<ClubDto>($"/api/clubs/{approved.CreatedClubSlug}");
        Assert.Equal(name, club.Name);
        Assert.True(club.IsMember);
    }

    [Fact]
    public async Task Rejection_requires_a_reason_that_the_student_can_read()
    {
        var student = await ApiSession.RegisterStudentAsync(app);
        var admin = await ApiSession.LoginAsync(app, "headgr");
        var requestId = await student.CreateAsync(
            "/api/club-requests", NewRequest($"Chess Circle {ApiSession.Unique()}"));
        var path = $"/api/admin/club-requests/{requestId}/reject";

        await admin.PostAsync(path, new RejectClubRequestRequest(""), HttpStatusCode.BadRequest);
        await admin.PostAsync(path, new RejectClubRequestRequest("Overlaps an existing club."));

        var mine = await student.GetAsync<PagedResult<ClubRequestDto>>("/api/club-requests/mine");
        Assert.Equal("Overlaps an existing club.", mine.Items.Single(r => r.Id == requestId).RejectionReason);
    }

    [Fact]
    public async Task Moderators_manage_only_their_assigned_club()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var assigned = await NewClubAsync(admin);
        var unassigned = await NewClubAsync(admin);
        var author = await ApiSession.RegisterStudentAsync(app);
        var assignedPost = await JoinAndPostAsync(author, assigned);
        var unassignedPost = await JoinAndPostAsync(author, unassigned);
        var moderator = await ApiSession.RegisterStudentAsync(app);
        var assignment = $"/api/admin/clubs/{assigned.Id}/moderators/{moderator.User.Id}";

        await moderator.PutAsync(assignment, expected: HttpStatusCode.Forbidden);
        await admin.PutAsync(assignment);

        await moderator.PutAsync($"/api/moderation/posts/{assignedPost}/pin", new SetPinnedRequest(true));
        await moderator.PostAsync(
            $"/api/moderation/posts/{assignedPost}/remove", new RemoveContentRequest("Off topic"));
        await moderator.PostAsync($"/api/moderation/posts/{assignedPost}/restore");

        await moderator.PutAsync(
            $"/api/moderation/posts/{unassignedPost}/pin", new SetPinnedRequest(true), HttpStatusCode.Forbidden);
        await moderator.PostAsync(
            $"/api/moderation/posts/{unassignedPost}/remove",
            new RemoveContentRequest(null),
            HttpStatusCode.Forbidden);
        await moderator.DeleteAsync($"/api/posts/{unassignedPost}", HttpStatusCode.Forbidden);
        var foreignList = await moderator.RawGetAsync($"/api/moderation/clubs/{unassigned.Id}/posts");
        Assert.Equal(HttpStatusCode.Forbidden, foreignList.StatusCode);

        var clubs = await moderator.GetAsync<List<ModeratedClubDto>>("/api/moderation/clubs");
        Assert.Equal([assigned.Id], clubs.Select(c => c.Id));

        await moderator.DeleteAsync(
            $"/api/clubs/{assigned.Id}/membership", HttpStatusCode.Conflict);
        await admin.DeleteAsync(assignment);
        await moderator.PostAsync(
            $"/api/moderation/posts/{assignedPost}/remove",
            new RemoveContentRequest(null),
            HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Removed_posts_are_hidden_from_other_students()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var club = await NewClubAsync(admin);
        var author = await ApiSession.RegisterStudentAsync(app);
        var postId = await JoinAndPostAsync(author, club);
        var reader = await ApiSession.RegisterStudentAsync(app);

        await admin.PostAsync($"/api/moderation/posts/{postId}/remove", new RemoveContentRequest("Spam"));

        Assert.Equal(HttpStatusCode.NotFound, (await reader.RawGetAsync($"/api/posts/{postId}")).StatusCode);
        Assert.Equal("Spam", (await author.GetAsync<PostDto>($"/api/posts/{postId}")).ModerationReason);
    }

    [Fact]
    public async Task Archived_clubs_are_read_only()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var club = await NewClubAsync(admin);
        var student = await ApiSession.RegisterStudentAsync(app);
        await JoinAndPostAsync(student, club);

        await admin.PutAsync(
            $"/api/admin/clubs/{club.Id}/status", new SetClubStatusRequest(ClubStatus.Archived));

        await student.PostAsync(
            "/api/posts",
            new CreatePostRequest(club.Id, PostType.Text, "Too late now", "Body", null),
            HttpStatusCode.Conflict);
    }

    private static CreateClubRequestRequest NewRequest(string name) =>
        new(name, 1, "A club description that is long enough.", "Students have asked for this several times.");

    private static async Task<ClubDto> NewClubAsync(ApiSession admin)
    {
        var name = $"Test Club {ApiSession.Unique()}";
        await admin.PostAsync(
            "/api/admin/clubs",
            new SaveClubRequest(name, 2, "A club created by the integration tests.", null),
            HttpStatusCode.Created);
        var clubs = await admin.GetAsync<PagedResult<ClubDto>>(
            $"/api/admin/clubs?search={Uri.EscapeDataString(name)}");
        return clubs.Items.Single();
    }

    private static async Task<int> JoinAndPostAsync(ApiSession student, ClubDto club)
    {
        await student.PostAsync($"/api/clubs/{club.Id}/membership");
        return await student.CreateAsync(
            "/api/posts", new CreatePostRequest(club.Id, PostType.Text, "Moderation subject", "Body", null));
    }
}
