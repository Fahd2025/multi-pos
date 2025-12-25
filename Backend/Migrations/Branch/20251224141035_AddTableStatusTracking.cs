using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddTableStatusTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Tables",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "Available");

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentSaleId",
                table: "Tables",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CurrentGuestCount",
                table: "Tables",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OccupiedAt",
                table: "Tables",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Tables");

            migrationBuilder.DropColumn(
                name: "CurrentSaleId",
                table: "Tables");

            migrationBuilder.DropColumn(
                name: "CurrentGuestCount",
                table: "Tables");

            migrationBuilder.DropColumn(
                name: "OccupiedAt",
                table: "Tables");
        }
    }
}
