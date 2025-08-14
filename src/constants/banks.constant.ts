export enum BankType {
  NINE_PSB = "9PSB",
  PALMPAY = "PALMPAY",
}

export const BANK_NAMES = {
  [BankType.NINE_PSB]: "9PSB Bank",
  [BankType.PALMPAY]: "Palmpay Bank",
} as const;

export const SUPPORTED_BANKS = Object.values(BankType);
export const SUPPORTED_BANK_NAMES = Object.values(BANK_NAMES);
