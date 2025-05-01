import { describe, expect, it } from "vitest";
import app from "./index";
import { simulateLifePlan } from "./services/simulationService";
import type { SimulationRequest } from "./types";

describe("index", () => {
	it("should return Hello Hono! for root path", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("Hello Hono!");
	});

	it("should handle POST /v1/simulate with valid data", async () => {
		const testData: SimulationRequest = {
			startAge: 30,
			simulationYears: 5,
			initialSavings: 1000000,
			initialLoans: 0,
			incomes: [
				{
					name: "Salary",
					amount: 5000000,
					startYear: 1,
					endYear: null,
					annualGrowthRate: 2.0,
				},
			],
			expenses: [
				{
					name: "Living Expenses",
					amount: 3000000,
					startYear: 1,
					endYear: null,
					annualGrowthRate: 1.5,
				},
			],
			loans: [],
		};

		const res = await app.request("/v1/simulate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(testData),
		});

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toHaveProperty("yearlyData");
		expect(Array.isArray(data.yearlyData)).toBe(true);
		expect(data.yearlyData.length).toBe(5);
	});

	it("should handle invalid JSON in request", async () => {
		const res = await app.request("/v1/simulate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: "invalid json",
		});

		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data).toHaveProperty("error");
	});
});

describe("simulationService", () => {
	it("should calculate yearly financial data correctly", () => {
		const request: SimulationRequest = {
			startAge: 30,
			simulationYears: 3,
			initialSavings: 1000000,
			initialLoans: 0,
			incomes: [
				{
					name: "Salary",
					amount: 5000000,
					startYear: 1,
					endYear: null,
				},
			],
			expenses: [
				{
					name: "Living Expenses",
					amount: 3000000,
					startYear: 1,
					endYear: null,
				},
			],
			loans: [
				{
					name: "Home Loan",
					amount: 20000000,
					startYear: 2,
					termYears: 20,
					interestRate: 1.5,
				},
			],
		};

		const result = simulateLifePlan(request);

		expect(result).toHaveProperty("yearlyData");
		expect(result.yearlyData.length).toBe(3);

		const year1 = result.yearlyData[0];
		expect(year1.year).toBe(1);
		expect(year1.age).toBe(30);
		expect(year1.totalIncome).toBe(5000000);
		expect(year1.totalExpense).toBe(3000000);
		expect(year1.savings).toBe(3000000); // 1M initial + 2M net savings

		const year2 = result.yearlyData[1];
		expect(year2.year).toBe(2);
		expect(year2.loans.length).toBe(1);
		expect(year2.loans[0].name).toBe("Home Loan");
		expect(year2.totalLoanBalance).toBeGreaterThan(0);

		expect(year2.savings).toBeGreaterThan(year1.savings);
		expect(result.yearlyData[2].savings).toBeGreaterThan(year2.savings);
	});

	it("should handle loan calculations correctly", () => {
		const request: SimulationRequest = {
			startAge: 30,
			simulationYears: 5,
			initialSavings: 1000000,
			initialLoans: 0,
			incomes: [
				{
					name: "Salary",
					amount: 5000000,
					startYear: 1,
					endYear: null,
				},
			],
			expenses: [
				{
					name: "Living Expenses",
					amount: 3000000,
					startYear: 1,
					endYear: null,
				},
			],
			loans: [
				{
					name: "Zero Interest Loan",
					amount: 1000000,
					startYear: 1,
					termYears: 5,
					interestRate: 0,
				},
				{
					name: "Interest Loan",
					amount: 1000000,
					startYear: 1,
					termYears: 5,
					interestRate: 5,
				},
			],
		};

		const result = simulateLifePlan(request);

		const zeroInterestLoan = result.yearlyData[0].loans.find(
			(l) => l.name === "Zero Interest Loan",
		);
		expect(zeroInterestLoan).toBeDefined();
		expect(zeroInterestLoan?.payment).toBeCloseTo(200000, 0); // 1M / 5 years

		const interestLoan = result.yearlyData[0].loans.find(
			(l) => l.name === "Interest Loan",
		);
		expect(interestLoan).toBeDefined();
		expect(interestLoan?.payment).toBeGreaterThan(200000);

		const loan1Year1 =
			result.yearlyData[0].loans.find((l) => l.name === "Interest Loan")
				?.remainingBalance || 0;
		const loan1Year2 =
			result.yearlyData[1].loans.find((l) => l.name === "Interest Loan")
				?.remainingBalance || 0;
		expect(loan1Year2).toBeLessThan(loan1Year1);
	});
});
