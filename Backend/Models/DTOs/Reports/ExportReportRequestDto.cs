namespace Backend.Models.DTOs.Reports;

/// <summary>
/// Request DTO for exporting reports
/// </summary>
public class ExportReportRequestDto
{
    /// <summary>
    /// Report type: "sales", "inventory", "financial"
    /// </summary>
    public string ReportType { get; set; } = string.Empty;

    /// <summary>
    /// Export format: "pdf", "excel", "csv"
    /// </summary>
    public string Format { get; set; } = string.Empty;

    /// <summary>
    /// Report start date
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Report end date
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Report-specific filters (dynamic object)
    /// </summary>
    public Dictionary<string, object>? Filters { get; set; }

    /// <summary>
    /// Export options (format-specific)
    /// </summary>
    public ExportOptionsDto? Options { get; set; }
}

public class ExportOptionsDto
{
    /// <summary>
    /// Include charts in the export (PDF only)
    /// </summary>
    public bool IncludeCharts { get; set; } = true;

    /// <summary>
    /// Include detailed data in the export
    /// </summary>
    public bool IncludeDetails { get; set; } = true;

    /// <summary>
    /// Page orientation for PDF: "portrait" or "landscape"
    /// </summary>
    public string PageOrientation { get; set; } = "landscape";

    /// <summary>
    /// CSV delimiter (default: comma)
    /// </summary>
    public string Delimiter { get; set; } = ",";

    /// <summary>
    /// Include headers in CSV
    /// </summary>
    public bool IncludeHeaders { get; set; } = true;

    /// <summary>
    /// Sheet names for Excel export
    /// </summary>
    public List<string>? SheetNames { get; set; }
}
