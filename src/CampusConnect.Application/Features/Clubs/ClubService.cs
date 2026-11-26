using CampusConnect.Application.Common.Abstractions;
using CampusConnect.Application.Common.Exceptions;
using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Constants;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Application.Features.Clubs;

public interface IClubService
{
    Task<IReadOnlyList<ClubCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken);
    Task<PagedResult<ClubDto>> ListAsync(ClubQuery query, CancellationToken cancellationToken);
    Task<ClubDto> GetBySlugAsync(string slug, CancellationToken cancellationToken);
    Task JoinAsync(int clubId, CancellationToken cancellationToken);
    Task LeaveAsync(int clubId, CancellationToken cancellationToken);
}

public sealed class ClubService(IAppDbContext db, ICurrentUser currentUser) : IClubService
{
    public async Task<IReadOnlyList<ClubCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken) =>
        await db.ClubCategories.AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .Select(c => new ClubCategoryDto(c.Id, c.Name, c.IconKey))
            .ToListAsync(cancellationToken);

    public Task<PagedResult<ClubDto>> ListAsync(ClubQuery query, CancellationToken cancellationToken)
    {
        var clubs = db.Clubs.AsNoTracking().Where(c => c.Status == (byte)ClubStatus.Active);

        if (query.JoinedOnly)
        {
            clubs = clubs.Where(c => c.ClubMembers.Any(m => m.UserId == currentUser.Id));
        }

        return clubs.ApplyFilters(query)
            .ToDto(currentUser.Id, currentUser.IsAdmin)
            .ToPagedResultAsync(query, cancellationToken);
    }

    public async Task<ClubDto> GetBySlugAsync(string slug, CancellationToken cancellationToken) =>
        await db.Clubs.AsNoTracking()
            .Where(c => c.Slug == slug)
            .ToDto(currentUser.Id, currentUser.IsAdmin)
            .SingleOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException("Club");

    // Club membership
    public async Task JoinAsync(int clubId, CancellationToken cancellationToken)
    {
        currentUser.Require(PermissionKeys.JoinClubs);
        var status = await db.Clubs
            .Where(c => c.Id == clubId)
            .Select(c => (byte?)c.Status)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Club");

        if (status != (byte)ClubStatus.Active)
        {
            throw new ConflictException("Archived clubs cannot accept new members.");
        }

        if (await db.ClubMembers.AnyAsync(m => m.ClubId == clubId && m.UserId == currentUser.Id, cancellationToken))
        {
            return;
        }

        db.ClubMembers.Add(new ClubMember { ClubId = clubId, UserId = currentUser.Id });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task LeaveAsync(int clubId, CancellationToken cancellationToken)
    {
        if (await db.ClubModerators.AnyAsync(
            m => m.ClubId == clubId && m.UserId == currentUser.Id, cancellationToken))
        {
            throw new ConflictException(
                "You moderate this club. Ask an administrator to remove the assignment before leaving.");
        }

        await db.ClubMembers
            .Where(m => m.ClubId == clubId && m.UserId == currentUser.Id)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
