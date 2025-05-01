export interface SimulationRequest {
	startAge: number;
	simulationYears: number;

	initialSavings: number;
	initialLoans: number;

	incomes: IncomeSource[];

	expenses: ExpenseItem[];

	loans: LoanItem[];
}

export interface IncomeSource {
	name: string;
	amount: number;
	startYear: number;
	endYear: number | null; // null means until the end of simulation
	annualGrowthRate?: number; // percentage, e.g., 2.0 means 2%
}

export interface ExpenseItem {
	name: string;
	amount: number;
	startYear: number;
	endYear: number | null; // null means until the end of simulation
	annualGrowthRate?: number; // percentage, e.g., 2.0 means 2%
}

export interface LoanItem {
	name: string;
	amount: number;
	startYear: number;
	termYears: number;
	interestRate: number; // percentage, e.g., 2.0 means 2%
}

export interface YearlyFinancialData {
	year: number;
	age: number;
	incomes: YearlyIncomeData[];
	expenses: YearlyExpenseData[];
	loans: YearlyLoanData[];
	totalIncome: number;
	totalExpense: number;
	savings: number;
	totalLoanBalance: number;
}

export interface YearlyIncomeData {
	name: string;
	amount: number;
}

export interface YearlyExpenseData {
	name: string;
	amount: number;
}

export interface YearlyLoanData {
	name: string;
	remainingBalance: number;
	payment: number;
}

export interface SimulationResponse {
	yearlyData: YearlyFinancialData[];
}
