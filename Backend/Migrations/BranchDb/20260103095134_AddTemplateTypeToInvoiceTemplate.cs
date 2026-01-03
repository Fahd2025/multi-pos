using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.BranchDb
{
    /// <inheritdoc />
    public partial class AddTemplateTypeToInvoiceTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TemplateType",
                table: "InvoiceTemplates",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TemplateType",
                table: "InvoiceTemplates");
        }
    }
}
