using System.Net;
using System.Net.Http.Json;
using System.Text;
using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Announcements;
using CampusConnect.Application.Features.Auth;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Application.Features.Events;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using CampusConnect.Infrastructure.Persistence;
using CampusConnect.Infrastructure.Storage;
using CampusConnect.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CampusConnect.Tests;

[Collection(ApiCollection.Name)]
public sealed class StorageTests(CampusConnectApp app)
{
    private const string AvatarPath = "/api/users/me/avatar";
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3];

    private static (string, string)[] S3Settings =>
    [
        ("Storage:Provider", "S3"),
        ("Storage:Endpoint", "https://account.r2.cloudflarestorage.com"),
        ("Storage:BucketName", "test-bucket"),
        ("Storage:AccessKeyId", "test-key"),
        ("Storage:SecretAccessKey", "test-secret")
    ];

    [Fact]
    public async Task Avatar_upload_replacement_and_deletion_keep_metadata_and_objects_in_step()
    {
        var student = await ApiSession.RegisterStudentAsync(app);

        var first = await UploadImageAsync(student, AvatarPath);
        var stored = await MetadataAsync(first.Id);
        Assert.Equal((byte)FilePurpose.Avatar, stored.Purpose);
        Assert.StartsWith($"users/{student.User.Id}/avatars/", stored.ObjectKey);
        Assert.Equal(
            ("Local", ".png", (long)Png.Length),
            (stored.StorageProvider, stored.FileExtension, stored.FileSize));
        Assert.True(await ExistsAsync(stored.ObjectKey));
        var download = await student.RawGetAsync($"/api/files/{first.Id}");
        Assert.Equal(Png, await download.Content.ReadAsByteArrayAsync());

        var second = await UploadImageAsync(student, AvatarPath);
        Assert.True((await MetadataAsync(first.Id)).IsDeleted);
        Assert.False(await ExistsAsync(stored.ObjectKey));
        Assert.Equal(second.Id, (await student.GetAsync<CurrentUserDto>("/api/auth/me")).AvatarFileId);

        await student.DeleteAsync($"/api/files/{second.Id}");
        Assert.Null((await student.GetAsync<CurrentUserDto>("/api/auth/me")).AvatarFileId);
        Assert.False(await ExistsAsync((await MetadataAsync(second.Id)).ObjectKey));
        Assert.Equal(HttpStatusCode.NotFound, (await student.RawGetAsync($"/api/files/{second.Id}")).StatusCode);
    }

    [Fact]
    public async Task Other_users_cannot_delete_files_and_anonymous_users_cannot_read_them()
    {
        var owner = await ApiSession.RegisterStudentAsync(app);
        var intruder = await ApiSession.RegisterStudentAsync(app);
        var avatar = await UploadImageAsync(owner, AvatarPath);

        await intruder.DeleteAsync($"/api/files/{avatar.Id}", HttpStatusCode.Forbidden);
        var anonymous = await ApiSession.Anonymous(app).RawGetAsync($"/api/files/{avatar.Id}");

        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        Assert.False((await MetadataAsync(avatar.Id)).IsDeleted);
    }

    [Theory]
    [InlineData("vector.svg", "<svg xmlns='http://www.w3.org/2000/svg'/>", "image/svg+xml")]
    [InlineData("setup.exe", "MZ executable", "application/octet-stream")]
    [InlineData("photo.png", "MZ disguised executable", "image/png")]
    [InlineData("notes.txt", "plain words", "text/html")]
    [InlineData("report.docx", "PK not really a document", "application/octet-stream")]
    public async Task Unsafe_or_mismatched_files_are_rejected(string name, string content, string contentType)
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var id = await DraftAsync(admin);

        await admin.UploadAsync(
            $"/api/announcements/{id}/attachments",
            name,
            Encoding.UTF8.GetBytes(content),
            HttpStatusCode.BadRequest,
            contentType);
    }

    [Fact]
    public async Task Size_limit_and_user_quota_are_enforced()
    {
        var student = await ApiSession.RegisterStudentAsync(app);
        var oversized = new byte[5 * 1024 * 1024 + 1];
        Png.CopyTo(oversized, 0);
        await student.UploadAsync(AvatarPath, "big.png", oversized, HttpStatusCode.BadRequest);

        await using var limited = CampusConnectApp.With(("Storage:UserQuota", "15"));
        var constrained = await ApiSession.RegisterStudentAsync(limited);
        await constrained.UploadAsync(AvatarPath, "a.png", Png, HttpStatusCode.Created);
        await constrained.UploadAsync(AvatarPath, "b.png", Png, HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Club_images_require_assignment_and_event_files_require_an_administrator()
    {
        var moderator = await ApiSession.LoginAsync(app, "moderator");
        var admin = await ApiSession.LoginAsync(app, "admin");
        var assigned = await moderator.GetAsync<ClubDto>("/api/clubs/artificial-intelligence-club");
        var foreign = await moderator.GetAsync<ClubDto>("/api/clubs/web-development-society");

        await moderator.UploadAsync($"/api/clubs/{foreign.Id}/logo", "logo.png", Png, HttpStatusCode.Forbidden);
        var logo = await UploadImageAsync(moderator, $"/api/clubs/{assigned.Id}/logo");
        var cover = await UploadImageAsync(moderator, $"/api/clubs/{assigned.Id}/cover");
        var refreshed = await moderator.GetAsync<ClubDto>("/api/clubs/artificial-intelligence-club");
        Assert.Equal((logo.Id, cover.Id), (refreshed.LogoFileId, refreshed.CoverFileId));
        await moderator.DeleteAsync($"/api/files/{logo.Id}");
        await moderator.DeleteAsync($"/api/files/{cover.Id}");

        var events = await admin.GetAsync<PagedResult<EventDto>>("/api/events?scope=Upcoming");
        var eventId = events.Items[0].Id;
        var path = $"/api/events/{eventId}/attachments";
        await moderator.UploadAsync(path, "plan.txt", "agenda"u8.ToArray(), HttpStatusCode.Forbidden);
        var response = await admin.UploadAsync(path, "plan.txt", "agenda"u8.ToArray(), HttpStatusCode.Created);
        var file = (await response.Content.ReadFromJsonAsync<AttachmentDto>(ApiSession.Json))!;
        Assert.StartsWith($"events/{eventId}/attachments/", (await MetadataAsync(file.Id)).ObjectKey);
        await admin.DeleteAsync($"/api/files/{file.Id}");
    }

    [Fact]
    public async Task S3_provider_redirects_authorized_users_to_a_short_lived_link()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var id = await DraftAsync(admin);
        var response = await admin.UploadAsync(
            $"/api/announcements/{id}/attachments", "n.txt", "text"u8.ToArray(), HttpStatusCode.Created);
        var file = (await response.Content.ReadFromJsonAsync<AttachmentDto>(ApiSession.Json))!;

        await using var cloud = CampusConnectApp.With(S3Settings);
        var cloudAdmin = await ApiSession.LoginAsync(cloud, "admin");
        var cloudStudent = await ApiSession.LoginAsync(cloud, "student");
        Assert.IsType<S3StorageService>(cloud.Services.GetRequiredService<IFileStorageService>());

        var denied = await cloudStudent.RawGetAsync($"/api/files/{file.Id}");
        var redirect = await cloudAdmin.RawGetAsync($"/api/files/{file.Id}");

        Assert.Equal(HttpStatusCode.NotFound, denied.StatusCode);
        Assert.Equal(HttpStatusCode.Redirect, redirect.StatusCode);
        var url = redirect.Headers.Location!;
        Assert.Equal("account.r2.cloudflarestorage.com", url.Host);
        Assert.StartsWith("/test-bucket/announcements/", url.AbsolutePath);
        Assert.Contains("X-Amz-Algorithm=AWS4-HMAC-SHA256", url.Query);
        Assert.Contains("X-Amz-Expires=", url.Query);
        Assert.DoesNotContain("test-secret", url.ToString());
        await admin.DeleteAsync($"/api/announcements/{id}");
    }

    [Fact]
    public async Task Incomplete_S3_settings_fail_safely()
    {
        using var storage = new S3StorageService(Options.Create(new ObjectStorageOptions { Provider = "S3" }));

        await Assert.ThrowsAsync<StorageUnavailableException>(
            () => storage.ExistsAsync("users/1/avatars/x", CancellationToken.None));
    }

    private static async Task<AttachmentDto> UploadImageAsync(ApiSession session, string path)
    {
        var response = await session.UploadAsync(path, "image.png", Png, HttpStatusCode.Created, "image/png");
        return (await response.Content.ReadFromJsonAsync<AttachmentDto>(ApiSession.Json))!;
    }

    private static Task<int> DraftAsync(ApiSession admin) =>
        admin.CreateAsync(
            "/api/announcements",
            new SaveAnnouncementRequest(
                $"Draft {ApiSession.Unique()}", "Draft announcement body.", null, null,
                AnnouncementPriority.Normal, false));

    private async Task<Attachment> MetadataAsync(int fileId)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<CampusConnectDbContext>();
        return await db.Attachments.AsNoTracking().SingleAsync(a => a.Id == fileId);
    }

    private Task<bool> ExistsAsync(string objectKey) =>
        app.Services.GetRequiredService<IFileStorageService>().ExistsAsync(objectKey, CancellationToken.None);
}
