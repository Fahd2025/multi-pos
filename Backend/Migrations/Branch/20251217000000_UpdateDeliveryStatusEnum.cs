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

            // Update in reverse order to avoid conflicts
            // First, convert Cancelled (6) to a temporary value to avoid conflicts
            migrationBuilder.Sql("UPDATE DeliveryOrders SET DeliveryStatus = 100 WHERE DeliveryStatus = 6");

            // Convert old Failed (5) to a temporary value
            migrationBuilder.Sql("UPDATE DeliveryOrders SET DeliveryStatus = 101 WHERE DeliveryStatus = 5");

            // Convert old Delivered (4) to new Delivered (3)
            migrationBuilder.Sql("UPDATE DeliveryOrders SET DeliveryStatus = 3 WHERE DeliveryStatus = 4");

            // Convert old OutForDelivery (3) to new OutForDelivery (2)
            // Note: Old PickedUp (2) is already at value 2, which is correct for new OutForDelivery
            migrationBuilder.Sql("UPDATE DeliveryOrders SET DeliveryStatus = 2 WHERE DeliveryStatus = 3");

            // Now convert the temporary values to new Failed (4)
            migrationBuilder.Sql("UPDATE DeliveryOrders SET DeliveryStatus = 4 WHERE DeliveryStatus = 100");
            migrationBuilder.Sql("UPDATE DeliveryOrders SET DeliveryStatus = 4 WHERE DeliveryStatus = 101");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Downgrade is not supported because we've consolidated Cancelled into Failed
            // and removed the distinction between PickedUp and OutForDelivery
            // If you need to rollback, you'll need to manually handle data migration
            throw new NotSupportedException(
                "Downgrade migration is not supported for DeliveryStatus enum changes. " +
                "The PickedUp and Cancelled statuses have been removed and consolidated."
            );
        }
    }
}
