using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddPendingOrdersTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PendingOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    OrderNumber = table.Column<string>(maxLength: 20, nullable: false),
                    CustomerName = table.Column<string>(maxLength: 200, nullable: true),
                    CustomerPhone = table.Column<string>(maxLength: 20, nullable: true),
                    CustomerId = table.Column<Guid>(nullable: true),
                    TableId = table.Column<Guid>(nullable: true),
                    TableNumber = table.Column<string>(maxLength: 20, nullable: true),
                    GuestCount = table.Column<int>(nullable: true),
                    Subtotal = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    TaxAmount = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    DiscountAmount = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    TotalAmount = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    Notes = table.Column<string>(maxLength: 500, nullable: true),
                    OrderType = table.Column<int>(nullable: false),
                    Status = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: true),
                    CreatedByUserId = table.Column<string>(maxLength: 100, nullable: false),
                    CreatedByUsername = table.Column<string>(maxLength: 100, nullable: false),
                    RetrievedAt = table.Column<DateTime>(nullable: true),
                    ExpiresAt = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PendingOrderItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    PendingOrderId = table.Column<Guid>(nullable: false),
                    ProductId = table.Column<Guid>(nullable: false),
                    ProductName = table.Column<string>(maxLength: 200, nullable: false),
                    ProductSku = table.Column<string>(maxLength: 50, nullable: true),
                    UnitPrice = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<int>(nullable: false),
                    Discount = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    TotalPrice = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                    Notes = table.Column<string>(maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingOrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PendingOrderItems_PendingOrders_PendingOrderId",
                        column: x => x.PendingOrderId,
                        principalTable: "PendingOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrderItems_PendingOrderId",
                table: "PendingOrderItems",
                column: "PendingOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrderItems_ProductId",
                table: "PendingOrderItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrders_CreatedAt",
                table: "PendingOrders",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrders_CreatedByUserId",
                table: "PendingOrders",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrders_CustomerName",
                table: "PendingOrders",
                column: "CustomerName");

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrders_ExpiresAt",
                table: "PendingOrders",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrders_OrderNumber",
                table: "PendingOrders",
                column: "OrderNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrders_OrderType",
                table: "PendingOrders",
                column: "OrderType");

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrders_Status",
                table: "PendingOrders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PendingOrders_TableNumber",
                table: "PendingOrders",
                column: "TableNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PendingOrderItems");

            migrationBuilder.DropTable(
                name: "PendingOrders");
        }
    }
}
