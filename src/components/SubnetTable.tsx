/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SubnetPlan } from '../types/network';
import { Copy, Check, Table } from 'lucide-react';

interface SubnetTableProps {
  subnets: SubnetPlan[];
  baseCidr: string;
}

export const SubnetTable: React.FC<SubnetTableProps> = ({ subnets, baseCidr }) => {
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  const copyRowData = (subnet: SubnetPlan) => {
    const text = `${subnet.name} (VLAN ${subnet.vlanId}): Network=${subnet.networkAddress}${subnet.cidrNotation}, Gateway=${subnet.gatewayAddress}, Range=${subnet.usableIpRange}, Broadcast=${subnet.broadcastAddress}, Mask=${subnet.subnetMask}`;
    navigator.clipboard.writeText(text);
    setCopiedRowId(subnet.id);
    setTimeout(() => setCopiedRowId(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="p-4 md:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-600" />
            <span>VLSM Subnet Allocation Table</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Non-overlapping subnets partitioned from root block <span className="font-mono font-semibold text-slate-700">{baseCidr}</span>
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {subnets.length} Subnets Provisioned
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-3 px-4">Subnet / Department</th>
              <th className="py-3 px-3">VLAN</th>
              <th className="py-3 px-3">Hosts</th>
              <th className="py-3 px-3">CIDR</th>
              <th className="py-3 px-3 font-mono">Network ID</th>
              <th className="py-3 px-3 font-mono">Subnet Mask</th>
              <th className="py-3 px-3 font-mono">Default Gateway</th>
              <th className="py-3 px-3 font-mono">Usable IP Range</th>
              <th className="py-3 px-3 font-mono">Broadcast IP</th>
              <th className="py-3 px-3 text-center">Switches</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {subnets.map((sub) => {
              const isCopied = copiedRowId === sub.id;

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span>{sub.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800">
                      {sub.vlanId}
                    </span>
                  </td>

                  <td className="py-3 px-3 tabular-nums">
                    <span className="font-semibold text-slate-900">{sub.requiredHosts}</span>
                    <span className="text-slate-400 text-[11px] block">
                      ({sub.allocatedHosts} alloc)
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {sub.cidrNotation}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {sub.networkAddress}
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    {sub.subnetMask}
                  </td>

                  <td className="py-3 px-3 font-semibold text-emerald-600">
                    {sub.gatewayAddress}
                  </td>

                  <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                    {sub.usableIpRange}
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    {sub.broadcastAddress}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-semibold font-sans">
                      {sub.switchesNeeded} (24-Port)
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-sans">
                    <button
                      onClick={() => copyRowData(sub)}
                      title="Copy Subnet Details"
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
