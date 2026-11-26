namespace CampusConnect.Application.Common.Exceptions;

public abstract class AppException(string message, string? field = null) : Exception(message)
{
    public string? Field { get; } = field;
}

public sealed class NotFoundException(string resource) : AppException($"{resource} was not found.");

public sealed class ForbiddenException(string message = "You do not have permission to perform this action.")
    : AppException(message);

public sealed class ConflictException(string message, string? field = null) : AppException(message, field);

public sealed class AuthenticationFailedException(string message) : AppException(message);

public sealed class RequestValidationException(string field, string message) : AppException(message, field);

public sealed class StorageUnavailableException(string message = "File storage is unavailable right now.")
    : AppException(message);
