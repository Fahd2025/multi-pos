using System.Security.Claims;
using Backend.Models.DTOs.Branch.Tables;
using Backend.Services.Branch.Tables;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Table and zone management endpoints
/// </summary>
public static class TableEndpoints
{
    /// <summary>
    /// Maps table and zone endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapTableEndpoints(this IEndpointRouteBuilder app)
    {
        // ==============================================
        // ZONE MANAGEMENT ENDPOINTS
        // ==============================================

        var zonesGroup = app.MapGroup("/api/v1/zones")
            .RequireAuthorization()
            .WithTags("Zones")
            .WithOpenApi();

        // GET /api/v1/zones - Get all zones
        zonesGroup.MapGet("/", async (IZoneService zoneService) =>
        {
            var zones = await zoneService.GetAllZonesAsync();
            return Results.Ok(zones);
        })
        .WithName("GetAllZones")
        .Produces<IEnumerable<ZoneDto>>();

        // GET /api/v1/zones/{id} - Get zone by ID
        zonesGroup.MapGet("/{id:int}", async (int id, IZoneService zoneService) =>
        {
            var zone = await zoneService.GetZoneByIdAsync(id);
            return zone != null ? Results.Ok(zone) : Results.NotFound();
        })
        .WithName("GetZoneById")
        .Produces<ZoneDto>()
        .Produces(StatusCodes.Status404NotFound);

        // POST /api/v1/zones - Create new zone
        zonesGroup.MapPost("/", async (
            CreateZoneDto dto,
            IZoneService zoneService,
            HttpContext httpContext) =>
        {
            try
            {
                var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var zone = await zoneService.CreateZoneAsync(dto, userId);
                return Results.Created($"/api/v1/zones/{zone.Id}", zone);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("CreateZone")
        .RequireAuthorization(policy => policy.RequireRole("Manager", "Admin"))
        .Produces<ZoneDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest);

        // PUT /api/v1/zones/{id} - Update zone
        zonesGroup.MapPut("/{id:int}", async (
            int id,
            UpdateZoneDto dto,
            IZoneService zoneService,
            HttpContext httpContext) =>
        {
            try
            {
                var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var zone = await zoneService.UpdateZoneAsync(id, dto, userId);
                return Results.Ok(zone);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UpdateZone")
        .RequireAuthorization(policy => policy.RequireRole("Manager", "Admin"))
        .Produces<ZoneDto>()
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status400BadRequest);

        // DELETE /api/v1/zones/{id} - Delete zone
        zonesGroup.MapDelete("/{id:int}", async (int id, IZoneService zoneService) =>
        {
            try
            {
                var deleted = await zoneService.DeleteZoneAsync(id);
                return deleted ? Results.NoContent() : Results.NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("DeleteZone")
        .RequireAuthorization(policy => policy.RequireRole("Manager", "Admin"))
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status400BadRequest);

        // ==============================================
        // TABLE MANAGEMENT ENDPOINTS
        // ==============================================

        var tablesGroup = app.MapGroup("/api/v1/tables")
            .RequireAuthorization()
            .WithTags("Tables")
            .WithOpenApi();

        // GET /api/v1/tables - Get all tables (optionally filtered by zone)
        tablesGroup.MapGet("/", async (
            [FromQuery] int? zoneId,
            ITableService tableService) =>
        {
            var tables = await tableService.GetAllTablesAsync(zoneId);
            return Results.Ok(tables);
        })
        .WithName("GetAllTables")
        .Produces<IEnumerable<TableDto>>();

        // GET /api/v1/tables/status - Get tables with current order status
        tablesGroup.MapGet("/status", async (
            [FromQuery] int? zoneId,
            ITableService tableService) =>
        {
            var tables = await tableService.GetTablesWithStatusAsync(zoneId);
            return Results.Ok(tables);
        })
        .WithName("GetTablesWithStatus")
        .Produces<IEnumerable<TableWithStatusDto>>();

        // GET /api/v1/tables/{id} - Get table by ID
        tablesGroup.MapGet("/{id:int}", async (int id, ITableService tableService) =>
        {
            var table = await tableService.GetTableByIdAsync(id);
            return table != null ? Results.Ok(table) : Results.NotFound();
        })
        .WithName("GetTableById")
        .Produces<TableDto>()
        .Produces(StatusCodes.Status404NotFound);

        // GET /api/v1/tables/number/{number} - Get table by number
        tablesGroup.MapGet("/number/{number:int}", async (int number, ITableService tableService) =>
        {
            var table = await tableService.GetTableByNumberAsync(number);
            return table != null ? Results.Ok(table) : Results.NotFound();
        })
        .WithName("GetTableByNumber")
        .Produces<TableDto>()
        .Produces(StatusCodes.Status404NotFound);

        // POST /api/v1/tables - Create new table
        tablesGroup.MapPost("/", async (
            CreateTableDto dto,
            ITableService tableService,
            HttpContext httpContext) =>
        {
            try
            {
                var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var table = await tableService.CreateTableAsync(dto, userId);
                return Results.Created($"/api/v1/tables/{table.Id}", table);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("CreateTable")
        .RequireAuthorization(policy => policy.RequireRole("Manager", "Admin"))
        .Produces<TableDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest);

        // PUT /api/v1/tables/{id} - Update table
        tablesGroup.MapPut("/{id:int}", async (
            int id,
            UpdateTableDto dto,
            ITableService tableService,
            HttpContext httpContext) =>
        {
            try
            {
                var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var table = await tableService.UpdateTableAsync(id, dto, userId);
                return Results.Ok(table);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UpdateTable")
        .RequireAuthorization(policy => policy.RequireRole("Manager", "Admin"))
        .Produces<TableDto>()
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status400BadRequest);

        // DELETE /api/v1/tables/{id} - Delete table
        tablesGroup.MapDelete("/{id:int}", async (int id, ITableService tableService) =>
        {
            try
            {
                var deleted = await tableService.DeleteTableAsync(id);
                return deleted ? Results.NoContent() : Results.NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("DeleteTable")
        .RequireAuthorization(policy => policy.RequireRole("Manager", "Admin"))
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status400BadRequest);

        // POST /api/v1/tables/transfer - Transfer order between tables
        tablesGroup.MapPost("/transfer", async (
            TransferTableDto dto,
            ITableService tableService,
            HttpContext httpContext) =>
        {
            try
            {
                var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var success = await tableService.TransferOrderAsync(dto, userId);
                return success
                    ? Results.Ok(new { message = "Order transferred successfully" })
                    : Results.NotFound();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("TransferOrder")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status400BadRequest);

        // POST /api/v1/tables/{tableNumber}/clear - Clear/complete table
        tablesGroup.MapPost("/{tableNumber:int}/clear", async (
            int tableNumber,
            ITableService tableService,
            HttpContext httpContext) =>
        {
            try
            {
                var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var success = await tableService.ClearTableAsync(tableNumber, userId);
                return success
                    ? Results.Ok(new { message = "Table cleared successfully" })
                    : Results.NotFound(new { error = "Table not found or already clear" });
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
        })
        .WithName("ClearTable")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        // POST /api/v1/tables/assign/{saleId} - Assign table to existing sale
        tablesGroup.MapPost("/assign/{saleId:guid}", async (
            Guid saleId,
            AssignTableDto dto,
            ITableService tableService) =>
        {
            try
            {
                var tableId = await tableService.AssignTableToSaleAsync(saleId, dto);
                return Results.Ok(new { tableId, message = "Table assigned successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("AssignTable")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status400BadRequest);

        return app;
    }
}
