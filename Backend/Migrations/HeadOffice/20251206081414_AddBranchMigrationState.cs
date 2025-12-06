using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.HeadOffice
{
    /// <inheritdoc />
    public partial class AddBranchMigrationState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BranchMigrationStates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BranchId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LastMigrationApplied = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    LastAttemptAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RetryCount = table.Column<int>(type: "INTEGER", nullable: false),
                    ErrorDetails = table.Column<string>(type: "TEXT", nullable: true),
                    LockOwnerId = table.Column<string>(type: "TEXT", nullable: true),
                    LockExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchMigrationStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BranchMigrationStates_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BranchMigrationStates_BranchId",
                table: "BranchMigrationStates",
                column: "BranchId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BranchMigrationStates_LastAttemptAt",
                table: "BranchMigrationStates",
                column: "LastAttemptAt");

            migrationBuilder.CreateIndex(
                name: "IX_BranchMigrationStates_LockExpiresAt",
                table: "BranchMigrationStates",
                column: "LockExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_BranchMigrationStates_Status",
                table: "BranchMigrationStates",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BranchMigrationStates");
        }
    }
}
