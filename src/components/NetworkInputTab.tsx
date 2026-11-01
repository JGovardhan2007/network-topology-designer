/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArchitectureMode, NetworkRequirement } from '../types/network';
import { Network, Server, Shield, Layers, Wand2 } from 'lucide-react';
import { autoDetectArchitecture } from '../utils/architectureSelector';

interface NetworkInputTabProps {
  baseCidr: string;
  setBaseCidr: (val: string) => void;
  architecture: ArchitectureMode;
  setArchitecture: (val: ArchitectureMode) => void;
  isAutoArch: boolean;
  setIsAutoArch: (val: boolean) => void;
  networks: NetworkRequirement[];
  setNetworks: React.Dispatch<React.SetStateAction<NetworkRequirement[]>>;
  numNetworks: number;
  handleNumNetworksChange: (num: number) => void;
  onGenerate: () => void;
}

const PRESET_CIDRS = [
  { label: 'Class C Lab (192.168.1.0/24)', value: '192.168.1.0/24', desc: '254 hosts max' },
  { label: 'Class B Campus (172.16.0.0/20)', value: '172.16.0.0/20', desc: '4,094 hosts max' },
  { label: 'Class A Enterprise (10.0.0.0/16)', value: '10.0.0.0/16', desc: '65,534 hosts max' },
];

const ARCHITECTURES: {
  id: ArchitectureMode;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  flow: string;
}[] = [
  {
    id: 'hierarchical',
    title: 'Hierarchical (Core-Distribution)',
    description: '3-tier enterprise campus model with Core Router and Distribution Aggregation switches.',
    icon: Layers,
    flow: 'Core Router -> Dist Switches -> Access Switches -> PCs',
  },
  {
    id: 'multi-router',
    title: 'Multi-Router (WAN / Edge Routers)',
    description: 'Central Backbone Router connecting dedicated Edge Routers per subnet over WAN links.',
    icon: Network,
    flow: 'Backbone Router -> Edge Routers -> Subnet Switches -> PCs',
  },
  {
    id: 'redundant-mesh',
    title: 'Redundant Mesh Core',
    description: 'Dual Core Routers with interlink heartbeat (HSRP/VRRP) and redundant uplinks.',
    icon: Server,
    flow: 'Dual Cores (Active/Standby) Heartbeat -> Dual Uplinks -> Switches -> PCs',
  },
  {
    id: 'star',
    title: 'Star (Single Gateway)',
    description: 'Unified Security Gateway / Router connecting directly to department switches.',
    icon: Shield,
    flow: 'Security Gateway / Firewall -> Subnet Switches -> PCs',
  },
];

const DEFAULT_DEPT_NAMES = [
  'Engineering',
  'Sales & Marketing',
  'Human Resources',
  'Research Lab',
  'Finance & Ops',
  'Server Farm',
];

export const NetworkInputTab: React.FC<NetworkInputTabProps> = ({
  baseCidr,
  setBaseCidr,
  architecture,
  setArchitecture,
  isAutoArch,
  setIsAutoArch,
  networks,
  setNetworks,
  numNetworks,
  handleNumNetworksChange,
  onGenerate,
}) => {
  const activeNetworks = networks.slice(0, numNetworks);
  const totalRequestedHosts = activeNetworks.reduce(
    (acc, curr) => acc + (Number(curr.hosts) || 0),
    0
  );

  const recommendation = autoDetectArchitecture(numNetworks, totalRequestedHosts);

  const handleHostChange = (id: string, hosts: number) => {
    setNetworks((prev) =>
      prev.map((n) => (n.id === id ? { ...n, hosts: Math.max(1, Math.min(250, hosts)) } : n))
    );
  };

  const handleNameChange = (id: string, name: string) => {
    setNetworks((prev) =>
      prev.map((n) => (n.id === id ? { ...n, name } : n))
    );
  };

  const handleVlanChange = (id: string, vlanId: number) => {
    setNetworks((prev) =>
      prev.map((n) => (n.id === id ? { ...n, vlanId: Math.max(1, Math.min(4094, vlanId)) } : n))
    );
  };

  const handleSelectArchitecture = (archId: ArchitectureMode) => {
    setIsAutoArch(false);
    setArchitecture(archId);
  };

  const handleResetToAuto = () => {
    setIsAutoArch(true);
    setArchitecture(recommendation.mode);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Base Network IP / CIDR */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="baseCidrInput" className="text-sm font-semibold text-slate-900">
            1. Base Network IP / CIDR
          </label>
          <span className="text-xs text-slate-500 font-mono">IPv4 Classless Address</span>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            id="baseCidrInput"
            type="text"
            value={baseCidr}
            onChange={(e) => setBaseCidr(e.target.value)}
            placeholder="e.g. 192.168.1.0/24"
            className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
          {PRESET_CIDRS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setBaseCidr(preset.value)}
              className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-colors cursor-pointer ${
                baseCidr === preset.value
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={preset.desc}
            >
              {preset.value}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Department & Subnet Requirements (Reordered before Architecture) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              2. Department & Subnet Requirements
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify host counts per department. Architecture below auto-selects based on these requirements.
            </p>
          </div>

          {/* Number of Networks Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="numNetworksSelect" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Networks:
            </label>
            <select
              id="numNetworksSelect"
              value={numNetworks}
              onChange={(e) => handleNumNetworksChange(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Network' : 'Networks'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Network Input Rows */}
        <div className="space-y-3">
          {networks.slice(0, numNetworks).map((net, idx) => (
            <div
              key={net.id}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: net.color }}
                  title={`Color: ${net.color}`}
                />
                <span className="text-xs font-bold text-slate-600 font-mono">
                  #{idx + 1}
                </span>
              </div>

              {/* Department Name Input */}
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Department / Subnet Name
                </label>
                <input
                  type="text"
                  value={net.name}
                  onChange={(e) => handleNameChange(net.id, e.target.value)}
                  placeholder={`e.g. ${DEFAULT_DEPT_NAMES[idx] || 'Subnet'}`}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                />
              </div>

              {/* Number of Hosts Input */}
              <div className="w-full sm:w-32">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Host Count
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="2"
                    max="250"
                    value={net.hosts}
                    onChange={(e) => handleHostChange(net.id, parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono font-semibold"
                  />
                  <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 pointer-events-none">
                    PCs
                  </span>
                </div>
              </div>

              {/* VLAN ID Input */}
              <div className="w-full sm:w-24">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  VLAN ID
                </label>
                <input
                  type="number"
                  min="1"
                  max="4094"
                  value={net.vlanId}
                  onChange={(e) => handleVlanChange(net.id, parseInt(e.target.value, 10) || 10)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Architecture & Topology Pattern (Now directly follows section 2) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              3. Architecture & Topology Pattern
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically determined based on {totalRequestedHosts} PCs across {numNetworks} subnets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAutoArch ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold">
                <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Selected</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResetToAuto}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Reset to Auto-Detection
              </button>
            )}
          </div>
        </div>

        {/* Auto Recommendation Reason Banner */}
        <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between gap-2">
          <span>{recommendation.reason}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ARCHITECTURES.map((arch) => {
            const Icon = arch.icon;
            const isSelected = architecture === arch.id;

            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => handleSelectArchitecture(arch.id)}
                className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900">{arch.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {arch.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono truncate">
                  {arch.flow}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prominent Generate Button */}
      <button
        onClick={onGenerate}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer"
      >
        <span>Generate Network Design</span>
      </button>
    </div>
  );
};
