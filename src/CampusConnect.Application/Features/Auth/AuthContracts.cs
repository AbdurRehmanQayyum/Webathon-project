using CampusConnect.Application.Common.Models;
using CampusConnect.Application.Common.Validation;
using FluentValidation;

namespace CampusConnect.Application.Features.Auth;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string RegistrationNumber,
    byte Semester,
    string Password,
    string? Bio,
    IReadOnlyList<int>? InterestIds = null);

public sealed record LoginRequest(string Email, string Password, bool RememberMe);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public sealed record SessionIdentity(
    int UserId,
    string FullName,
    string Email,
    Guid SecurityStamp,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions,
    bool MustChangePassword);

public sealed record CurrentUserDto
{
    public required int Id { get; init; }
    public required string FullName { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public string? RegistrationNumber { get; init; }
    public byte? Semester { get; init; }
    public string? Title { get; init; }
    public string? Bio { get; init; }
    public int? AvatarFileId { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required bool MustChangePassword { get; init; }
    public required IReadOnlyList<string> Roles { get; init; }
    public IReadOnlyList<string> Permissions { get; init; } = [];
    public required IReadOnlyList<int> InterestIds { get; init; }
    public required IReadOnlyList<ClubReferenceDto> ModeratedClubs { get; init; }
    public required int JoinedClubCount { get; init; }
}

public sealed class RegistrationOptions
{
    public const string SectionName = "Registration";

    public string[] AllowedEmailDomains { get; set; } = [];
}

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().Length(3, 100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.RegistrationNumber)
            .NotEmpty()
            .Length(3, 30)
            .Matches(@"^[A-Za-z0-9\-/]+$").WithMessage("Use letters, numbers, hyphens or slashes only.");
        RuleFor(x => x.Semester).InclusiveBetween((byte)1, (byte)8);
        RuleFor(x => x.Password).StrongPassword();
        RuleFor(x => x.Bio).MaximumLength(500);
        RuleFor(x => x.InterestIds).Must(ids => ids is null || ids.Count <= 8)
            .WithMessage("Choose up to 8 interests.");
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(128);
    }
}

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().MaximumLength(128);
        RuleFor(x => x.NewPassword)
            .StrongPassword()
            .NotEqual(x => x.CurrentPassword).WithMessage("Choose a password you are not already using.");
    }
}
