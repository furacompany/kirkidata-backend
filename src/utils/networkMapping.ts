/**
 * Network mapping utility for Aychindodata API
 * Maps network names to Aychindodata numeric IDs
 */

export const NETWORK_IDS = {
  MTN: 1,
  AIRTEL: 2,
  GLO: 3,
  "9MOBILE": 4,
} as const;

export type NetworkName = keyof typeof NETWORK_IDS;
export type NetworkId = typeof NETWORK_IDS[NetworkName];

/**
 * Get Aychindodata network ID from network name
 * @param networkName - Network name (MTN, AIRTEL, GLO, 9MOBILE)
 * @returns Network ID (1, 2, 3, or 4)
 */
export function getNetworkId(networkName: string): number {
  const normalizedName = networkName.toUpperCase().trim();
  
  if (normalizedName === "9MOBILE" || normalizedName === "9 MOBILE") {
    return NETWORK_IDS["9MOBILE"];
  }
  
  const networkId = NETWORK_IDS[normalizedName as NetworkName];
  
  if (!networkId) {
    throw new Error(
      `Invalid network name: ${networkName}. Must be one of: MTN, AIRTEL, GLO, 9MOBILE`
    );
  }
  
  return networkId;
}

/**
 * Get network name from Aychindodata network ID
 * @param networkId - Network ID (1, 2, 3, or 4)
 * @returns Network name (MTN, AIRTEL, GLO, or 9MOBILE)
 */
export function getNetworkName(networkId: number): string {
  const networkEntry = Object.entries(NETWORK_IDS).find(
    ([_, id]) => id === networkId
  );
  
  if (!networkEntry) {
    throw new Error(
      `Invalid network ID: ${networkId}. Must be one of: 1, 2, 3, 4`
    );
  }
  
  return networkEntry[0];
}

/**
 * Get all available network names
 * @returns Array of network names
 */
export function getAllNetworkNames(): NetworkName[] {
  return Object.keys(NETWORK_IDS) as NetworkName[];
}

/**
 * Check if a network name is valid
 * @param networkName - Network name to validate
 * @returns True if valid, false otherwise
 */
export function isValidNetworkName(networkName: string): boolean {
  try {
    getNetworkId(networkName);
    return true;
  } catch {
    return false;
  }
}

