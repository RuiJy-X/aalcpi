export type PayrollSummaryInput = {
    totalHours: number;
    hourlyRate: number;
    holidays: number;
    deductions: number;
};

export type PayrollSummary = {
    basicPay: number;
    holidayPay: number;
    grossPay: number;
    netPay: number;
};

export const parseNumber = (value: string): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const calculatePayrollSummary = (
    input: PayrollSummaryInput,
): PayrollSummary => {
    const basicPay = roundCurrency(input.hourlyRate * input.totalHours);
    const holidayPay = roundCurrency(input.hourlyRate * 8 * input.holidays);
    const grossPay = roundCurrency(basicPay + holidayPay);
    const netPay = roundCurrency(Math.max(0, grossPay - input.deductions));

    return {
        basicPay,
        holidayPay,
        grossPay,
        netPay,
    };
};

export const formatMoney = (value: number): string =>
    value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const roundCurrency = (value: number): number =>
    Math.round((value + Number.EPSILON) * 100) / 100;

export const computeHourlyRate = (monthlySalary: number): string => {
    // Philippine standard: 313 working days/year ÷ 12 months × 8 hours
    const hourlyRate = monthlySalary / 24 / 8;
    return hourlyRate.toFixed(2);
};
