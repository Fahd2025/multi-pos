using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch;

public class InvoiceRenderingService : IInvoiceRenderingService
{
    public string RenderInvoice(InvoiceTemplate template, Sale sale, Backend.Models.Entities.HeadOffice.Branch branch, string zatcaQRCode)
    {
        try
        {
            var schema = JsonSerializer.Deserialize<InvoiceSchema>(template.Schema);
            if (schema == null)
            {
                throw new InvalidOperationException("Invalid template schema");
            }

            var html = new StringBuilder();
            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html>");
            html.AppendLine("<head>");
            html.AppendLine("<meta charset='UTF-8'>");
            html.AppendLine("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            html.AppendLine("<title>Invoice</title>");
            html.AppendLine(GenerateStyles(template.PaperSize, template.CustomWidth, template.CustomHeight, schema));
            html.AppendLine("</head>");
            html.AppendLine("<body>");
            html.AppendLine("<div class='invoice-container'>");

            // Render sections based on schema
            if (schema.Sections != null)
            {
                foreach (var section in schema.Sections.OrderBy(s => s.Order))
                {
                    if (!section.Visible) continue;

                    html.AppendLine(RenderSection(section, sale, branch, zatcaQRCode));
                }
            }

            html.AppendLine("</div>");
            html.AppendLine("</body>");
            html.AppendLine("</html>");

            return html.ToString();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to render invoice: {ex.Message}", ex);
        }
    }

    public string RenderPreview(string schema, PaperSize paperSize, Backend.Models.Entities.HeadOffice.Branch branch)
    {
        // Generate sample data for preview
        var sampleSale = GenerateSampleSale();
        var sampleQRCode = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

        try
        {
            var invoiceSchema = JsonSerializer.Deserialize<InvoiceSchema>(schema);
            if (invoiceSchema == null)
            {
                throw new InvalidOperationException("Invalid schema");
            }

            var html = new StringBuilder();
            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html>");
            html.AppendLine("<head>");
            html.AppendLine("<meta charset='UTF-8'>");
            html.AppendLine("<title>Invoice Preview</title>");
            html.AppendLine(GenerateStyles(paperSize, null, null, invoiceSchema));
            html.AppendLine("</head>");
            html.AppendLine("<body>");
            html.AppendLine("<div class='invoice-container'>");

            if (invoiceSchema.Sections != null)
            {
                foreach (var section in invoiceSchema.Sections.OrderBy(s => s.Order))
                {
                    if (!section.Visible) continue;
                    html.AppendLine(RenderSection(section, sampleSale, branch, sampleQRCode));
                }
            }

            html.AppendLine("</div>");
            html.AppendLine("</body>");
            html.AppendLine("</html>");

            return html.ToString();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to render preview: {ex.Message}", ex);
        }
    }

    public bool ValidateSchema(string schema)
    {
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            var invoiceSchema = JsonSerializer.Deserialize<InvoiceSchema>(schema, options);
            return invoiceSchema != null && invoiceSchema.Sections != null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ValidateSchema] Schema validation failed: {ex.Message}");
            Console.WriteLine($"[ValidateSchema] Schema content: {schema?.Substring(0, Math.Min(200, schema?.Length ?? 0))}...");
            return false;
        }
    }

    private string GenerateStyles(PaperSize paperSize, int? customWidth, int? customHeight, InvoiceSchema schema)
    {
        var styles = new StringBuilder();
        styles.AppendLine("<style>");

        // Paper size specific styles
        var width = GetPaperWidth(paperSize, customWidth);

        // @page rule to set actual print page size
        styles.AppendLine($"@page {{ size: {width}mm auto; margin: 5mm; }}");

        // Base styles
        styles.AppendLine("* { box-sizing: border-box; }");
        styles.AppendLine("body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; color: black; }");

        // Container with paper-size specific width
        styles.AppendLine($".invoice-container {{ width: {width}mm; max-width: {width}mm; margin: 0 auto; padding: 10px; background: white; color: black; }}");

        // Print-specific styles
        styles.AppendLine("@media print {");
        styles.AppendLine("  body { margin: 0; padding: 0; }");
        styles.AppendLine($"  .invoice-container {{ width: {width}mm; max-width: {width}mm; margin: 0; padding: 5mm; page-break-inside: avoid; }}");
        styles.AppendLine("  @page { margin: 0; }");
        styles.AppendLine("}");

        // Typography
        styles.AppendLine($".invoice-container {{ font-size: {schema.Styling?.FontSize?.Body ?? "12px"}; }}");
        styles.AppendLine($".header {{ text-align: center; margin-bottom: {schema.Styling?.Spacing?.SectionGap ?? "15px"}; }}");
        styles.AppendLine(".header img { max-width: 120px; margin-bottom: 10px; }");
        styles.AppendLine(".header h1 { margin: 5px 0; font-size: 18px; }");
        styles.AppendLine(".header p { margin: 3px 0; font-size: 11px; }");

        styles.AppendLine($".invoice-title {{ text-align: center; font-size: {schema.Styling?.FontSize?.Title ?? "16px"}; font-weight: bold; margin: 10px 0; }}");

        styles.AppendLine(".section { margin-bottom: 15px; }");
        styles.AppendLine(".section-title { font-weight: bold; margin-bottom: 5px; }");
        styles.AppendLine(".field-group { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }");
        styles.AppendLine(".field-label { font-weight: bold; }");

        styles.AppendLine("table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }");
        styles.AppendLine("table th { background: #f5f5f5; padding: 5px; text-align: left; border: 1px solid #ddd; }");
        styles.AppendLine("table td { padding: 5px; border: 1px solid #ddd; }");
        styles.AppendLine("table td.right { text-align: right; }");
        styles.AppendLine("table td.center { text-align: center; }");
        styles.AppendLine("table tr.item-details td { background: #f9f9f9; font-size: 10px; padding: 5px 5px 5px 15px; border-top: none; }");
        styles.AppendLine("table tr.item-details .details-label { font-weight: bold; }");

        styles.AppendLine(".summary { margin-top: 15px; }");
        styles.AppendLine(".summary-line { display: flex; justify-content: space-between; padding: 3px 0; }");
        styles.AppendLine(".summary-line.total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }");

        styles.AppendLine(".footer { text-align: center; margin-top: 15px; }");
        styles.AppendLine(".footer img { max-width: 150px; margin: 10px auto; }");
        styles.AppendLine($".footer p {{ margin: 5px 0; font-size: {schema.Styling?.FontSize?.Footer ?? "10px"}; }}");

        styles.AppendLine("</style>");
        return styles.ToString();
    }

    private string RenderSection(InvoiceSchemaSection section, Sale sale, Backend.Models.Entities.HeadOffice.Branch branch, string zatcaQRCode)
    {
        return section.Type.ToLower() switch
        {
            "header" => RenderHeader(section, branch),
            "title" => RenderTitle(section, sale),
            "customer" => RenderCustomer(section, sale),
            "metadata" => RenderMetadata(section, sale),
            "items" => RenderItems(section, sale),
            "summary" => RenderSummary(section, sale),
            "footer" => RenderFooter(section, sale, zatcaQRCode),
            _ => ""
        };
    }

    /// <summary>
    /// Formats address from JSON string or plain text
    /// </summary>
    private string FormatAddress(string? address)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return string.Empty;
        }

        // Try to parse as JSON object
        try
        {
            using var doc = JsonDocument.Parse(address);
            var root = doc.RootElement;

            // Extract address components (case-insensitive property lookup)
            var buildingNumber = GetJsonProperty(root, "BuildingNumber", "buildingNumber");
            var street = GetJsonProperty(root, "Street", "street");
            var district = GetJsonProperty(root, "District", "district");
            var city = GetJsonProperty(root, "City", "city");
            var postalCode = GetJsonProperty(root, "PostalCode", "postalCode");

            // Build address from non-null components
            var parts = new[] { buildingNumber, street, district, city, postalCode }
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .ToArray();

            if (parts.Length > 0)
            {
                return string.Join(", ", parts);
            }

            // Fall back to ShortAddress if all components are null
            var shortAddress = GetJsonProperty(root, "ShortAddress", "shortAddress");
            if (!string.IsNullOrWhiteSpace(shortAddress))
            {
                return shortAddress;
            }

            return string.Empty;
        }
        catch
        {
            // If parsing fails, it's a plain string - return as-is
            return address;
        }
    }

    /// <summary>
    /// Gets JSON property value with case-insensitive fallback
    /// </summary>
    private string? GetJsonProperty(JsonElement element, params string[] propertyNames)
    {
        foreach (var name in propertyNames)
        {
            if (element.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String)
            {
                var value = prop.GetString();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }
        }
        return null;
    }

    private string RenderHeader(InvoiceSchemaSection section, Backend.Models.Entities.HeadOffice.Branch branch)
    {
        var html = new StringBuilder();
        html.AppendLine("<div class='header'>");

        if (section.Config?.ContainsKey("showLogo") == true && (bool)(section.Config["showLogo"] ?? false) && !string.IsNullOrEmpty(branch.LogoPath))
        {
            html.AppendLine($"<img src='{branch.LogoPath}' alt='Logo' />");
        }

        if (section.Config?.ContainsKey("showBranchName") == true && (bool)(section.Config["showBranchName"] ?? false))
        {
            html.AppendLine($"<h1>{branch.NameEn}</h1>");
        }

        if (section.Config?.ContainsKey("showAddress") == true && (bool)(section.Config["showAddress"] ?? false) && !string.IsNullOrEmpty(branch.AddressEn))
        {
            var formattedAddress = FormatAddress(branch.AddressEn);
            if (!string.IsNullOrWhiteSpace(formattedAddress))
            {
                html.AppendLine($"<p>{formattedAddress}</p>");
            }
        }

        if (section.Config?.ContainsKey("showPhone") == true && (bool)(section.Config["showPhone"] ?? false) && !string.IsNullOrEmpty(branch.Phone))
        {
            html.AppendLine($"<p>Tel: {branch.Phone}</p>");
        }

        if (section.Config?.ContainsKey("showVatNumber") == true && (bool)(section.Config["showVatNumber"] ?? false) && !string.IsNullOrEmpty(branch.TaxNumber))
        {
            html.AppendLine($"<p>VAT: {branch.TaxNumber}</p>");
        }

        if (section.Config?.ContainsKey("showCRN") == true && (bool)(section.Config["showCRN"] ?? false) && !string.IsNullOrEmpty(branch.CRN))
        {
            html.AppendLine($"<p>CR: {branch.CRN}</p>");
        }

        html.AppendLine("</div>");
        return html.ToString();
    }

    private string RenderTitle(InvoiceSchemaSection section, Sale sale)
    {
        string title;

        // Check if invoice has no VAT (tax amount is zero) - use nonVatTitle
        if (sale.TaxAmount == 0)
        {
            title = section.Config?.GetValueOrDefault("nonVatTitle")?.ToString() ?? "Invoice";
        }
        else
        {
            // Use standardTitle for Standard invoices, simplifiedTitle for Simplified invoices
            title = sale.InvoiceType == InvoiceType.Standard
                ? section.Config?.GetValueOrDefault("standardTitle")?.ToString() ?? "Standard Tax Invoice"
                : section.Config?.GetValueOrDefault("simplifiedTitle")?.ToString() ?? "Simplified Tax Invoice";
        }

        return $"<div class='invoice-title'>{title}</div>";
    }

    private string RenderCustomer(InvoiceSchemaSection section, Sale sale)
    {
        if (sale.Customer == null) return "";

        // Hide the ENTIRE customer section if phone is blank
        // Note: Customer entity doesn't have a VAT number field
        if (string.IsNullOrWhiteSpace(sale.Customer.Phone)) return "";

        var html = new StringBuilder();
        html.AppendLine("<div class='section'>");
        html.AppendLine("<div class='section-title'>Customer Information</div>");
        html.AppendLine($"<div class='field-group'><span class='field-label'>Name:</span><span>{sale.Customer.NameEn}</span></div>");

        if (!string.IsNullOrEmpty(sale.Customer.Email))
        {
            html.AppendLine($"<div class='field-group'><span class='field-label'>Email:</span><span>{sale.Customer.Email}</span></div>");
        }

        html.AppendLine($"<div class='field-group'><span class='field-label'>Phone:</span><span>{sale.Customer.Phone}</span></div>");

        html.AppendLine("</div>");
        return html.ToString();
    }

    private string RenderMetadata(InvoiceSchemaSection section, Sale sale)
    {
        var html = new StringBuilder();
        html.AppendLine("<div class='section'>");
        html.AppendLine($"<div class='field-group'><span class='field-label'>Invoice #:</span><span>{sale.InvoiceNumber}</span></div>");
        html.AppendLine($"<div class='field-group'><span class='field-label'>Transaction ID:</span><span>{sale.TransactionId}</span></div>");
        html.AppendLine($"<div class='field-group'><span class='field-label'>Date & Time:</span><span>{sale.SaleDate:yyyy-MM-dd HH:mm:ss}</span></div>");
        html.AppendLine("</div>");
        return html.ToString();
    }

    private string RenderItems(InvoiceSchemaSection section, Sale sale)
    {
        var html = new StringBuilder();
        html.AppendLine("<table>");
        html.AppendLine("<thead><tr>");
        html.AppendLine("<th>Item</th>");
        html.AppendLine("<th class='center'>Qty</th>");
        html.AppendLine("<th class='right'>Price</th>");
        html.AppendLine("<th class='right'>Total</th>");
        html.AppendLine("</tr></thead>");
        html.AppendLine("<tbody>");

        foreach (var item in sale.LineItems)
        {
            var productName = item.Product?.NameEn ?? "Unknown Product";

            // Main item row
            html.AppendLine("<tr>");
            html.AppendLine($"<td>{productName}</td>");
            html.AppendLine($"<td class='center'>{item.Quantity}</td>");
            html.AppendLine($"<td class='right'>{item.UnitPrice:F2}</td>");
            html.AppendLine($"<td class='right'>{item.LineTotal:F2}</td>");
            html.AppendLine("</tr>");

            // Details row for notes (only if notes exist)
            if (!string.IsNullOrWhiteSpace(item.Notes))
            {
                html.AppendLine("<tr class='item-details'>");
                html.AppendLine($"<td colspan='4'><span class='details-label'>Details:</span> {item.Notes}</td>");
                html.AppendLine("</tr>");
            }
        }

        html.AppendLine("</tbody>");
        html.AppendLine("</table>");
        return html.ToString();
    }

    private string RenderSummary(InvoiceSchemaSection section, Sale sale)
    {
        var html = new StringBuilder();
        html.AppendLine("<div class='summary'>");
        html.AppendLine($"<div class='summary-line'><span>Subtotal:</span><span>{sale.Subtotal:F2}</span></div>");

        if (sale.TotalDiscount > 0)
        {
            html.AppendLine($"<div class='summary-line'><span>Discount:</span><span>-{sale.TotalDiscount:F2}</span></div>");

            // Show subtotal after discount (total excluding VAT)
            var totalExclVat = sale.Subtotal - sale.TotalDiscount;
            html.AppendLine($"<div class='summary-line'><span>Total (Excl. VAT):</span><span>{totalExclVat:F2}</span></div>");
        }

        // Only show VAT line if there is VAT
        if (sale.TaxAmount > 0)
        {
            html.AppendLine($"<div class='summary-line'><span>VAT (15%):</span><span>{sale.TaxAmount:F2}</span></div>");
        }

        html.AppendLine($"<div class='summary-line total'><span>Total:</span><span>{sale.Total:F2}</span></div>");
        html.AppendLine("</div>");
        return html.ToString();
    }

    private string RenderFooter(InvoiceSchemaSection section, Sale sale, string zatcaQRCode)
    {
        var html = new StringBuilder();
        html.AppendLine("<div class='footer'>");

        if (section.Config?.ContainsKey("showZatcaQR") == true && (bool)(section.Config["showZatcaQR"] ?? false))
        {
            html.AppendLine($"<img src='data:image/png;base64,{zatcaQRCode}' alt='ZATCA QR Code' />");
            html.AppendLine("<p>Scan for e-Invoice verification</p>");
        }

        html.AppendLine("<p>Thank you for your business!</p>");
        html.AppendLine("</div>");
        return html.ToString();
    }

    private int GetPaperWidth(PaperSize paperSize, int? customWidth)
    {
        return paperSize switch
        {
            PaperSize.Thermal58mm => 58,
            PaperSize.Thermal80mm => 80,
            PaperSize.A4 => 210,
            PaperSize.Custom => customWidth ?? 80,
            _ => 80
        };
    }

    private Sale GenerateSampleSale()
    {
        return new Sale
        {
            Id = Guid.NewGuid(),
            TransactionId = "TXN-SAMPLE-001",
            InvoiceNumber = "INV-SAMPLE-001",
            InvoiceType = InvoiceType.Standard,
            SaleDate = DateTime.UtcNow,
            Subtotal = 100.00m,
            TaxAmount = 15.00m,
            TotalDiscount = 5.00m,
            Total = 110.00m,
            PaymentMethod = PaymentMethod.Cash,
            CashierId = Guid.NewGuid(),
            LineItems = new List<SaleLineItem>
            {
                new SaleLineItem
                {
                    ProductId = Guid.NewGuid(),
                    Quantity = 2,
                    UnitPrice = 30.00m,
                    LineTotal = 60.00m,
                    Notes = "Handle with care - fragile item",
                    Product = new Product
                    {
                        NameEn = "Sample Product 1",
                        NameAr = "منتج نموذجي 1",
                        SKU = "SAMPLE-001",
                        CategoryId = Guid.NewGuid(),
                        SellingPrice = 30.00m,
                        CostPrice = 20.00m,
                        CreatedBy = Guid.NewGuid()
                    }
                },
                new SaleLineItem
                {
                    ProductId = Guid.NewGuid(),
                    Quantity = 1,
                    UnitPrice = 45.00m,
                    LineTotal = 45.00m,
                    Notes = null, // No notes for this item
                    Product = new Product
                    {
                        NameEn = "Sample Product 2",
                        NameAr = "منتج نموذجي 2",
                        SKU = "SAMPLE-002",
                        CategoryId = Guid.NewGuid(),
                        SellingPrice = 45.00m,
                        CostPrice = 30.00m,
                        CreatedBy = Guid.NewGuid()
                    }
                }
            },
            Customer = new Customer
            {
                Code = "CUST-SAMPLE",
                NameEn = "Sample Customer",
                NameAr = "عميل نموذجي",
                Email = "customer@example.com",
                Phone = "+966 50 123 4567",
                CreatedBy = Guid.NewGuid()
            }
        };
    }
}

// Schema classes for JSON deserialization
public class InvoiceSchema
{
    public string Version { get; set; } = "1.0";
    public string PaperSize { get; set; } = "Thermal80mm";
    public bool PriceIncludesVat { get; set; } = true;
    public List<InvoiceSchemaSection>? Sections { get; set; }
    public InvoiceStyling? Styling { get; set; }
}

public class InvoiceSchemaSection
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool Visible { get; set; } = true;
    public Dictionary<string, object>? Config { get; set; }

    /// <summary>
    /// Captures any additional properties not explicitly defined (like alignment, fields, etc.)
    /// </summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? ExtensionData { get; set; }
}

public class InvoiceStyling
{
    public string? FontFamily { get; set; }
    public FontSizes? FontSize { get; set; }
    public SpacingConfig? Spacing { get; set; }
}

public class FontSizes
{
    public string? Header { get; set; }
    public string? Title { get; set; }
    public string? Body { get; set; }
    public string? Footer { get; set; }
}

public class SpacingConfig
{
    public string? SectionGap { get; set; }
    public string? LineHeight { get; set; }
    public string? Padding { get; set; }
}
