using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddUnitsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UnitId",
                table: "Products",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Code = table.Column<string>(maxLength: 20, nullable: false),
                    NameEn = table.Column<string>(maxLength: 100, nullable: false),
                    NameAr = table.Column<string>(maxLength: 100, nullable: false),
                    Symbol = table.Column<string>(maxLength: 10, nullable: true),
                    IsBaseUnit = table.Column<bool>(nullable: false),
                    BaseUnitId = table.Column<Guid>(nullable: true),
                    ConversionFactor = table.Column<decimal>(precision: 18, scale: 6, nullable: true),
                    AllowFractional = table.Column<bool>(nullable: false),
                    DecimalPlaces = table.Column<int>(nullable: false),
                    DisplayOrder = table.Column<int>(nullable: false),
                    IsActive = table.Column<bool>(nullable: false),
                    Notes = table.Column<string>(maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Units_Units_BaseUnitId",
                        column: x => x.BaseUnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_UnitId",
                table: "Products",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_BaseUnitId",
                table: "Units",
                column: "BaseUnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_Code",
                table: "Units",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Units_DisplayOrder",
                table: "Units",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Units_IsActive",
                table: "Units",
                column: "IsActive");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Units_UnitId",
                table: "Products",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Units_UnitId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropIndex(
                name: "IX_Products_UnitId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "Products");
        }
    }
}
