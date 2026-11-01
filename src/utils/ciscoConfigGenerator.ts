/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArchitectureMode, SubnetPlan } from '../types/network';

export function generateCiscoIosCommands(
  architecture: ArchitectureMode,
  subnets: SubnetPlan[]
): string {
  let output = `! ========================================================\n`;
  output += `! AUTOMATED NETWORK TOPOLOGY LAB CONFIGURATION (CISCO IOS)\n`;
  output += `! Architecture: ${architecture.toUpperCase()}\n`;
  output += `! Generated for Computer Networks Lab Experiment\n`;
  output += `! ========================================================\n\n`;

  // 1. ROUTER CONFIGURATION
  output += `! --------------------------------------------------------\n`;
  output += `! 1. ROUTER CONFIGURATION (Gateway / Inter-VLAN Routing)\n`;
  output += `! --------------------------------------------------------\n`;
  output += `enable\nconfigure terminal\nhostname Lab-Router-01\nservice password-encryption\nno ip domain-lookup\n\n`;

  if (architecture === 'hierarchical' || architecture === 'star') {
    output += `! Router-on-a-Stick (ROAS) Inter-VLAN Sub-interfaces\n`;
    output += `interface GigabitEthernet0/0/0\n description Trunk Uplink to Core/Distribution Switch\n no ip address\n no shutdown\n!\n`;

    subnets.forEach((subnet) => {
      output += `interface GigabitEthernet0/0/0.${subnet.vlanId}\n`;
      output += ` description Subnet Gateway for ${subnet.name}\n`;
      output += ` encapsulation dot1Q ${subnet.vlanId}\n`;
      output += ` ip address ${subnet.gatewayAddress} ${subnet.subnetMask}\n`;
      output += ` no shutdown\n!\n`;
    });
  } else if (architecture === 'redundant-mesh') {
    output += `! PRIMARY CORE ROUTER (HSRP Active)\n`;
    output += `interface GigabitEthernet0/0/1\n description Trunk to Access Switches\n no shutdown\n!\n`;

    subnets.forEach((subnet) => {
      output += `interface GigabitEthernet0/0/1.${subnet.vlanId}\n`;
      output += ` description Gateway for ${subnet.name}\n`;
      output += ` encapsulation dot1Q ${subnet.vlanId}\n`;
      output += ` ip address ${subnet.firstUsableIp} ${subnet.subnetMask}\n`;
      output += ` standby ${subnet.vlanId} ip ${subnet.gatewayAddress}\n`;
      output += ` standby ${subnet.vlanId} priority 110\n`;
      output += ` standby ${subnet.vlanId} preempt\n`;
      output += ` no shutdown\n!\n`;
    });
  } else if (architecture === 'multi-router') {
    output += `! BACKBONE WAN ROUTER (OSPF Routing)\n`;
    output += `router ospf 1\n router-id 1.1.1.1\n`;
    subnets.forEach((subnet, idx) => {
      output += ` network 10.254.${idx + 1}.0 0.0.0.3 area 0\n`;
    });
    output += `!\n`;
  }

  // 2. DHCP POOL CONFIGURATION
  output += `\n! --------------------------------------------------------\n`;
  output += `! 2. AUTOMATED DHCP SERVER POOLS FOR ENDPOINTS\n`;
  output += `! --------------------------------------------------------\n`;
  subnets.forEach((subnet) => {
    output += `ip dhcp excluded-address ${subnet.gatewayAddress}\n`;
    output += `ip dhcp pool POOL_${subnet.name.toUpperCase().replace(/\s+/g, '_')}\n`;
    output += ` network ${subnet.networkAddress} ${subnet.subnetMask}\n`;
    output += ` default-router ${subnet.gatewayAddress}\n`;
    output += ` dns-server 8.8.8.8 1.1.1.1\n`;
    output += ` lease 0 12 0\n!\n`;
  });

  // 3. SWITCH CONFIGURATION
  output += `\n! --------------------------------------------------------\n`;
  output += `! 3. SWITCH CONFIGURATION (VLANs & Access Ports)\n`;
  output += `! --------------------------------------------------------\n`;
  output += `enable\nconfigure terminal\nhostname Lab-Switch-01\nspanning-tree mode rapid-pvst\n\n! Create VLAN Database\n`;

  subnets.forEach((subnet) => {
    output += `vlan ${subnet.vlanId}\n name ${subnet.name.replace(/\s+/g, '_')}\n state active\n!\n`;
  });

  output += `! Configure Trunk Uplink to Router / Core\n`;
  output += `interface GigabitEthernet0/1\n description Trunk Uplink\n switchport mode trunk\n switchport trunk allowed vlan all\n no shutdown\n!\n`;

  output += `! Sample Access Port Assignments\n`;
  let currentPort = 2;
  subnets.forEach((subnet) => {
    const endPort = Math.min(24, currentPort + 3);
    output += `interface range FastEthernet0/${currentPort} - ${endPort}\n`;
    output += ` description Host ports for ${subnet.name}\n`;
    output += ` switchport mode access\n`;
    output += ` switchport access vlan ${subnet.vlanId}\n`;
    output += ` spanning-tree portfast\n`;
    output += ` no shutdown\n!\n`;
    currentPort = endPort + 1;
  });

  output += `end\nwrite memory\n`;
  return output;
}
