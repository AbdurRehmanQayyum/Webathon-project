using System.Net;
using System.Net.Http.Json;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Comments;
using CampusConnect.Application.Features.Notifications;
using CampusConnect.Application.Features.Posts;
using CampusConnect.Domain.Enums;
using CampusConnect.Tests.Support;

namespace CampusConnect.Tests;

[Collection(ApiCollection.Name)]
public sealed class DiscussionTests(CampusConnectApp app)
{
    [Fact]
    public async Task Students_join_a_club_before_posting_text_and_link_posts()
    {
        var student = await ApiSession.RegisterStudentAsync(app);
        var club = await ClubAsync(student, "web-development-society");
        var text = new CreatePostRequest(club.Id, PostType.Text, "A test discussion", "Body text", null);

        await student.PostAsync("/api/posts", text, HttpStatusCode.Forbidden);
        await student.PostAsync($"/api/clubs/{club.Id}/membership");
        await student.PostAsync($"/api/clubs/{club.Id}/membership");
        var textId = await student.CreateAsync("/api/posts", text);
        var linkId = await student.CreateAsync(
            "/api/posts",
            new CreatePostRequest(club.Id, PostType.Link, "A useful link", null, "https://example.com/guide"));

        var feed = await student.GetAsync<PagedResult<PostDto>>("/api/posts?joinedOnly=true");
        Assert.Contains(feed.Items, p => p.Id == textId && p.Type == PostType.Text);
        Assert.Contains(feed.Items, p => p.Id == linkId && p.LinkUrl == "https://example.com/guide");
    }

    [Fact]
    public async Task Unsafe_link_schemes_are_rejected()
    {
        var student = await ApiSession.LoginAsync(app, "student");
        var club = await ClubAsync(student, "web-development-society");

        await student.PostAsync(
            "/api/posts",
            new CreatePostRequest(club.Id, PostType.Link, "Script link", null, "javascript:alert(1)"),
            HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Comments_support_replies_and_notify_the_recipients()
    {
        var author = await MemberAsync("cs-academic-support");
        var replier = await MemberAsync("cs-academic-support");
        var postId = await PostAsync(author, "cs-academic-support");

        var commentId = await replier.CreateAsync(
            $"/api/posts/{postId}/comments", new CreateCommentRequest("First comment", null));
        var replyId = await author.CreateAsync(
            $"/api/posts/{postId}/comments", new CreateCommentRequest("A reply", commentId));

        var comments = await author.GetAsync<List<CommentDto>>($"/api/posts/{postId}/comments");
        Assert.Equal(commentId, comments.Single(c => c.Id == replyId).ParentCommentId);
        var notifications = await replier.GetAsync<NotificationFeedDto>("/api/notifications");
        Assert.Contains(notifications.Items, n => n.Type == NotificationType.ReplyToComment);

        await author.PutAsync(
            $"/api/comments/{commentId}", new UpdateCommentRequest("Hijacked"), HttpStatusCode.Forbidden);
        await replier.PutAsync($"/api/comments/{commentId}", new UpdateCommentRequest("Edited"));
        await replier.DeleteAsync($"/api/comments/{commentId}");

        var afterDelete = await author.GetAsync<List<CommentDto>>($"/api/posts/{postId}/comments");
        Assert.Null(afterDelete.Single(c => c.Id == commentId).Body);
    }

    [Fact]
    public async Task A_user_holds_one_changeable_vote_and_one_bookmark_per_post()
    {
        var author = await MemberAsync("data-science-community");
        var voter = await ApiSession.RegisterStudentAsync(app);
        var postId = await PostAsync(author, "data-science-community");

        Assert.Equal(1, (await VoteAsync(voter, postId, 1)).Score);
        Assert.Equal(1, (await VoteAsync(voter, postId, 1)).Score);
        Assert.Equal(-1, (await VoteAsync(voter, postId, -1)).Score);
        Assert.Equal(0, (await VoteAsync(voter, postId, 0)).Score);

        await voter.PutAsync($"/api/posts/{postId}/bookmark");
        await voter.PutAsync($"/api/posts/{postId}/bookmark");
        var saved = await voter.GetAsync<PagedResult<PostDto>>("/api/bookmarks");
        Assert.Single(saved.Items, p => p.Id == postId);

        await voter.DeleteAsync($"/api/posts/{postId}/bookmark");
        Assert.Empty((await voter.GetAsync<PagedResult<PostDto>>("/api/bookmarks")).Items);
    }

    [Fact]
    public async Task Only_authors_edit_and_other_students_cannot_delete()
    {
        var author = await MemberAsync("open-source-society");
        var other = await MemberAsync("open-source-society");
        var postId = await PostAsync(author, "open-source-society");
        var edit = new UpdatePostRequest("An edited title", "Edited body", null);

        await other.PutAsync($"/api/posts/{postId}", edit, HttpStatusCode.Forbidden);
        await other.DeleteAsync($"/api/posts/{postId}", HttpStatusCode.Forbidden);
        await author.PutAsync($"/api/posts/{postId}", edit);
        Assert.NotNull((await author.GetAsync<PostDto>($"/api/posts/{postId}")).EditedAtUtc);

        await author.DeleteAsync($"/api/posts/{postId}");
        Assert.Equal(HttpStatusCode.NotFound, (await author.RawGetAsync($"/api/posts/{postId}")).StatusCode);
    }

    [Fact]
    public async Task Attachments_are_validated_and_downloadable()
    {
        var author = await MemberAsync("artificial-intelligence-club");
        var postId = await PostAsync(author, "artificial-intelligence-club");
        var path = $"/api/posts/{postId}/attachments";
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3];

        await author.UploadAsync(path, "fake.png", "not an image"u8.ToArray(), HttpStatusCode.BadRequest);
        await author.UploadAsync(path, "tool.exe", png, HttpStatusCode.BadRequest);
        var response = await author.UploadAsync(path, "../../diagram.png", png, HttpStatusCode.Created);
        var attachment = (await response.Content.ReadFromJsonAsync<AttachmentDto>(ApiSession.Json))!;

        Assert.Equal("diagram.png", attachment.FileName);
        var download = await author.RawGetAsync($"/api/files/{attachment.Id}");
        Assert.Equal(png, await download.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task Data_persists_after_an_application_restart()
    {
        int postId;
        string email;
        await using (var first = new CampusConnectApp())
        {
            var author = await ApiSession.RegisterStudentAsync(first);
            var club = await ClubAsync(author, "cybersecurity-club");
            await author.PostAsync($"/api/clubs/{club.Id}/membership");
            postId = await author.CreateAsync(
                "/api/posts",
                new CreatePostRequest(club.Id, PostType.Text, "Survives a restart", "Stored in SQL Server", null));
            email = author.User.Email;
        }

        await using var second = new CampusConnectApp();
        var returning = await ApiSession.LoginAsync(second, email);

        Assert.Equal("Survives a restart", (await returning.GetAsync<PostDto>($"/api/posts/{postId}")).Title);
    }

    private static Task<ClubDto> ClubAsync(ApiSession session, string slug) =>
        session.GetAsync<ClubDto>($"/api/clubs/{slug}");

    private async Task<ApiSession> MemberAsync(string slug)
    {
        var student = await ApiSession.RegisterStudentAsync(app);
        var club = await ClubAsync(student, slug);
        await student.PostAsync($"/api/clubs/{club.Id}/membership");
        return student;
    }

    private static async Task<int> PostAsync(ApiSession author, string slug)
    {
        var club = await ClubAsync(author, slug);
        return await author.CreateAsync(
            "/api/posts",
            new CreatePostRequest(club.Id, PostType.Text, $"Topic {ApiSession.Unique()}", "Details", null));
    }

    private static async Task<VoteResultDto> VoteAsync(ApiSession session, int postId, int value)
    {
        var response = await session.PutAsync(
            $"/api/posts/{postId}/vote", new VoteRequest(value), HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<VoteResultDto>(ApiSession.Json))!;
    }
}
