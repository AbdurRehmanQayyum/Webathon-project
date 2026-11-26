using FluentValidation;

namespace CampusConnect.Application.Common.Validation;

public static class ValidationRules
{
    public static IRuleBuilderOptions<T, string?> WebUrl<T>(this IRuleBuilder<T, string?> rule) =>
        rule.MaximumLength(2048)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            .WithMessage("Enter a full web address starting with http:// or https://.");

    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .Matches("[A-Za-z]").WithMessage("Password must contain a letter.")
            .Matches("[0-9]").WithMessage("Password must contain a number.");
}
