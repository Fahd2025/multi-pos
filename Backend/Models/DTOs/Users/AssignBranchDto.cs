using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Users;

/// <summary>
/// DTO for assigning a user to a branch with a specific role
/// </summary>
public class AssignBranchDto
{
    [Required(ErrorMessage = "Branch ID is required")]
    public Guid BranchId { get; set; }

    [Required(ErrorMessage = "Role is required")]
    [StringLength(50, ErrorMessage = "Role cannot exceed 50 characters")]
    public string Role { get; set; } = string.Empty; // Manager, Cashier, etc.
}
