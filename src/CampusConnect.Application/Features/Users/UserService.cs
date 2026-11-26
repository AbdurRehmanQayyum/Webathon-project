using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Users;

public interface IUserService
{
    Task<ProfileDto> GetProfileAsync(int userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<UserHandleDto>> SearchHandlesAsync(string? search, CancellationToken cancellationToken);
    Task UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken);
}

public sealed class UserService(IAppDbContext db, ICurrentUser currentUser) : IUserService
{
    private const int HandleResults = 8;

    public async Task<ProfileDto> GetProfileAsync(int userId, CancellationToken cancellationToken)
    {
        var includeInactive = currentUser.IsAdmin;

        return await db.Users.AsNoTracking()
            .Where(u => u.Id == userId && (u.IsActive || includeInactive))
            .Select(u => new ProfileDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Username = u.Username,
                AvatarFileId = u.AvatarFileId,
                Semester = u.Semester,
                Title = u.Title,
                Bio = u.Bio,
                CreatedAtUtc = u.CreatedAtUtc,
                Roles = u.Roles.Select(r => r.Name).ToList(),
                Clubs = u.ClubMembers
                    .Where(m => m.Club.Status == (byte)ClubStatus.Active)
                    .OrderBy(m => m.Club.Name)
                    .Select(m => new ClubReferenceDto(
                        m.ClubId, m.Club.Name, m.Club.Slug, m.Club.Category.IconKey, m.Club.LogoFileId))
                    .ToList(),
                PostCount = u.PostAuthors.Count(p => p.Status == (byte)ContentStatus.Published),
                CommentCount = u.CommentAuthors.Count(c => c.Status == (byte)ContentStatus.Published)
            })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("User");
    }

    // Mention suggestions
    public async Task<IReadOnlyList<UserHandleDto>> SearchHandlesAsync(
        string? search, CancellationToken cancellationToken)
    {
        var users = db.Users.AsNoTracking().Where(u => u.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            users = users.Where(u => u.Username.StartsWith(term) || u.FullName.Contains(term));
        }

        return await users
            .OrderBy(u => u.Username)
            .Take(HandleResults)
            .Select(u => new UserHandleDto(u.Id, u.Username, u.FullName, u.AvatarFileId))
            .ToListAsync(cancellationToken);
    }

    public async Task UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Users.Include(u => u.Categories)
            .SingleAsync(u => u.Id == currentUser.Id, cancellationToken);
        user.FullName = request.FullName.Trim();
        user.Semester = request.Semester;
        user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        if (request.InterestIds is not null)
        {
            await Accounts.SetInterestsAsync(db, user, request.InterestIds, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
