using Backend.Models.DTOs.Printing;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Shared.Printing;

/// <summary>
/// Service interface for receipt printing operations
/// </summary>
public interface IPrintService
{
    /// <summary>
    /// Print a receipt for a sale
    /// </summary>
    /// <param name="saleId">The sale ID to print</param>
    /// <param name="branchId">The branch ID</param>
    /// <param name="copies">Number of copies to print</param>
    /// <returns>Print response with success status and optional print data</returns>
    Task<PrintResponseDto> PrintReceiptAsync(Guid saleId, Guid branchId, int copies = 1);

    /// <summary>
    /// Print a credit note for a return
    /// </summary>
    /// <param name="returnId">The return ID to print</param>
    /// <param name="branchId">The branch ID</param>
    /// <returns>Print response with success status and optional print data</returns>
    Task<PrintResponseDto> PrintCreditNoteAsync(Guid returnId, Guid branchId);

    /// <summary>
    /// Test print to verify printer configuration
    /// </summary>
    /// <param name="branchId">The branch ID</param>
    /// <param name="testMessage">Optional test message</param>
    /// <returns>Print response with success status</returns>
    Task<PrintResponseDto> TestPrintAsync(Guid branchId, string? testMessage = null);

    /// <summary>
    /// Generate ESC/POS commands for a receipt
    /// </summary>
    /// <param name="sale">The sale entity</param>
    /// <param name="config">Printer configuration</param>
    /// <returns>Byte array of ESC/POS commands</returns>
    byte[] GenerateReceiptCommands(Sale sale, PrinterConfiguration config);

    /// <summary>
    /// Generate ESC/POS commands for a credit note
    /// </summary>
    /// <param name="returnEntity">The return entity</param>
    /// <param name="config">Printer configuration</param>
    /// <returns>Byte array of ESC/POS commands</returns>
    byte[] GenerateCreditNoteCommands(Return returnEntity, PrinterConfiguration config);

    /// <summary>
    /// Send print data to network printer
    /// </summary>
    /// <param name="ipAddress">Printer IP address</param>
    /// <param name="port">Printer port</param>
    /// <param name="data">ESC/POS byte array</param>
    /// <returns>True if successful</returns>
    Task<bool> SendToNetworkPrinterAsync(string ipAddress, int port, byte[] data);
}
