using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddDiscountAndTaxToPurchases : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "Purchases",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "DiscountType",
                table: "Purchases",
                maxLength: 20,
                nullable: false,
                defaultValue: "amount");

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountValue",
                table: "Purchases",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GrandTotal",
                table: "Purchases",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Subtotal",
                table: "Purchases",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "Purchases",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "TaxIncluded",
                table: "Purchases",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxRate",
                table: "Purchases",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "DiscountAmount", table: "Purchases");
            migrationBuilder.DropColumn(name: "DiscountType", table: "Purchases");
            migrationBuilder.DropColumn(name: "DiscountValue", table: "Purchases");
            migrationBuilder.DropColumn(name: "GrandTotal", table: "Purchases");
            migrationBuilder.DropColumn(name: "Subtotal", table: "Purchases");
            migrationBuilder.DropColumn(name: "TaxAmount", table: "Purchases");
            migrationBuilder.DropColumn(name: "TaxIncluded", table: "Purchases");
            migrationBuilder.DropColumn(name: "TaxRate", table: "Purchases");
        }
    }
}
