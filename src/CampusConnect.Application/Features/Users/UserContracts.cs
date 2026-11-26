using CampusConnect.Application.Common.Models;
using FluentValidation;

namespace CampusConnect.Application.Features.Users;

public sealed record UpdateProfileRequest(string FullName, byte? Semester, string? Bio);

public sealed record SetUserStatusRequest(bool IsActive);

public sealed record SetAdminRoleRequest(bool IsAdmin, string? Title);

public sealed record AdminUserQuery : PageQuery
{
    public string? Role { get; init; }
    public bool? IsActive { get; init; }
}

public sealed record ProfileDto
{
    public required int Id { get; init; }
    public required string FullName { get; init; }
    public int? AvatarFileId { get; init; }
    public byte? Semester { get; init; }
    public string? Title { get; init; }
    public string? Bio { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required IReadOnlyList<string> Roles { get; init; }
    public required IReadOnlyList<ClubReferenceDto> Clubs { get; init; }
    public required int PostCount { get; init; }
    public required int CommentCount { get; init; }
}

public sealed record AdminUserDto
{
    public required int Id { get; init; }
    public required string FullName { get; init; }
    public int? AvatarFileId { get; init; }
    public required string Email { get; init; }
    public string? RegistrationNumber { get; init; }
    public byte? Semester { get; init; }
    public string? Title { get; init; }
    public required bool IsActive { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public DateTime? LastLoginAtUtc { get; init; }
    public required IReadOnlyList<string> Roles { get; init; }
}

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().Length(3, 100);
        RuleFor(x => x.Semester).InclusiveBetween((byte)1, (byte)8).When(x => x.Semester.HasValue);
        RuleFor(x => x.Bio).MaximumLength(500);
    }
}

public sealed class SetAdminRoleRequestValidator : AbstractValidator<SetAdminRoleRequest>
{
    public SetAdminRoleRequestValidator()
    {
        RuleFor(x => x.Title).MaximumLength(60);
    }
}
