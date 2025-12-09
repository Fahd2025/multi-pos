using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.CompanyInfo;

public class UpdateCompanyInfoDto
{
    [Required]
    [MaxLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? CompanyNameAr { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(50)]
    public string? VatNumber { get; set; }

    [MaxLength(50)]
    public string? CommercialRegNumber { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(20)]
    public string? PostalCode { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Website { get; set; }
}
