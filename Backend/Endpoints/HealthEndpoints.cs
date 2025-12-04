using Backend.Constants;

namespace Backend.Endpoints;

/// <summary>
/// Health check endpoints
/// </summary>
public static class HealthEndpoints
{
    /// <summary>
    /// Maps health check endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet(ApiRoutes.Health.Base, () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
            .WithName("HealthCheck")
            .WithOpenApi();

        return app;
    }
}
