using Backend.Data.Branch;
using Backend.Models.DTOs.Printing;
using Backend.Models.Entities.Branch;
using Backend.Services.Shared.Printing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class PrintingEndpoints
{
    public static void MapPrintingEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/printing")
            .WithTags("Printing")
            .RequireAuthorization();

        // Print receipt for a sale
        group.MapPost("/receipt", PrintReceipt)
            .WithName("PrintReceipt")
            .WithOpenApi();

        // Print credit note for a return
        group.MapPost("/credit-note", PrintCreditNote)
            .WithName("PrintCreditNote")
            .WithOpenApi();

        // Test print
        group.MapPost("/test", TestPrint)
            .WithName("TestPrint")
            .WithOpenApi();

        // Get printer configuration for branch
        group.MapGet("/config", GetPrinterConfig)
            .WithName("GetPrinterConfig")
            .WithOpenApi();

        // Update printer configuration
        group.MapPut("/config", UpdatePrinterConfig)
            .WithName("UpdatePrinterConfig")
            .Produces<PrinterConfigurationDto>()
            .WithOpenApi();

        // Create printer configuration
        group.MapPost("/config", CreatePrinterConfig)
            .WithName("CreatePrinterConfig")
            .Produces<PrinterConfigurationDto>()
            .WithOpenApi();
    }

    private static async Task<IResult> PrintReceipt(
        [FromBody] PrintReceiptDto request,
        IPrintService printService,
        HttpContext httpContext)
    {
        try
        {
            var branchId = Guid.Parse(httpContext.User.FindFirst("branch_id")?.Value
                ?? throw new InvalidOperationException("Branch ID not found in token"));

            var result = await printService.PrintReceiptAsync(
                request.SaleId,
                branchId,
                request.Copies
            );

            if (!result.Success)
            {
                return Results.BadRequest(new { error = result.Message, details = result.ErrorDetails });
            }

            // If USB printer, return print data
            if (result.PrintData != null)
            {
                return Results.Ok(new
                {
                    success = true,
                    message = result.Message,
                    printData = Convert.ToBase64String(result.PrintData),
                    dataLength = result.PrintData.Length
                });
            }

            return Results.Ok(new { success = true, message = result.Message });
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { error = "Failed to print receipt", details = ex.Message });
        }
    }

    private static async Task<IResult> PrintCreditNote(
        [FromBody] Guid returnId,
        IPrintService printService,
        HttpContext httpContext)
    {
        try
        {
            var branchId = Guid.Parse(httpContext.User.FindFirst("branch_id")?.Value
                ?? throw new InvalidOperationException("Branch ID not found in token"));

            var result = await printService.PrintCreditNoteAsync(returnId, branchId);

            if (!result.Success)
            {
                return Results.BadRequest(new { error = result.Message, details = result.ErrorDetails });
            }

            // If USB printer, return print data
            if (result.PrintData != null)
            {
                return Results.Ok(new
                {
                    success = true,
                    message = result.Message,
                    printData = Convert.ToBase64String(result.PrintData),
                    dataLength = result.PrintData.Length
                });
            }

            return Results.Ok(new { success = true, message = result.Message });
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { error = "Failed to print credit note", details = ex.Message });
        }
    }

    private static async Task<IResult> TestPrint(
        [FromBody] TestPrintDto request,
        IPrintService printService,
        HttpContext httpContext)
    {
        try
        {
            var branchId = Guid.Parse(httpContext.User.FindFirst("branch_id")?.Value
                ?? throw new InvalidOperationException("Branch ID not found in token"));

            var result = await printService.TestPrintAsync(branchId, request.TestMessage);

            if (!result.Success)
            {
                return Results.BadRequest(new { error = result.Message, details = result.ErrorDetails });
            }

            // If USB printer, return print data
            if (result.PrintData != null)
            {
                return Results.Ok(new
                {
                    success = true,
                    message = result.Message,
                    printData = Convert.ToBase64String(result.PrintData),
                    dataLength = result.PrintData.Length
                });
            }

            return Results.Ok(new { success = true, message = result.Message });
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { error = "Test print failed", details = ex.Message });
        }
    }

    private static async Task<IResult> GetPrinterConfig(
        IDbContextFactory<BranchDbContext> contextFactory,
        HttpContext httpContext)
    {
        try
        {
            var branchId = Guid.Parse(httpContext.User.FindFirst("branch_id")?.Value
                ?? throw new InvalidOperationException("Branch ID not found in token"));

            await using var context = await contextFactory.CreateDbContextAsync();

            var config = await context.PrinterConfigurations
                .Where(p => p.BranchId == branchId)
                .FirstOrDefaultAsync();

            if (config == null)
            {
                return Results.NotFound(new { error = "Printer not configured for this branch" });
            }

            var dto = new PrinterConfigurationDto
            {
                Id = config.Id,
                BranchId = config.BranchId,
                PrinterName = config.PrinterName,
                ConnectionType = config.ConnectionType,
                IpAddress = config.IpAddress,
                Port = config.Port,
                PrinterModel = config.PrinterModel,
                PaperWidth = config.PaperWidth,
                AutoPrint = config.AutoPrint,
                HeaderLine1 = config.HeaderLine1,
                HeaderLine2 = config.HeaderLine2,
                HeaderLine3 = config.HeaderLine3,
                TaxNumber = config.TaxNumber,
                FooterLine1 = config.FooterLine1,
                FooterLine2 = config.FooterLine2,
                FooterLine3 = config.FooterLine3,
                PrintLogo = config.PrintLogo,
                LogoPath = config.LogoPath,
                PrintBarcode = config.PrintBarcode,
                PrintQrCode = config.PrintQrCode,
                CreatedAt = config.CreatedAt,
                UpdatedAt = config.UpdatedAt
            };

            return Results.Ok(dto);
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { error = "Failed to get printer configuration", details = ex.Message });
        }
    }

    [Authorize(Roles = "Manager,Admin")]
    private static async Task<IResult> CreatePrinterConfig(
        [FromBody] UpsertPrinterConfigurationDto request,
        IDbContextFactory<BranchDbContext> contextFactory,
        HttpContext httpContext)
    {
        try
        {
            var branchId = Guid.Parse(httpContext.User.FindFirst("branch_id")?.Value
                ?? throw new InvalidOperationException("Branch ID not found in token"));

            await using var context = await contextFactory.CreateDbContextAsync();

            // Check if printer config already exists
            var existing = await context.PrinterConfigurations
                .FirstOrDefaultAsync(p => p.BranchId == branchId);

            if (existing != null)
            {
                return Results.BadRequest(new { error = "Printer configuration already exists. Use PUT to update." });
            }

            var config = new PrinterConfiguration
            {
                Id = Guid.NewGuid(),
                BranchId = branchId,
                PrinterName = request.PrinterName,
                ConnectionType = request.ConnectionType,
                IpAddress = request.IpAddress,
                Port = request.Port,
                PrinterModel = request.PrinterModel,
                PaperWidth = request.PaperWidth,
                AutoPrint = request.AutoPrint,
                HeaderLine1 = request.HeaderLine1,
                HeaderLine2 = request.HeaderLine2,
                HeaderLine3 = request.HeaderLine3,
                TaxNumber = request.TaxNumber,
                FooterLine1 = request.FooterLine1,
                FooterLine2 = request.FooterLine2,
                FooterLine3 = request.FooterLine3,
                PrintLogo = request.PrintLogo,
                LogoPath = request.LogoPath,
                PrintBarcode = request.PrintBarcode,
                PrintQrCode = request.PrintQrCode,
                CreatedAt = DateTime.UtcNow
            };

            context.PrinterConfigurations.Add(config);
            await context.SaveChangesAsync();

            var dto = new PrinterConfigurationDto
            {
                Id = config.Id,
                BranchId = config.BranchId,
                PrinterName = config.PrinterName,
                ConnectionType = config.ConnectionType,
                IpAddress = config.IpAddress,
                Port = config.Port,
                PrinterModel = config.PrinterModel,
                PaperWidth = config.PaperWidth,
                AutoPrint = config.AutoPrint,
                HeaderLine1 = config.HeaderLine1,
                HeaderLine2 = config.HeaderLine2,
                HeaderLine3 = config.HeaderLine3,
                TaxNumber = config.TaxNumber,
                FooterLine1 = config.FooterLine1,
                FooterLine2 = config.FooterLine2,
                FooterLine3 = config.FooterLine3,
                PrintLogo = config.PrintLogo,
                LogoPath = config.LogoPath,
                PrintBarcode = config.PrintBarcode,
                PrintQrCode = config.PrintQrCode,
                CreatedAt = config.CreatedAt,
                UpdatedAt = config.UpdatedAt
            };

            return Results.Created($"/api/v1/printing/config", dto);
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { error = "Failed to create printer configuration", details = ex.Message });
        }
    }

    [Authorize(Roles = "Manager,Admin")]
    private static async Task<IResult> UpdatePrinterConfig(
        [FromBody] UpsertPrinterConfigurationDto request,
        IDbContextFactory<BranchDbContext> contextFactory,
        HttpContext httpContext)
    {
        try
        {
            var branchId = Guid.Parse(httpContext.User.FindFirst("branch_id")?.Value
                ?? throw new InvalidOperationException("Branch ID not found in token"));

            await using var context = await contextFactory.CreateDbContextAsync();

            var config = await context.PrinterConfigurations
                .FirstOrDefaultAsync(p => p.BranchId == branchId);

            if (config == null)
            {
                return Results.NotFound(new { error = "Printer configuration not found. Use POST to create." });
            }

            // Update properties
            config.PrinterName = request.PrinterName;
            config.ConnectionType = request.ConnectionType;
            config.IpAddress = request.IpAddress;
            config.Port = request.Port;
            config.PrinterModel = request.PrinterModel;
            config.PaperWidth = request.PaperWidth;
            config.AutoPrint = request.AutoPrint;
            config.HeaderLine1 = request.HeaderLine1;
            config.HeaderLine2 = request.HeaderLine2;
            config.HeaderLine3 = request.HeaderLine3;
            config.TaxNumber = request.TaxNumber;
            config.FooterLine1 = request.FooterLine1;
            config.FooterLine2 = request.FooterLine2;
            config.FooterLine3 = request.FooterLine3;
            config.PrintLogo = request.PrintLogo;
            config.LogoPath = request.LogoPath;
            config.PrintBarcode = request.PrintBarcode;
            config.PrintQrCode = request.PrintQrCode;
            config.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            var dto = new PrinterConfigurationDto
            {
                Id = config.Id,
                BranchId = config.BranchId,
                PrinterName = config.PrinterName,
                ConnectionType = config.ConnectionType,
                IpAddress = config.IpAddress,
                Port = config.Port,
                PrinterModel = config.PrinterModel,
                PaperWidth = config.PaperWidth,
                AutoPrint = config.AutoPrint,
                HeaderLine1 = config.HeaderLine1,
                HeaderLine2 = config.HeaderLine2,
                HeaderLine3 = config.HeaderLine3,
                TaxNumber = config.TaxNumber,
                FooterLine1 = config.FooterLine1,
                FooterLine2 = config.FooterLine2,
                FooterLine3 = config.FooterLine3,
                PrintLogo = config.PrintLogo,
                LogoPath = config.LogoPath,
                PrintBarcode = config.PrintBarcode,
                PrintQrCode = config.PrintQrCode,
                CreatedAt = config.CreatedAt,
                UpdatedAt = config.UpdatedAt
            };

            return Results.Ok(dto);
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { error = "Failed to update printer configuration", details = ex.Message });
        }
    }
}
