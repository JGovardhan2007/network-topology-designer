/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TopologyData } from '../types/network';
import {
  Boxes,
  Cpu,
  Monitor,
  Cable,
  PieChart,
  HardDrive,
  Activity,
} from 'lucide-react';

interface BOMCardProps {
  bom: TopologyData['bom'];
  utilizationPercent: number;
  totalAddressSpace: number;
  allocatedAddresses: number;
}

export const BOMCard: React.FC<BOMCardProps> = ({
  bom,
  utilizationPercent,
  totalAddressSpace,
  allocatedAddresses,
}) => {
  const totalSwitches = bom.distributionSwitches + bom.accessSwitches;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Boxes className="w-4 h-4 text-emerald-600" />
          <span>Bill of Materials (BOM) & Lab Hardware</span>
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          Auto-Calculated Hardware Spec
        </span>
      </div>

      {/* Grid of Equipment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Routers */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Cpu className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-medium">Routers / Gateways</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {bom.routers}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Cisco ISR / Gateway
          </span>
        </div>

        {/* Switches */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium">Network Switches</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalSwitches}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {bom.accessSwitches} Access + {bom.distributionSwitches} Dist (24p)
          </span>
        </div>

        {/* Endpoints */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Monitor className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-medium">PC Workstations</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {bom.totalEndpoints}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Configured Lab Endpoints
          </span>
        </div>

        {/* Cabling Total */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Cable className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium">Physical Media Runs</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {bom.copperCables + bom.fiberUplinks + bom.serialHeartbeats}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {bom.copperCables} UTP · {bom.fiberUplinks} Fiber · {bom.serialHeartbeats} Sync
          </span>
        </div>
      </div>

      {/* Capacity & Address Space Meter */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-slate-500" />
            <span>Root IP Space Utilization</span>
          </span>
          <span className="font-mono text-slate-600 font-medium">
            {allocatedAddresses} / {totalAddressSpace} IPs ({utilizationPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              utilizationPercent > 90
                ? 'bg-rose-500'
                : utilizationPercent > 70
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, utilizationPercent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>0%</span>
          <span>{totalAddressSpace - allocatedAddresses} Unallocated Free IPs Remaining</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
