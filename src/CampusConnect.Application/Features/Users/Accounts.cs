using System.Text.RegularExpressions;
using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Users;

// Account details shared by self registration and administrator provisioning
public static partial class Accounts
{
    private const int MaxHandleLength = 30;

    public static async Task<string> NewUsernameAsync(
        IAppDbContext db, string email, CancellationToken cancellationToken)
    {
        var handle = Unsafe().Replace(email.Split('@')[0].ToLowerInvariant(), string.Empty).Trim('.');
        if (handle.Length < 3)
        {
            handle = $"member{handle}";
        }

        handle = handle.Length > MaxHandleLength ? handle[..MaxHandleLength] : handle;
        var taken = await db.Users
            .Where(u => u.Username.StartsWith(handle))
            .Select(u => u.Username)
            .ToListAsync(cancellationToken);

        var candidate = handle;
        for (var suffix = 2; taken.Contains(candidate, StringComparer.OrdinalIgnoreCase); suffix++)
        {
            candidate = $"{handle}{suffix}";
        }

        return candidate;
    }

    public static async Task EnsureUniqueAsync(
        IAppDbContext db, string email, string? registrationNumber, CancellationToken cancellationToken)
    {
        if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            throw new ConflictException("An account with this email already exists.", "email");
        }

        if (registrationNumber is not null
            && await db.Users.AnyAsync(u => u.RegistrationNumber == registrationNumber, cancellationToken))
        {
            throw new ConflictException("This registration number is already in use.", "registrationNumber");
        }
    }

    public static async Task SetInterestsAsync(
        IAppDbContext db, User user, IReadOnlyList<int> categoryIds, CancellationToken cancellationToken)
    {
        var categories = await db.ClubCategories
            .Where(c => categoryIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        user.Categories.Clear();
        foreach (var category in categories)
        {
            user.Categories.Add(category);
        }
    }

    [GeneratedRegex("[^a-z0-9._]")]
    private static partial Regex Unsafe();
}
