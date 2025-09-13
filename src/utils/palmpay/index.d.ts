// TypeScript declarations for PalmPay utilities
export function sign(params: any, privateKey: string): string;
export function rsaVerify(
  encryData: string,
  signature: string,
  publicKey: string,
  hash: string
): boolean;
export function sortParams(params: any): string;
export function verifyPalmPayWebhook(
  notifyData: any,
  publicKey: string
): boolean;
export function getPalmPayPrivateKey(keyPath?: string): string;
export function getPalmPayPublicKeyForUpload(publicKeyPath?: string): string;
export function getPalmPayPublicKey(): string;

export const HashMap: {
  SHA256withRSA: string;
  SHA1withRSA: string;
};
