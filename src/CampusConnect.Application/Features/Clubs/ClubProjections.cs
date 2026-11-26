using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Entities;
using CampusConnect.Domain.Enums;

namespace CampusConnect.Application.Features.Clubs;

public static class ClubProjections
{
    public static IQueryable<ClubDto> ToDto(this IQueryable<Club> clubs, int userId, bool isAdmin) =>
        clubs.Select(c => new ClubDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            Description = c.Description,
            Rules = c.Rules,
            LogoFileId = c.LogoFileId,
            CoverFileId = c.CoverFileId,
            Status = (ClubStatus)c.Status,
            Category = new ClubCategoryDto(c.Category.Id, c.Category.Name, c.Category.IconKey),
            CreatedAtUtc = c.CreatedAtUtc,
            MemberCount = c.ClubMembers.Count,
            PostCount = c.Posts.Count(p => p.Status == (byte)ContentStatus.Published),
            IsMember = c.ClubMembers.Any(m => m.UserId == userId),
            IsModerator = c.ClubModerators.Any(m => m.UserId == userId),
            CanModerate = isAdmin || c.ClubModerators.Any(m => m.UserId == userId),
            Moderators = c.ClubModerators
                .OrderBy(m => m.User.FullName)
                .Select(m => new UserSummaryDto(m.UserId, m.User.FullName, m.User.Title, m.User.AvatarFileId))
                .ToList()
        });

    public static IQueryable<Club> ApplyFilters(this IQueryable<Club> clubs, ClubQuery query)
    {
        if (query.Search is { } search)
        {
            clubs = clubs.Where(c => c.Name.Contains(search) || c.Description.Contains(search));
        }

        if (query.CategoryId is { } categoryId)
        {
            clubs = clubs.Where(c => c.CategoryId == categoryId);
        }

        return query.Sort switch
        {
            ClubSort.Name => clubs.OrderBy(c => c.Name),
            ClubSort.Newest => clubs.OrderByDescending(c => c.CreatedAtUtc).ThenBy(c => c.Id),
            _ => clubs.OrderByDescending(c => c.ClubMembers.Count).ThenBy(c => c.Name)
        };
    }
}
