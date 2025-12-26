using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class ChangePendingOrderTableNumberToInt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Note: Pending orders are temporary (expire after 24 hours)
            // Dropping and recreating the column is acceptable
            // Any existing pending orders will lose their table number, but the order itself remains

            migrationBuilder.DropColumn(
                name: "TableNumber",
                table: "PendingOrders");

            migrationBuilder.AddColumn<int>(
                name: "TableNumber",
                table: "PendingOrders",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TableNumber",
                table: "PendingOrders");

            migrationBuilder.AddColumn<string>(
                name: "TableNumber",
                table: "PendingOrders",
                maxLength: 20,
                nullable: true);
        }
    }
}
