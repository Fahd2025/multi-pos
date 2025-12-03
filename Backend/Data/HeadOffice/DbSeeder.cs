namespace Backend.Data.HeadOffice;

public static class DbSeeder
{
    public static async Task SeedAsync(HeadOfficeDbContext context)
    {
        // Delegate to HeadOfficeDbSeeder which handles all seeding logic
        await HeadOfficeDbSeeder.SeedAsync(context);
    }
}
