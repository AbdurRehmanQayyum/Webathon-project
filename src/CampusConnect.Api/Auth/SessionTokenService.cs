using System.Security.Claims;
using System.Text;
using CampusConnect.Application.Features.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace CampusConnect.Api.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string? Key { get; set; }
    public string Issuer { get; set; } = "CampusConnect";
    public string Audience { get; set; } = "CampusConnect";
    public int SessionHours { get; set; } = 8;
    public int RememberDays { get; set; } = 14;
}

// Signed JWT kept in an HttpOnly cookie, so scripts can never read it
public sealed class SessionTokenService(
    IOptions<JwtOptions> options,
    TimeProvider clock,
    IHostEnvironment environment)
{
    public const string CookieName = "campusconnect.session";
    public const string StampClaim = "stamp";
    public const string RememberClaim = "remember";
    private const int MinimumKeyBytes = 32;

    private readonly JwtOptions _settings = options.Value;

    public TokenValidationParameters ValidationParameters => new()
    {
        ValidIssuer = _settings.Issuer,
        ValidAudience = _settings.Audience,
        IssuerSigningKey = SigningKey(),
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
        ClockSkew = TimeSpan.FromMinutes(1)
    };

    public TimeSpan Lifetime(bool remember) =>
        remember ? TimeSpan.FromDays(_settings.RememberDays) : TimeSpan.FromHours(_settings.SessionHours);

    public void Issue(HttpContext context, SessionIdentity identity, bool remember)
    {
        var now = clock.GetUtcNow();
        var expires = now.Add(Lifetime(remember));
        var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = _settings.Issuer,
            Audience = _settings.Audience,
            IssuedAt = now.UtcDateTime,
            NotBefore = now.UtcDateTime,
            Expires = expires.UtcDateTime,
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, identity.UserId.ToString()),
                new Claim(StampClaim, identity.SecurityStamp.ToString()),
                new Claim(RememberClaim, remember ? "1" : "0")
            ]),
            SigningCredentials = new SigningCredentials(SigningKey(), SecurityAlgorithms.HmacSha256)
        });

        var cookie = CookieOptions(context);
        cookie.Expires = remember ? expires : null;
        context.Response.Cookies.Append(CookieName, token, cookie);
    }

    public void Clear(HttpContext context) => context.Response.Cookies.Delete(CookieName, CookieOptions(context));

    // Production cookies require HTTPS
    private CookieOptions CookieOptions(HttpContext context) => new()
    {
        HttpOnly = true,
        Secure = !environment.IsDevelopment() || context.Request.IsHttps,
        SameSite = SameSiteMode.Strict,
        IsEssential = true,
        Path = "/"
    };

    private SymmetricSecurityKey SigningKey()
    {
        var key = Encoding.UTF8.GetBytes(_settings.Key ?? string.Empty);
        return key.Length >= MinimumKeyBytes
            ? new SymmetricSecurityKey(key)
            : throw new InvalidOperationException("Jwt:Key must hold at least 32 bytes. See docs/SETUP.md.");
    }
}
