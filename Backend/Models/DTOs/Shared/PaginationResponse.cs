namespace Backend.Models.DTOs.Shared;

/// <summary>
/// Generic pagination response wrapper
/// </summary>
/// <typeparam name="T">Item type</typeparam>
public class PaginationResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}
