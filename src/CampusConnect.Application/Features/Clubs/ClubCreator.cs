using System.Text.RegularExpressions;
using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Clubs;

// Shared by direct creation and request approval
public sealed partial class ClubCreator(IAppDbContext db, ICurrentUser currentUser)
{
    public async Task<Club> AddAsync(SaveClubRequest request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        await EnsureNameAvailableAsync(name, null, cancellationToken);
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        var club = new Club
        {
            Name = name,
            Slug = await CreateSlugAsync(name, cancellationToken),
            CategoryId = request.CategoryId,
            Description = request.Description.Trim(),
            Rules = string.IsNullOrWhiteSpace(request.Rules) ? null : request.Rules.Trim(),
            Status = (byte)ClubStatus.Active,
            CreatedByUserId = currentUser.Id
        };
        db.Clubs.Add(club);
        return club;
    }

    public async Task EnsureNameAvailableAsync(string name, int? excludedClubId, CancellationToken cancellationToken)
    {
        if (await db.Clubs.AnyAsync(c => c.Name == name && c.Id != excludedClubId, cancellationToken))
        {
            throw new ConflictException("A club with this name already exists.", "name");
        }
    }

    public async Task EnsureCategoryExistsAsync(int categoryId, CancellationToken cancellationToken)
    {
        if (!await db.ClubCategories.AnyAsync(c => c.Id == categoryId, cancellationToken))
        {
            throw new RequestValidationException("categoryId", "Choose a valid category.");
        }
    }

    public static string Slugify(string name)
    {
        var slug = NonAlphanumeric().Replace(name.ToLowerInvariant(), "-").Trim('-');
        return slug.Length == 0 ? "club" : slug;
    }

    private async Task<string> CreateSlugAsync(string name, CancellationToken cancellationToken)
    {
        var baseSlug = Slugify(name);
        var taken = await db.Clubs
            .Where(c => c.Slug.StartsWith(baseSlug))
            .Select(c => c.Slug)
            .ToListAsync(cancellationToken);

        var slug = baseSlug;
        for (var suffix = 2; taken.Contains(slug); suffix++)
        {
            slug = $"{baseSlug}-{suffix}";
        }

        return slug;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();
}
