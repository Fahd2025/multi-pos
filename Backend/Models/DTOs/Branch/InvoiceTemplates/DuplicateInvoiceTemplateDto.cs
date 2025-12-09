using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.InvoiceTemplates;

public class DuplicateInvoiceTemplateDto
{
    [Required]
    [MaxLength(200)]
    public string NewName { get; set; } = string.Empty;
}
