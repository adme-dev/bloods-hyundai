/**
 * Finance calculation utilities
 */

/**
 * Calculate weekly payment from vehicle price
 * Uses standard finance calculation: 9.8% APR, 5 year term
 */
export function calculateWeeklyPayment(price: number, annualInterestRate = 9.8, loanTermYears = 5): number {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const loanTermMonths = loanTermYears * 12;
  const i = Math.pow(1 + monthlyInterestRate, loanTermMonths);
  const payment = i !== 1 ? (price * monthlyInterestRate * i) / (i - 1) : 0;
  return (payment * 12) / 52;
}










