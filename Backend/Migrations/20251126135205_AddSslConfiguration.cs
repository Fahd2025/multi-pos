using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSslConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "UserActivityLogs");

            migrationBuilder.RenameColumn(
                name: "ActivityType",
                table: "UserActivityLogs",
                newName: "EntityType");

            migrationBuilder.AddColumn<string>(
                name: "Action",
                table: "UserActivityLogs",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Details",
                table: "UserActivityLogs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EntityId",
                table: "UserActivityLogs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "UserActivityLogs",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SslMode",
                table: "Branches",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "TrustServerCertificate",
                table: "Branches",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Action",
                table: "UserActivityLogs");

            migrationBuilder.DropColumn(
                name: "Details",
                table: "UserActivityLogs");

            migrationBuilder.DropColumn(
                name: "EntityId",
                table: "UserActivityLogs");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                table: "UserActivityLogs");

            migrationBuilder.DropColumn(
                name: "SslMode",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "TrustServerCertificate",
                table: "Branches");

            migrationBuilder.RenameColumn(
                name: "EntityType",
                table: "UserActivityLogs",
                newName: "ActivityType");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "UserActivityLogs",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }
    }
}
