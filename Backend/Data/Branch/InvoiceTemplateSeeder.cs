using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Branch;

/// <summary>
/// Seeds initial invoice templates for a branch
/// </summary>
public static class InvoiceTemplateSeeder
{
    /// <summary>
    /// Seeds default invoice templates if none exist
    /// Creates templates for 58mm, 80mm (default), and A4 sizes
    /// </summary>
    public static async Task SeedAsync(BranchDbContext context, Guid adminUserId)
    {
        // Check if any templates already exist
        var existingCount = await context.InvoiceTemplates.CountAsync();
        if (existingCount > 0)
        {
            return; // Templates already exist, skip seeding
        }

        var templates = new[]
        {
            CreateThermal58mmTemplate(adminUserId),
            CreateThermal80mmTemplate(adminUserId, isActive: true), // Default active template
            CreateA4Template(adminUserId)
        };

        await context.InvoiceTemplates.AddRangeAsync(templates);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Creates a 58mm thermal receipt template
    /// </summary>
    private static InvoiceTemplate CreateThermal58mmTemplate(Guid createdBy)
    {
        var schema = @"{
  ""version"": ""1.0"",
  ""paperSize"": ""58mm"",
  ""sections"": [
    {
      ""type"": ""header"",
      ""alignment"": ""center"",
      ""fields"": [
        { ""field"": ""companyLogo"", ""show"": true, ""maxHeight"": 50 },
        { ""field"": ""companyName"", ""show"": true, ""fontSize"": 14, ""bold"": true },
        { ""field"": ""companyNameAr"", ""show"": true, ""fontSize"": 12, ""bold"": true },
        { ""field"": ""vatNumber"", ""show"": true, ""prefix"": ""VAT: "" },
        { ""field"": ""phone"", ""show"": true }
      ]
    },
    {
      ""type"": ""invoice-info"",
      ""alignment"": ""left"",
      ""fields"": [
        { ""field"": ""invoiceType"", ""show"": true, ""fontSize"": 12, ""bold"": true },
        { ""field"": ""invoiceNumber"", ""show"": true, ""prefix"": ""Invoice: "" },
        { ""field"": ""invoiceDate"", ""show"": true, ""prefix"": ""Date: "" },
        { ""field"": ""cashierName"", ""show"": true, ""prefix"": ""Cashier: "" }
      ]
    },
    {
      ""type"": ""customer-info"",
      ""show"": false,
      ""alignment"": ""left"",
      ""fields"": [
        { ""field"": ""customerName"", ""show"": true, ""prefix"": ""Customer: "" }
      ]
    },
    {
      ""type"": ""line-items"",
      ""showBorders"": false,
      ""columns"": [
        { ""field"": ""name"", ""label"": ""Item"", ""width"": 60 },
        { ""field"": ""quantity"", ""label"": ""Qty"", ""width"": 15, ""alignment"": ""right"" },
        { ""field"": ""lineTotal"", ""label"": ""Total"", ""width"": 25, ""alignment"": ""right"" }
      ]
    },
    {
      ""type"": ""totals"",
      ""alignment"": ""right"",
      ""fields"": [
        { ""field"": ""subtotal"", ""show"": true, ""label"": ""Subtotal"" },
        { ""field"": ""discount"", ""show"": true, ""label"": ""Discount"" },
        { ""field"": ""vatAmount"", ""show"": true, ""label"": ""VAT (15%)"" },
        { ""field"": ""total"", ""show"": true, ""label"": ""TOTAL"", ""fontSize"": 14, ""bold"": true }
      ]
    },
    {
      ""type"": ""footer"",
      ""alignment"": ""center"",
      ""fields"": [
        { ""field"": ""zatcaQrCode"", ""show"": true, ""size"": 100 },
        { ""field"": ""customText"", ""show"": true, ""text"": ""Thank you for your business!"" }
      ]
    }
  ]
}";

        return new InvoiceTemplate
        {
            Id = Guid.NewGuid(),
            Name = "Default 58mm Thermal Receipt",
            Description = "Compact thermal receipt template for 58mm printers",
            IsActive = false,
            PaperSize = PaperSize.Thermal58mm,
            Schema = schema,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Creates an 80mm thermal receipt template (default)
    /// </summary>
    private static InvoiceTemplate CreateThermal80mmTemplate(Guid createdBy, bool isActive = false)
    {
        var schema = @"{
  ""version"": ""1.0"",
  ""paperSize"": ""80mm"",
  ""sections"": [
    {
      ""type"": ""header"",
      ""alignment"": ""center"",
      ""fields"": [
        { ""field"": ""companyLogo"", ""show"": true, ""maxHeight"": 80 },
        { ""field"": ""companyName"", ""show"": true, ""fontSize"": 16, ""bold"": true },
        { ""field"": ""companyNameAr"", ""show"": true, ""fontSize"": 14, ""bold"": true },
        { ""field"": ""address"", ""show"": true, ""fontSize"": 10 },
        { ""field"": ""phone"", ""show"": true, ""fontSize"": 10 },
        { ""field"": ""vatNumber"", ""show"": true, ""prefix"": ""VAT: "", ""fontSize"": 10 },
        { ""field"": ""commercialRegNumber"", ""show"": true, ""prefix"": ""CR: "", ""fontSize"": 10 }
      ]
    },
    {
      ""type"": ""separator"",
      ""style"": ""dashed""
    },
    {
      ""type"": ""invoice-info"",
      ""alignment"": ""left"",
      ""fields"": [
        { ""field"": ""invoiceType"", ""show"": true, ""fontSize"": 14, ""bold"": true, ""alignment"": ""center"" },
        { ""field"": ""invoiceNumber"", ""show"": true, ""prefix"": ""Invoice #: "", ""bold"": true },
        { ""field"": ""invoiceDate"", ""show"": true, ""prefix"": ""Date: "" },
        { ""field"": ""cashierName"", ""show"": true, ""prefix"": ""Cashier: "" }
      ]
    },
    {
      ""type"": ""customer-info"",
      ""show"": true,
      ""alignment"": ""left"",
      ""fields"": [
        { ""field"": ""customerName"", ""show"": true, ""prefix"": ""Customer: "", ""bold"": true },
        { ""field"": ""customerVatNumber"", ""show"": true, ""prefix"": ""VAT: "" },
        { ""field"": ""customerPhone"", ""show"": true, ""prefix"": ""Phone: "" }
      ]
    },
    {
      ""type"": ""separator"",
      ""style"": ""solid""
    },
    {
      ""type"": ""line-items"",
      ""showBorders"": true,
      ""fontSize"": 10,
      ""columns"": [
        { ""field"": ""name"", ""label"": ""Item"", ""width"": 45 },
        { ""field"": ""quantity"", ""label"": ""Qty"", ""width"": 10, ""alignment"": ""center"" },
        { ""field"": ""unitPrice"", ""label"": ""Price"", ""width"": 20, ""alignment"": ""right"" },
        { ""field"": ""lineTotal"", ""label"": ""Total"", ""width"": 25, ""alignment"": ""right"" }
      ]
    },
    {
      ""type"": ""separator"",
      ""style"": ""solid""
    },
    {
      ""type"": ""totals"",
      ""alignment"": ""right"",
      ""fields"": [
        { ""field"": ""subtotal"", ""show"": true, ""label"": ""Subtotal:"", ""fontSize"": 11 },
        { ""field"": ""discount"", ""show"": true, ""label"": ""Discount:"", ""fontSize"": 11 },
        { ""field"": ""vatAmount"", ""show"": true, ""label"": ""VAT (15%):"", ""fontSize"": 11 },
        { ""field"": ""total"", ""show"": true, ""label"": ""TOTAL:"", ""fontSize"": 16, ""bold"": true }
      ]
    },
    {
      ""type"": ""separator"",
      ""style"": ""dashed""
    },
    {
      ""type"": ""footer"",
      ""alignment"": ""center"",
      ""fields"": [
        { ""field"": ""zatcaQrCode"", ""show"": true, ""size"": 120 },
        { ""field"": ""customText"", ""show"": true, ""text"": ""Thank you for your business!"", ""fontSize"": 11 },
        { ""field"": ""customText"", ""show"": true, ""text"": ""Please visit us again"", ""fontSize"": 9 }
      ]
    }
  ]
}";

        return new InvoiceTemplate
        {
            Id = Guid.NewGuid(),
            Name = "Default 80mm Thermal Receipt",
            Description = "Standard thermal receipt template for 80mm printers with full details",
            IsActive = isActive,
            PaperSize = PaperSize.Thermal80mm,
            Schema = schema,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Creates an A4 invoice template
    /// </summary>
    private static InvoiceTemplate CreateA4Template(Guid createdBy)
    {
        var schema = @"{
  ""version"": ""1.0"",
  ""paperSize"": ""A4"",
  ""sections"": [
    {
      ""type"": ""header"",
      ""layout"": ""split"",
      ""left"": {
        ""fields"": [
          { ""field"": ""companyLogo"", ""show"": true, ""maxHeight"": 100 },
          { ""field"": ""companyName"", ""show"": true, ""fontSize"": 20, ""bold"": true },
          { ""field"": ""companyNameAr"", ""show"": true, ""fontSize"": 16, ""bold"": true }
        ]
      },
      ""right"": {
        ""alignment"": ""right"",
        ""fields"": [
          { ""field"": ""address"", ""show"": true, ""fontSize"": 11 },
          { ""field"": ""phone"", ""show"": true, ""fontSize"": 11, ""prefix"": ""Tel: "" },
          { ""field"": ""email"", ""show"": true, ""fontSize"": 11, ""prefix"": ""Email: "" },
          { ""field"": ""website"", ""show"": true, ""fontSize"": 11 },
          { ""field"": ""vatNumber"", ""show"": true, ""fontSize"": 11, ""prefix"": ""VAT: "", ""bold"": true },
          { ""field"": ""commercialRegNumber"", ""show"": true, ""fontSize"": 11, ""prefix"": ""CR: "" }
        ]
      }
    },
    {
      ""type"": ""invoice-info"",
      ""layout"": ""split"",
      ""left"": {
        ""title"": ""Bill To:"",
        ""fields"": [
          { ""field"": ""customerName"", ""show"": true, ""fontSize"": 12, ""bold"": true },
          { ""field"": ""customerVatNumber"", ""show"": true, ""prefix"": ""VAT: "" },
          { ""field"": ""customerPhone"", ""show"": true, ""prefix"": ""Phone: "" }
        ]
      },
      ""right"": {
        ""alignment"": ""right"",
        ""fields"": [
          { ""field"": ""invoiceType"", ""show"": true, ""fontSize"": 18, ""bold"": true },
          { ""field"": ""invoiceNumber"", ""show"": true, ""fontSize"": 14, ""bold"": true },
          { ""field"": ""invoiceDate"", ""show"": true, ""prefix"": ""Date: "", ""fontSize"": 12 },
          { ""field"": ""cashierName"", ""show"": true, ""prefix"": ""Issued by: "", ""fontSize"": 11 }
        ]
      }
    },
    {
      ""type"": ""line-items"",
      ""showBorders"": true,
      ""fontSize"": 11,
      ""headerBackground"": ""#f0f0f0"",
      ""alternateRowColors"": true,
      ""columns"": [
        { ""field"": ""index"", ""label"": ""#"", ""width"": 5, ""alignment"": ""center"" },
        { ""field"": ""name"", ""label"": ""Description"", ""width"": 45 },
        { ""field"": ""quantity"", ""label"": ""Quantity"", ""width"": 10, ""alignment"": ""center"" },
        { ""field"": ""unitPrice"", ""label"": ""Unit Price"", ""width"": 15, ""alignment"": ""right"" },
        { ""field"": ""discount"", ""label"": ""Discount"", ""width"": 10, ""alignment"": ""right"" },
        { ""field"": ""lineTotal"", ""label"": ""Total"", ""width"": 15, ""alignment"": ""right"", ""bold"": true }
      ]
    },
    {
      ""type"": ""totals"",
      ""alignment"": ""right"",
      ""width"": 40,
      ""fields"": [
        { ""field"": ""subtotal"", ""show"": true, ""label"": ""Subtotal:"", ""fontSize"": 12 },
        { ""field"": ""discount"", ""show"": true, ""label"": ""Total Discount:"", ""fontSize"": 12 },
        { ""field"": ""vatAmount"", ""show"": true, ""label"": ""VAT (15%):"", ""fontSize"": 12 },
        { ""field"": ""total"", ""show"": true, ""label"": ""GRAND TOTAL:"", ""fontSize"": 16, ""bold"": true, ""background"": ""#f0f0f0"" }
      ]
    },
    {
      ""type"": ""footer"",
      ""layout"": ""split"",
      ""left"": {
        ""fields"": [
          { ""field"": ""customText"", ""show"": true, ""text"": ""Terms & Conditions:"", ""bold"": true, ""fontSize"": 10 },
          { ""field"": ""customText"", ""show"": true, ""text"": ""• Payment is due within 30 days"", ""fontSize"": 9 },
          { ""field"": ""customText"", ""show"": true, ""text"": ""• Please include invoice number with payment"", ""fontSize"": 9 },
          { ""field"": ""customText"", ""show"": true, ""text"": ""• Thank you for your business!"", ""fontSize"": 9 }
        ]
      },
      ""right"": {
        ""alignment"": ""center"",
        ""fields"": [
          { ""field"": ""zatcaQrCode"", ""show"": true, ""size"": 150 },
          { ""field"": ""customText"", ""show"": true, ""text"": ""Scan for verification"", ""fontSize"": 9 }
        ]
      }
    }
  ]
}";

        return new InvoiceTemplate
        {
            Id = Guid.NewGuid(),
            Name = "Default A4 Invoice",
            Description = "Professional A4 invoice template with comprehensive layout",
            IsActive = false,
            PaperSize = PaperSize.A4,
            Schema = schema,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
