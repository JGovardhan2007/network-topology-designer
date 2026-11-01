/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArchitectureMode, SubnetPlan, TopologyData, DeviceNodeData } from '../types/network';
import { DEVICE_ICONS } from './deviceIcons';
import { generateMac, ipToLong, longToIp } from './subnetCalculator';

/**
 * Concise department abbreviation for clean canvas node badges without label overlap
 */
function getShortDept(name: string): string {
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (lower.includes('engineer')) return 'Eng';
  if (lower.includes('sales')) return 'Sales';
  if (lower.includes('human') || lower.includes('hr')) return 'HR';
  if (lower.includes('research') || lower.includes('lab')) return 'R&D';
  if (lower.includes('finance') || lower.includes('ops')) return 'Finance';
  if (lower.includes('server')) return 'Servers';
  return clean.split(' ')[0].slice(0, 7);
}

export function buildTopologyData(
  architecture: ArchitectureMode,
  subnets: SubnetPlan[],
  baseCidr: string,
  totalAddressSpace: number,
  allocatedAddresses: number
): TopologyData {
  const nodes: any[] = [];
  const edges: any[] = [];

  let routersCount = 0;
  let distSwitchesCount = 0;
  let accessSwitchesCount = 0;
  let totalEndpoints = 0;
  let copperCables = 0;
  let fiberUplinks = 0;
  let serialHeartbeats = 0;

  subnets.forEach((s) => {
    totalEndpoints += s.requiredHosts;
  });

  const getSubnetColor = (subnet: SubnetPlan) => subnet.color || '#10b981';

  // -------------------------------------------------------------
  // ARCHITECTURE 1: HIERARCHICAL (Core - Distribution - Access - PC)
  // -------------------------------------------------------------
  if (architecture === 'hierarchical') {
    routersCount = 1;
    distSwitchesCount = subnets.length > 3 ? 2 : 1;

    // 1. Core Router
    const coreId = 'core_router_01';
    nodes.push({
      id: coreId,
      label: 'Core-RTR-01\n(Backbone)',
      shape: 'image',
      image: DEVICE_ICONS.coreRouter,
      size: 38,
      level: 1,
      title: 'Device: Core Backbone Router\nRole: L3 Routing & Campus Gateway\nModel: Cisco ISR 4451-X',
      deviceData: {
        id: coreId,
        label: 'Core-RTR-01',
        type: 'core-router',
        macAddress: generateMac(coreId),
        interfaceName: 'Te0/0/0, Te0/0/1',
        extraInfo: 'High-throughput Enterprise Campus Core Router',
      } as DeviceNodeData,
    });

    // 2. Distribution Switches
    const distIds: string[] = [];
    for (let d = 0; d < distSwitchesCount; d++) {
      const distId = `dist_sw_0${d + 1}`;
      distIds.push(distId);
      nodes.push({
        id: distId,
        label: `Dist-SW-0${d + 1}\n(Aggregator)`,
        shape: 'image',
        image: DEVICE_ICONS.switch,
        size: 32,
        level: 2,
        title: `Device: Dist-SW-0${d + 1}\nRole: Layer 3 Distribution Aggregator\nModel: Cisco Catalyst 3850`,
        deviceData: {
          id: distId,
          label: `Dist-SW-0${d + 1}`,
          type: 'dist-switch',
          macAddress: generateMac(distId),
          interfaceName: 'Te1/1/1 - Te1/1/4',
          extraInfo: 'VLAN aggregation & routing',
        } as DeviceNodeData,
      });

      edges.push({
        from: coreId,
        to: distId,
        label: '10G Fiber',
        color: { color: '#0284c7', highlight: '#059669' },
        width: 3,
        title: 'Core to Dist 10Gbps SFP+ Fiber Trunk',
      });
      fiberUplinks++;
    }

    if (distSwitchesCount === 2) {
      edges.push({
        from: distIds[0],
        to: distIds[1],
        label: 'EtherChannel',
        dashes: true,
        color: { color: '#059669' },
        width: 2.5,
        title: '20Gbps EtherChannel Crosslink',
      });
      fiberUplinks += 2;
    }

    // 3. Access Switches & Endpoints
    subnets.forEach((subnet, index) => {
      const parentDistId = distIds[index % distSwitchesCount];
      const deptTag = getShortDept(subnet.name);
      const numSwitches = subnet.switchesNeeded;
      accessSwitchesCount += numSwitches;

      let prevSwitchId: string | null = null;
      for (let sIdx = 1; sIdx <= numSwitches; sIdx++) {
        const swId = `sw_${subnet.id}_${sIdx}`;
        const isCascaded = sIdx > 1;

        nodes.push({
          id: swId,
          label: `SW-${deptTag}${isCascaded ? `-${sIdx}` : ''}\n(VLAN ${subnet.vlanId})`,
          shape: 'image',
          image: DEVICE_ICONS.switch,
          size: 26,
          level: 3,
          title: `Switch: SW-${subnet.name}-${sIdx}\nVLAN: ${subnet.vlanId}\nSubnet: ${subnet.networkAddress}${subnet.cidrNotation}\nGateway: ${subnet.gatewayAddress}`,
          deviceData: {
            id: swId,
            label: `SW-${subnet.name}-${sIdx}`,
            type: 'access-switch',
            macAddress: generateMac(swId),
            networkName: subnet.name,
            vlanId: subnet.vlanId,
            subnetMask: subnet.subnetMask,
            gateway: subnet.gatewayAddress,
            interfaceName: isCascaded ? 'Gi0/24 (Cascade)' : 'Gi0/1 (Uplink)',
            extraInfo: isCascaded ? 'Cascaded 24-Port Access Switch' : 'Primary Access Switch',
          } as DeviceNodeData,
        });

        if (!isCascaded) {
          edges.push({
            from: parentDistId,
            to: swId,
            label: `VLAN ${subnet.vlanId}`,
            color: { color: getSubnetColor(subnet) },
            width: 2.2,
            title: `Trunk link to ${parentDistId}`,
          });
          fiberUplinks++;
        } else if (prevSwitchId) {
          edges.push({
            from: prevSwitchId,
            to: swId,
            label: 'Cascade',
            color: { color: getSubnetColor(subnet) },
            width: 2,
            dashes: [4, 4],
          });
          copperCables++;
        }
        prevSwitchId = swId;

        // Render PCs
        const hostsForThisSwitch = Math.min(subnet.requiredHosts, 20);
        const sampleCount = Math.min(hostsForThisSwitch, 3);
        const baseLong = ipToLong(subnet.firstUsableIp);

        for (let p = 1; p <= sampleCount; p++) {
          const pcIp = longToIp(baseLong + (sIdx - 1) * 20 + p);
          const pcId = `pc_${subnet.id}_${sIdx}_${p}`;

          nodes.push({
            id: pcId,
            label: `PC-${p} (${deptTag})\n${pcIp}`,
            shape: 'image',
            image: DEVICE_ICONS.pc,
            size: 20,
            level: 4,
            title: `PC-${p} [${subnet.name}]\nIP: ${pcIp}\nMask: ${subnet.subnetMask}\nGW: ${subnet.gatewayAddress}\nVLAN: ${subnet.vlanId}`,
            deviceData: {
              id: pcId,
              label: `PC-${p} (${subnet.name})`,
              type: 'pc',
              ipAddress: pcIp,
              subnetMask: subnet.subnetMask,
              gateway: subnet.gatewayAddress,
              macAddress: generateMac(pcId),
              networkName: subnet.name,
              vlanId: subnet.vlanId,
              interfaceName: `Fa0/${p}`,
            } as DeviceNodeData,
          });

          edges.push({
            from: swId,
            to: pcId,
            color: { color: '#94a3b8' },
            width: 1.2,
          });
          copperCables++;
        }

        const remainingHosts = hostsForThisSwitch - sampleCount;
        if (remainingHosts > 0) {
          const clusterId = `cluster_${subnet.id}_${sIdx}`;
          const clusterStartIp = longToIp(baseLong + (sIdx - 1) * 20 + sampleCount + 1);
          const clusterEndIp = longToIp(baseLong + (sIdx - 1) * 20 + hostsForThisSwitch);

          nodes.push({
            id: clusterId,
            label: `+${remainingHosts} More Hosts\n(${deptTag})`,
            shape: 'image',
            image: DEVICE_ICONS.pcCluster,
            size: 22,
            level: 4,
            title: `Host Pool: +${remainingHosts} Workstations (${subnet.name})\nRange: ${clusterStartIp} – ${clusterEndIp}`,
            deviceData: {
              id: clusterId,
              label: `+${remainingHosts} Workstations (${subnet.name})`,
              type: 'pc-cluster',
              ipAddress: `${clusterStartIp} – ${clusterEndIp}`,
              subnetMask: subnet.subnetMask,
              gateway: subnet.gatewayAddress,
              macAddress: 'Virtual DHCP Pool',
              networkName: subnet.name,
              vlanId: subnet.vlanId,
            } as DeviceNodeData,
          });

          edges.push({
            from: swId,
            to: clusterId,
            color: { color: getSubnetColor(subnet) },
            width: 1.5,
            dashes: [2, 2],
          });
          copperCables += remainingHosts;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // ARCHITECTURE 2: MULTI-ROUTER (WAN / Edge Routers)
  // -------------------------------------------------------------
  else if (architecture === 'multi-router') {
    routersCount = 1 + subnets.length;
    const backboneId = 'backbone_wan_rtr';

    nodes.push({
      id: backboneId,
      label: 'WAN-Backbone\n(Central Core)',
      shape: 'image',
      image: DEVICE_ICONS.coreRouter,
      size: 40,
      level: 1,
      title: 'Backbone Central WAN Router\nRole: OSPF / BGP Backbone Gateway',
      deviceData: {
        id: backboneId,
        label: 'WAN-Backbone-RTR',
        type: 'core-router',
        macAddress: generateMac(backboneId),
        interfaceName: 'Gi0/0/0 – Gi0/0/5',
        extraInfo: 'Central WAN Backbone Aggregator',
      } as DeviceNodeData,
    });

    subnets.forEach((subnet, index) => {
      const deptTag = getShortDept(subnet.name);
      const edgeRtrId = `edge_rtr_${subnet.id}`;
      const wanIpRouter = `10.254.${index + 1}.1`;
      const wanIpEdge = `10.254.${index + 1}.2`;

      nodes.push({
        id: edgeRtrId,
        label: `RTR-${deptTag}\n(Edge GW)`,
        shape: 'image',
        image: DEVICE_ICONS.router,
        size: 32,
        level: 2,
        title: `Edge Router: RTR-${subnet.name}\nLAN IP: ${subnet.gatewayAddress}\nWAN IP: ${wanIpEdge}/30`,
        deviceData: {
          id: edgeRtrId,
          label: `RTR-${subnet.name}`,
          type: 'router',
          ipAddress: `${subnet.gatewayAddress} (LAN) / ${wanIpEdge} (WAN)`,
          subnetMask: subnet.subnetMask,
          gateway: wanIpRouter,
          macAddress: generateMac(edgeRtrId),
          networkName: subnet.name,
          vlanId: subnet.vlanId,
          interfaceName: 'Gi0/0/0 (WAN), Gi0/0/1 (LAN)',
        } as DeviceNodeData,
      });

      edges.push({
        from: backboneId,
        to: edgeRtrId,
        label: `WAN /30`,
        color: { color: '#0284c7' },
        width: 2.5,
        title: `Point-to-Point WAN Link: 10.254.${index + 1}.0/30`,
      });
      fiberUplinks++;

      const numSwitches = subnet.switchesNeeded;
      accessSwitchesCount += numSwitches;

      let prevSwitchId: string | null = null;
      for (let sIdx = 1; sIdx <= numSwitches; sIdx++) {
        const swId = `sw_${subnet.id}_${sIdx}`;
        const isCascaded = sIdx > 1;

        nodes.push({
          id: swId,
          label: `SW-${deptTag}${isCascaded ? `-${sIdx}` : ''}`,
          shape: 'image',
          image: DEVICE_ICONS.switch,
          size: 26,
          level: 3,
          title: `Switch: SW-${subnet.name}-${sIdx}\nDepartment: ${subnet.name}\nGateway: ${subnet.gatewayAddress}`,
          deviceData: {
            id: swId,
            label: `SW-${subnet.name}-${sIdx}`,
            type: 'access-switch',
            macAddress: generateMac(swId),
            networkName: subnet.name,
            vlanId: subnet.vlanId,
            subnetMask: subnet.subnetMask,
            gateway: subnet.gatewayAddress,
          } as DeviceNodeData,
        });

        if (!isCascaded) {
          edges.push({
            from: edgeRtrId,
            to: swId,
            label: 'LAN Link',
            color: { color: getSubnetColor(subnet) },
            width: 2.2,
          });
          copperCables++;
        } else if (prevSwitchId) {
          edges.push({
            from: prevSwitchId,
            to: swId,
            label: 'Cascade',
            color: { color: getSubnetColor(subnet) },
            width: 1.8,
            dashes: [4, 4],
          });
          copperCables++;
        }
        prevSwitchId = swId;

        const hostsForThisSwitch = Math.min(subnet.requiredHosts, 20);
        const sampleCount = Math.min(hostsForThisSwitch, 3);
        const baseLong = ipToLong(subnet.firstUsableIp);

        for (let p = 1; p <= sampleCount; p++) {
          const pcIp = longToIp(baseLong + (sIdx - 1) * 20 + p);
          const pcId = `pc_${subnet.id}_${sIdx}_${p}`;

          nodes.push({
            id: pcId,
            label: `PC-${p} (${deptTag})\n${pcIp}`,
            shape: 'image',
            image: DEVICE_ICONS.pc,
            size: 20,
            level: 4,
            title: `Host: PC-${p} [${subnet.name}]\nIP: ${pcIp}\nMask: ${subnet.subnetMask}`,
            deviceData: {
              id: pcId,
              label: `PC-${p} (${subnet.name})`,
              type: 'pc',
              ipAddress: pcIp,
              subnetMask: subnet.subnetMask,
              gateway: subnet.gatewayAddress,
              macAddress: generateMac(pcId),
              networkName: subnet.name,
              vlanId: subnet.vlanId,
            } as DeviceNodeData,
          });

          edges.push({
            from: swId,
            to: pcId,
            color: { color: '#94a3b8' },
            width: 1.2,
          });
          copperCables++;
        }

        const remainingHosts = hostsForThisSwitch - sampleCount;
        if (remainingHosts > 0) {
          const clusterId = `cluster_${subnet.id}_${sIdx}`;
          const clusterStartIp = longToIp(baseLong + (sIdx - 1) * 20 + sampleCount + 1);
          const clusterEndIp = longToIp(baseLong + (sIdx - 1) * 20 + hostsForThisSwitch);

          nodes.push({
            id: clusterId,
            label: `+${remainingHosts} More Hosts\n(${deptTag})`,
            shape: 'image',
            image: DEVICE_ICONS.pcCluster,
            size: 22,
            level: 4,
            title: `Workstations: +${remainingHosts} Hosts (${subnet.name})\nRange: ${clusterStartIp} – ${clusterEndIp}`,
            deviceData: {
              id: clusterId,
              label: `+${remainingHosts} Workstations (${subnet.name})`,
              type: 'pc-cluster',
              ipAddress: `${clusterStartIp} – ${clusterEndIp}`,
              subnetMask: subnet.subnetMask,
              gateway: subnet.gatewayAddress,
              macAddress: 'Virtual DHCP Pool',
              networkName: subnet.name,
              vlanId: subnet.vlanId,
            } as DeviceNodeData,
          });

          edges.push({
            from: swId,
            to: clusterId,
            color: { color: getSubnetColor(subnet) },
            width: 1.5,
            dashes: [2, 2],
          });
          copperCables += remainingHosts;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // ARCHITECTURE 3: REDUNDANT MESH CORE
  // -------------------------------------------------------------
  else if (architecture === 'redundant-mesh') {
    routersCount = 2;
    const core1Id = 'core_rtr_primary';
    const core2Id = 'core_rtr_standby';

    nodes.push({
      id: core1Id,
      label: 'Core-RTR-01\n(Active GW)',
      shape: 'image',
      image: DEVICE_ICONS.coreRouter,
      size: 38,
      level: 1,
      title: 'Primary Core: Core-RTR-01\nStatus: HSRP Active Gateway',
      deviceData: {
        id: core1Id,
        label: 'Core-RTR-01 (Active)',
        type: 'core-router',
        macAddress: generateMac(core1Id),
        interfaceName: 'Te0/0/1, Gi0/0/0 – Gi0/0/8',
      } as DeviceNodeData,
    });

    nodes.push({
      id: core2Id,
      label: 'Core-RTR-02\n(Standby GW)',
      shape: 'image',
      image: DEVICE_ICONS.router,
      size: 38,
      level: 1,
      title: 'Secondary Core: Core-RTR-02\nStatus: HSRP Standby Fallback',
      deviceData: {
        id: core2Id,
        label: 'Core-RTR-02 (Standby)',
        type: 'core-router',
        macAddress: generateMac(core2Id),
        interfaceName: 'Te0/0/1, Gi0/0/0 – Gi0/0/8',
      } as DeviceNodeData,
    });

    edges.push({
      from: core1Id,
      to: core2Id,
      label: 'Sync Heartbeat',
      dashes: [5, 5],
      color: { color: '#f59e0b', highlight: '#d97706' },
      width: 3.5,
      title: 'HSRP Inter-Router Heartbeat (Te0/0/1 ↔ Te0/0/1)',
    });
    serialHeartbeats++;

    subnets.forEach((subnet) => {
      const deptTag = getShortDept(subnet.name);
      const numSwitches = subnet.switchesNeeded;
      accessSwitchesCount += numSwitches;

      let prevSwitchId: string | null = null;
      for (let sIdx = 1; sIdx <= numSwitches; sIdx++) {
        const swId = `sw_${subnet.id}_${sIdx}`;
        const isCascaded = sIdx > 1;

        nodes.push({
          id: swId,
          label: `SW-${deptTag}${isCascaded ? `-${sIdx}` : ''}\n(VLAN ${subnet.vlanId})`,
          shape: 'image',
          image: DEVICE_ICONS.switch,
          size: 26,
          level: 2,
          title: `Access Switch: SW-${subnet.name}-${sIdx}\nDual Uplinks to Core-1 & Core-2`,
          deviceData: {
            id: swId,
            label: `SW-${subnet.name}-${sIdx}`,
            type: 'access-switch',
            macAddress: generateMac(swId),
            networkName: subnet.name,
            vlanId: subnet.vlanId,
            subnetMask: subnet.subnetMask,
            gateway: subnet.gatewayAddress,
          } as DeviceNodeData,
        });

        if (!isCascaded) {
          edges.push({
            from: core1Id,
            to: swId,
            label: 'Active Uplink',
            color: { color: '#059669' },
            width: 2.2,
          });
          edges.push({
            from: core2Id,
            to: swId,
            label: 'Standby Uplink',
            color: { color: '#94a3b8' },
            dashes: [4, 4],
            width: 1.8,
          });
          fiberUplinks += 2;
        } else if (prevSwitchId) {
          edges.push({
            from: prevSwitchId,
            to: swId,
            label: 'Cascade',
            color: { color: getSubnetColor(subnet) },
            width: 1.8,
            dashes: [4, 4],
          });
          copperCables++;
        }
        prevSwitchId = swId;

        const hostsForThisSwitch = Math.min(subnet.requiredHosts, 20);
        const sampleCount = Math.min(hostsForThisSwitch, 3);
        const baseLong = ipToLong(subnet.firstUsableIp);

        for (let p = 1; p <= sampleCount; p++) {
          const pcIp = longToIp(baseLong + (sIdx - 1) * 20 + p);
          const pcId = `pc_${subnet.id}_${sIdx}_${p}`;

          nodes.push({
            id: pcId,
            label: `PC-${p} (${deptTag})\n${pcIp}`,
            shape: 'image',
            image: DEVICE_ICONS.pc,
            size: 20,
            level: 3,
            title: `Host: PC-${p} [${subnet.name}]\nIP: ${pcIp}\nVirtual GW (HSRP): ${subnet.gatewayAddress}`,
            deviceData: {
              id: pcId,
              label: `PC-${p} (${subnet.name})`,
              type: 'pc',
              ipAddress: pcIp,
              subnetMask: subnet.subnetMask,
              gateway: subnet.gatewayAddress,
              macAddress: generateMac(pcId),
              networkName: subnet.name,
              vlanId: subnet.vlanId,
            } as DeviceNodeData,
          });

          edges.push({
            from: swId,
            to: pcId,
            color: { color: '#94a3b8' },
            width: 1.2,
          });
          copperCables++;
        }

        const remainingHosts = hostsForThisSwitch - sampleCount;
        if (remainingHosts > 0) {
          const clusterId = `cluster_${subnet.id}_${sIdx}`;
          const clusterStartIp = longToIp(baseLong + (sIdx - 1) * 20 + sampleCount + 1);
          const clusterEndIp = longToIp(baseLong + (sIdx - 1) * 20 + hostsForThisSwitch);

          nodes.push({
            id: clusterId,
            label: `+${remainingHosts} More Hosts\n(${deptTag})`,
            shape: 'image',
            image: DEVICE_ICONS.pcCluster,
            size: 22,
            level: 3,
            title: `Host Pool: +${remainingHosts} PCs (${subnet.name})\nRange: ${clusterStartIp} – ${clusterEndIp}`,
            deviceData: {
              id: clusterId,
              label: `+${remainingHosts} Workstations (${subnet.name})`,
              type: 'pc-cluster',
              ipAddress: `${clusterStartIp} – ${clusterEndIp}`,
              subnetMask: subnet.subnetMask,
              gateway: subnet.gatewayAddress,
              macAddress: 'Virtual DHCP Pool',
              networkName: subnet.name,
              vlanId: subnet.vlanId,
            } as DeviceNodeData,
          });

          edges.push({
            from: swId,
            to: clusterId,
            color: { color: getSubnetColor(subnet) },
            width: 1.5,
            dashes: [2, 2],
          });
          copperCables += remainingHosts;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // ARCHITECTURE 4: STAR (Single Gateway)
  // -------------------------------------------------------------
  else {
    routersCount = 1;
    const gatewayId = 'security_gateway_01';

    nodes.push({
      id: gatewayId,
      label: 'Security-GW-01\n(Firewall/Router)',
      shape: 'image',
      image: DEVICE_ICONS.gateway,
      size: 40,
      level: 1,
      title: 'Unified Security Gateway & Router\nRole: Central NAT, Routing & Firewall',
      deviceData: {
        id: gatewayId,
        label: 'Security-GW-01',
        type: 'gateway',
        macAddress: generateMac(gatewayId),
        interfaceName: 'Port 1 (WAN), Port 2-8 (Internal)',
      } as DeviceNodeData,
    });

    subnets.forEach((subnet) => {
      const deptTag = getShortDept(subnet.name);
      const numSwitches = subnet.switchesNeeded;
      accessSwitchesCount += numSwitches;

      let prevSwitchId: string | null = null;
      for (let sIdx = 1; sIdx <= numSwitches; sIdx++) {
        const swId = `sw_${subnet.id}_${sIdx}`;
        const isCascaded = sIdx > 1;

        nodes.push({
          id: swId,
          label: `SW-${deptTag}${isCascaded ? `-${sIdx}` : ''}\n(VLAN ${subnet.vlanId})`,
          shape: 'image',
          image: DEVICE_ICONS.switch,
          size: 26,
          level: 2,
          title: `Switch: SW-${subnet.name}-${sIdx}\nVLAN: ${subnet.vlanId}\nSubnet: ${subnet.networkAddress}${subnet.cidrNotation}`,
          deviceData: {
            id: swId,
            label: `SW-${subnet.name}-${sIdx}`,
            type: 'access-switch',
            macAddress: generateMac(swId),
            networkName: subnet.name,
            vlanId: subnet.vlanId,
            subnetMask: subnet.subnetMask,
            gateway: subnet.gatewayAddress,
          } as DeviceNodeData,
        });

        if (!isCascaded) {
          edges.push({
            from: gatewayId,
            to: swId,
            label: `VLAN ${subnet.vlanId}`,
            color: { color: getSubnetColor(subnet) },
            width: 2.2,
          });
          copperCables++;
        } else if (prevSwitchId) {
          edges.push({
            from: prevSwitchId,
            to: swId,
            label: 'Cascade',
            color: { color: getSubnetColor(subnet) },
            width: 1.8,
            dashes: [4, 4],
          });
          copperCables++;
        }
        prevSwitchId = swId;

        const hostsForThisSwitch = Math.min(subnet.requiredHosts, 20);
        const sampleCount = Math.min(hostsForThisSwitch, 3);
        const baseLong = ipToLong(subnet.firstUsableIp);

        for (let p = 1; p <= sampleCount; p++) {
          const pcIp = longToIp(baseLong + (sIdx - 1) * 20 + p);
          const pcId = `pc_${subnet.id}_${sIdx}_${p}`;

          nodes.push({
            id: pcId,
            label: `PC-${p} (${deptTag})\n${pcIp}`,
            shape: 'image',
            image: DEVICE_ICONS.pc,
            size: 20,
            level: 3,
            title: `Host: PC-${p} [${subnet.name}]\nIP: ${pcIp}\nMask: ${subnet.subnetMask}\nGW: ${subnet.gatewayAddress}`,
            deviceData: {
              id: pcId,
              label: `PC-${p} (${subnet.name})`,
              type: 'pc',
              ipAddress: pcIp,
              subnetMask: subnet.subnetMask,
              gateway: subnet.gatewayAddress,
              macAddress: generateMac(pcId),
              networkName: subnet.name,
              vlanId: subnet.vlanId,
            } as DeviceNodeData,
          });

          edges.push({
            from: swId,
            to: pcId,
            color: { color: '#94a3b8' },
            width: 1.2,
          });
          copperCables++;
        }

        const remainingHosts = hostsForThisSwitch - sampleCount;
        if (remainingHosts > 0) {
          const clusterId = `cluster_${subnet.id}_${sIdx}`;
          const clusterStartIp = longToIp(baseLong + (sIdx - 1) * 20 + sampleCount + 1);
          const clusterEndIp = longToIp(baseLong + (sIdx - 1) * 20 + hostsForThisSwitch);

          nodes.push({
            id: clusterId,
            label: `+${remainingHosts} More Hosts\n(${deptTag})`,
            shape: 'image',
            image: DEVICE_ICONS.pcCluster,
            size: 22,
            level: 3,
            title: `Workstation Pool: +${remainingHosts} PCs (${subnet.name})\nRange: ${clusterStartIp} – ${clusterEndIp}`,
            deviceData: {
              id: clusterId,
              label: `+${remainingHosts} Workstations (${subnet.name})`,
              type: 'pc-cluster',
              ipAddress: `${clusterStartIp} – ${clusterEndIp}`,
              subnetMask: subnet.subnetMask,
              gateway: subnet.gatewayAddress,
              macAddress: 'Virtual DHCP Pool',
              networkName: subnet.name,
              vlanId: subnet.vlanId,
            } as DeviceNodeData,
          });

          edges.push({
            from: swId,
            to: clusterId,
            color: { color: getSubnetColor(subnet) },
            width: 1.5,
            dashes: [2, 2],
          });
          copperCables += remainingHosts;
        }
      }
    });
  }

  const utilizationPercent =
    totalAddressSpace > 0
      ? Math.round((allocatedAddresses / totalAddressSpace) * 100)
      : 0;

  return {
    nodes,
    edges,
    subnets,
    bom: {
      routers: routersCount,
      distributionSwitches: distSwitchesCount,
      accessSwitches: accessSwitchesCount,
      totalEndpoints,
      copperCables,
      fiberUplinks,
      serialHeartbeats,
    },
    totalAddressSpace,
    allocatedAddresses,
    utilizationPercent,
    baseIpCidr: baseCidr,
    architecture,
  };
}
