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
  ""paperSize"": ""Thermal58mm"",
  ""priceIncludesVat"": true,
  ""sections"": [
    {
      ""id"": ""header"",
      ""type"": ""header"",
      ""order"": 1,
      ""visible"": true,
      ""config"": {
        ""showLogo"": true,
        ""showBranchName"": true,
        ""branchNameLabel"": ""Branch Name"",
        ""showAddress"": false,
        ""addressLabel"": ""Address"",
        ""showPhone"": true,
        ""phoneLabel"": ""Phone"",
        ""showVatNumber"": true,
        ""vatNumberLabel"": ""VAT Number"",
        ""showCRN"": false,
        ""crnLabel"": ""CR Number"",
        ""alignment"": ""center""
      }
    },
    {
      ""id"": ""invoice-title"",
      ""type"": ""title"",
      ""order"": 2,
      ""visible"": true,
      ""config"": {
        ""dynamicTitle"": true,
        ""standardTitle"": ""Standard Tax Invoice"",
        ""simplifiedTitle"": ""Simplified Tax Invoice""
      }
    },
    {
      ""id"": ""customer-info"",
      ""type"": ""customer"",
      ""order"": 3,
      ""visible"": false,
      ""config"": {
        ""fields"": [
          { ""key"": ""name"", ""label"": ""Customer Name"", ""visible"": true },
          { ""key"": ""vatNumber"", ""label"": ""VAT Number"", ""visible"": false },
          { ""key"": ""phone"", ""label"": ""Phone"", ""visible"": false },
          { ""key"": ""buildingNumber"", ""label"": ""Building Number"", ""visible"": false },
          { ""key"": ""streetName"", ""label"": ""Street Name"", ""visible"": false },
          { ""key"": ""district"", ""label"": ""District"", ""visible"": false },
          { ""key"": ""city"", ""label"": ""City"", ""visible"": false },
          { ""key"": ""postalCode"", ""label"": ""Postal Code"", ""visible"": false },
          { ""key"": ""additionalNumber"", ""label"": ""Additional Number"", ""visible"": false },
          { ""key"": ""unitNumber"", ""label"": ""Unit Number"", ""visible"": false }
        ]
      }
    },
    {
      ""id"": ""invoice-meta"",
      ""type"": ""metadata"",
      ""order"": 4,
      ""visible"": true,
      ""config"": {
        ""fields"": [
          { ""key"": ""invoiceNumber"", ""label"": ""Invoice #"", ""visible"": true },
          { ""key"": ""date"", ""label"": ""Date"", ""visible"": true },
          { ""key"": ""cashier"", ""label"": ""Cashier"", ""visible"": true }
        ]
      }
    },
    {
      ""id"": ""items-table"",
      ""type"": ""items"",
      ""order"": 5,
      ""visible"": true,
      ""config"": {
        ""columns"": [
          { ""key"": ""name"", ""label"": ""Item"", ""visible"": true, ""width"": ""60%"" },
          { ""key"": ""quantity"", ""label"": ""Qty"", ""visible"": true, ""width"": ""15%"" },
          { ""key"": ""price"", ""label"": ""Price"", ""visible"": false, ""width"": ""0%"" },
          { ""key"": ""total"", ""label"": ""Total"", ""visible"": true, ""width"": ""25%"" }
        ]
      }
    },
    {
      ""id"": ""summary"",
      ""type"": ""summary"",
      ""order"": 6,
      ""visible"": true,
      ""config"": {
        ""fields"": [
          { ""key"": ""subtotal"", ""label"": ""Subtotal"", ""visible"": true },
          { ""key"": ""discount"", ""label"": ""Discount"", ""visible"": true },
          { ""key"": ""vatAmount"", ""label"": ""VAT (15%)"", ""visible"": true },
          { ""key"": ""total"", ""label"": ""Total"", ""visible"": true, ""highlight"": true }
        ]
      }
    },
    {
      ""id"": ""footer"",
      ""type"": ""footer"",
      ""order"": 7,
      ""visible"": true,
      ""config"": {
        ""showBarcode"": false,
        ""barcodeLabel"": ""Invoice Number"",
        ""barcodeFormat"": ""CODE128"",
        ""barcodeWidth"": 2,
        ""barcodeHeight"": 40,
        ""showBarcodeValue"": true,
        ""showZatcaQR"": true,
        ""zatcaQRLabel"": ""Scan for e-Invoice"",
        ""showOrderType"": false,
        ""orderTypeLabel"": ""Order Type"",
        ""showPaymentMethod"": false,
        ""paymentMethodLabel"": ""Payment Method"",
        ""showNotes"": true,
        ""notesLabel"": ""Notes"",
        ""notesText"": ""Thank you for your business!"",
        ""showPoweredBy"": false,
        ""poweredByText"": """"
      }
    }
  ],
  ""styling"": {
    ""fontFamily"": ""Arial, sans-serif"",
    ""fontSize"": {
      ""header"": ""12px"",
      ""title"": ""14px"",
      ""body"": ""10px"",
      ""footer"": ""9px""
    },
    ""spacing"": {
      ""sectionGap"": ""12px"",
      ""lineHeight"": ""1.4"",
      ""padding"": ""8px""
    }
  }
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
  ""paperSize"": ""Thermal80mm"",
  ""priceIncludesVat"": true,
  ""sections"": [
    {
      ""id"": ""header"",
      ""type"": ""header"",
      ""order"": 1,
      ""visible"": true,
      ""config"": {
        ""showLogo"": true,
        ""showBranchName"": true,
        ""branchNameLabel"": ""Branch Name"",
        ""showAddress"": true,
        ""addressLabel"": ""Address"",
        ""showPhone"": true,
        ""phoneLabel"": ""Phone"",
        ""showVatNumber"": true,
        ""vatNumberLabel"": ""VAT Number"",
        ""showCRN"": true,
        ""crnLabel"": ""CR Number"",
        ""alignment"": ""center""
      }
    },
    {
      ""id"": ""invoice-title"",
      ""type"": ""title"",
      ""order"": 2,
      ""visible"": true,
      ""config"": {
        ""dynamicTitle"": true,
        ""standardTitle"": ""Standard Tax Invoice"",
        ""simplifiedTitle"": ""Simplified Tax Invoice""
      }
    },
    {
      ""id"": ""customer-info"",
      ""type"": ""customer"",
      ""order"": 3,
      ""visible"": true,
      ""config"": {
        ""fields"": [
          { ""key"": ""name"", ""label"": ""Customer Name"", ""visible"": true },
          { ""key"": ""vatNumber"", ""label"": ""VAT Number"", ""visible"": true },
          { ""key"": ""phone"", ""label"": ""Phone"", ""visible"": true }
        ]
      }
    },
    {
      ""id"": ""invoice-meta"",
      ""type"": ""metadata"",
      ""order"": 4,
      ""visible"": true,
      ""config"": {
        ""fields"": [
          { ""key"": ""invoiceNumber"", ""label"": ""Invoice #"", ""visible"": true },
          { ""key"": ""date"", ""label"": ""Date"", ""visible"": true },
          { ""key"": ""cashier"", ""label"": ""Cashier"", ""visible"": true }
        ]
      }
    },
    {
      ""id"": ""items-table"",
      ""type"": ""items"",
      ""order"": 5,
      ""visible"": true,
      ""config"": {
        ""columns"": [
          { ""key"": ""name"", ""label"": ""Item"", ""visible"": true, ""width"": ""40%"" },
          { ""key"": ""quantity"", ""label"": ""Qty"", ""visible"": true, ""width"": ""15%"" },
          { ""key"": ""price"", ""label"": ""Price"", ""visible"": true, ""width"": ""20%"" },
          { ""key"": ""total"", ""label"": ""Total"", ""visible"": true, ""width"": ""25%"" }
        ]
      }
    },
    {
      ""id"": ""summary"",
      ""type"": ""summary"",
      ""order"": 6,
      ""visible"": true,
      ""config"": {
        ""fields"": [
          { ""key"": ""subtotal"", ""label"": ""Subtotal"", ""visible"": true },
          { ""key"": ""discount"", ""label"": ""Discount"", ""visible"": true },
          { ""key"": ""vatAmount"", ""label"": ""VAT (15%)"", ""visible"": true },
          { ""key"": ""total"", ""label"": ""Total"", ""visible"": true, ""highlight"": true }
        ]
      }
    },
    {
      ""id"": ""footer"",
      ""type"": ""footer"",
      ""order"": 7,
      ""visible"": true,
      ""config"": {
        ""showBarcode"": false,
        ""barcodeLabel"": ""Invoice Number"",
        ""barcodeFormat"": ""CODE128"",
        ""barcodeWidth"": 2,
        ""barcodeHeight"": 40,
        ""showBarcodeValue"": true,
        ""showZatcaQR"": true,
        ""zatcaQRLabel"": ""Scan for e-Invoice"",
        ""showOrderType"": false,
        ""orderTypeLabel"": ""Order Type"",
        ""showPaymentMethod"": false,
        ""paymentMethodLabel"": ""Payment Method"",
        ""showNotes"": true,
        ""notesLabel"": ""Notes"",
        ""notesText"": ""Thank you for your business!"",
        ""showPoweredBy"": false,
        ""poweredByText"": """"
      }
    }
  ],
  ""styling"": {
    ""fontFamily"": ""Arial, sans-serif"",
    ""fontSize"": {
      ""header"": ""14px"",
      ""title"": ""16px"",
      ""body"": ""12px"",
      ""footer"": ""10px""
    },
    ""spacing"": {
      ""sectionGap"": ""15px"",
      ""lineHeight"": ""1.5"",
      ""padding"": ""10px""
    }
  }
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
  ""priceIncludesVat"": true,
  ""sections"": [
    {
      ""id"": ""header"",
      ""type"": ""header"",
      ""order"": 1,
      ""visible"": true,
      ""config"": {
        ""showLogo"": true,
        ""showBranchName"": true,
        ""branchNameLabel"": ""Branch Name"",
        ""showAddress"": true,
        ""addressLabel"": ""Address"",
        ""showPhone"": true,
        ""phoneLabel"": ""Phone"",
        ""showVatNumber"": true,
        ""vatNumberLabel"": ""VAT Number"",
        ""showCRN"": true,
        ""crnLabel"": ""CR Number"",
        ""alignment"": ""center""
      }
    },
    {
      ""id"": ""invoice-title"",
      ""type"": ""title"",
      ""order"": 2,
      ""visible"": true,
      ""config"": {
        ""dynamicTitle"": true,
        ""standardTitle"": ""Standard Tax Invoice"",
        ""simplifiedTitle"": ""Simplified Tax Invoice""
      }
    },
    {
      ""id"": ""customer-info"",
      ""type"": ""customer"",
      ""order"": 3,
      ""visible"": true,
      ""config"": {
        ""fields"": [
          { ""key"": ""name"", ""label"": ""Customer Name"", ""visible"": true },
          { ""key"": ""vatNumber"", ""label"": ""VAT Number"", ""visible"": true },
          { ""key"": ""phone"", ""label"": ""Phone"", ""visible"": true }
        ]
      }
    },
    {
      ""id"": ""invoice-meta"",
      ""type"": ""metadata"",
      ""order"": 4,
      ""visible"": true,
      ""config"": {
        ""fields"": [
          { ""key"": ""invoiceNumber"", ""label"": ""Invoice #"", ""visible"": true },
          { ""key"": ""date"", ""label"": ""Date"", ""visible"": true },
          { ""key"": ""cashier"", ""label"": ""Cashier"", ""visible"": true }
        ]
      }
    },
    {
      ""id"": ""items-table"",
      ""type"": ""items"",
      ""order"": 5,
      ""visible"": true,
      ""config"": {
        ""columns"": [
          { ""key"": ""name"", ""label"": ""Item"", ""visible"": true, ""width"": ""40%"" },
          { ""key"": ""quantity"", ""label"": ""Qty"", ""visible"": true, ""width"": ""15%"" },
          { ""key"": ""price"", ""label"": ""Price"", ""visible"": true, ""width"": ""20%"" },
          { ""key"": ""total"", ""label"": ""Total"", ""visible"": true, ""width"": ""25%"" }
        ]
      }
    },
    {
      ""id"": ""summary"",
      ""type"": ""summary"",
      ""order"": 6,
      ""visible"": true,
      ""config"": {
        ""fields"": [
          { ""key"": ""subtotal"", ""label"": ""Subtotal"", ""visible"": true },
          { ""key"": ""discount"", ""label"": ""Discount"", ""visible"": true },
          { ""key"": ""vatAmount"", ""label"": ""VAT (15%)"", ""visible"": true },
          { ""key"": ""total"", ""label"": ""Total"", ""visible"": true, ""highlight"": true }
        ]
      }
    },
    {
      ""id"": ""footer"",
      ""type"": ""footer"",
      ""order"": 7,
      ""visible"": true,
      ""config"": {
        ""showZatcaQR"": true,
        ""zatcaQRLabel"": ""Scan for e-Invoice"",
        ""showNotes"": true,
        ""notesLabel"": ""Notes"",
        ""notesText"": ""Thank you for your business! Payment is due within 30 days."",
        ""showPoweredBy"": false,
        ""poweredByText"": """"
      }
    }
  ],
  ""styling"": {
    ""fontFamily"": ""Arial, sans-serif"",
    ""fontSize"": {
      ""header"": ""16px"",
      ""title"": ""18px"",
      ""body"": ""12px"",
      ""footer"": ""10px""
    },
    ""spacing"": {
      ""sectionGap"": ""20px"",
      ""lineHeight"": ""1.6"",
      ""padding"": ""15px""
    }
  }
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
