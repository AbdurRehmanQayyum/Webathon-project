using CampusConnect.Application.Common.Content;
using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Common.Validation;
using CampusConnect.Domain.Enums;
using FluentValidation;

namespace CampusConnect.Application.Features.Posts;

public enum PostSort
{
    Recent,
    Popular,
    ForYou
}

public sealed record PostQuery : PageQuery
{
    public bool JoinedOnly { get; init; }
    public int? ClubId { get; init; }
    public int? AuthorId { get; init; }
    public string? Tag { get; init; }
    public PostSort Sort { get; init; } = PostSort.Recent;
}

public sealed record CreatePostRequest(
    int ClubId,
    PostType Type,
    string Title,
    string? Body,
    string? LinkUrl,
    IReadOnlyList<string>? Tags = null);

public sealed record UpdatePostRequest(
    string Title, string? Body, string? LinkUrl, IReadOnlyList<string>? Tags = null);

public sealed record VoteRequest(int Value);

public sealed record VoteResultDto(int Score, int MyVote);

public sealed record TagDto(string Name, int PostCount);

public sealed record PostDto
{
    public required int Id { get; init; }
    public required PostType Type { get; init; }
    public required string Title { get; init; }
    public string? Body { get; init; }
    public string? Excerpt { get; init; }
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
    public required IReadOnlyList<string> Tags { get; init; }
    public required IReadOnlyList<AttachmentDto> Attachments { get; init; }
    public required bool CanEdit { get; init; }
    public required bool CanDelete { get; init; }
    public required bool CanModerate { get; init; }
    public required bool CanPin { get; init; }
    public required bool CanComment { get; init; }
    public required bool CanReact { get; init; }
}

public static class PostRules
{
    public const int MaxTextLength = 20_000;
    public const int MaxMarkupLength = 60_000;
}

public sealed class CreatePostRequestValidator : AbstractValidator<CreatePostRequest>
{
    public CreatePostRequestValidator()
    {
        RuleFor(x => x.ClubId).GreaterThan(0).WithMessage("Choose a club.");
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.Title).NotEmpty().Length(5, 200);
        RuleFor(x => x.Body).MaximumLength(PostRules.MaxMarkupLength);
        RuleFor(x => x.LinkUrl).NotEmpty().WebUrl().When(x => x.Type == PostType.Link);
        RuleFor(x => x.Tags).Must(tags => tags is null || tags.Count <= ContentProcessor.MaxTags)
            .WithMessage($"Add up to {ContentProcessor.MaxTags} tags.");
    }
}

public sealed class UpdatePostRequestValidator : AbstractValidator<UpdatePostRequest>
{
    public UpdatePostRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().Length(5, 200);
        RuleFor(x => x.Body).MaximumLength(PostRules.MaxMarkupLength);
        RuleFor(x => x.LinkUrl).WebUrl().When(x => !string.IsNullOrEmpty(x.LinkUrl));
        RuleFor(x => x.Tags).Must(tags => tags is null || tags.Count <= ContentProcessor.MaxTags)
            .WithMessage($"Add up to {ContentProcessor.MaxTags} tags.");
    }
}

public sealed class VoteRequestValidator : AbstractValidator<VoteRequest>
{
    public VoteRequestValidator()
    {
        RuleFor(x => x.Value).InclusiveBetween(-1, 1);
    }
}
