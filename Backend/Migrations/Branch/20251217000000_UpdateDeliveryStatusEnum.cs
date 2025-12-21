using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class UpdateDeliveryStatusEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update DeliveryStatus enum values to remove PickedUp and Cancelled statuses
            // New mapping:
            // - Pending (0) -> Pending (0) [no change]
            // - Assigned (1) -> Assigned (1) [no change]
            // - PickedUp (2) -> OutForDelivery (2) [already correct value, just renamed]
            // - OutForDelivery (3) -> OutForDelivery (2) [need to update]
            // - Delivered (4) -> Delivered (3) [need to update]
            // - Failed (5) -> Failed (4) [need to update]
            // - Cancelled (6) -> Failed (4) [consolidate into Failed]

            var provider = migrationBuilder.ActiveProvider;

            if (provider != null && provider.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase))
            {
                // PostgreSQL-specific with table existence check
                migrationBuilder.Sql(@"
                    DO $$
                    BEGIN
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DeliveryOrders') THEN
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 100 WHERE ""DeliveryStatus"" = 6;
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 101 WHERE ""DeliveryStatus"" = 5;
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 3 WHERE ""DeliveryStatus"" = 4;
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 2 WHERE ""DeliveryStatus"" = 3;
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 4 WHERE ""DeliveryStatus"" = 100;
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 4 WHERE ""DeliveryStatus"" = 101;
                        END IF;
                    END $$;
                ");
            }
            else if (provider != null && provider.Contains("SqlServer", StringComparison.OrdinalIgnoreCase))
            {
                // SQL Server-specific with table existence check
                migrationBuilder.Sql(@"
                    IF OBJECT_ID('DeliveryOrders', 'U') IS NOT NULL
                    BEGIN
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 100 WHERE [DeliveryStatus] = 6;
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 101 WHERE [DeliveryStatus] = 5;
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 3 WHERE [DeliveryStatus] = 4;
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 2 WHERE [DeliveryStatus] = 3;
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 4 WHERE [DeliveryStatus] = 100;
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 4 WHERE [DeliveryStatus] = 101;
                    END
                ");
            }
            else if (provider != null && provider.Contains("MySql", StringComparison.OrdinalIgnoreCase))
            {
                // MySQL-specific - just run updates, MySQL is more forgiving
                migrationBuilder.Sql(@"
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 100 WHERE `DeliveryStatus` = 6;
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 101 WHERE `DeliveryStatus` = 5;
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 3 WHERE `DeliveryStatus` = 4;
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 2 WHERE `DeliveryStatus` = 3;
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 4 WHERE `DeliveryStatus` = 100;
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 4 WHERE `DeliveryStatus` = 101;
                ");
            }
            else
            {
                // SQLite and others - use double quotes (ANSI SQL standard)
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 100 WHERE \"DeliveryStatus\" = 6");
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 101 WHERE \"DeliveryStatus\" = 5");
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 3 WHERE \"DeliveryStatus\" = 4");
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 2 WHERE \"DeliveryStatus\" = 3");
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 4 WHERE \"DeliveryStatus\" = 100");
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 4 WHERE \"DeliveryStatus\" = 101");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort rollback to restore old enum values
            var provider = migrationBuilder.ActiveProvider;

            if (provider != null && provider.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase))
            {
                // PostgreSQL-specific with table existence check
                migrationBuilder.Sql(@"
                    DO $$
                    BEGIN
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DeliveryOrders') THEN
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 5 WHERE ""DeliveryStatus"" = 4;
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 4 WHERE ""DeliveryStatus"" = 3;
                            UPDATE ""DeliveryOrders"" SET ""DeliveryStatus"" = 3 WHERE ""DeliveryStatus"" = 2;
                        END IF;
                    END $$;
                ");
            }
            else if (provider != null && provider.Contains("SqlServer", StringComparison.OrdinalIgnoreCase))
            {
                // SQL Server-specific with table existence check
                migrationBuilder.Sql(@"
                    IF OBJECT_ID('DeliveryOrders', 'U') IS NOT NULL
                    BEGIN
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 5 WHERE [DeliveryStatus] = 4;
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 4 WHERE [DeliveryStatus] = 3;
                        UPDATE [DeliveryOrders] SET [DeliveryStatus] = 3 WHERE [DeliveryStatus] = 2;
                    END
                ");
            }
            else if (provider != null && provider.Contains("MySql", StringComparison.OrdinalIgnoreCase))
            {
                // MySQL-specific
                migrationBuilder.Sql(@"
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 5 WHERE `DeliveryStatus` = 4;
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 4 WHERE `DeliveryStatus` = 3;
                    UPDATE `DeliveryOrders` SET `DeliveryStatus` = 3 WHERE `DeliveryStatus` = 2;
                ");
            }
            else
            {
                // SQLite and others - use double quotes (ANSI SQL standard)
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 5 WHERE \"DeliveryStatus\" = 4");
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 4 WHERE \"DeliveryStatus\" = 3");
                migrationBuilder.Sql("UPDATE \"DeliveryOrders\" SET \"DeliveryStatus\" = 3 WHERE \"DeliveryStatus\" = 2");
            }
        }
    }
}
