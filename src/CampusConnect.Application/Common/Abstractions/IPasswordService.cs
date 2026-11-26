namespace CampusConnect.Application.Common.Abstractions;

public enum PasswordCheck
{
    Failed,
    Success,
    SuccessRehashNeeded
}

public interface IPasswordService
{
    string Hash(string password);
    PasswordCheck Verify(string passwordHash, string password);
}
