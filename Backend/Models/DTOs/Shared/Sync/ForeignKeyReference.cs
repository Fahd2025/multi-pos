namespace Backend.Models.DTOs.Shared.Sync;

/// <summary>
/// Represents a foreign key reference that needs to be resolved during sync
/// Used when an offline transaction references a temporary ID that must be mapped to a real ID
/// </summary>
/// <param name="Field">The field name containing the foreign key (e.g., "CustomerId", "ProductId")</param>
/// <param name="TempId">The temporary ID that needs to be resolved to a real ID</param>
/// <example>
/// For a sale created offline with a customer created offline:
/// new ForeignKeyReference("CustomerId", "temp-customer-1735123456789-x7k2m3p9")
/// </example>
public record ForeignKeyReference(
    string Field,
    string TempId
);
