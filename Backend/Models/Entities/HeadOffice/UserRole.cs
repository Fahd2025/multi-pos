namespace Backend.Models.Entities.HeadOffice;

/// <summary>
/// User role enumeration (deprecated - kept for backward compatibility)
/// New system uses BranchUser with string-based roles
/// </summary>
public enum UserRole
{
    Cashier = 0,
    Manager = 1,
    Admin = 2,
}
