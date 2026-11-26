using System.Net;
using CampusConnect.Application.Features.Auth;
using CampusConnect.Application.Features.Users;
using CampusConnect.Tests.Support;

namespace CampusConnect.Tests;

[Collection(ApiCollection.Name)]
public sealed class AuthenticationTests(CampusConnectApp app)
{
    [Fact]
    public async Task Registration_creates_a_student_without_elevated_access()
    {
        var student = await ApiSession.RegisterStudentAsync(app);

        Assert.Equal(["Student"], student.User.Roles);
        var me = await student.GetAsync<CurrentUserDto>("/api/auth/me");
        Assert.Equal(student.User.Id, me.Id);
        foreach (var path in new[] { "/api/admin/overview", "/api/admin/clubs", "/api/admin/permissions" })
        {
            var response = await student.RawGetAsync(path);
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }

    [Fact]
    public async Task Registration_rejects_weak_passwords_and_duplicate_emails()
    {
        var anonymous = ApiSession.Anonymous(app);
        var weak = new RegisterRequest("Weak Password", "weak@example.test", "W-1", 1, "short", null);
        var duplicate = new RegisterRequest(
            "Duplicate", "student@campusconnect.test", $"D-{ApiSession.Unique()}", 1,
            CampusConnectApp.DemoPassword, null);

        await anonymous.PostAsync("/api/auth/register", weak, HttpStatusCode.BadRequest);
        await anonymous.PostAsync("/api/auth/register", duplicate, HttpStatusCode.Conflict);
    }

    [Theory]
    [InlineData("/api/auth/me")]
    [InlineData("/api/posts")]
    [InlineData("/api/clubs")]
    [InlineData("/api/admin/users")]
    public async Task Anonymous_requests_are_unauthorized(string path)
    {
        var response = await ApiSession.Anonymous(app).RawGetAsync(path);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task State_changing_requests_require_a_csrf_token()
    {
        var response = await app.CreateClient().PostAsync("/api/auth/logout", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Wrong_password_is_rejected_and_logout_ends_the_session()
    {
        await ApiSession.Anonymous(app).PostAsync(
            "/api/auth/login",
            new LoginRequest("student@campusconnect.test", "not-the-password-1", false),
            HttpStatusCode.Unauthorized);

        var student = await ApiSession.RegisterStudentAsync(app);
        await student.PostAsync("/api/auth/logout");

        Assert.Equal(HttpStatusCode.Unauthorized, (await student.RawGetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task Password_change_signs_out_other_sessions()
    {
        const string newPassword = "Changed-Password-77";
        var first = await ApiSession.RegisterStudentAsync(app);
        var second = await ApiSession.LoginAsync(app, first.User.Email);

        await first.PostAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest(CampusConnectApp.DemoPassword, newPassword));

        Assert.Equal(HttpStatusCode.OK, (await first.RawGetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await second.RawGetAsync("/api/auth/me")).StatusCode);
        await ApiSession.LoginAsync(app, first.User.Email, newPassword);
    }

    [Fact]
    public async Task Deactivated_accounts_lose_access_immediately()
    {
        var admin = await ApiSession.LoginAsync(app, "admin");
        var student = await ApiSession.RegisterStudentAsync(app);

        await admin.PutAsync($"/api/admin/users/{student.User.Id}/status", new SetUserStatusRequest(false));

        Assert.Equal(HttpStatusCode.Unauthorized, (await student.RawGetAsync("/api/auth/me")).StatusCode);
        await admin.PutAsync(
            $"/api/admin/users/{admin.User.Id}/status", new SetUserStatusRequest(false), HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Sensitive_endpoints_are_rate_limited()
    {
        await using var limited = CampusConnectApp.With(("RateLimiting:SensitivePermitsPerMinute", "2"));
        var anonymous = ApiSession.Anonymous(limited);
        var attempt = new LoginRequest("nobody@example.test", "Password-123", false);

        await anonymous.PostAsync("/api/auth/login", attempt, HttpStatusCode.Unauthorized);
        await anonymous.PostAsync("/api/auth/login", attempt, HttpStatusCode.Unauthorized);
        await anonymous.PostAsync("/api/auth/login", attempt, HttpStatusCode.TooManyRequests);
    }
}
