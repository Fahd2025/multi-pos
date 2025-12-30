using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Returns;

/// <summary>
/// DTO for approving or rejecting a return
/// </summary>
public class ApproveReturnDto
{
    /// <summary>
    /// Whether the return is approved
    /// </summary>
    [Required]
    public bool Approved { get; set; }

    /// <summary>
    /// Notes about the decision (required if rejecting)
    /// </summary>
    [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }
}
