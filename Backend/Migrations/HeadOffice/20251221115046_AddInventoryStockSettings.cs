using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.HeadOffice
{
    /// <inheritdoc />
    public partial class AddInventoryStockSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowNegativeStock",
                table: "Branches",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "NegativeStockLimit",
                table: "Branches",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowNegativeStock",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "NegativeStockLimit",
                table: "Branches");
        }
    }
}
