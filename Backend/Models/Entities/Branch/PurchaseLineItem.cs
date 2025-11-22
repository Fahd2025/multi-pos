using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class PurchaseLineItem
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid PurchaseId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal UnitCost { get; set; }

    [Required]
    public decimal LineTotal { get; set; }

    // Navigation properties
    public Purchase Purchase { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
