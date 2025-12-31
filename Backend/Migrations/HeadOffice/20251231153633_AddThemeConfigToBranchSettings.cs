using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.HeadOffice
{
    /// <inheritdoc />
    public partial class AddThemeConfigToBranchSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThemeConfigJson",
                table: "Branches",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThemeConfigJson",
                table: "Branches");
        }
    }
}
