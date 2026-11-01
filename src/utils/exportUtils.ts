/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SubnetPlan, TopologyData } from '../types/network';

export function downloadSubnetPlanCsv(
  subnets: SubnetPlan[],
  topologyData: TopologyData
): void {
  const headers = [
    'Subnet / Department',
    'VLAN ID',
    'Required Hosts',
    'Allocated Hosts',
    'CIDR Notation',
    'Network ID',
    'Subnet Mask',
    'Default Gateway',
    'First Usable IP',
    'Last Usable IP',
    'Broadcast Address',
    'Wildcard Mask',
    '24-Port Switches Required',
  ];

  const rows = subnets.map((s) => [
    `"${s.name.replace(/"/g, '""')}"`,
    s.vlanId,
    s.requiredHosts,
    s.allocatedHosts,
    `"${s.cidrNotation}"`,
    s.networkAddress,
    s.subnetMask,
    s.gatewayAddress,
    s.firstUsableIp,
    s.lastUsableIp,
    s.broadcastAddress,
    s.wildcardMask,
    s.switchesNeeded,
  ]);

  let csvContent = `data:text/csv;charset=utf-8,`;
  csvContent += `# AUTOMATED NETWORK TOPOLOGY & SUBNET PLAN\n`;
  csvContent += `# Base Network: ${topologyData.baseIpCidr}\n`;
  csvContent += `# Architecture: ${topologyData.architecture}\n`;
  csvContent += `# Total Routers: ${topologyData.bom.routers}, Switches: ${topologyData.bom.accessSwitches + topologyData.bom.distributionSwitches}, Endpoints: ${topologyData.bom.totalEndpoints}\n`;
  csvContent += `# Generated: ${new Date().toISOString()}\n\n`;

  csvContent += headers.join(',') + '\n';
  rows.forEach((row) => {
    csvContent += row.join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `network-subnet-plan-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
