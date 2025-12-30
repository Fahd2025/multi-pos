using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddCashDrawerReturnsPrinterAndSplitPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CashDrawers",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    BranchId = table.Column<Guid>(nullable: false),
                    OpenedBy = table.Column<Guid>(nullable: false),
                    OpenedAt = table.Column<DateTime>(nullable: false),
                    OpeningBalance = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    ClosedBy = table.Column<Guid>(nullable: true),
                    ClosedAt = table.Column<DateTime>(nullable: true),
                    ExpectedCash = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    ActualCash = table.Column<decimal>(precision: 18, scale: 2, nullable: true),
                    Variance = table.Column<decimal>(precision: 18, scale: 2, nullable: true),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    DenominationBreakdown = table.Column<string>(nullable: true),
                    Notes = table.Column<string>(maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashDrawers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CashDrawers_Users_ClosedBy",
                        column: x => x.ClosedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CashDrawers_Users_OpenedBy",
                        column: x => x.OpenedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PrinterConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    BranchId = table.Column<Guid>(nullable: false),
                    PrinterName = table.Column<string>(maxLength: 100, nullable: false),
                    ConnectionType = table.Column<string>(maxLength: 20, nullable: false),
                    IpAddress = table.Column<string>(maxLength: 50, nullable: true),
                    Port = table.Column<int>(nullable: true),
                    PrinterModel = table.Column<string>(maxLength: 50, nullable: true),
                    PaperWidth = table.Column<int>(nullable: false),
                    AutoPrint = table.Column<bool>(nullable: false),
                    HeaderLine1 = table.Column<string>(maxLength: 200, nullable: true),
                    HeaderLine2 = table.Column<string>(maxLength: 200, nullable: true),
                    HeaderLine3 = table.Column<string>(maxLength: 200, nullable: true),
                    TaxNumber = table.Column<string>(maxLength: 100, nullable: true),
                    FooterLine1 = table.Column<string>(maxLength: 200, nullable: true),
                    FooterLine2 = table.Column<string>(maxLength: 200, nullable: true),
                    FooterLine3 = table.Column<string>(maxLength: 200, nullable: true),
                    PrintLogo = table.Column<bool>(nullable: false),
                    LogoPath = table.Column<string>(maxLength: 500, nullable: true),
                    PrintBarcode = table.Column<bool>(nullable: false),
                    PrintQrCode = table.Column<bool>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrinterConfigurations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReturnPolicies",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    BranchId = table.Column<Guid>(nullable: false),
                    MaxReturnDays = table.Column<int>(nullable: false),
                    RequireReceipt = table.Column<bool>(nullable: false),
                    RequireManagerApproval = table.Column<bool>(nullable: false),
                    AllowedConditions = table.Column<string>(nullable: false),
                    RestockingFeePercent = table.Column<decimal>(precision: 5, scale: 2, nullable: false),
                    RefundMethods = table.Column<string>(nullable: false),
                    ExchangeAllowed = table.Column<bool>(nullable: false),
                    IsActive = table.Column<bool>(nullable: false),
                    Notes = table.Column<string>(maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnPolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SalePayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    SaleId = table.Column<Guid>(nullable: false),
                    PaymentMethod = table.Column<int>(nullable: false),
                    Amount = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    Reference = table.Column<string>(maxLength: 100, nullable: true),
                    ProcessedAt = table.Column<DateTime>(nullable: false),
                    ProcessedBy = table.Column<Guid>(nullable: false),
                    Notes = table.Column<string>(maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalePayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SalePayments_Sales_SaleId",
                        column: x => x.SaleId,
                        principalTable: "Sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SalePayments_Users_ProcessedBy",
                        column: x => x.ProcessedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CashTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CashDrawerId = table.Column<Guid>(nullable: false),
                    Type = table.Column<string>(maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    Reason = table.Column<string>(maxLength: 500, nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    Reference = table.Column<string>(maxLength: 100, nullable: true),
                    Notes = table.Column<string>(maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CashTransactions_CashDrawers_CashDrawerId",
                        column: x => x.CashDrawerId,
                        principalTable: "CashDrawers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CashTransactions_Users_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Returns",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    BranchId = table.Column<Guid>(nullable: false),
                    OriginalSaleId = table.Column<Guid>(nullable: false),
                    CustomerId = table.Column<Guid>(nullable: true),
                    ReturnDate = table.Column<DateTime>(nullable: false),
                    Reason = table.Column<string>(maxLength: 500, nullable: false),
                    Status = table.Column<string>(maxLength: 50, nullable: false),
                    Subtotal = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    TaxAmount = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    RestockingFee = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    RefundMethod = table.Column<string>(maxLength: 50, nullable: true),
                    RefundReference = table.Column<string>(maxLength: 100, nullable: true),
                    ProcessedBy = table.Column<Guid>(nullable: false),
                    ApprovedBy = table.Column<Guid>(nullable: true),
                    ApprovedAt = table.Column<DateTime>(nullable: true),
                    CompletedAt = table.Column<DateTime>(nullable: true),
                    Notes = table.Column<string>(maxLength: 1000, nullable: true),
                    ReturnPolicyId = table.Column<Guid>(nullable: true),
                    IsExchange = table.Column<bool>(nullable: false),
                    ExchangeSaleId = table.Column<Guid>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Returns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Returns_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Returns_ReturnPolicies_ReturnPolicyId",
                        column: x => x.ReturnPolicyId,
                        principalTable: "ReturnPolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Returns_Sales_ExchangeSaleId",
                        column: x => x.ExchangeSaleId,
                        principalTable: "Sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Returns_Sales_OriginalSaleId",
                        column: x => x.OriginalSaleId,
                        principalTable: "Sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Returns_Users_ApprovedBy",
                        column: x => x.ApprovedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Returns_Users_ProcessedBy",
                        column: x => x.ProcessedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReturnLineItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ReturnId = table.Column<Guid>(nullable: false),
                    SaleLineItemId = table.Column<Guid>(nullable: false),
                    ProductId = table.Column<Guid>(nullable: false),
                    Quantity = table.Column<int>(nullable: false),
                    UnitPrice = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    DiscountValue = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    Condition = table.Column<string>(maxLength: 50, nullable: false),
                    LineTotal = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    Notes = table.Column<string>(maxLength: 500, nullable: true),
                    Restocked = table.Column<bool>(nullable: false),
                    RestockedAt = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnLineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReturnLineItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnLineItems_Returns_ReturnId",
                        column: x => x.ReturnId,
                        principalTable: "Returns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReturnLineItems_SaleLineItems_SaleLineItemId",
                        column: x => x.SaleLineItemId,
                        principalTable: "SaleLineItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CashDrawers_BranchId",
                table: "CashDrawers",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_CashDrawers_ClosedAt",
                table: "CashDrawers",
                column: "ClosedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CashDrawers_ClosedBy",
                table: "CashDrawers",
                column: "ClosedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CashDrawers_OpenedAt",
                table: "CashDrawers",
                column: "OpenedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CashDrawers_OpenedBy",
                table: "CashDrawers",
                column: "OpenedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CashDrawers_Status",
                table: "CashDrawers",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransactions_CashDrawerId",
                table: "CashTransactions",
                column: "CashDrawerId");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransactions_CreatedAt",
                table: "CashTransactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransactions_CreatedBy",
                table: "CashTransactions",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransactions_Type",
                table: "CashTransactions",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_PrinterConfigurations_BranchId",
                table: "PrinterConfigurations",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_PrinterConfigurations_ConnectionType",
                table: "PrinterConfigurations",
                column: "ConnectionType");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnLineItems_ProductId",
                table: "ReturnLineItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnLineItems_ReturnId",
                table: "ReturnLineItems",
                column: "ReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnLineItems_SaleLineItemId",
                table: "ReturnLineItems",
                column: "SaleLineItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnPolicies_BranchId",
                table: "ReturnPolicies",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnPolicies_CreatedAt",
                table: "ReturnPolicies",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnPolicies_IsActive",
                table: "ReturnPolicies",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_ApprovedBy",
                table: "Returns",
                column: "ApprovedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_BranchId",
                table: "Returns",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_CustomerId",
                table: "Returns",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_ExchangeSaleId",
                table: "Returns",
                column: "ExchangeSaleId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_OriginalSaleId",
                table: "Returns",
                column: "OriginalSaleId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_ProcessedBy",
                table: "Returns",
                column: "ProcessedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_ReturnDate",
                table: "Returns",
                column: "ReturnDate");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_ReturnPolicyId",
                table: "Returns",
                column: "ReturnPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_Status",
                table: "Returns",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SalePayments_PaymentMethod",
                table: "SalePayments",
                column: "PaymentMethod");

            migrationBuilder.CreateIndex(
                name: "IX_SalePayments_ProcessedAt",
                table: "SalePayments",
                column: "ProcessedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SalePayments_ProcessedBy",
                table: "SalePayments",
                column: "ProcessedBy");

            migrationBuilder.CreateIndex(
                name: "IX_SalePayments_SaleId",
                table: "SalePayments",
                column: "SaleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CashTransactions");

            migrationBuilder.DropTable(
                name: "PrinterConfigurations");

            migrationBuilder.DropTable(
                name: "ReturnLineItems");

            migrationBuilder.DropTable(
                name: "SalePayments");

            migrationBuilder.DropTable(
                name: "CashDrawers");

            migrationBuilder.DropTable(
                name: "Returns");

            migrationBuilder.DropTable(
                name: "ReturnPolicies");
        }
    }
}
