using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Branch.InvoiceTemplates;

public class InvoiceTemplateListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public PaperSize PaperSize { get; set; }
    public string PaperSizeName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
