// Cash Drawer Types

export interface CashDrawer {
  id: string;
  branchId: string;
  openedBy: string;
  openedByUsername: string;
  openedAt: string;
  openingBalance: number;
  closedBy?: string;
  closedByUsername?: string;
  closedAt?: string;
  expectedCash: number;
  actualCash?: number;
  variance?: number;
  status: 'Open' | 'Closed' | 'Reconciled';
  denominationBreakdown?: string;
  notes?: string;
  transactions: CashTransaction[];
  salesCount: number;
  totalTransactionCount: number;
}

export interface CashTransaction {
  id: string;
  cashDrawerId: string;
  type: string;
  amount: number;
  reason: string;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
  reference?: string;
  notes?: string;
}

export interface OpenDrawerDto {
  openingBalance: number;
  notes?: string;
}

export interface CloseDrawerDto {
  actualCash: number;
  denominationBreakdown?: DenominationBreakdown;
  notes?: string;
}

export interface DenominationBreakdown {
  bills: Record<string, number>;
  coins: Record<string, number>;
}

export interface CreateCashTransactionDto {
  type: string;
  amount: number;
  reason: string;
  reference?: string;
  notes?: string;
}

export interface ReconciliationReport {
  cashDrawerId: string;
  branchId: string;
  branchName: string;
  openedAt: string;
  closedAt?: string;
  openedByUsername: string;
  closedByUsername?: string;
  openingBalance: number;
  totalCashSales: number;
  cashSalesCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalPettyCash: number;
  expectedCash: number;
  actualCash?: number;
  variance?: number;
  varianceReason?: string;
  status: string;
  requiresManagerApproval: boolean;
  denominationBreakdown?: string;
  notes?: string;
  transactions: CashTransaction[];
}

// Cash transaction types
export const CashTransactionTypes = {
  PETTY_CASH: 'PettyCash',
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  BANK_DEPOSIT: 'BankDeposit',
  CASH_DROP: 'CashDrop',
  LOAN: 'Loan',
  OTHER: 'Other',
} as const;
