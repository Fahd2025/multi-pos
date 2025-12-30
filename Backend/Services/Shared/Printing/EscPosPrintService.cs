using System.Net.Sockets;
using System.Text;
using Backend.Data.Branch;
using Backend.Models.DTOs.Printing;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Printing;

/// <summary>
/// ESC/POS printing service for thermal receipt printers
/// </summary>
public class EscPosPrintService : IPrintService
{
    private readonly IDbContextFactory<BranchDbContext> _contextFactory;

    // ESC/POS Commands
    private static readonly byte[] ESC = { 0x1B };
    private static readonly byte[] INIT = { 0x1B, 0x40 }; // Initialize printer
    private static readonly byte[] CENTER = { 0x1B, 0x61, 0x01 }; // Center alignment
    private static readonly byte[] LEFT = { 0x1B, 0x61, 0x00 }; // Left alignment
    private static readonly byte[] RIGHT = { 0x1B, 0x61, 0x02 }; // Right alignment
    private static readonly byte[] BOLD_ON = { 0x1B, 0x45, 0x01 }; // Bold on
    private static readonly byte[] BOLD_OFF = { 0x1B, 0x45, 0x00 }; // Bold off
    private static readonly byte[] DOUBLE_HEIGHT = { 0x1B, 0x21, 0x10 }; // Double height
    private static readonly byte[] DOUBLE_WIDTH = { 0x1B, 0x21, 0x20 }; // Double width
    private static readonly byte[] DOUBLE_SIZE = { 0x1B, 0x21, 0x30 }; // Double size (height + width)
    private static readonly byte[] NORMAL = { 0x1B, 0x21, 0x00 }; // Normal size
    private static readonly byte[] CUT = { 0x1D, 0x56, 0x42, 0x00 }; // Cut paper
    private static readonly byte[] LF = { 0x0A }; // Line feed
    private static readonly byte[] BARCODE_128 = { 0x1D, 0x6B, 0x49 }; // CODE128 barcode

    public EscPosPrintService(IDbContextFactory<BranchDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task<PrintResponseDto> PrintReceiptAsync(Guid saleId, Guid branchId, int copies = 1)
    {
        try
        {
            await using var context = await _contextFactory.CreateDbContextAsync();

            // Get printer configuration
            var config = await context.PrinterConfigurations
                .FirstOrDefaultAsync(p => p.BranchId == branchId);

            if (config == null)
            {
                return new PrintResponseDto
                {
                    Success = false,
                    Message = "Printer not configured for this branch"
                };
            }

            // Get sale with related data
            var sale = await context.Sales
                .Include(s => s.Customer)
                .Include(s => s.LineItems)
                    .ThenInclude(li => li.Product)
                .Include(s => s.Payments)
                .FirstOrDefaultAsync(s => s.Id == saleId);

            if (sale == null)
            {
                return new PrintResponseDto
                {
                    Success = false,
                    Message = "Sale not found"
                };
            }

            // Generate ESC/POS commands
            var printData = GenerateReceiptCommands(sale, config);

            // If network printer, send directly
            if (config.ConnectionType == "Network" && !string.IsNullOrEmpty(config.IpAddress))
            {
                var sent = await SendToNetworkPrinterAsync(
                    config.IpAddress,
                    config.Port ?? 9100,
                    printData
                );

                return new PrintResponseDto
                {
                    Success = sent,
                    Message = sent ? "Receipt sent to printer" : "Failed to send to network printer",
                    PrintData = null // Don't return data for network printers
                };
            }

            // For USB/Bluetooth printers, return data for client-side printing
            return new PrintResponseDto
            {
                Success = true,
                Message = "Receipt data generated",
                PrintData = printData
            };
        }
        catch (Exception ex)
        {
            return new PrintResponseDto
            {
                Success = false,
                Message = "Error generating receipt",
                ErrorDetails = ex.Message
            };
        }
    }

    public async Task<PrintResponseDto> PrintCreditNoteAsync(Guid returnId, Guid branchId)
    {
        try
        {
            await using var context = await _contextFactory.CreateDbContextAsync();

            // Get printer configuration
            var config = await context.PrinterConfigurations
                .FirstOrDefaultAsync(p => p.BranchId == branchId);

            if (config == null)
            {
                return new PrintResponseDto
                {
                    Success = false,
                    Message = "Printer not configured for this branch"
                };
            }

            // Get return with related data
            var returnEntity = await context.Returns
                .Include(r => r.Customer)
                .Include(r => r.LineItems)
                    .ThenInclude(li => li.Product)
                .Include(r => r.OriginalSale)
                .FirstOrDefaultAsync(r => r.Id == returnId);

            if (returnEntity == null)
            {
                return new PrintResponseDto
                {
                    Success = false,
                    Message = "Return not found"
                };
            }

            // Generate ESC/POS commands
            var printData = GenerateCreditNoteCommands(returnEntity, config);

            // If network printer, send directly
            if (config.ConnectionType == "Network" && !string.IsNullOrEmpty(config.IpAddress))
            {
                var sent = await SendToNetworkPrinterAsync(
                    config.IpAddress,
                    config.Port ?? 9100,
                    printData
                );

                return new PrintResponseDto
                {
                    Success = sent,
                    Message = sent ? "Credit note sent to printer" : "Failed to send to network printer",
                    PrintData = null
                };
            }

            // For USB/Bluetooth printers, return data for client-side printing
            return new PrintResponseDto
            {
                Success = true,
                Message = "Credit note data generated",
                PrintData = printData
            };
        }
        catch (Exception ex)
        {
            return new PrintResponseDto
            {
                Success = false,
                Message = "Error generating credit note",
                ErrorDetails = ex.Message
            };
        }
    }

    public async Task<PrintResponseDto> TestPrintAsync(Guid branchId, string? testMessage = null)
    {
        try
        {
            await using var context = await _contextFactory.CreateDbContextAsync();

            var config = await context.PrinterConfigurations
                .FirstOrDefaultAsync(p => p.BranchId == branchId);

            if (config == null)
            {
                return new PrintResponseDto
                {
                    Success = false,
                    Message = "Printer not configured for this branch"
                };
            }

            // Generate test print
            var data = new List<byte>();
            data.AddRange(INIT); // Initialize
            data.AddRange(CENTER);
            data.AddRange(DOUBLE_SIZE);
            data.AddRange(Encoding.UTF8.GetBytes("TEST PRINT"));
            data.AddRange(LF);
            data.AddRange(NORMAL);
            data.AddRange(LF);
            data.AddRange(Encoding.UTF8.GetBytes(testMessage ?? "Printer configuration test"));
            data.AddRange(LF);
            data.AddRange(Encoding.UTF8.GetBytes($"Date: {DateTime.Now:yyyy-MM-dd HH:mm:ss}"));
            data.AddRange(LF);
            data.AddRange(LF);
            data.AddRange(LEFT);
            data.AddRange(Encoding.UTF8.GetBytes($"Paper Width: {config.PaperWidth}mm"));
            data.AddRange(LF);
            data.AddRange(Encoding.UTF8.GetBytes($"Connection: {config.ConnectionType}"));
            data.AddRange(LF);
            data.AddRange(LF);
            data.AddRange(LF);
            data.AddRange(CUT); // Cut paper

            var printData = data.ToArray();

            // If network printer, send directly
            if (config.ConnectionType == "Network" && !string.IsNullOrEmpty(config.IpAddress))
            {
                var sent = await SendToNetworkPrinterAsync(
                    config.IpAddress,
                    config.Port ?? 9100,
                    printData
                );

                return new PrintResponseDto
                {
                    Success = sent,
                    Message = sent ? "Test print sent successfully" : "Failed to send test print",
                    PrintData = null
                };
            }

            return new PrintResponseDto
            {
                Success = true,
                Message = "Test print data generated",
                PrintData = printData
            };
        }
        catch (Exception ex)
        {
            return new PrintResponseDto
            {
                Success = false,
                Message = "Error generating test print",
                ErrorDetails = ex.Message
            };
        }
    }

    public byte[] GenerateReceiptCommands(Sale sale, PrinterConfiguration config)
    {
        var data = new List<byte>();

        // Initialize printer
        data.AddRange(INIT);

        // Header
        if (!string.IsNullOrEmpty(config.HeaderLine1))
        {
            data.AddRange(CENTER);
            data.AddRange(DOUBLE_SIZE);
            data.AddRange(Encoding.UTF8.GetBytes(config.HeaderLine1));
            data.AddRange(LF);
            data.AddRange(NORMAL);
        }

        if (!string.IsNullOrEmpty(config.HeaderLine2))
        {
            data.AddRange(CENTER);
            data.AddRange(Encoding.UTF8.GetBytes(config.HeaderLine2));
            data.AddRange(LF);
        }

        if (!string.IsNullOrEmpty(config.HeaderLine3))
        {
            data.AddRange(CENTER);
            data.AddRange(Encoding.UTF8.GetBytes(config.HeaderLine3));
            data.AddRange(LF);
        }

        if (!string.IsNullOrEmpty(config.TaxNumber))
        {
            data.AddRange(CENTER);
            data.AddRange(Encoding.UTF8.GetBytes($"Tax No: {config.TaxNumber}"));
            data.AddRange(LF);
        }

        data.AddRange(LEFT);
        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Transaction info
        data.AddRange(Encoding.UTF8.GetBytes($"Date: {sale.SaleDate:yyyy-MM-dd HH:mm:ss}"));
        data.AddRange(LF);
        data.AddRange(Encoding.UTF8.GetBytes($"Transaction: {sale.TransactionId}"));
        data.AddRange(LF);

        if (!string.IsNullOrEmpty(sale.InvoiceNumber))
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Invoice: {sale.InvoiceNumber}"));
            data.AddRange(LF);
        }

        if (sale.Customer != null)
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Customer: {sale.Customer.NameEn}"));
            data.AddRange(LF);
        }

        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Line items
        foreach (var item in sale.LineItems)
        {
            var productName = item.Product?.NameEn ?? "Unknown Product";
            var qty = item.Quantity.ToString();
            var price = item.UnitPrice.ToString("F2");
            var total = item.LineTotal.ToString("F2");

            data.AddRange(Encoding.UTF8.GetBytes(productName));
            data.AddRange(LF);
            data.AddRange(Encoding.UTF8.GetBytes($"  {qty} x ${price} = ${total}"));
            data.AddRange(LF);

            // Calculate discount amount if applicable
            var discountAmount = (item.UnitPrice - item.DiscountedUnitPrice) * item.Quantity;
            if (discountAmount > 0)
            {
                data.AddRange(Encoding.UTF8.GetBytes($"  Discount: -${discountAmount:F2}"));
                data.AddRange(LF);
            }
        }

        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Totals
        data.AddRange(RIGHT);
        data.AddRange(Encoding.UTF8.GetBytes($"Subtotal: ${sale.Subtotal:F2}"));
        data.AddRange(LF);

        if (sale.TotalDiscount > 0)
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Discount: -${sale.TotalDiscount:F2}"));
            data.AddRange(LF);
        }

        if (sale.TaxAmount > 0)
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Tax: ${sale.TaxAmount:F2}"));
            data.AddRange(LF);
        }

        data.AddRange(LEFT);
        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        data.AddRange(RIGHT);
        data.AddRange(BOLD_ON);
        data.AddRange(DOUBLE_HEIGHT);
        data.AddRange(Encoding.UTF8.GetBytes($"TOTAL: ${sale.Total:F2}"));
        data.AddRange(LF);
        data.AddRange(NORMAL);
        data.AddRange(BOLD_OFF);

        data.AddRange(LEFT);
        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Payment details
        if (sale.Payments.Any())
        {
            data.AddRange(Encoding.UTF8.GetBytes("PAYMENTS:"));
            data.AddRange(LF);

            foreach (var payment in sale.Payments)
            {
                var method = payment.PaymentMethod.ToString();
                var amount = payment.Amount.ToString("F2");
                var line = $"{method}: ${amount}";

                if (!string.IsNullOrEmpty(payment.Reference))
                {
                    line += $" ({payment.Reference})";
                }

                data.AddRange(Encoding.UTF8.GetBytes(line));
                data.AddRange(LF);
            }
        }
        else
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Payment: {sale.PaymentMethod}"));
            data.AddRange(LF);

            if (sale.AmountPaid.HasValue && sale.ChangeReturned.HasValue)
            {
                data.AddRange(Encoding.UTF8.GetBytes($"Paid: ${sale.AmountPaid:F2}"));
                data.AddRange(LF);
                data.AddRange(Encoding.UTF8.GetBytes($"Change: ${sale.ChangeReturned:F2}"));
                data.AddRange(LF);
            }
        }

        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Barcode (Transaction ID as Code128)
        if (config.PrintBarcode)
        {
            data.AddRange(CENTER);
            data.AddRange(BARCODE_128);
            data.AddRange(new byte[] { (byte)sale.TransactionId.Length });
            data.AddRange(Encoding.UTF8.GetBytes(sale.TransactionId));
            data.AddRange(LF);
            data.AddRange(LF);
        }

        // Footer
        data.AddRange(CENTER);
        if (!string.IsNullOrEmpty(config.FooterLine1))
        {
            data.AddRange(Encoding.UTF8.GetBytes(config.FooterLine1));
            data.AddRange(LF);
        }
        if (!string.IsNullOrEmpty(config.FooterLine2))
        {
            data.AddRange(Encoding.UTF8.GetBytes(config.FooterLine2));
            data.AddRange(LF);
        }
        if (!string.IsNullOrEmpty(config.FooterLine3))
        {
            data.AddRange(Encoding.UTF8.GetBytes(config.FooterLine3));
            data.AddRange(LF);
        }

        data.AddRange(LF);
        data.AddRange(LF);
        data.AddRange(LF);

        // Cut paper
        data.AddRange(CUT);

        return data.ToArray();
    }

    public byte[] GenerateCreditNoteCommands(Return returnEntity, PrinterConfiguration config)
    {
        var data = new List<byte>();

        // Initialize printer
        data.AddRange(INIT);

        // Header
        data.AddRange(CENTER);
        data.AddRange(DOUBLE_SIZE);
        data.AddRange(Encoding.UTF8.GetBytes("CREDIT NOTE"));
        data.AddRange(LF);
        data.AddRange(NORMAL);

        if (!string.IsNullOrEmpty(config.HeaderLine1))
        {
            data.AddRange(Encoding.UTF8.GetBytes(config.HeaderLine1));
            data.AddRange(LF);
        }

        data.AddRange(LEFT);
        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Return info
        data.AddRange(Encoding.UTF8.GetBytes($"Date: {returnEntity.ReturnDate:yyyy-MM-dd HH:mm:ss}"));
        data.AddRange(LF);
        data.AddRange(Encoding.UTF8.GetBytes($"Return ID: {returnEntity.Id}"));
        data.AddRange(LF);

        if (returnEntity.OriginalSale != null)
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Original: {returnEntity.OriginalSale.TransactionId}"));
            data.AddRange(LF);
        }

        if (returnEntity.Customer != null)
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Customer: {returnEntity.Customer.NameEn}"));
            data.AddRange(LF);
        }

        data.AddRange(Encoding.UTF8.GetBytes($"Reason: {returnEntity.Reason}"));
        data.AddRange(LF);

        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Returned items
        data.AddRange(Encoding.UTF8.GetBytes("RETURNED ITEMS:"));
        data.AddRange(LF);

        foreach (var item in returnEntity.LineItems)
        {
            var productName = item.Product?.NameEn ?? "Unknown Product";
            var qty = item.Quantity.ToString();
            var price = item.UnitPrice.ToString("F2");
            var total = item.LineTotal.ToString("F2");

            data.AddRange(Encoding.UTF8.GetBytes(productName));
            data.AddRange(LF);
            data.AddRange(Encoding.UTF8.GetBytes($"  {qty} x ${price} = ${total}"));
            data.AddRange(LF);
        }

        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Totals
        data.AddRange(RIGHT);
        data.AddRange(Encoding.UTF8.GetBytes($"Subtotal: ${returnEntity.Subtotal:F2}"));
        data.AddRange(LF);

        if (returnEntity.TaxAmount > 0)
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Tax: ${returnEntity.TaxAmount:F2}"));
            data.AddRange(LF);
        }

        data.AddRange(LEFT);
        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        data.AddRange(RIGHT);
        data.AddRange(BOLD_ON);
        data.AddRange(DOUBLE_HEIGHT);
        data.AddRange(Encoding.UTF8.GetBytes($"REFUND: ${returnEntity.Total:F2}"));
        data.AddRange(LF);
        data.AddRange(NORMAL);
        data.AddRange(BOLD_OFF);

        data.AddRange(LEFT);
        data.AddRange(Encoding.UTF8.GetBytes("--------------------------------"));
        data.AddRange(LF);

        // Refund method
        if (!string.IsNullOrEmpty(returnEntity.RefundMethod))
        {
            data.AddRange(Encoding.UTF8.GetBytes($"Refund Method: {returnEntity.RefundMethod}"));
            data.AddRange(LF);
        }

        data.AddRange(LF);

        // Footer
        data.AddRange(CENTER);
        data.AddRange(Encoding.UTF8.GetBytes("Please keep this for your records"));
        data.AddRange(LF);
        data.AddRange(LF);
        data.AddRange(LF);

        // Cut paper
        data.AddRange(CUT);

        return data.ToArray();
    }

    public async Task<bool> SendToNetworkPrinterAsync(string ipAddress, int port, byte[] data)
    {
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(ipAddress, port);

            await using var stream = client.GetStream();
            await stream.WriteAsync(data, 0, data.Length);
            await stream.FlushAsync();

            return true;
        }
        catch
        {
            return false;
        }
    }
}
