using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents an individual item being returned in a return transaction.
/// Links to the original sale line item.
/// </summary>
public class ReturnLineItem
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The return this line item belongs to
    /// </summary>
    [Required]
    public Guid ReturnId { get; set; }

    /// <summary>
    /// Reference to the original sale line item being returned
    /// </summary>
    [Required]
    public Guid SaleLineItemId { get; set; }

    /// <summary>
    /// The product being returned
    /// </summary>
    [Required]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Quantity being returned
    /// </summary>
    [Required]
    public int Quantity { get; set; }

    /// <summary>
    /// Unit price at time of original sale
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Discount applied on original sale (per unit)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountValue { get; set; } = 0;

    /// <summary>
    /// Condition of the returned product
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Condition { get; set; } = ProductCondition.New;

    /// <summary>
    /// Total for this line item (Quantity * (UnitPrice - Discount))
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    /// <summary>
    /// Optional notes about this specific item
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// Whether this item was restocked
    /// </summary>
    public bool Restocked { get; set; } = false;

    /// <summary>
    /// When this item was restocked
    /// </summary>
    public DateTime? RestockedAt { get; set; }

    // Navigation properties
    public Return? Return { get; set; }
    public SaleLineItem? SaleLineItem { get; set; }
    public Product? Product { get; set; }
}
