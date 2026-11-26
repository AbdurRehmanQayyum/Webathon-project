using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Common.Validation;
using CampusConnect.Domain.Enums;
using FluentValidation;

namespace CampusConnect.Application.Features.Posts;

public enum PostSort
{
    Recent,
    Popular
}

public sealed record PostQuery : PageQuery
{
    public bool JoinedOnly { get; init; }
    public int? ClubId { get; init; }
    public int? AuthorId { get; init; }
    public PostSort Sort { get; init; } = PostSort.Recent;
}

public sealed record CreatePostRequest(int ClubId, PostType Type, string Title, string? Body, string? LinkUrl);

public sealed record UpdatePostRequest(string Title, string? Body, string? LinkUrl);

public sealed record VoteRequest(int Value);

public sealed record VoteResultDto(int Score, int MyVote);

public sealed record PostDto
{
    public required int Id { get; init; }
    public required PostType Type { get; init; }
    public required string Title { get; init; }
    public string? Body { get; init; }
    public required bool IsBodyTruncated { get; init; }
    public string? LinkUrl { get; init; }
    public required ContentStatus Status { get; init; }
    public required bool IsPinned { get; init; }
    public string? ModerationReason { get; init; }
    public required ClubReferenceDto Club { get; init; }
    public required UserSummaryDto Author { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public DateTime? EditedAtUtc { get; init; }
    public required int Score { get; init; }
    public required int MyVote { get; init; }
    public required int CommentCount { get; init; }
    public required bool IsBookmarked { get; init; }
    public required IReadOnlyList<AttachmentDto> Attachments { get; init; }
    public required bool CanEdit { get; init; }
    public required bool CanDelete { get; init; }
    public required bool CanModerate { get; init; }
    public required bool CanComment { get; init; }
}

public sealed class CreatePostRequestValidator : AbstractValidator<CreatePostRequest>
{
    public CreatePostRequestValidator()
    {
        RuleFor(x => x.ClubId).GreaterThan(0).WithMessage("Choose a club.");
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.Title).NotEmpty().Length(5, 200);
        RuleFor(x => x.Body).MaximumLength(20000);
        RuleFor(x => x.Body).NotEmpty().When(x => x.Type == PostType.Text)
            .WithMessage("Write something in your post.");
        RuleFor(x => x.LinkUrl).NotEmpty().WebUrl().When(x => x.Type == PostType.Link);
    }
}

public sealed class UpdatePostRequestValidator : AbstractValidator<UpdatePostRequest>
{
    public UpdatePostRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().Length(5, 200);
        RuleFor(x => x.Body).MaximumLength(20000);
        RuleFor(x => x.LinkUrl).WebUrl().When(x => !string.IsNullOrEmpty(x.LinkUrl));
    }
}

public sealed class VoteRequestValidator : AbstractValidator<VoteRequest>
{
    public VoteRequestValidator()
    {
        RuleFor(x => x.Value).InclusiveBetween(-1, 1);
    }
}
