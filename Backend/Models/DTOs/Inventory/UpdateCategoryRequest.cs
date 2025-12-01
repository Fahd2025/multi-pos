namespace Backend.Models.DTOs.Inventory;

public record UpdateCategoryRequest(
    string Code,
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    Guid? ParentCategoryId,
    int DisplayOrder
);
