using System.Net;
using System.Text.Json;

namespace Backend.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "❌ API Error - {Method} {Path} | Type: {ExceptionType} | Message: {Message}",
                context.Request.Method,
                context.Request.Path,
                ex.GetType().Name,
                ex.Message
            );

            // Log additional details for debugging
            _logger.LogDebug(
                "Exception Details: {StackTrace}",
                ex.StackTrace ?? "No stack trace available"
            );

            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var code = HttpStatusCode.InternalServerError;
        string errorCode;
        string errorMessage;

        switch (exception)
        {
            case KeyNotFoundException:
                code = HttpStatusCode.NotFound;
                errorCode = "NOT_FOUND";
                errorMessage = exception.Message;
                break;

            case UnauthorizedAccessException:
                code = HttpStatusCode.Unauthorized;
                errorCode = "UNAUTHORIZED";
                errorMessage = exception.Message;
                break;

            case ArgumentException:
            case InvalidOperationException:
                code = HttpStatusCode.BadRequest;
                errorCode = "BAD_REQUEST";
                errorMessage = exception.Message;
                break;

            default:
                errorCode = "INTERNAL_ERROR";
                errorMessage = exception.Message;
                break;
        }

        var response = new
        {
            success = false,
            error = new { code = errorCode, message = errorMessage }
        };

        var result = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;
        return context.Response.WriteAsync(result);
    }
}

public static class ErrorHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ErrorHandlingMiddleware>();
    }
}
