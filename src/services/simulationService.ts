import type {
	SimulationRequest,
	SimulationResponse,
	YearlyExpenseData,
	YearlyFinancialData,
	YearlyIncomeData,
	YearlyLoanData,
} from "../types";

export function simulateLifePlan(
	request: SimulationRequest,
): SimulationResponse {
	const {
		startAge,
		simulationYears,
		initialSavings,
		initialLoans,
		incomes,
		expenses,
		loans,
	} = request;

	const yearlyData: YearlyFinancialData[] = [];
	let currentSavings = initialSavings;

	const activeLoans = loans.map((loan) => ({
		...loan,
		remainingBalance: 0, // Will be set in the year the loan starts
		monthlyPayment: 0, // Will be calculated when the loan starts
	}));

	for (let yearIndex = 0; yearIndex < simulationYears; yearIndex++) {
		const currentYear = yearIndex + 1;
		const currentAge = startAge + yearIndex;

		const yearlyIncomes: YearlyIncomeData[] = [];
		let totalIncome = 0;

		for (const income of incomes) {
			if (
				income.startYear <= currentYear &&
				(income.endYear === null || income.endYear >= currentYear)
			) {
				const yearsActive = currentYear - income.startYear;
				const growthFactor = 1 + (income.annualGrowthRate || 0) / 100;
				const adjustedAmount = income.amount * growthFactor ** yearsActive;

				yearlyIncomes.push({
					name: income.name,
					amount: adjustedAmount,
				});

				totalIncome += adjustedAmount;
			}
		}

		const yearlyExpenses: YearlyExpenseData[] = [];
		let totalExpense = 0;

		for (const expense of expenses) {
			if (
				expense.startYear <= currentYear &&
				(expense.endYear === null || expense.endYear >= currentYear)
			) {
				const yearsActive = currentYear - expense.startYear;
				const growthFactor = 1 + (expense.annualGrowthRate || 0) / 100;
				const adjustedAmount = expense.amount * growthFactor ** yearsActive;

				yearlyExpenses.push({
					name: expense.name,
					amount: adjustedAmount,
				});

				totalExpense += adjustedAmount;
			}
		}

		const yearlyLoans: YearlyLoanData[] = [];
		let totalLoanPayment = 0;
		let totalLoanBalance = 0;

		for (const loan of activeLoans) {
			if (loan.startYear === currentYear) {
				loan.remainingBalance = loan.amount;

				const monthlyRate = loan.interestRate / 100 / 12;
				const totalPayments = loan.termYears * 12;

				if (monthlyRate === 0) {
					loan.monthlyPayment = loan.amount / totalPayments;
				} else {
					loan.monthlyPayment =
						(loan.amount * monthlyRate * (1 + monthlyRate) ** totalPayments) /
						((1 + monthlyRate) ** totalPayments - 1);
				}
			}

			if (loan.remainingBalance > 0) {
				const annualPayment = loan.monthlyPayment * 12;
				let yearlyPayment = annualPayment;

				if (loan.remainingBalance < annualPayment) {
					yearlyPayment = loan.remainingBalance;
					loan.remainingBalance = 0;
				} else {
					const annualInterest =
						loan.remainingBalance * (loan.interestRate / 100);
					const principalPayment = annualPayment - annualInterest;
					loan.remainingBalance -= principalPayment;
				}

				yearlyLoans.push({
					name: loan.name,
					remainingBalance: loan.remainingBalance,
					payment: yearlyPayment,
				});

				totalLoanPayment += yearlyPayment;
				totalLoanBalance += loan.remainingBalance;
			} else if (
				loan.startYear <= currentYear &&
				currentYear < loan.startYear + loan.termYears
			) {
				yearlyLoans.push({
					name: loan.name,
					remainingBalance: 0,
					payment: 0,
				});
			}
		}

		totalExpense += totalLoanPayment;

		const netSavings = totalIncome - totalExpense;
		currentSavings += netSavings;

		yearlyData.push({
			year: currentYear,
			age: currentAge,
			incomes: yearlyIncomes,
			expenses: yearlyExpenses,
			loans: yearlyLoans,
			totalIncome,
			totalExpense,
			savings: currentSavings,
			totalLoanBalance,
		});
	}

	return {
		yearlyData,
	};
}
