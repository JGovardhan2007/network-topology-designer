/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ArchitectureMode =
  | 'hierarchical'
  | 'multi-router'
  | 'redundant-mesh'
  | 'star';

export interface NetworkRequirement {
  id: string;
  name: string;
  hosts: number;
  vlanId: number;
  color: string;
}

export interface SubnetPlan {
  id: string;
  name: string;
  vlanId: number;
  color: string;
  requiredHosts: number;
  allocatedHosts: number;
  prefixLength: number; // e.g. 27
  cidrNotation: string; // e.g. /27
  networkAddress: string; // e.g. 192.168.1.0
  subnetMask: string; // e.g. 255.255.255.224
  wildcardMask: string; // e.g. 0.0.0.31
  gatewayAddress: string; // e.g. 192.168.1.1
  firstUsableIp: string; // e.g. 192.168.1.2
  lastUsableIp: string; // e.g. 192.168.1.30
  usableIpRange: string; // e.g. 192.168.1.1 - 192.168.1.30
  broadcastAddress: string; // e.g. 192.168.1.31
  switchesNeeded: number;
}

export interface DeviceNodeData {
  id: string;
  label: string;
  type: 'router' | 'core-router' | 'gateway' | 'dist-switch' | 'access-switch' | 'pc' | 'pc-cluster' | 'server';
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  macAddress: string;
  networkName?: string;
  vlanId?: number;
  interfaceName?: string;
  connectedTo?: string;
  extraInfo?: string;
}

export interface TopologyEdgeData {
  from: string;
  to: string;
  label?: string;
  title?: string;
  type?: 'copper' | 'fiber' | 'heartbeat' | 'serial';
  dashed?: boolean;
  color?: string;
}

export interface TopologyData {
  nodes: any[];
  edges: any[];
  subnets: SubnetPlan[];
  bom: {
    routers: number;
    distributionSwitches: number;
    accessSwitches: number;
    totalEndpoints: number;
    copperCables: number;
    fiberUplinks: number;
    serialHeartbeats: number;
  };
  totalAddressSpace: number;
  allocatedAddresses: number;
  utilizationPercent: number;
  baseIpCidr: string;
  architecture: ArchitectureMode;
}
