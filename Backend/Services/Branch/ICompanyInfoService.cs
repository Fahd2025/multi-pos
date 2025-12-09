using Backend.Models.DTOs.Branch.CompanyInfo;

namespace Backend.Services.Branch;

/// <summary>
/// Service interface for company information management
/// </summary>
public interface ICompanyInfoService
{
    /// <summary>
    /// Get company information for the current branch
    /// </summary>
    /// <returns>Company information or null if not configured</returns>
    Task<CompanyInfoDto?> GetCompanyInfoAsync();

    /// <summary>
    /// Create or update company information
    /// </summary>
    /// <param name="dto">Company information data</param>
    /// <returns>Updated company information</returns>
    Task<CompanyInfoDto> UpsertCompanyInfoAsync(UpdateCompanyInfoDto dto);
}
