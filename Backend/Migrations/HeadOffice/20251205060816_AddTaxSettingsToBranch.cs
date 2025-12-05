using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.HeadOffice
{
    /// <inheritdoc />
    public partial class AddTaxSettingsToBranch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnableTax",
                table: "Branches",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PriceIncludesTax",
                table: "Branches",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnableTax",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "PriceIncludesTax",
                table: "Branches");
        }
    }
}
