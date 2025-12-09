using Backend.Models.DTOs.Branch.InvoiceTemplates;

namespace Backend.Services.Branch;

/// <summary>
/// Service interface for invoice template management operations
/// </summary>
public interface IInvoiceTemplateService
{
    /// <summary>
    /// Get all invoice templates for the current branch
    /// </summary>
    /// <returns>List of invoice templates</returns>
    Task<List<InvoiceTemplateListDto>> GetTemplatesAsync();

    /// <summary>
    /// Get an invoice template by ID
    /// </summary>
    /// <param name="templateId">Template unique identifier</param>
    /// <returns>Template details or null if not found</returns>
    Task<InvoiceTemplateDto?> GetTemplateByIdAsync(Guid templateId);

    /// <summary>
    /// Get the active invoice template for the current branch
    /// </summary>
    /// <returns>Active template or null if none set</returns>
    Task<InvoiceTemplateDto?> GetActiveTemplateAsync();

    /// <summary>
    /// Create a new invoice template
    /// </summary>
    /// <param name="dto">Template creation data</param>
    /// <param name="userId">ID of the user creating the template</param>
    /// <returns>Created template details</returns>
    Task<InvoiceTemplateDto> CreateTemplateAsync(CreateInvoiceTemplateDto dto, Guid userId);

    /// <summary>
    /// Update an existing invoice template
    /// </summary>
    /// <param name="templateId">Template unique identifier</param>
    /// <param name="dto">Template update data</param>
    /// <returns>Updated template details</returns>
    Task<InvoiceTemplateDto> UpdateTemplateAsync(Guid templateId, UpdateInvoiceTemplateDto dto);

    /// <summary>
    /// Delete an invoice template
    /// </summary>
    /// <param name="templateId">Template unique identifier</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteTemplateAsync(Guid templateId);

    /// <summary>
    /// Set a template as active (and deactivate others)
    /// </summary>
    /// <param name="templateId">Template unique identifier</param>
    /// <returns>Updated template details</returns>
    Task<InvoiceTemplateDto> SetActiveTemplateAsync(Guid templateId);

    /// <summary>
    /// Duplicate an existing template
    /// </summary>
    /// <param name="templateId">Template unique identifier to duplicate</param>
    /// <param name="newName">Name for the new template</param>
    /// <param name="userId">ID of the user creating the duplicate</param>
    /// <returns>Created template details</returns>
    Task<InvoiceTemplateDto> DuplicateTemplateAsync(Guid templateId, string newName, Guid userId);
}
