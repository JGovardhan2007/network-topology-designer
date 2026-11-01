/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetworkRequirement, SubnetPlan } from '../types/network';

/**
 * Converts a dotted-decimal IPv4 string to a 32-bit unsigned integer
 */
export function ipToLong(ip: string): number {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return 0;
  return (
    ((parseInt(parts[0], 10) & 0xff) << 24) |
    ((parseInt(parts[1], 10) & 0xff) << 16) |
    ((parseInt(parts[2], 10) & 0xff) << 8) |
    (parseInt(parts[3], 10) & 0xff)
  ) >>> 0;
}

/**
 * Converts a 32-bit unsigned integer to dotted-decimal IPv4 string
 */
export function longToIp(long: number): string {
  return [
    (long >>> 24) & 0xff,
    (long >>> 16) & 0xff,
    (long >>> 8) & 0xff,
    long & 0xff,
  ].join('.');
}

/**
 * Converts prefix length (0-32) to dotted-decimal subnet mask
 */
export function cidrToMask(prefix: number): string {
  if (prefix === 0) return '0.0.0.0';
  const mask = ((0xffffffff << (32 - prefix)) >>> 0);
  return longToIp(mask);
}

/**
 * Converts prefix length to dotted-decimal wildcard mask
 */
export function cidrToWildcard(prefix: number): string {
  if (prefix === 0) return '255.255.255.255';
  const mask = ((0xffffffff << (32 - prefix)) >>> 0);
  const wildcard = (~mask) >>> 0;
  return longToIp(wildcard);
}

/**
 * Generate a realistic pseudorandom MAC address based on a seed string
 */
export function generateMac(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Cisco OUI prefix: 00:0A:F4 or standard unicast 52:54:00
  return `00:50:56:${hex.slice(0, 2)}:${hex.slice(2, 4)}:${hex.slice(4, 6)}`.toUpperCase();
}

/**
 * Validates a base CIDR string like "192.168.1.0/24"
 */
export function validateBaseCidr(cidrInput: string): {
  valid: boolean;
  ip: string;
  prefix: number;
  error?: string;
} {
  const parts = cidrInput.trim().split('/');
  if (parts.length !== 2) {
    return { valid: false, ip: '', prefix: 0, error: 'Must be in IP/prefix format (e.g., 192.168.1.0/24)' };
  }

  const ip = parts[0].trim();
  const prefix = parseInt(parts[1].trim(), 10);

  if (isNaN(prefix) || prefix < 8 || prefix > 30) {
    return { valid: false, ip: '', prefix: 0, error: 'Prefix must be an integer between 8 and 30' };
  }

  const octets = ip.split('.');
  if (octets.length !== 4) {
    return { valid: false, ip: '', prefix: 0, error: 'IP must contain 4 octets separated by dots' };
  }

  for (const oct of octets) {
    const num = parseInt(oct, 10);
    if (isNaN(num) || num < 0 || num > 255 || String(num) !== oct) {
      return { valid: false, ip: '', prefix: 0, error: `Invalid octet '${oct}' in IP address` };
    }
  }

  return { valid: true, ip, prefix };
}

export interface CalculationResult {
  success: boolean;
  subnets: SubnetPlan[];
  totalRequiredHosts: number;
  totalAllocatedHosts: number;
  totalAddressesUsed: number;
  baseCapacity: number;
  errorMessage?: string;
}

/**
 * Calculates VLSM subnets for given network requirements
 */
export function calculateVlsmSubnets(
  baseCidr: string,
  networks: NetworkRequirement[]
): CalculationResult {
  const validation = validateBaseCidr(baseCidr);
  if (!validation.valid) {
    return {
      success: false,
      subnets: [],
      totalRequiredHosts: 0,
      totalAllocatedHosts: 0,
      totalAddressesUsed: 0,
      baseCapacity: 0,
      errorMessage: validation.error,
    };
  }

  const baseIpLong = ipToLong(validation.ip);
  const basePrefix = validation.prefix;
  const baseBlockSize = Math.pow(2, 32 - basePrefix);
  const baseCapacity = baseBlockSize >= 2 ? baseBlockSize - 2 : 0;

  // Mask base IP to its true network address
  const baseMaskLong = ((0xffffffff << (32 - basePrefix)) >>> 0);
  const normalizedBaseNetworkLong = (baseIpLong & baseMaskLong) >>> 0;

  // VLSM Rule: Sort networks descending by host requirement to avoid fragmentation
  const sortedRequirements = [...networks].sort((a, b) => b.hosts - a.hosts);

  const subnets: SubnetPlan[] = [];
  let currentBase = normalizedBaseNetworkLong;
  let totalRequiredHosts = 0;
  let totalAllocatedHosts = 0;

  for (const req of sortedRequirements) {
    totalRequiredHosts += req.hosts;

    // Minimum addresses needed = hosts + 2 (network + broadcast)
    const neededIps = req.hosts + 2;

    // Find smallest power of 2 >= neededIps
    let hostBits = 2; // minimum for /30 (4 IPs, 2 hosts)
    while (Math.pow(2, hostBits) < neededIps && hostBits <= 32 - basePrefix) {
      hostBits++;
    }

    const subnetSize = Math.pow(2, hostBits);
    const prefixLength = 32 - hostBits;
    const allocatedHosts = subnetSize - 2;

    // Subnet address must align to a multiple of its size
    if (currentBase % subnetSize !== 0) {
      currentBase = (Math.ceil(currentBase / subnetSize) * subnetSize) >>> 0;
    }

    const networkAddressLong = currentBase;
    const broadcastAddressLong = (networkAddressLong + subnetSize - 1) >>> 0;
    const gatewayAddressLong = (networkAddressLong + 1) >>> 0;
    const firstUsableLong = (networkAddressLong + 1) >>> 0;
    const lastUsableLong = (broadcastAddressLong - 1) >>> 0;

    // Check if within base block
    if (broadcastAddressLong >= normalizedBaseNetworkLong + baseBlockSize) {
      return {
        success: false,
        subnets: [],
        totalRequiredHosts,
        totalAllocatedHosts,
        totalAddressesUsed: currentBase - normalizedBaseNetworkLong,
        baseCapacity,
        errorMessage: `IP pool exhausted! Total hosts requested exceed the capacity of ${validation.ip}/${basePrefix} (${baseCapacity} usable hosts). Try a larger network block like /${Math.max(8, basePrefix - 1)} or /${Math.max(8, basePrefix - 2)}.`,
      };
    }

    // Hardware rule: 24-port switches: if department exceeds 20 hosts, cascade another switch
    const switchesNeeded = Math.max(1, Math.ceil(req.hosts / 20));

    subnets.push({
      id: req.id,
      name: req.name,
      vlanId: req.vlanId,
      color: req.color,
      requiredHosts: req.hosts,
      allocatedHosts,
      prefixLength,
      cidrNotation: `/${prefixLength}`,
      networkAddress: longToIp(networkAddressLong),
      subnetMask: cidrToMask(prefixLength),
      wildcardMask: cidrToWildcard(prefixLength),
      gatewayAddress: longToIp(gatewayAddressLong),
      firstUsableIp: longToIp(firstUsableLong),
      lastUsableIp: longToIp(lastUsableLong),
      usableIpRange: `${longToIp(firstUsableLong)} – ${longToIp(lastUsableLong)}`,
      broadcastAddress: longToIp(broadcastAddressLong),
      switchesNeeded,
    });

    totalAllocatedHosts += allocatedHosts;
    currentBase = (broadcastAddressLong + 1) >>> 0;
  }

  const totalAddressesUsed = currentBase - normalizedBaseNetworkLong;

  return {
    success: true,
    subnets,
    totalRequiredHosts,
    totalAllocatedHosts,
    totalAddressesUsed,
    baseCapacity,
  };
}
