using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddDriverTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Drivers",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Code = table.Column<string>(maxLength: 50, nullable: false),
                    NameEn = table.Column<string>(maxLength: 200, nullable: false),
                    NameAr = table.Column<string>(maxLength: 200, nullable: true),
                    Phone = table.Column<string>(maxLength: 50, nullable: false),
                    Email = table.Column<string>(maxLength: 255, nullable: true),
                    AddressEn = table.Column<string>(maxLength: 500, nullable: true),
                    AddressAr = table.Column<string>(maxLength: 500, nullable: true),
                    LicenseNumber = table.Column<string>(maxLength: 50, nullable: false),
                    LicenseExpiryDate = table.Column<DateTime>(nullable: false),
                    VehicleNumber = table.Column<string>(maxLength: 50, nullable: true),
                    VehicleType = table.Column<string>(maxLength: 100, nullable: true),
                    VehicleColor = table.Column<string>(maxLength: 50, nullable: true),
                    ProfileImagePath = table.Column<string>(maxLength: 500, nullable: true),
                    LicenseImagePath = table.Column<string>(maxLength: 500, nullable: true),
                    VehicleImagePath = table.Column<string>(maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    IsAvailable = table.Column<bool>(nullable: false),
                    TotalDeliveries = table.Column<int>(nullable: false),
                    AverageRating = table.Column<decimal>(precision: 3, scale: 2, nullable: true),
                    Notes = table.Column<string>(maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Drivers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_Code",
                table: "Drivers",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_Email",
                table: "Drivers",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_IsActive",
                table: "Drivers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_IsAvailable",
                table: "Drivers",
                column: "IsAvailable");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_LicenseNumber",
                table: "Drivers",
                column: "LicenseNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_Phone",
                table: "Drivers",
                column: "Phone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Drivers");
        }
    }
}
