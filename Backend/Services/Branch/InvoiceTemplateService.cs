using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.InvoiceTemplates;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch;

/// <summary>
/// Service implementation for invoice template management operations
/// </summary>
public class InvoiceTemplateService : IInvoiceTemplateService
{
    private readonly BranchDbContext _context;
    private readonly IInvoiceRenderingService _renderingService;

    public InvoiceTemplateService(BranchDbContext context, IInvoiceRenderingService renderingService)
    {
        _context = context;
        _renderingService = renderingService;
    }

    public async Task<List<InvoiceTemplateListDto>> GetTemplatesAsync()
    {
        var templates = await _context.InvoiceTemplates
            .OrderByDescending(t => t.IsActive)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new InvoiceTemplateListDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                IsActive = t.IsActive,
                PaperSize = t.PaperSize,
                PaperSizeName = t.PaperSize.ToString(),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return templates;
    }

    public async Task<InvoiceTemplateDto?> GetTemplateByIdAsync(Guid templateId)
    {
        var template = await _context.InvoiceTemplates
            .Where(t => t.Id == templateId)
            .Select(t => new InvoiceTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                IsActive = t.IsActive,
                PaperSize = t.PaperSize,
                PaperSizeName = t.PaperSize.ToString(),
                CustomWidth = t.CustomWidth,
                CustomHeight = t.CustomHeight,
                Schema = t.Schema,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                CreatedBy = t.CreatedBy
            })
            .FirstOrDefaultAsync();

        return template;
    }

    public async Task<InvoiceTemplateDto?> GetActiveTemplateAsync()
    {
        var template = await _context.InvoiceTemplates
            .Where(t => t.IsActive)
            .Select(t => new InvoiceTemplateDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                IsActive = t.IsActive,
                PaperSize = t.PaperSize,
                PaperSizeName = t.PaperSize.ToString(),
                CustomWidth = t.CustomWidth,
                CustomHeight = t.CustomHeight,
                Schema = t.Schema,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                CreatedBy = t.CreatedBy
            })
            .FirstOrDefaultAsync();

        return template;
    }

    public async Task<InvoiceTemplateDto> CreateTemplateAsync(CreateInvoiceTemplateDto dto, Guid userId)
    {
        // Validate schema
        if (!_renderingService.ValidateSchema(dto.Schema))
        {
            throw new InvalidOperationException("Invalid template schema");
        }

        // Validate custom dimensions
        if (dto.PaperSize == PaperSize.Custom && (!dto.CustomWidth.HasValue || !dto.CustomHeight.HasValue))
        {
            throw new InvalidOperationException("Custom dimensions are required for custom paper size");
        }

        // If setting as active, deactivate others
        if (dto.SetAsActive)
        {
            await DeactivateAllTemplatesAsync();
        }

        var template = new InvoiceTemplate
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            IsActive = dto.SetAsActive,
            PaperSize = dto.PaperSize,
            CustomWidth = dto.CustomWidth,
            CustomHeight = dto.CustomHeight,
            Schema = dto.Schema,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.InvoiceTemplates.Add(template);
        await _context.SaveChangesAsync();

        return new InvoiceTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            IsActive = template.IsActive,
            PaperSize = template.PaperSize,
            PaperSizeName = template.PaperSize.ToString(),
            CustomWidth = template.CustomWidth,
            CustomHeight = template.CustomHeight,
            Schema = template.Schema,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt,
            CreatedBy = template.CreatedBy
        };
    }

    public async Task<InvoiceTemplateDto> UpdateTemplateAsync(Guid templateId, UpdateInvoiceTemplateDto dto)
    {
        var template = await _context.InvoiceTemplates.FindAsync(templateId);
        if (template == null)
        {
            throw new InvalidOperationException($"Template with ID {templateId} not found");
        }

        // Validate schema
        if (!_renderingService.ValidateSchema(dto.Schema))
        {
            throw new InvalidOperationException("Invalid template schema");
        }

        // Validate custom dimensions
        if (dto.PaperSize == PaperSize.Custom && (!dto.CustomWidth.HasValue || !dto.CustomHeight.HasValue))
        {
            throw new InvalidOperationException("Custom dimensions are required for custom paper size");
        }

        template.Name = dto.Name;
        template.Description = dto.Description;
        template.PaperSize = dto.PaperSize;
        template.CustomWidth = dto.CustomWidth;
        template.CustomHeight = dto.CustomHeight;
        template.Schema = dto.Schema;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new InvoiceTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            IsActive = template.IsActive,
            PaperSize = template.PaperSize,
            PaperSizeName = template.PaperSize.ToString(),
            CustomWidth = template.CustomWidth,
            CustomHeight = template.CustomHeight,
            Schema = template.Schema,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt,
            CreatedBy = template.CreatedBy
        };
    }

    public async Task<bool> DeleteTemplateAsync(Guid templateId)
    {
        var template = await _context.InvoiceTemplates.FindAsync(templateId);
        if (template == null)
        {
            return false;
        }

        // Prevent deletion of active template
        if (template.IsActive)
        {
            throw new InvalidOperationException("Cannot delete the active template. Please set another template as active first.");
        }

        _context.InvoiceTemplates.Remove(template);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<InvoiceTemplateDto> SetActiveTemplateAsync(Guid templateId)
    {
        var template = await _context.InvoiceTemplates.FindAsync(templateId);
        if (template == null)
        {
            throw new InvalidOperationException($"Template with ID {templateId} not found");
        }

        // Deactivate all templates
        await DeactivateAllTemplatesAsync();

        // Activate the selected template
        template.IsActive = true;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new InvoiceTemplateDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            IsActive = template.IsActive,
            PaperSize = template.PaperSize,
            PaperSizeName = template.PaperSize.ToString(),
            CustomWidth = template.CustomWidth,
            CustomHeight = template.CustomHeight,
            Schema = template.Schema,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt,
            CreatedBy = template.CreatedBy
        };
    }

    public async Task<InvoiceTemplateDto> DuplicateTemplateAsync(Guid templateId, string newName, Guid userId)
    {
        var originalTemplate = await _context.InvoiceTemplates.FindAsync(templateId);
        if (originalTemplate == null)
        {
            throw new InvalidOperationException($"Template with ID {templateId} not found");
        }

        var duplicateTemplate = new InvoiceTemplate
        {
            Id = Guid.NewGuid(),
            Name = newName,
            Description = originalTemplate.Description,
            IsActive = false, // Duplicated templates are not active by default
            PaperSize = originalTemplate.PaperSize,
            CustomWidth = originalTemplate.CustomWidth,
            CustomHeight = originalTemplate.CustomHeight,
            Schema = originalTemplate.Schema,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.InvoiceTemplates.Add(duplicateTemplate);
        await _context.SaveChangesAsync();

        return new InvoiceTemplateDto
        {
            Id = duplicateTemplate.Id,
            Name = duplicateTemplate.Name,
            Description = duplicateTemplate.Description,
            IsActive = duplicateTemplate.IsActive,
            PaperSize = duplicateTemplate.PaperSize,
            PaperSizeName = duplicateTemplate.PaperSize.ToString(),
            CustomWidth = duplicateTemplate.CustomWidth,
            CustomHeight = duplicateTemplate.CustomHeight,
            Schema = duplicateTemplate.Schema,
            CreatedAt = duplicateTemplate.CreatedAt,
            UpdatedAt = duplicateTemplate.UpdatedAt,
            CreatedBy = duplicateTemplate.CreatedBy
        };
    }

    private async Task DeactivateAllTemplatesAsync()
    {
        var activeTemplates = await _context.InvoiceTemplates
            .Where(t => t.IsActive)
            .ToListAsync();

        foreach (var template in activeTemplates)
        {
            template.IsActive = false;
            template.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}
