using System.Security.Claims;
using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Constants;

namespace CampusConnect.Api.Auth;

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public int Id =>
        int.TryParse(accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new AuthenticationFailedException("Sign in to continue.");

    public bool IsAdmin => accessor.HttpContext?.User.IsInRole(RoleNames.Admin) ?? false;
}
