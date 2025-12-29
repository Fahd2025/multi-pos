using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddReturnInvoiceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsReturn",
                table: "Sales",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "OriginalSaleId",
                table: "Sales",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReturnApprovedBy",
                table: "Sales",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnDate",
                table: "Sales",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnNotes",
                table: "Sales",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnReason",
                table: "Sales",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ItemStatus",
                table: "SaleLineItems",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ReturnQuantity",
                table: "SaleLineItems",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Sales_IsReturn",
                table: "Sales",
                column: "IsReturn");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_OriginalSaleId",
                table: "Sales",
                column: "OriginalSaleId");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_ReturnDate",
                table: "Sales",
                column: "ReturnDate");

            migrationBuilder.CreateIndex(
                name: "IX_SaleLineItems_ItemStatus",
                table: "SaleLineItems",
                column: "ItemStatus");

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_Sales_OriginalSaleId",
                table: "Sales",
                column: "OriginalSaleId",
                principalTable: "Sales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sales_Sales_OriginalSaleId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_IsReturn",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_OriginalSaleId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_ReturnDate",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_SaleLineItems_ItemStatus",
                table: "SaleLineItems");

            migrationBuilder.DropColumn(
                name: "IsReturn",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "OriginalSaleId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ReturnApprovedBy",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ReturnDate",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ReturnNotes",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ReturnReason",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ItemStatus",
                table: "SaleLineItems");

            migrationBuilder.DropColumn(
                name: "ReturnQuantity",
                table: "SaleLineItems");
        }
    }
}
