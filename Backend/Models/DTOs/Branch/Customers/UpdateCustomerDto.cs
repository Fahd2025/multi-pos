using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Customers;

/// <summary>
/// Data transfer object for updating an existing customer
/// </summary>
public class UpdateCustomerDto
{
    /// <summary>
    /// Customer code (e.g., "CUST001")
    /// </summary>
    [Required(ErrorMessage = "Customer code is required")]
    [StringLength(50, ErrorMessage = "Customer code cannot exceed 50 characters")]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Customer name (English)
    /// </summary>
    [Required(ErrorMessage = "Customer name (English) is required")]
    [StringLength(200, ErrorMessage = "Customer name cannot exceed 200 characters")]
    public string NameEn { get; set; } = string.Empty;

    /// <summary>
    /// Customer name (Arabic)
    /// </summary>
    [StringLength(200, ErrorMessage = "Customer name (Arabic) cannot exceed 200 characters")]
    public string? NameAr { get; set; }

    /// <summary>
    /// Customer email address
    /// </summary>
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string? Email { get; set; }

    /// <summary>
    /// Customer phone number
    /// </summary>
    [StringLength(50, ErrorMessage = "Phone number cannot exceed 50 characters")]
    public string? Phone { get; set; }

    /// <summary>
    /// Customer address (English)
    /// </summary>
    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string? AddressEn { get; set; }

    /// <summary>
    /// Customer address (Arabic)
    /// </summary>
    [StringLength(500, ErrorMessage = "Address (Arabic) cannot exceed 500 characters")]
    public string? AddressAr { get; set; }

    /// <summary>
    /// Saudi National Address: Building Number
    /// </summary>
    [StringLength(10, ErrorMessage = "Building number cannot exceed 10 characters")]
    public string? BuildingNumber { get; set; }

    /// <summary>
    /// Saudi National Address: Street Name
    /// </summary>
    [StringLength(200, ErrorMessage = "Street name cannot exceed 200 characters")]
    public string? StreetName { get; set; }

    /// <summary>
    /// Saudi National Address: District
    /// </summary>
    [StringLength(200, ErrorMessage = "District cannot exceed 200 characters")]
    public string? District { get; set; }

    /// <summary>
    /// Saudi National Address: City
    /// </summary>
    [StringLength(100, ErrorMessage = "City cannot exceed 100 characters")]
    public string? City { get; set; }

    /// <summary>
    /// Saudi National Address: Postal Code (5 digits)
    /// </summary>
    [StringLength(10, ErrorMessage = "Postal code cannot exceed 10 characters")]
    [RegularExpression(@"^\d{5}$", ErrorMessage = "Postal code must be 5 digits")]
    public string? PostalCode { get; set; }

    /// <summary>
    /// Saudi National Address: Additional Number (4 digits)
    /// </summary>
    [StringLength(10, ErrorMessage = "Additional number cannot exceed 10 characters")]
    [RegularExpression(@"^\d{4}$", ErrorMessage = "Additional number must be 4 digits")]
    public string? AdditionalNumber { get; set; }

    /// <summary>
    /// Saudi National Address: Unit Number
    /// </summary>
    [StringLength(50, ErrorMessage = "Unit number cannot exceed 50 characters")]
    public string? UnitNumber { get; set; }

    /// <summary>
    /// Path to customer logo/photo
    /// </summary>
    [StringLength(500, ErrorMessage = "Logo path cannot exceed 500 characters")]
    public string? LogoPath { get; set; }

    /// <summary>
    /// Loyalty program points
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "Loyalty points must be non-negative")]
    public int LoyaltyPoints { get; set; }

    /// <summary>
    /// Customer account status
    /// </summary>
    public bool IsActive { get; set; }
}
