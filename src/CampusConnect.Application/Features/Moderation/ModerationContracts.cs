using CampusConnect.Application.Common.Models;
using CampusConnect.Domain.Enums;
using FluentValidation;

namespace CampusConnect.Application.Features.Moderation;

public sealed record ModerationQuery : PageQuery
{
    public ContentStatus? Status { get; init; }
}

public sealed record SetPinnedRequest(bool IsPinned);

public sealed record RemoveContentRequest(string? Reason);

public sealed record ModeratedClubDto
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public required string IconKey { get; init; }
    public int? LogoFileId { get; init; }
    public required int MemberCount { get; init; }
    public required int PublishedPostCount { get; init; }
    public required int RemovedPostCount { get; init; }
    public required int PinnedPostCount { get; init; }
}

public sealed record ModerationCommentDto
{
    public required int Id { get; init; }
    public required int PostId { get; init; }
    public required string PostTitle { get; init; }
    public required string Body { get; init; }
    public required ContentStatus Status { get; init; }
    public required UserSummaryDto Author { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
}

public sealed class RemoveContentRequestValidator : AbstractValidator<RemoveContentRequest>
{
    public RemoveContentRequestValidator()
    {
        RuleFor(x => x.Reason).MaximumLength(500);
    }
}
