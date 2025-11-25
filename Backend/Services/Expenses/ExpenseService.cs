using Backend.Data;
using Backend.Models.DTOs.Expenses;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Expenses;

/// <summary>
/// Service implementation for expense management operations
/// </summary>
public class ExpenseService : IExpenseService
{
    private readonly BranchDbContext _context;

    public ExpenseService(BranchDbContext context)
    {
        _context = context;
    }

    public async Task<(List<ExpenseDto> Expenses, int TotalCount)> GetExpensesAsync(
        Guid? categoryId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int? approvalStatus = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.Expenses
            .Include(e => e.Category)
            .AsQueryable();

        // Apply filters
        if (categoryId.HasValue)
        {
            query = query.Where(e => e.ExpenseCategoryId == categoryId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDate <= endDate.Value);
        }

        if (approvalStatus.HasValue)
        {
            query = query.Where(e => (int)e.ApprovalStatus == approvalStatus.Value);
        }

        var totalCount = await query.CountAsync();

        var expenses = await query
            .OrderByDescending(e => e.ExpenseDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ExpenseDto
            {
                Id = e.Id,
                ExpenseCategoryId = e.ExpenseCategoryId,
                CategoryNameEn = e.Category.NameEn,
                CategoryNameAr = e.Category.NameAr,
                Amount = e.Amount,
                ExpenseDate = e.ExpenseDate,
                DescriptionEn = e.DescriptionEn,
                DescriptionAr = e.DescriptionAr,
                PaymentMethod = (int)e.PaymentMethod,
                PaymentReference = e.PaymentReference,
                ReceiptImagePath = e.ReceiptImagePath,
                ApprovalStatus = (int)e.ApprovalStatus,
                ApprovedBy = e.ApprovedBy,
                ApprovedAt = e.ApprovedAt,
                CreatedAt = e.CreatedAt,
                CreatedBy = e.CreatedBy
            })
            .ToListAsync();

        return (expenses, totalCount);
    }

    public async Task<ExpenseDto?> GetExpenseByIdAsync(Guid expenseId)
    {
        var expense = await _context.Expenses
            .Include(e => e.Category)
            .Where(e => e.Id == expenseId)
            .Select(e => new ExpenseDto
            {
                Id = e.Id,
                ExpenseCategoryId = e.ExpenseCategoryId,
                CategoryNameEn = e.Category.NameEn,
                CategoryNameAr = e.Category.NameAr,
                Amount = e.Amount,
                ExpenseDate = e.ExpenseDate,
                DescriptionEn = e.DescriptionEn,
                DescriptionAr = e.DescriptionAr,
                PaymentMethod = (int)e.PaymentMethod,
                PaymentReference = e.PaymentReference,
                ReceiptImagePath = e.ReceiptImagePath,
                ApprovalStatus = (int)e.ApprovalStatus,
                ApprovedBy = e.ApprovedBy,
                ApprovedAt = e.ApprovedAt,
                CreatedAt = e.CreatedAt,
                CreatedBy = e.CreatedBy
            })
            .FirstOrDefaultAsync();

        return expense;
    }

    public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto dto, Guid userId)
    {
        // Verify category exists
        var category = await _context.ExpenseCategories.FindAsync(dto.ExpenseCategoryId);
        if (category == null)
        {
            throw new KeyNotFoundException($"Expense category with ID '{dto.ExpenseCategoryId}' not found.");
        }

        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            ExpenseCategoryId = dto.ExpenseCategoryId,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate,
            DescriptionEn = dto.DescriptionEn,
            DescriptionAr = dto.DescriptionAr,
            PaymentMethod = (PaymentMethod)dto.PaymentMethod,
            PaymentReference = dto.PaymentReference,
            ReceiptImagePath = dto.ReceiptImagePath,
            ApprovalStatus = ApprovalStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        return new ExpenseDto
        {
            Id = expense.Id,
            ExpenseCategoryId = expense.ExpenseCategoryId,
            CategoryNameEn = category.NameEn,
            CategoryNameAr = category.NameAr,
            Amount = expense.Amount,
            ExpenseDate = expense.ExpenseDate,
            DescriptionEn = expense.DescriptionEn,
            DescriptionAr = expense.DescriptionAr,
            PaymentMethod = (int)expense.PaymentMethod,
            PaymentReference = expense.PaymentReference,
            ReceiptImagePath = expense.ReceiptImagePath,
            ApprovalStatus = (int)expense.ApprovalStatus,
            ApprovedBy = expense.ApprovedBy,
            ApprovedAt = expense.ApprovedAt,
            CreatedAt = expense.CreatedAt,
            CreatedBy = expense.CreatedBy
        };
    }

    public async Task<ExpenseDto> UpdateExpenseAsync(Guid expenseId, CreateExpenseDto dto)
    {
        var expense = await _context.Expenses
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == expenseId);

        if (expense == null)
        {
            throw new KeyNotFoundException($"Expense with ID '{expenseId}' not found.");
        }

        // Only allow updates for pending expenses
        if (expense.ApprovalStatus != ApprovalStatus.Pending)
        {
            throw new InvalidOperationException("Cannot update an expense that has been approved or rejected.");
        }

        // Verify category exists if changed
        if (expense.ExpenseCategoryId != dto.ExpenseCategoryId)
        {
            var category = await _context.ExpenseCategories.FindAsync(dto.ExpenseCategoryId);
            if (category == null)
            {
                throw new KeyNotFoundException($"Expense category with ID '{dto.ExpenseCategoryId}' not found.");
            }
            expense.ExpenseCategoryId = dto.ExpenseCategoryId;
        }

        // Update expense properties
        expense.Amount = dto.Amount;
        expense.ExpenseDate = dto.ExpenseDate;
        expense.DescriptionEn = dto.DescriptionEn;
        expense.DescriptionAr = dto.DescriptionAr;
        expense.PaymentMethod = (PaymentMethod)dto.PaymentMethod;
        expense.PaymentReference = dto.PaymentReference;
        expense.ReceiptImagePath = dto.ReceiptImagePath;

        await _context.SaveChangesAsync();

        // Reload category if changed
        if (expense.Category == null)
        {
            await _context.Entry(expense).Reference(e => e.Category).LoadAsync();
        }

        return new ExpenseDto
        {
            Id = expense.Id,
            ExpenseCategoryId = expense.ExpenseCategoryId,
            CategoryNameEn = expense.Category.NameEn,
            CategoryNameAr = expense.Category.NameAr,
            Amount = expense.Amount,
            ExpenseDate = expense.ExpenseDate,
            DescriptionEn = expense.DescriptionEn,
            DescriptionAr = expense.DescriptionAr,
            PaymentMethod = (int)expense.PaymentMethod,
            PaymentReference = expense.PaymentReference,
            ReceiptImagePath = expense.ReceiptImagePath,
            ApprovalStatus = (int)expense.ApprovalStatus,
            ApprovedBy = expense.ApprovedBy,
            ApprovedAt = expense.ApprovedAt,
            CreatedAt = expense.CreatedAt,
            CreatedBy = expense.CreatedBy
        };
    }

    public async Task DeleteExpenseAsync(Guid expenseId)
    {
        var expense = await _context.Expenses.FindAsync(expenseId);

        if (expense == null)
        {
            throw new KeyNotFoundException($"Expense with ID '{expenseId}' not found.");
        }

        // Only allow deletion of pending expenses
        if (expense.ApprovalStatus != ApprovalStatus.Pending)
        {
            throw new InvalidOperationException("Cannot delete an expense that has been approved or rejected.");
        }

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();
    }

    public async Task<ExpenseDto> ApproveExpenseAsync(Guid expenseId, Guid userId, bool approved)
    {
        var expense = await _context.Expenses
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == expenseId);

        if (expense == null)
        {
            throw new KeyNotFoundException($"Expense with ID '{expenseId}' not found.");
        }

        if (expense.ApprovalStatus != ApprovalStatus.Pending)
        {
            throw new InvalidOperationException("Expense has already been approved or rejected.");
        }

        expense.ApprovalStatus = approved ? ApprovalStatus.Approved : ApprovalStatus.Rejected;
        expense.ApprovedBy = userId;
        expense.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ExpenseDto
        {
            Id = expense.Id,
            ExpenseCategoryId = expense.ExpenseCategoryId,
            CategoryNameEn = expense.Category.NameEn,
            CategoryNameAr = expense.Category.NameAr,
            Amount = expense.Amount,
            ExpenseDate = expense.ExpenseDate,
            DescriptionEn = expense.DescriptionEn,
            DescriptionAr = expense.DescriptionAr,
            PaymentMethod = (int)expense.PaymentMethod,
            PaymentReference = expense.PaymentReference,
            ReceiptImagePath = expense.ReceiptImagePath,
            ApprovalStatus = (int)expense.ApprovalStatus,
            ApprovedBy = expense.ApprovedBy,
            ApprovedAt = expense.ApprovedAt,
            CreatedAt = expense.CreatedAt,
            CreatedBy = expense.CreatedBy
        };
    }

    public async Task<List<ExpenseCategoryDto>> GetExpenseCategoriesAsync(bool includeInactive = false)
    {
        var query = _context.ExpenseCategories.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        var categories = await query
            .OrderBy(c => c.NameEn)
            .Select(c => new ExpenseCategoryDto
            {
                Id = c.Id,
                Code = c.Code,
                NameEn = c.NameEn,
                NameAr = c.NameAr,
                BudgetAllocation = c.BudgetAllocation,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                TotalExpenses = c.Expenses.Where(e => e.ApprovalStatus == ApprovalStatus.Approved).Sum(e => (decimal?)e.Amount),
                ExpenseCount = c.Expenses.Count
            })
            .ToListAsync();

        return categories;
    }

    public async Task<ExpenseCategoryDto> CreateExpenseCategoryAsync(string code, string nameEn, string nameAr, decimal? budgetAllocation = null)
    {
        // Check for duplicate code
        var existingCategory = await _context.ExpenseCategories
            .FirstOrDefaultAsync(c => c.Code == code);

        if (existingCategory != null)
        {
            throw new InvalidOperationException($"An expense category with code '{code}' already exists.");
        }

        var category = new ExpenseCategory
        {
            Id = Guid.NewGuid(),
            Code = code,
            NameEn = nameEn,
            NameAr = nameAr,
            BudgetAllocation = budgetAllocation,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.ExpenseCategories.Add(category);
        await _context.SaveChangesAsync();

        return new ExpenseCategoryDto
        {
            Id = category.Id,
            Code = category.Code,
            NameEn = category.NameEn,
            NameAr = category.NameAr,
            BudgetAllocation = category.BudgetAllocation,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            TotalExpenses = 0,
            ExpenseCount = 0
        };
    }
}
