using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class ExpenseCategory
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameAr { get; set; } = string.Empty;

    public decimal? BudgetAllocation { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}
