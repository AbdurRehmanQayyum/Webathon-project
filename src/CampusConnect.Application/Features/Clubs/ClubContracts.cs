using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Enums;
using FluentValidation;

namespace CampusConnect.Application.Features.Clubs;

public sealed record ClubQuery : PageQuery
{
    public int? CategoryId { get; init; }
    public bool JoinedOnly { get; init; }
    public ClubSort Sort { get; init; } = ClubSort.Popular;
    public ClubStatus? Status { get; init; }
}

public enum ClubSort
{
    Popular,
    Name,
    Newest
}

public sealed record SaveClubRequest(string Name, int CategoryId, string Description, string? Rules);

public sealed record SetClubStatusRequest(ClubStatus Status);

public sealed record ClubCategoryDto(int Id, string Name, string IconKey);

public sealed record ClubDto
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public required string Description { get; init; }
    public string? Rules { get; init; }
    public int? LogoFileId { get; init; }
    public int? CoverFileId { get; init; }
    public required ClubStatus Status { get; init; }
    public required ClubCategoryDto Category { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required int MemberCount { get; init; }
    public required int PostCount { get; init; }
    public required bool IsMember { get; init; }
    public required bool IsModerator { get; init; }
    public required bool CanModerate { get; init; }
    public required IReadOnlyList<UserSummaryDto> Moderators { get; init; }
}

public sealed record ClubMemberDto
{
    public required int Id { get; init; }
    public required string FullName { get; init; }
    public required string Username { get; init; }
    public int? AvatarFileId { get; init; }
    // Only for people who may manage user accounts
    public string? Email { get; init; }
    public string? RegistrationNumber { get; init; }
    public byte? Semester { get; init; }
    public required bool IsModerator { get; init; }
    public required bool IsActive { get; init; }
    public required DateTime JoinedAtUtc { get; init; }
}

public sealed class SaveClubRequestValidator : AbstractValidator<SaveClubRequest>
{
    public SaveClubRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(3, 80);
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Choose a category.");
        RuleFor(x => x.Description).NotEmpty().Length(20, 500);
        RuleFor(x => x.Rules).MaximumLength(2000);
    }
}

public sealed class SetClubStatusRequestValidator : AbstractValidator<SetClubStatusRequest>
{
    public SetClubStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}
