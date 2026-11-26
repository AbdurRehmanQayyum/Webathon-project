using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace CampusConnect.Infrastructure.Security;

// ASP.NET Core Identity password hashing (PBKDF2)
public sealed class PasswordService : IPasswordService
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(null!, password);

    public PasswordCheck Verify(string passwordHash, string password) =>
        _hasher.VerifyHashedPassword(null!, passwordHash, password) switch
        {
            PasswordVerificationResult.Success => PasswordCheck.Success,
            PasswordVerificationResult.SuccessRehashNeeded => PasswordCheck.SuccessRehashNeeded,
            _ => PasswordCheck.Failed
        };
}
