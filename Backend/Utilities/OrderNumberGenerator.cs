namespace Backend.Utilities;

/// <summary>
/// Utility for generating pending order numbers in format: PO-YYYYMMDD-XXXX
/// </summary>
public static class OrderNumberGenerator
{
    private static readonly object _lock = new object();
    private static int _counter = 0;
    private static string _lastDate = string.Empty;

    /// <summary>
    /// Generate a new pending order number
    /// Format: PO-YYYYMMDD-XXXX (e.g., PO-20251225-0001)
    /// </summary>
    /// <returns>Generated order number</returns>
    public static string GenerateOrderNumber()
    {
        lock (_lock)
        {
            var currentDate = DateTime.UtcNow.ToString("yyyyMMdd");

            // Reset counter if date changed
            if (currentDate != _lastDate)
            {
                _counter = 0;
                _lastDate = currentDate;
            }

            // Increment counter
            _counter++;

            // Format: PO-YYYYMMDD-XXXX
            return $"PO-{currentDate}-{_counter:D4}";
        }
    }

    /// <summary>
    /// Generate a new pending order number with async support
    /// </summary>
    /// <returns>Generated order number</returns>
    public static Task<string> GenerateOrderNumberAsync()
    {
        return Task.FromResult(GenerateOrderNumber());
    }

    /// <summary>
    /// Parse an order number to extract the date
    /// </summary>
    /// <param name="orderNumber">Order number in format PO-YYYYMMDD-XXXX</param>
    /// <returns>Parsed date or null if invalid format</returns>
    public static DateTime? ParseOrderDate(string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            return null;

        var parts = orderNumber.Split('-');
        if (parts.Length != 3 || parts[0] != "PO")
            return null;

        if (DateTime.TryParseExact(parts[1], "yyyyMMdd", null,
            System.Globalization.DateTimeStyles.None, out var date))
        {
            return date;
        }

        return null;
    }

    /// <summary>
    /// Validate an order number format
    /// </summary>
    /// <param name="orderNumber">Order number to validate</param>
    /// <returns>True if valid format, false otherwise</returns>
    public static bool IsValidOrderNumber(string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            return false;

        var parts = orderNumber.Split('-');
        if (parts.Length != 3)
            return false;

        if (parts[0] != "PO")
            return false;

        if (parts[1].Length != 8 || !int.TryParse(parts[1], out _))
            return false;

        if (parts[2].Length != 4 || !int.TryParse(parts[2], out _))
            return false;

        return true;
    }
}
