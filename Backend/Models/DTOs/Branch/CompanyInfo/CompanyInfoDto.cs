namespace Backend.Models.DTOs.Branch.CompanyInfo;

public class CompanyInfoDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyNameAr { get; set; }
    public string? LogoUrl { get; set; }
    public string? VatNumber { get; set; }
    public string? CommercialRegNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
