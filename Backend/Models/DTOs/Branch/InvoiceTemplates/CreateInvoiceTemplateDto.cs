using System.ComponentModel.DataAnnotations;
using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Branch.InvoiceTemplates;

public class CreateInvoiceTemplateDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public PaperSize PaperSize { get; set; }

    public int? CustomWidth { get; set; }

    public int? CustomHeight { get; set; }

    [Required]
    public string Schema { get; set; } = string.Empty;

    public bool SetAsActive { get; set; } = false;
}
