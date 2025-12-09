using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch;

public interface IInvoiceRenderingService
{
    /// <summary>
    /// Renders an invoice using a template and sale data
    /// </summary>
    /// <param name="template">The invoice template</param>
    /// <param name="sale">The sale data</param>
    /// <param name="companyInfo">Company information</param>
    /// <param name="zatcaQRCode">ZATCA QR code base64 string</param>
    /// <returns>HTML string of the rendered invoice</returns>
    string RenderInvoice(InvoiceTemplate template, Sale sale, CompanyInfo companyInfo, string zatcaQRCode);

    /// <summary>
    /// Renders a preview of an invoice template with sample data
    /// </summary>
    /// <param name="schema">JSON schema string</param>
    /// <param name="paperSize">Paper size for the template</param>
    /// <param name="companyInfo">Company information</param>
    /// <returns>HTML string of the preview</returns>
    string RenderPreview(string schema, PaperSize paperSize, CompanyInfo companyInfo);

    /// <summary>
    /// Validates a JSON schema
    /// </summary>
    /// <param name="schema">JSON schema string</param>
    /// <returns>True if valid, false otherwise</returns>
    bool ValidateSchema(string schema);
}
