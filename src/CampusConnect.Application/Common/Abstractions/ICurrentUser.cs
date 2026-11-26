using CampusConnect.Application.Common.Exceptions;

namespace CampusConnect.Application.Common.Abstractions;

public interface ICurrentUser
{
    int Id { get; }
    bool IsAdmin { get; }
    bool Has(string permission);
}

public static class CurrentUserExtensions
{
    public static void Require(this ICurrentUser user, string permission)
    {
        if (!user.Has(permission))
        {
            throw new ForbiddenException("Your role does not allow this action.");
        }
    }
}
