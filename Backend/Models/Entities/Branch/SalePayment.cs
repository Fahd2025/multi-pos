using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents a single payment method used in a sale transaction.
/// Supports split payments where a sale can have multiple payment methods.
/// </summary>
public class SalePayment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The sale this payment belongs to
    /// </summary>
    [Required]
    public Guid SaleId { get; set; }

    /// <summary>
    /// Payment method used (Cash, Card, DigitalWallet, etc.)
    /// </summary>
    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    /// <summary>
    /// Amount paid using this payment method
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Reference number for this payment (transaction ID, check number, etc.)
    /// </summary>
    [MaxLength(100)]
    public string? Reference { get; set; }

    /// <summary>
    /// When this payment was processed
    /// </summary>
    [Required]
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who processed this payment
    /// </summary>
    [Required]
    public Guid ProcessedBy { get; set; }

    /// <summary>
    /// Optional notes about this payment
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public Sale? Sale { get; set; }
    public User? ProcessedByUser { get; set; }
}
