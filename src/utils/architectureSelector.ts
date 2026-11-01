/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArchitectureMode } from '../types/network';

export interface ArchitectureRecommendation {
  mode: ArchitectureMode;
  title: string;
  reason: string;
}

/**
 * Automatically determines the optimal network topology architecture
 * based on the host count and number of subnets configured.
 */
export function autoDetectArchitecture(
  numSubnets: number,
  totalHosts: number
): ArchitectureRecommendation {
  // 1. Small lab or single subnet -> Star
  if (numSubnets <= 1 || (totalHosts <= 20 && numSubnets <= 2)) {
    return {
      mode: 'star',
      title: 'Star (Single Gateway)',
      reason: `Auto-selected for small lab (${totalHosts} PCs, ${numSubnets} net): Unified gateway is direct and cost-effective.`,
    };
  }

  // 2. Multi-branch / 4 or more departments -> Multi-Router WAN
  if (numSubnets >= 4) {
    return {
      mode: 'multi-router',
      title: 'Multi-Router (WAN / Edge Routers)',
      reason: `Auto-selected for multi-department scale (${numSubnets} subnets): Dedicated Edge Routers provide isolated WAN domains.`,
    };
  }

  // 3. High host density (> 45 hosts) -> Redundant Mesh Core
  if (totalHosts >= 45) {
    return {
      mode: 'redundant-mesh',
      title: 'Redundant Mesh Core',
      reason: `Auto-selected for enterprise host capacity (${totalHosts} PCs): Dual cores with HSRP/VRRP ensure high availability.`,
    };
  }

  // 4. Standard 2-3 departments with moderate hosts -> Hierarchical
  return {
    mode: 'hierarchical',
    title: 'Hierarchical (Core-Distribution)',
    reason: `Auto-selected for campus model (${totalHosts} PCs, ${numSubnets} subnets): Core and Distribution aggregation layer.`,
  };
}
