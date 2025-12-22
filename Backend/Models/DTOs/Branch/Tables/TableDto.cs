using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Tables;

/// <summary>
/// DTO for table position information
/// </summary>
public class PositionDto
{
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public int Rotation { get; set; }
}

/// <summary>
/// DTO for table dimensions and appearance
/// </summary>
public class DimensionDto
{
    public decimal Width { get; set; }
    public decimal Height { get; set; }
    public string Shape { get; set; } = "Rectangle";
}

/// <summary>
/// DTO for table information returned to clients
/// </summary>
public class TableDto
{
    public int Id { get; set; }
    public int Number { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public PositionDto Position { get; set; } = new();
    public DimensionDto Dimensions { get; set; } = new();
    public int? ZoneId { get; set; }
    public string? ZoneName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for table with current occupancy status
/// </summary>
public class TableWithStatusDto : TableDto
{
    /// <summary>
    /// Table status: available, occupied, reserved
    /// </summary>
    public string Status { get; set; } = "available";

    /// <summary>
    /// ID of the current sale if table is occupied
    /// </summary>
    public Guid? SaleId { get; set; }

    /// <summary>
    /// Invoice number of the current order
    /// </summary>
    public string? InvoiceNumber { get; set; }

    /// <summary>
    /// Number of guests at the table
    /// </summary>
    public int? GuestCount { get; set; }

    /// <summary>
    /// How long the order has been active (formatted string)
    /// </summary>
    public string? OrderTime { get; set; }

    /// <summary>
    /// Total amount of the current order
    /// </summary>
    public decimal? OrderTotal { get; set; }
}

/// <summary>
/// DTO for creating a new table
/// </summary>
public class CreateTableDto
{
    [Required(ErrorMessage = "Table number is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Table number must be positive")]
    public int Number { get; set; }

    [Required(ErrorMessage = "Table name is required")]
    [MaxLength(100, ErrorMessage = "Table name must not exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Capacity is required")]
    [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100")]
    public int Capacity { get; set; }

    [Required(ErrorMessage = "Position is required")]
    public PositionDto Position { get; set; } = new();

    public DimensionDto Dimensions { get; set; } = new() { Width = 10, Height = 10, Shape = "Rectangle" };

    public int? ZoneId { get; set; }
}

/// <summary>
/// DTO for updating an existing table
/// </summary>
public class UpdateTableDto
{
    [Required(ErrorMessage = "Table number is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Table number must be positive")]
    public int Number { get; set; }

    [Required(ErrorMessage = "Table name is required")]
    [MaxLength(100, ErrorMessage = "Table name must not exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Capacity is required")]
    [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100")]
    public int Capacity { get; set; }

    [Required(ErrorMessage = "Position is required")]
    public PositionDto Position { get; set; } = new();

    public DimensionDto Dimensions { get; set; } = new();

    public int? ZoneId { get; set; }

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for transferring an order between tables
/// </summary>
public class TransferTableDto
{
    [Required(ErrorMessage = "Sale ID is required")]
    public Guid SaleId { get; set; }

    [Required(ErrorMessage = "Source table number is required")]
    public int FromTableNumber { get; set; }

    [Required(ErrorMessage = "Target table number is required")]
    public int ToTableNumber { get; set; }
}

/// <summary>
/// DTO for assigning a table to a sale
/// </summary>
public class AssignTableDto
{
    [Required(ErrorMessage = "Table number is required")]
    public int TableNumber { get; set; }

    [Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
    public int GuestCount { get; set; } = 1;
}
