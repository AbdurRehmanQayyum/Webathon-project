namespace CampusConnect.Application.Common.Abstractions;

public interface ICurrentUser
{
    int Id { get; }
    bool IsAdmin { get; }
}
