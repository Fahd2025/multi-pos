namespace Backend.Models.DTOs.Branch.Customers;

/// <summary>
/// Data transfer object for customer information
/// </summary>
public class CustomerDto
{
    /// <summary>
    /// Unique customer identifier
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Customer code (e.g., "CUST001")
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Customer name (English)
    /// </summary>
    public string NameEn { get; set; } = string.Empty;

    /// <summary>
    /// Customer name (Arabic)
    /// </summary>
    public string? NameAr { get; set; }

    /// <summary>
    /// Customer email address
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Customer phone number
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Customer address (English)
    /// </summary>
    public string? AddressEn { get; set; }

    /// <summary>
    /// Customer address (Arabic)
    /// </summary>
    public string? AddressAr { get; set; }

    /// <summary>
    /// Path to customer logo/photo
    /// </summary>
    public string? LogoPath { get; set; }

    /// <summary>
    /// Lifetime total purchase amount
    /// </summary>
    public decimal TotalPurchases { get; set; }

    /// <summary>
    /// Number of purchases made
    /// </summary>
    public int VisitCount { get; set; }

    /// <summary>
    /// Last purchase timestamp
    /// </summary>
    public DateTime? LastVisitAt { get; set; }

    /// <summary>
    /// Loyalty program points
    /// </summary>
    public int LoyaltyPoints { get; set; }

    /// <summary>
    /// Customer account status
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// User who created the customer
    /// </summary>
    public Guid CreatedBy { get; set; }
}
