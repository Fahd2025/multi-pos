using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.HeadOffice
{
    /// <inheritdoc />
    public partial class DeleteUserAssignmentAndCreateBranchUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BranchUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BranchId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    FullNameEn = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    FullNameAr = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    PreferredLanguage = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastActivityAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SyncedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BranchUsers_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BranchUsers_BranchId",
                table: "BranchUsers",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_BranchUsers_BranchId_Username",
                table: "BranchUsers",
                columns: new[] { "BranchId", "Username" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BranchUsers_Email",
                table: "BranchUsers",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_BranchUsers_IsActive",
                table: "BranchUsers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_BranchUsers_Username",
                table: "BranchUsers",
                column: "Username");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BranchUsers");
        }
    }
}
