namespace Backend.Constants;

/// <summary>
/// Centralized API route definitions for all endpoints
/// </summary>
public static class ApiRoutes
{
    /// <summary>
    /// API version prefix
    /// </summary>
    public const string ApiVersion = "v1";

    /// <summary>
    /// Base API path
    /// </summary>
    public const string ApiBase = "/api/v1";

    /// <summary>
    /// Health check routes
    /// </summary>
    public static class Health
    {
        public const string Base = "/health";
    }

    /// <summary>
    /// Authentication and authorization routes
    /// </summary>
    public static class Auth
    {
        public const string Group = $"{ApiBase}/auth";
        public const string Login = "/login";
        public const string Logout = "/logout";
        public const string Refresh = "/refresh";
        public const string Me = "/me";
    }

    /// <summary>
    /// Sales transaction routes
    /// </summary>
    public static class Sales
    {
        public const string Group = $"{ApiBase}/sales";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Void = "{id}/void";
        public const string Invoice = "{id}/invoice";
        public const string Stats = "stats";
    }

    /// <summary>
    /// Product routes
    /// </summary>
    public static class Products
    {
        public const string Group = $"{ApiBase}/products";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Update = "{id}";
        public const string Delete = "{id}";
        public const string AdjustStock = "{id}/adjust-stock";
    }

    /// <summary>
    /// Category routes
    /// </summary>
    public static class Categories
    {
        public const string Group = $"{ApiBase}/categories";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Update = "{id}";
        public const string Delete = "{id}";
    }

    /// <summary>
    /// Customer routes
    /// </summary>
    public static class Customers
    {
        public const string Group = $"{ApiBase}/customers";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Update = "{id}";
        public const string Delete = "{id}";
        public const string History = "{id}/history";
    }

    /// <summary>
    /// Supplier routes
    /// </summary>
    public static class Suppliers
    {
        public const string Group = $"{ApiBase}/suppliers";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Update = "{id}";
        public const string Delete = "{id}";
        public const string History = "{id}/history";
    }

    /// <summary>
    /// Purchase order routes
    /// </summary>
    public static class Purchases
    {
        public const string Group = $"{ApiBase}/purchases";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Receive = "{id}/receive";
    }

    /// <summary>
    /// Expense routes
    /// </summary>
    public static class Expenses
    {
        public const string Group = $"{ApiBase}/expenses";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Update = "{id}";
        public const string Delete = "{id}";
        public const string Approve = "{id}/approve";
    }

    /// <summary>
    /// Expense category routes
    /// </summary>
    public static class ExpenseCategories
    {
        public const string Group = $"{ApiBase}/expense-categories";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Update = "{id}";
        public const string Delete = "{id}";
    }

    /// <summary>
    /// Branch routes
    /// </summary>
    public static class Branches
    {
        public const string Group = $"{ApiBase}/branches";
        public const string Create = "";
        public const string List = "";
        public const string Lookup = "lookup";
        public const string ById = "{id}";
        public const string Update = "{id}";
        public const string Delete = "{id}";
        public const string Settings = "{id}/settings";
        public const string UpdateSettings = "{id}/settings";
        public const string TestConnection = "{id}/test-connection";
    }

    /// <summary>
    /// User routes
    /// </summary>
    public static class Users
    {
        public const string Group = $"{ApiBase}/users";
        public const string Create = "";
        public const string List = "";
        public const string ById = "{id}";
        public const string Update = "{id}";
        public const string Delete = "{id}";
        public const string AssignBranch = "{id}/assign-branch";
        public const string RemoveBranchAssignment = "{userId}/branches/{branchId}";
        public const string Activity = "{userId}/activity";
    }

    /// <summary>
    /// Sync routes
    /// </summary>
    public static class Sync
    {
        public const string Group = $"{ApiBase}/sync";
        public const string Transaction = "transaction";
        public const string Batch = "batch";
        public const string Status = "status";
    }

    /// <summary>
    /// Image routes
    /// </summary>
    public static class Images
    {
        public const string Group = $"{ApiBase}/images";
        public const string Upload = "upload";
        public const string UploadMultiple = "upload-multiple";
        public const string Get = "{branchName}/{entityType}/{entityId}/{size}";
        public const string UpdateProduct = "products/{id}";
        public const string Delete = "{branchName}/{entityType}/{entityId}";
    }

    /// <summary>
    /// Report routes
    /// </summary>
    public static class Reports
    {
        public const string Group = $"{ApiBase}/reports";
        public const string Sales = "sales";
        public const string Inventory = "inventory";
        public const string Financial = "financial";
        public const string Export = "export";
    }

    /// <summary>
    /// Audit log routes
    /// </summary>
    public static class Audit
    {
        public const string Group = $"{ApiBase}/audit";
        public const string Logs = "logs";
        public const string UserTrail = "user/{userId}";
    }
}
