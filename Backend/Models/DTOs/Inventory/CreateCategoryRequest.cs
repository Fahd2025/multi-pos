namespace Backend.Models.DTOs.Inventory;

public record CreateCategoryRequest(
    string Code,
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    Guid? ParentCategoryId,
    int DisplayOrder
);
