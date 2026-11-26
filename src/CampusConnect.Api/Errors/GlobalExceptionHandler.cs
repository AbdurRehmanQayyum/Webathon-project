using CampusConnect.Application.Common.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace CampusConnect.Api.Errors;

public sealed class GlobalExceptionHandler(
    IProblemDetailsService problems,
    IHostEnvironment environment,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, exception.Message),
            ForbiddenException => (StatusCodes.Status403Forbidden, exception.Message),
            ConflictException => (StatusCodes.Status409Conflict, exception.Message),
            AuthenticationFailedException => (StatusCodes.Status401Unauthorized, exception.Message),
            RequestValidationException => (StatusCodes.Status400BadRequest, exception.Message),
            StorageUnavailableException => (StatusCodes.Status503ServiceUnavailable, exception.Message),
            // Unique constraint violations from concurrent requests
            DbUpdateException { InnerException: SqlException { Number: 2601 or 2627 } } =>
                (StatusCodes.Status409Conflict, "That record already exists."),
            BadHttpRequestException { StatusCode: StatusCodes.Status413PayloadTooLarge } =>
                (StatusCodes.Status413PayloadTooLarge, "That upload is larger than the server accepts."),
            BadHttpRequestException badRequest => (badRequest.StatusCode, "The request could not be processed."),
            _ => (StatusCodes.Status500InternalServerError, "Something went wrong on our side.")
        };

        if (status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled error on {Path}", httpContext.Request.Path);
        }

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = environment.IsDevelopment() && status == StatusCodes.Status500InternalServerError
                ? exception.ToString()
                : null
        };

        if (exception is AppException { Field: { } field })
        {
            problem.Extensions["errors"] = new Dictionary<string, string[]> { [field] = [exception.Message] };
        }

        httpContext.Response.StatusCode = status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem
        });
    }
}
