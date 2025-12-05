using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.HeadOffice.Branches;

/// <summary>
/// Data transfer object for structured address information
/// </summary>
public class AddressDto
{
    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? District { get; set; }

    [MaxLength(200)]
    public string? Street { get; set; }

    [MaxLength(50)]
    public string? BuildingNumber { get; set; }

    [MaxLength(20)]
    public string? PostalCode { get; set; }

    [MaxLength(500)]
    public string? ShortAddress { get; set; }

    public string ToFullAddress()
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(BuildingNumber)) parts.Add($"Building {BuildingNumber}");
        if (!string.IsNullOrWhiteSpace(Street)) parts.Add(Street);
        if (!string.IsNullOrWhiteSpace(District)) parts.Add(District);
        if (!string.IsNullOrWhiteSpace(City)) parts.Add(City);
        if (!string.IsNullOrWhiteSpace(PostalCode)) parts.Add(PostalCode);

        return parts.Count > 0 ? string.Join(", ", parts) : string.Empty;
    }

    public static AddressDto FromFullAddress(string? fullAddress)
    {
        if (string.IsNullOrWhiteSpace(fullAddress))
        {
            return new AddressDto();
        }

        return new AddressDto
        {
            ShortAddress = fullAddress
        };
    }
}
