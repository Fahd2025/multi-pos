namespace Backend.Models.DTOs.HeadOffice.Branches;

/// <summary>
/// Simplified branch DTO for lookup purposes
/// </summary>
public class BranchLookupDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string LoginName { get; set; } = string.Empty;
}
