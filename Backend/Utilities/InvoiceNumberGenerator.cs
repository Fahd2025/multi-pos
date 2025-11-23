using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Utilities;

public class InvoiceNumberGenerator
{
    public static async Task<string> GenerateInvoiceNumberAsync(
        BranchDbContext context,
        string branchCode
    )
    {
        // Get the last invoice number for this branch
        var lastInvoice = await context
            .Sales.Where(s => s.InvoiceNumber != null)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => s.InvoiceNumber)
            .FirstOrDefaultAsync();

        int nextNumber = 1;

        if (!string.IsNullOrEmpty(lastInvoice))
        {
            // Extract the number from the last invoice (format: B001-INV-000123)
            var parts = lastInvoice.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        // Format: BRANCH-INV-NNNNNN (e.g., B001-INV-000001)
        return $"{branchCode}-INV-{nextNumber:D6}";
    }

    public static string GenerateTransactionId()
    {
        // Format: TXN-YYYYMMDD-NNNNNN (e.g., TXN-20250121-000123)
        var date = DateTime.UtcNow.ToString("yyyyMMdd");
        var random = new Random();
        var number = random.Next(1, 999999);
        return $"TXN-{date}-{number:D6}";
    }
}
