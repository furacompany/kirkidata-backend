/**
 * Calculate funding charge based on amount tier
 * @param amount - The funding amount in NGN
 * @returns The charge amount in NGN
 */
export function calculateFundingCharge(amount: number): number {
  if (amount < 500) return 0;
  if (amount <= 1000) return 10;
  if (amount <= 3000) return 30;
  return 40;
}
