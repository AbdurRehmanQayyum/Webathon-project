using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Features.Clubs;
using CampusConnect.Domain.Enums;
using FluentValidation;

namespace CampusConnect.Application.Features.ClubRequests;

public sealed record CreateClubRequestRequest(
    string ProposedName,
    int CategoryId,
    string Description,
    string Justification);

public sealed record RejectClubRequestRequest(string Reason);

public sealed record ClubRequestQuery : PageQuery
{
    public ClubRequestStatus? Status { get; init; }
}

public sealed record ClubRequestDto
{
    public required int Id { get; init; }
    public required string ProposedName { get; init; }
    public required string Description { get; init; }
    public required string Justification { get; init; }
    public required ClubRequestStatus Status { get; init; }
    public string? RejectionReason { get; init; }
    public required ClubCategoryDto Category { get; init; }
    public required UserSummaryDto RequestedBy { get; init; }
    public UserSummaryDto? ReviewedBy { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public DateTime? ReviewedAtUtc { get; init; }
    public string? CreatedClubSlug { get; init; }
}

public sealed class CreateClubRequestRequestValidator : AbstractValidator<CreateClubRequestRequest>
{
    public CreateClubRequestRequestValidator()
    {
        RuleFor(x => x.ProposedName).NotEmpty().Length(3, 80);
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Choose a category.");
        RuleFor(x => x.Description).NotEmpty().Length(20, 500);
        RuleFor(x => x.Justification).NotEmpty().Length(20, 1000);
    }
}

public sealed class RejectClubRequestRequestValidator : AbstractValidator<RejectClubRequestRequest>
{
    public RejectClubRequestRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().Length(5, 500);
    }
}
