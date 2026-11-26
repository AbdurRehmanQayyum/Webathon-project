using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Common.Validation;
using CampusConnect.Domain.Constants;
using FluentValidation;

namespace CampusConnect.Application.Features.Users;

public sealed record UpdateProfileRequest(
    string FullName, byte? Semester, string? Bio, IReadOnlyList<int>? InterestIds = null);

public sealed record CreateUserRequest(
    string FullName,
    string Email,
    string Role,
    string? RegistrationNumber,
    byte? Semester,
    string? Title,
    string TemporaryPassword);

public sealed record SetUserStatusRequest(bool IsActive);

public sealed record SetAdminRoleRequest(bool IsAdmin, string? Title);

public sealed record AdminUserQuery : PageQuery
{
    public string? Role { get; init; }
    public bool? IsActive { get; init; }
}

public sealed record UserHandleDto(int Id, string Username, string FullName, int? AvatarFileId);

public sealed record ProfileDto
{
    public required int Id { get; init; }
    public required string FullName { get; init; }
    public required string Username { get; init; }
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
    public required string Username { get; init; }
    public int? AvatarFileId { get; init; }
    public required string Email { get; init; }
    public string? RegistrationNumber { get; init; }
    public byte? Semester { get; init; }
    public string? Title { get; init; }
    public required bool IsActive { get; init; }
    public required bool MustChangePassword { get; init; }
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
        RuleFor(x => x.InterestIds).Must(ids => ids is null || ids.Count <= 8)
            .WithMessage("Choose up to 8 interests.");
    }
}

public sealed class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().Length(3, 100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Role).Must(role => role is RoleNames.Student or RoleNames.Admin)
            .WithMessage("Choose Student or Administrator.");
        RuleFor(x => x.RegistrationNumber)
            .NotEmpty().When(x => x.Role == RoleNames.Student)
            .WithMessage("Students need a registration number.");
        RuleFor(x => x.RegistrationNumber)
            .MaximumLength(30)
            .Matches(@"^[A-Za-z0-9\-/]*$").WithMessage("Use letters, numbers, hyphens or slashes only.");
        RuleFor(x => x.Semester).InclusiveBetween((byte)1, (byte)8).When(x => x.Semester.HasValue);
        RuleFor(x => x.Title).MaximumLength(60);
        RuleFor(x => x.TemporaryPassword).StrongPassword();
    }
}

public sealed class SetAdminRoleRequestValidator : AbstractValidator<SetAdminRoleRequest>
{
    public SetAdminRoleRequestValidator()
    {
        RuleFor(x => x.Title).MaximumLength(60);
    }
}
