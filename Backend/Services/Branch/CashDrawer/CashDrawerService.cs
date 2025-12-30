using System.Text.Json;
using Backend.Data.Branch;
using Backend.Models.DTOs.CashDrawer;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch.CashDrawer;

/// <summary>
/// Service for cash drawer operations
/// </summary>
public class CashDrawerService : ICashDrawerService
{
    private readonly BranchDbContext _context;
    private readonly ILogger<CashDrawerService> _logger;

    public CashDrawerService(BranchDbContext context, ILogger<CashDrawerService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CashDrawerDto> OpenDrawerAsync(Guid branchId, OpenDrawerDto dto, Guid userId)
    {
        // Check if there's already an open drawer for this branch
        var existingDrawer = await _context.CashDrawers
            .FirstOrDefaultAsync(cd => cd.BranchId == branchId && cd.Status == CashDrawerStatus.Open);

        if (existingDrawer != null)
        {
            throw new InvalidOperationException("A cash drawer is already open for this branch. Please close it before opening a new one.");
        }

        var drawer = new Models.Entities.Branch.CashDrawer
        {
            BranchId = branchId,
            OpenedBy = userId,
            OpenedAt = DateTime.UtcNow,
            OpeningBalance = dto.OpeningBalance,
            ExpectedCash = dto.OpeningBalance, // Initially, expected cash is the opening balance
            Status = CashDrawerStatus.Open,
            Notes = dto.Notes
        };

        _context.CashDrawers.Add(drawer);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cash drawer {DrawerId} opened for branch {BranchId} by user {UserId} with opening balance {OpeningBalance}",
            drawer.Id, branchId, userId, dto.OpeningBalance);

        return await MapToDto(drawer);
    }

    public async Task<CashDrawerDto> CloseDrawerAsync(Guid drawerId, CloseDrawerDto dto, Guid userId)
    {
        var drawer = await _context.CashDrawers
            .Include(cd => cd.OpenedByUser)
            .Include(cd => cd.Transactions)
            .FirstOrDefaultAsync(cd => cd.Id == drawerId);

        if (drawer == null)
        {
            throw new KeyNotFoundException($"Cash drawer with ID {drawerId} not found.");
        }

        if (drawer.Status != CashDrawerStatus.Open)
        {
            throw new InvalidOperationException("Cash drawer is not open and cannot be closed.");
        }

        drawer.ClosedBy = userId;
        drawer.ClosedAt = DateTime.UtcNow;
        drawer.ActualCash = dto.ActualCash;
        drawer.Variance = dto.ActualCash - drawer.ExpectedCash;
        drawer.Status = CashDrawerStatus.Closed;
        drawer.Notes = string.IsNullOrEmpty(drawer.Notes) ? dto.Notes : $"{drawer.Notes}\n\nClosing Notes: {dto.Notes}";

        // Serialize denomination breakdown if provided
        if (dto.DenominationBreakdown != null)
        {
            drawer.DenominationBreakdown = JsonSerializer.Serialize(dto.DenominationBreakdown);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cash drawer {DrawerId} closed by user {UserId}. Expected: {Expected}, Actual: {Actual}, Variance: {Variance}",
            drawerId, userId, drawer.ExpectedCash, drawer.ActualCash, drawer.Variance);

        return await MapToDto(drawer);
    }

    public async Task<CashDrawerDto?> GetCurrentDrawerAsync(Guid branchId)
    {
        var drawer = await _context.CashDrawers
            .Include(cd => cd.OpenedByUser)
            .Include(cd => cd.ClosedByUser)
            .Include(cd => cd.Transactions)
                .ThenInclude(t => t.CreatedByUser)
            .Where(cd => cd.BranchId == branchId && cd.Status == CashDrawerStatus.Open)
            .OrderByDescending(cd => cd.OpenedAt)
            .FirstOrDefaultAsync();

        return drawer != null ? await MapToDto(drawer) : null;
    }

    public async Task<CashDrawerDto?> GetDrawerByIdAsync(Guid drawerId)
    {
        var drawer = await _context.CashDrawers
            .Include(cd => cd.OpenedByUser)
            .Include(cd => cd.ClosedByUser)
            .Include(cd => cd.Transactions)
                .ThenInclude(t => t.CreatedByUser)
            .FirstOrDefaultAsync(cd => cd.Id == drawerId);

        return drawer != null ? await MapToDto(drawer) : null;
    }

    public async Task<CashTransactionDto> AddTransactionAsync(Guid drawerId, CreateCashTransactionDto dto, Guid userId)
    {
        var drawer = await _context.CashDrawers
            .FirstOrDefaultAsync(cd => cd.Id == drawerId);

        if (drawer == null)
        {
            throw new KeyNotFoundException($"Cash drawer with ID {drawerId} not found.");
        }

        if (drawer.Status != CashDrawerStatus.Open)
        {
            throw new InvalidOperationException("Cannot add transactions to a closed cash drawer.");
        }

        var transaction = new CashTransaction
        {
            CashDrawerId = drawerId,
            Type = dto.Type,
            Amount = dto.Amount,
            Reason = dto.Reason,
            Reference = dto.Reference,
            Notes = dto.Notes,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.CashTransactions.Add(transaction);

        // Update expected cash based on transaction type
        // Deposits and petty cash additions increase expected cash
        // Withdrawals decrease expected cash
        if (dto.Type == CashTransactionType.Deposit ||
            dto.Type == CashTransactionType.Withdrawal ||
            dto.Type == CashTransactionType.PettyCash ||
            dto.Type == CashTransactionType.CashDrop ||
            dto.Type == CashTransactionType.BankDeposit)
        {
            drawer.ExpectedCash += dto.Amount;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cash transaction {TransactionId} added to drawer {DrawerId}. Type: {Type}, Amount: {Amount}",
            transaction.Id, drawerId, dto.Type, dto.Amount);

        // Load user for response
        transaction.CreatedByUser = await _context.Users.FindAsync(userId);

        return MapTransactionToDto(transaction);
    }

    public async Task<List<CashDrawerDto>> GetDrawerHistoryAsync(Guid branchId, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 50)
    {
        var query = _context.CashDrawers
            .Include(cd => cd.OpenedByUser)
            .Include(cd => cd.ClosedByUser)
            .Include(cd => cd.Transactions)
                .ThenInclude(t => t.CreatedByUser)
            .Where(cd => cd.BranchId == branchId);

        if (startDate.HasValue)
        {
            query = query.Where(cd => cd.OpenedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(cd => cd.OpenedAt <= endDate.Value);
        }

        var drawers = await query
            .OrderByDescending(cd => cd.OpenedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = new List<CashDrawerDto>();
        foreach (var drawer in drawers)
        {
            dtos.Add(await MapToDto(drawer));
        }

        return dtos;
    }

    public async Task<ReconciliationReportDto> GetReconciliationReportAsync(Guid drawerId)
    {
        var drawer = await _context.CashDrawers
            .Include(cd => cd.OpenedByUser)
            .Include(cd => cd.ClosedByUser)
            .Include(cd => cd.Transactions)
                .ThenInclude(t => t.CreatedByUser)
            .FirstOrDefaultAsync(cd => cd.Id == drawerId);

        if (drawer == null)
        {
            throw new KeyNotFoundException($"Cash drawer with ID {drawerId} not found.");
        }

        // Get cash sales count and total
        var cashSales = await _context.Sales
            .Where(s => s.SaleDate >= drawer.OpenedAt &&
                       (drawer.ClosedAt == null || s.SaleDate <= drawer.ClosedAt) &&
                       s.PaymentMethod == Models.Entities.Branch.PaymentMethod.Cash &&
                       !s.IsVoided)
            .ToListAsync();

        var totalCashSales = cashSales.Sum(s => s.Total);
        var cashSalesCount = cashSales.Count;

        // Calculate transaction totals
        var totalDeposits = drawer.Transactions
            .Where(t => t.Type == CashTransactionType.Deposit)
            .Sum(t => t.Amount);

        var totalWithdrawals = drawer.Transactions
            .Where(t => t.Type == CashTransactionType.Withdrawal || t.Type == CashTransactionType.BankDeposit || t.Type == CashTransactionType.CashDrop)
            .Sum(t => Math.Abs(t.Amount));

        var totalPettyCash = drawer.Transactions
            .Where(t => t.Type == CashTransactionType.PettyCash)
            .Sum(t => t.Amount);

        var report = new ReconciliationReportDto
        {
            CashDrawerId = drawer.Id,
            BranchId = drawer.BranchId,
            BranchName = "Branch", // TODO: Get actual branch name from HeadOffice DB
            OpenedAt = drawer.OpenedAt,
            ClosedAt = drawer.ClosedAt,
            OpenedByUsername = drawer.OpenedByUser?.Username ?? "Unknown",
            ClosedByUsername = drawer.ClosedByUser?.Username,
            OpeningBalance = drawer.OpeningBalance,
            TotalCashSales = totalCashSales,
            CashSalesCount = cashSalesCount,
            TotalDeposits = totalDeposits,
            TotalWithdrawals = totalWithdrawals,
            TotalPettyCash = totalPettyCash,
            ExpectedCash = drawer.ExpectedCash,
            ActualCash = drawer.ActualCash,
            Variance = drawer.Variance,
            Status = drawer.Status,
            RequiresManagerApproval = drawer.Variance.HasValue && Math.Abs(drawer.Variance.Value) > 10, // Threshold of $10
            DenominationBreakdown = drawer.DenominationBreakdown,
            Notes = drawer.Notes,
            Transactions = drawer.Transactions.Select(MapTransactionToDto).ToList()
        };

        return report;
    }

    public async Task UpdateExpectedCashAsync(Guid branchId, decimal amount)
    {
        var drawer = await _context.CashDrawers
            .FirstOrDefaultAsync(cd => cd.BranchId == branchId && cd.Status == CashDrawerStatus.Open);

        if (drawer != null)
        {
            drawer.ExpectedCash += amount;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated expected cash for drawer {DrawerId} by {Amount}. New expected: {ExpectedCash}",
                drawer.Id, amount, drawer.ExpectedCash);
        }
        else
        {
            _logger.LogWarning("No open cash drawer found for branch {BranchId} when trying to update expected cash", branchId);
        }
    }

    // Helper methods
    private async Task<CashDrawerDto> MapToDto(Models.Entities.Branch.CashDrawer drawer)
    {
        // Ensure users are loaded
        if (drawer.OpenedByUser == null && drawer.OpenedBy != Guid.Empty)
        {
            drawer.OpenedByUser = await _context.Users.FindAsync(drawer.OpenedBy);
        }
        if (drawer.ClosedByUser == null && drawer.ClosedBy.HasValue && drawer.ClosedBy != Guid.Empty)
        {
            drawer.ClosedByUser = await _context.Users.FindAsync(drawer.ClosedBy.Value);
        }

        // Count sales during this cash drawer session
        var salesCount = await _context.Sales
            .Where(s => s.SaleDate >= drawer.OpenedAt &&
                       (drawer.ClosedAt == null || s.SaleDate <= drawer.ClosedAt) &&
                       !s.IsVoided)
            .CountAsync();

        var cashTransactionCount = drawer.Transactions?.Count ?? 0;

        return new CashDrawerDto
        {
            Id = drawer.Id,
            BranchId = drawer.BranchId,
            OpenedBy = drawer.OpenedBy,
            OpenedByUsername = drawer.OpenedByUser?.Username ?? "Unknown",
            OpenedAt = drawer.OpenedAt,
            OpeningBalance = drawer.OpeningBalance,
            ClosedBy = drawer.ClosedBy,
            ClosedByUsername = drawer.ClosedByUser?.Username,
            ClosedAt = drawer.ClosedAt,
            ExpectedCash = drawer.ExpectedCash,
            ActualCash = drawer.ActualCash,
            Variance = drawer.Variance,
            Status = drawer.Status,
            DenominationBreakdown = drawer.DenominationBreakdown,
            Notes = drawer.Notes,
            Transactions = drawer.Transactions?.Select(MapTransactionToDto).ToList() ?? new List<CashTransactionDto>(),
            SalesCount = salesCount,
            TotalTransactionCount = salesCount + cashTransactionCount
        };
    }

    private static CashTransactionDto MapTransactionToDto(CashTransaction transaction)
    {
        return new CashTransactionDto
        {
            Id = transaction.Id,
            CashDrawerId = transaction.CashDrawerId,
            Type = transaction.Type,
            Amount = transaction.Amount,
            Reason = transaction.Reason,
            CreatedBy = transaction.CreatedBy,
            CreatedByUsername = transaction.CreatedByUser?.Username ?? "Unknown",
            CreatedAt = transaction.CreatedAt,
            Reference = transaction.Reference,
            Notes = transaction.Notes
        };
    }
}
