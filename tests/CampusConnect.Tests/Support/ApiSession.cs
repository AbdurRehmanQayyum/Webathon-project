using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CampusConnect.Application.Features.Auth;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CampusConnect.Tests.Support;

// A browser-like client: keeps cookies and sends the CSRF header
public sealed class ApiSession
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient _client;
    private string? _csrfToken;

    private ApiSession(HttpClient client) => _client = client;

    public CurrentUserDto User { get; private set; } = null!;

    public static ApiSession Anonymous(CampusConnectApp app) =>
        new(app.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false }));

    public static async Task<ApiSession> LoginAsync(
        CampusConnectApp app, string account, string password = CampusConnectApp.DemoPassword)
    {
        var session = Anonymous(app);
        var email = account.Contains('@') ? account : $"{account}@campusconnect.test";
        var response = await session.PostAsync(
            "/api/auth/login", new LoginRequest(email, password, false), HttpStatusCode.OK);
        await session.AdoptUserAsync(response);
        return session;
    }

    public static async Task<ApiSession> RegisterStudentAsync(CampusConnectApp app)
    {
        var session = Anonymous(app);
        var id = Unique();
        var request = new RegisterRequest(
            $"Test Student {id}", $"student.{id}@example.test", $"T-{id}", 3, CampusConnectApp.DemoPassword, null);
        var response = await session.PostAsync("/api/auth/register", request, HttpStatusCode.Created);
        await session.AdoptUserAsync(response);
        return session;
    }

    public static string Unique() => Guid.NewGuid().ToString("N")[..10];

    public async Task<T> GetAsync<T>(string path)
    {
        var response = await _client.GetAsync(path);
        await ExpectAsync(response, HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<T>(Json))!;
    }

    public Task<HttpResponseMessage> RawGetAsync(string path) => _client.GetAsync(path);

    public Task<HttpResponseMessage> RangeAsync(string path, long from, long to)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Range = new RangeHeaderValue(from, to);
        return _client.SendAsync(request);
    }

    public Task<HttpResponseMessage> PostAsync(
        string path, object? body = null, HttpStatusCode expected = HttpStatusCode.NoContent) =>
        SendAsync(HttpMethod.Post, path, body, expected);

    public Task<HttpResponseMessage> PutAsync(
        string path, object? body = null, HttpStatusCode expected = HttpStatusCode.NoContent) =>
        SendAsync(HttpMethod.Put, path, body, expected);

    public Task<HttpResponseMessage> DeleteAsync(
        string path, HttpStatusCode expected = HttpStatusCode.NoContent) =>
        SendAsync(HttpMethod.Delete, path, null, expected);

    public async Task<int> CreateAsync(string path, object body)
    {
        var response = await SendAsync(HttpMethod.Post, path, body, HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>(Json);
        return created.GetProperty("id").GetInt32();
    }

    public async Task<HttpResponseMessage> UploadAsync(
        string path,
        string fileName,
        byte[] content,
        HttpStatusCode expected,
        string contentType = "application/octet-stream")
    {
        var file = new ByteArrayContent(content);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        using var form = new MultipartFormDataContent { { file, "file", fileName } };
        return await SendContentAsync(HttpMethod.Post, path, form, expected);
    }

    private Task<HttpResponseMessage> SendAsync(
        HttpMethod method, string path, object? body, HttpStatusCode expected) =>
        SendContentAsync(
            method, path, body is null ? null : JsonContent.Create(body, body.GetType(), options: Json), expected);

    private async Task<HttpResponseMessage> SendContentAsync(
        HttpMethod method, string path, HttpContent? content, HttpStatusCode expected)
    {
        _csrfToken ??= (await _client.GetFromJsonAsync<JsonElement>("/api/auth/csrf"))
            .GetProperty("token").GetString();

        using var request = new HttpRequestMessage(method, path) { Content = content };
        request.Headers.Add("X-CSRF-TOKEN", _csrfToken);
        var response = await _client.SendAsync(request);
        await ExpectAsync(response, expected);
        return response;
    }

    private async Task AdoptUserAsync(HttpResponseMessage response)
    {
        User = (await response.Content.ReadFromJsonAsync<CurrentUserDto>(Json))!;
        // Tokens are bound to the signed-in identity
        _csrfToken = null;
    }

    private static async Task ExpectAsync(HttpResponseMessage response, HttpStatusCode expected)
    {
        if (response.StatusCode != expected)
        {
            var body = await response.Content.ReadAsStringAsync();
            Assert.Fail(
                $"{response.RequestMessage?.Method} {response.RequestMessage?.RequestUri?.PathAndQuery} "
                + $"returned {(int)response.StatusCode}, expected {(int)expected}. {body}");
        }
    }
}
