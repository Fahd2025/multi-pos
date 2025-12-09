using System.Security.Cryptography;
using System.Text;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch;

public class ZatcaService : IZatcaService
{
    /// <summary>
    /// Generates a ZATCA-compliant QR code for a sale invoice using TLV encoding
    /// Phase 1 Implementation - QR Code Generation
    ///
    /// ZATCA Requirements:
    /// Tag 1: Seller name
    /// Tag 2: VAT registration number
    /// Tag 3: Timestamp (ISO 8601 format)
    /// Tag 4: Invoice total (including VAT)
    /// Tag 5: VAT amount
    /// Tag 6: Invoice hash (SHA-256)
    /// </summary>
    public string GenerateQRCode(Sale sale, CompanyInfo companyInfo)
    {
        var tlvData = EncodeTLV(new Dictionary<int, string>
        {
            { 1, companyInfo.CompanyName }, // Seller name
            { 2, companyInfo.VatNumber ?? "N/A" }, // VAT registration number
            { 3, sale.SaleDate.ToString("yyyy-MM-ddTHH:mm:ssZ") }, // Timestamp
            { 4, sale.Total.ToString("0.00") }, // Invoice total (including VAT)
            { 5, sale.TaxAmount.ToString("0.00") }, // VAT amount
            { 6, GenerateInvoiceHash(sale) } // Invoice hash
        });

        return Convert.ToBase64String(tlvData);
    }

    /// <summary>
    /// Encodes data using TLV (Tag-Length-Value) format
    ///
    /// Format: [Tag(1 byte)][Length(1 byte)][Value(N bytes)]
    /// Each tag contains:
    /// - Tag: 1 byte (tag number)
    /// - Length: 1 byte (value length in bytes)
    /// - Value: N bytes (UTF-8 encoded string)
    /// </summary>
    public byte[] EncodeTLV(Dictionary<int, string> tags)
    {
        using var ms = new MemoryStream();

        foreach (var tag in tags.OrderBy(t => t.Key))
        {
            var value = Encoding.UTF8.GetBytes(tag.Value);

            // Tag number (1 byte)
            ms.WriteByte((byte)tag.Key);

            // Length (1 byte)
            if (value.Length > 255)
            {
                throw new ArgumentException($"Tag {tag.Key} value exceeds maximum length of 255 bytes");
            }
            ms.WriteByte((byte)value.Length);

            // Value (N bytes)
            ms.Write(value, 0, value.Length);
        }

        return ms.ToArray();
    }

    /// <summary>
    /// Generates an invoice hash for ZATCA compliance
    ///
    /// Phase 1: Simple hash based on invoice data
    /// Phase 2: Will require XML invoice hashing with digital signatures
    /// </summary>
    public string GenerateInvoiceHash(Sale sale)
    {
        // Simplified hash for Phase 1
        // Combines invoice number, date, and total to create a unique hash
        var hashInput = $"{sale.InvoiceNumber}|{sale.SaleDate:O}|{sale.Total:0.00}";

        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(hashInput));

        return Convert.ToBase64String(hash);
    }

    // TODO: Phase 2 ZATCA Implementation
    // The following methods will be needed for Phase 2:
    // - GenerateUBLXml: Create UBL 2.1 compliant XML invoice
    // - SignInvoice: Apply X.509 digital signature
    // - ReportInvoice: Submit invoice to ZATCA platform
    // - ClearInvoice: Get clearance from ZATCA before issuing
    // - HandleZatcaResponse: Process ZATCA API responses
}
