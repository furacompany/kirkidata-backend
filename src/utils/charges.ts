/**
 * Calculate funding charge based on amount tier
 * @param amount - The funding amount in NGN
 * @returns The charge amount in NGN
 */
export function calculateFundingCharge(amount: number): number {
  if (amount < 100) return 0;
  if (amount <= 499) return 20;
  if (amount <= 999) return 30;
  if (amount < 3000) return 50; // 1000-2999
  return 60; // 3000 and above
}
