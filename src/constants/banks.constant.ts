export enum BankType {
  PALMPAY = "PALMPAY",
}

export const BANK_NAMES = {
  [BankType.PALMPAY]: "Palmpay Bank",
} as const;

export const SUPPORTED_BANKS = Object.values(BankType);
export const SUPPORTED_BANK_NAMES = Object.values(BANK_NAMES);
