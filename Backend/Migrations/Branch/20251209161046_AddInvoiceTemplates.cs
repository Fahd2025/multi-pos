using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddInvoiceTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BranchInfo");

            migrationBuilder.CreateTable(
                name: "InvoiceTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    PaperSize = table.Column<int>(type: "INTEGER", nullable: false),
                    CustomWidth = table.Column<int>(type: "INTEGER", nullable: true),
                    CustomHeight = table.Column<int>(type: "INTEGER", nullable: true),
                    Schema = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceTemplates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceTemplates_Name",
                table: "InvoiceTemplates",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceTemplates_IsActive",
                table: "InvoiceTemplates",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceTemplates_CreatedAt",
                table: "InvoiceTemplates",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InvoiceTemplates");

            migrationBuilder.CreateTable(
                name: "BranchInfo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Address = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CommercialRegNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    BranchName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    BranchNameAr = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    LogoUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    PostalCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    VatNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Website = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchInfo", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BranchInfo_CommercialRegNumber",
                table: "BranchInfo",
                column: "CommercialRegNumber");

            migrationBuilder.CreateIndex(
                name: "IX_BranchInfo_VatNumber",
                table: "BranchInfo",
                column: "VatNumber");
        }
    }
}
