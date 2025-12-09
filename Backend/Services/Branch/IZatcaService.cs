using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch;

public interface IZatcaService
{
    /// <summary>
    /// Generates a ZATCA-compliant QR code for a sale invoice
    /// </summary>
    /// <param name="sale">The sale entity</param>
    /// <param name="companyInfo">Company information</param>
    /// <returns>Base64-encoded TLV data for QR code</returns>
    string GenerateQRCode(Sale sale, CompanyInfo companyInfo);

    /// <summary>
    /// Encodes data using TLV (Tag-Length-Value) format
    /// </summary>
    /// <param name="tags">Dictionary of tag numbers and values</param>
    /// <returns>TLV-encoded byte array</returns>
    byte[] EncodeTLV(Dictionary<int, string> tags);

    /// <summary>
    /// Generates an invoice hash for ZATCA compliance
    /// </summary>
    /// <param name="sale">The sale entity</param>
    /// <returns>Base64-encoded SHA-256 hash</returns>
    string GenerateInvoiceHash(Sale sale);
}
