using System.Net;
using System.Net.Http.Json;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Auth;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Comments;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Application.Features.Permissions;
using CampusConnect.Application.Features.Posts;
using CampusConnect.Application.Features.Recommendations;
using CampusConnect.Application.Features.Users;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Enums;
using CampusConnect.Infrastructure.Persistence;
using CampusConnect.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CampusConnect.Tests;

[Collection(ApiCollection.Name)]
public sealed class CommunityTests(CampusConnectApp app)
{
    private const string Slug = "web-development-society";

    [Fact]
    public async Task Rich_text_is_sanitised_and_stored_encrypted()
    {
        var author = await MemberAsync();
        var postId = await PostAsync(
            author,
            "<p onclick=\"steal()\">Safe <strong>bold</strong><script>alert(1)</script></p>"
            + "<p><a href=\"javascript:alert(1)\">bad</a> <img src=x onerror=alert(1)></p>");

        var post = await author.GetAsync<PostDto>($"/api/posts/{postId}");

        Assert.Contains("<strong>bold</strong>", post.Body);
        Assert.DoesNotContain("script", post.Body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", post.Body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<img", post.Body, StringComparison.OrdinalIgnoreCase);
        Assert.StartsWith("Safe bold", post.Excerpt);

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<CampusConnectDbContext>();
        var stored = await db.Database
            .SqlQueryRaw<string>("SELECT Body AS Value FROM dbo.Posts WHERE Id = {0}", postId)
            .SingleAsync();
        Assert.StartsWith("enc:v1:", stored);
        Assert.DoesNotContain("bold", stored);
    }

    [Fact]
    public async Task Mentions_notify_users_and_tags_filter_the_feed()
    {
        var mentioned = await ApiSession.RegisterStudentAsync(app);
        var author = await MemberAsync();
        var tag = $"t{ApiSession.Unique()}";
        var handle = mentioned.User.Username;

        var postId = await PostAsync(author, $"<p>Hello @{handle}, see #{tag}</p>");

        var post = await author.GetAsync<PostDto>($"/api/posts/{postId}");
        Assert.Contains(tag, post.Tags);
        Assert.Contains($"href=\"/users/{mentioned.User.Id}\"", post.Body);
        var feed = await author.GetAsync<PagedResult<PostDto>>($"/api/posts?tag={tag}");
        Assert.Equal(postId, Assert.Single(feed.Items).Id);
        var notices = await mentioned.GetAsync<NotificationFeedDto>("/api/notifications?category=Mentions");
        var notice = Assert.Single(notices.Page.Items);
        Assert.Equal(author.User.Id, notice.Actor!.Id);

        await mentioned.DeleteAsync($"/api/notifications/{notice.Id}");
        var after = await mentioned.GetAsync<NotificationFeedDto>("/api/notifications?category=Mentions");
        Assert.Empty(after.Page.Items);
    }

    [Fact]
    public async Task Comment_votes_drive_popular_order_and_threads_are_paged()
    {
        var author = await MemberAsync();
        var voter = await MemberAsync();
        var postId = await PostAsync(author, "<p>Thread test</p>");
        var path = $"/api/posts/{postId}/comments";
        var first = await author.CreateAsync(path, new CreateCommentRequest("<p>First</p>", null));
        var second = await author.CreateAsync(path, new CreateCommentRequest("<p>Second</p>", null));
        var reply = await voter.CreateAsync(path, new CreateCommentRequest("<p>Reply</p>", first));

        await voter.PutAsync($"/api/comments/{first}/vote", new VoteRequest(1), HttpStatusCode.OK);
        await voter.PutAsync($"/api/comments/{first}/vote", new VoteRequest(1), HttpStatusCode.OK);

        var popular = await voter.GetAsync<PagedResult<CommentDto>>($"{path}?sort=Popular&pageSize=1");
        Assert.Equal(2, popular.TotalCount);
        Assert.Equal([first, reply], popular.Items.Select(c => c.Id));
        Assert.Equal(1, popular.Items[0].Score);
        var recent = await voter.GetAsync<PagedResult<CommentDto>>($"{path}?sort=Recent");
        Assert.Equal(second, recent.Items[0].Id);
    }

    [Fact]
    public async Task Role_permissions_are_enforced_and_only_admins_manage_them()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var student = await MemberAsync();
        var matrix = await admin.GetAsync<PermissionMatrixDto>("/api/admin/permissions");
        var original = matrix.Roles.Single(r => r.RoleId == RoleIds.Student).Permissions;
        var path = $"/api/admin/permissions/{RoleIds.Student}";
        Assert.Equal(
            HttpStatusCode.Forbidden, (await student.RawGetAsync("/api/admin/permissions")).StatusCode);

        await admin.PutAsync(
            $"/api/admin/permissions/{RoleIds.Admin}",
            new UpdateRolePermissionsRequest([]),
            HttpStatusCode.Conflict);
        await admin.PutAsync(
            path,
            new UpdateRolePermissionsRequest([PermissionKeys.ManagePermissions]),
            HttpStatusCode.BadRequest);

        try
        {
            await admin.PutAsync(
                path,
                new UpdateRolePermissionsRequest([.. original.Where(p => p != PermissionKeys.CreatePosts)]));
            await student.PostAsync(
                "/api/posts",
                new CreatePostRequest(
                    await ClubIdAsync(student), PostType.Text, "Blocked post", "<p>Body</p>", null),
                HttpStatusCode.Forbidden);

            await admin.PutAsync(
                path, new UpdateRolePermissionsRequest([.. original, PermissionKeys.ManageEvents]));
            var me = await student.GetAsync<CurrentUserDto>("/api/auth/me");
            Assert.Contains(PermissionKeys.ManageEvents, me.Permissions);
        }
        finally
        {
            await admin.PutAsync(path, new UpdateRolePermissionsRequest(original));
        }
    }

    [Fact]
    public async Task Provisioned_accounts_must_replace_the_temporary_password()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var id = ApiSession.Unique();
        var email = $"new.{id}@example.test";
        await admin.CreateAsync(
            "/api/admin/users",
            new CreateUserRequest(
                "Provisioned Student", email, "Student", $"P-{id}", 2, null, CampusConnectApp.DemoPassword));

        var user = await ApiSession.LoginAsync(app, email);
        Assert.True(user.User.MustChangePassword);
        Assert.Equal(HttpStatusCode.Forbidden, (await user.RawGetAsync("/api/posts")).StatusCode);

        await user.PostAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest(CampusConnectApp.DemoPassword, "Replaced-Password-42"));
        Assert.Equal(HttpStatusCode.OK, (await user.RawGetAsync("/api/posts")).StatusCode);
    }

    [Fact]
    public async Task Interests_shape_club_recommendations()
    {
        var anonymous = ApiSession.Anonymous(app);
        var categories = await anonymous.GetAsync<List<ClubCategoryDto>>("/api/clubs/categories");
        var security = categories.Single(c => c.Name == "Cybersecurity");
        var id = ApiSession.Unique();
        var session = ApiSession.Anonymous(app);
        await session.PostAsync(
            "/api/auth/register",
            new RegisterRequest(
                "Interested Student", $"interest.{id}@example.test", $"I-{id}", 2,
                CampusConnectApp.DemoPassword, null, [security.Id]),
            HttpStatusCode.Created);
        var user = await ApiSession.LoginAsync(app, $"interest.{id}@example.test");

        var suggestions = await user.GetAsync<List<ClubRecommendationDto>>("/api/recommendations/clubs");

        Assert.Contains(
            suggestions,
            s => s.Club.Category.Id == security.Id && s.Reason.Contains("interest"));
        Assert.Equal(HttpStatusCode.OK, (await user.RawGetAsync("/api/posts?sort=ForYou")).StatusCode);
    }

    [Fact]
    public async Task Video_uploads_stream_with_range_requests()
    {
        var author = await MemberAsync();
        var postId = await PostAsync(author, "<p>Clip</p>");
        byte[] video = [0, 0, 0, 24, .. "ftypmp42"u8.ToArray(), .. new byte[64]];

        var response = await author.UploadAsync(
            $"/api/posts/{postId}/attachments", "clip.mp4", video, HttpStatusCode.Created, "video/mp4");
        var file = (await response.Content.ReadFromJsonAsync<AttachmentDto>(ApiSession.Json))!;
        var partial = await author.RangeAsync($"/api/files/{file.Id}", 0, 9);

        Assert.Equal(HttpStatusCode.PartialContent, partial.StatusCode);
        Assert.Equal(10, (await partial.Content.ReadAsByteArrayAsync()).Length);
        Assert.Null(partial.Content.Headers.ContentDisposition);
        var attachment = await author.RawGetAsync($"/api/files/{file.Id}?download=true");
        Assert.Equal("attachment", attachment.Content.Headers.ContentDisposition?.DispositionType);
    }

    private static async Task<int> ClubIdAsync(ApiSession session) =>
        (await session.GetAsync<ClubDto>($"/api/clubs/{Slug}")).Id;

    private async Task<ApiSession> MemberAsync()
    {
        var student = await ApiSession.RegisterStudentAsync(app);
        await student.PostAsync($"/api/clubs/{await ClubIdAsync(student)}/membership");
        return student;
    }

    private static async Task<int> PostAsync(ApiSession author, string html) =>
        await author.CreateAsync(
            "/api/posts",
            new CreatePostRequest(
                await ClubIdAsync(author), PostType.Text, $"Topic {ApiSession.Unique()}", html, null));
}
