using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.CompanyInfo;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch;

/// <summary>
/// Service implementation for company information management
/// </summary>
public class CompanyInfoService : ICompanyInfoService
{
    private readonly BranchDbContext _context;

    public CompanyInfoService(BranchDbContext context)
    {
        _context = context;
    }

    public async Task<CompanyInfoDto?> GetCompanyInfoAsync()
    {
        var companyInfo = await _context.CompanyInfo
            .Select(c => new CompanyInfoDto
            {
                Id = c.Id,
                CompanyName = c.CompanyName,
                CompanyNameAr = c.CompanyNameAr,
                LogoUrl = c.LogoUrl,
                VatNumber = c.VatNumber,
                CommercialRegNumber = c.CommercialRegNumber,
                Address = c.Address,
                City = c.City,
                PostalCode = c.PostalCode,
                Phone = c.Phone,
                Email = c.Email,
                Website = c.Website,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .FirstOrDefaultAsync();

        return companyInfo;
    }

    public async Task<CompanyInfoDto> UpsertCompanyInfoAsync(UpdateCompanyInfoDto dto)
    {
        var existingCompanyInfo = await _context.CompanyInfo.FirstOrDefaultAsync();

        if (existingCompanyInfo == null)
        {
            // Create new company info
            var newCompanyInfo = new Models.Entities.Branch.CompanyInfo
            {
                Id = Guid.NewGuid(),
                CompanyName = dto.CompanyName,
                CompanyNameAr = dto.CompanyNameAr,
                LogoUrl = dto.LogoUrl,
                VatNumber = dto.VatNumber,
                CommercialRegNumber = dto.CommercialRegNumber,
                Address = dto.Address,
                City = dto.City,
                PostalCode = dto.PostalCode,
                Phone = dto.Phone,
                Email = dto.Email,
                Website = dto.Website,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CompanyInfo.Add(newCompanyInfo);
            await _context.SaveChangesAsync();

            return new CompanyInfoDto
            {
                Id = newCompanyInfo.Id,
                CompanyName = newCompanyInfo.CompanyName,
                CompanyNameAr = newCompanyInfo.CompanyNameAr,
                LogoUrl = newCompanyInfo.LogoUrl,
                VatNumber = newCompanyInfo.VatNumber,
                CommercialRegNumber = newCompanyInfo.CommercialRegNumber,
                Address = newCompanyInfo.Address,
                City = newCompanyInfo.City,
                PostalCode = newCompanyInfo.PostalCode,
                Phone = newCompanyInfo.Phone,
                Email = newCompanyInfo.Email,
                Website = newCompanyInfo.Website,
                CreatedAt = newCompanyInfo.CreatedAt,
                UpdatedAt = newCompanyInfo.UpdatedAt
            };
        }
        else
        {
            // Update existing company info
            existingCompanyInfo.CompanyName = dto.CompanyName;
            existingCompanyInfo.CompanyNameAr = dto.CompanyNameAr;
            existingCompanyInfo.LogoUrl = dto.LogoUrl;
            existingCompanyInfo.VatNumber = dto.VatNumber;
            existingCompanyInfo.CommercialRegNumber = dto.CommercialRegNumber;
            existingCompanyInfo.Address = dto.Address;
            existingCompanyInfo.City = dto.City;
            existingCompanyInfo.PostalCode = dto.PostalCode;
            existingCompanyInfo.Phone = dto.Phone;
            existingCompanyInfo.Email = dto.Email;
            existingCompanyInfo.Website = dto.Website;
            existingCompanyInfo.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new CompanyInfoDto
            {
                Id = existingCompanyInfo.Id,
                CompanyName = existingCompanyInfo.CompanyName,
                CompanyNameAr = existingCompanyInfo.CompanyNameAr,
                LogoUrl = existingCompanyInfo.LogoUrl,
                VatNumber = existingCompanyInfo.VatNumber,
                CommercialRegNumber = existingCompanyInfo.CommercialRegNumber,
                Address = existingCompanyInfo.Address,
                City = existingCompanyInfo.City,
                PostalCode = existingCompanyInfo.PostalCode,
                Phone = existingCompanyInfo.Phone,
                Email = existingCompanyInfo.Email,
                Website = existingCompanyInfo.Website,
                CreatedAt = existingCompanyInfo.CreatedAt,
                UpdatedAt = existingCompanyInfo.UpdatedAt
            };
        }
    }
}
