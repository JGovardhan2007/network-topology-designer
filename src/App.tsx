/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArchitectureMode,
  NetworkRequirement,
  TopologyData,
  DeviceNodeData,
} from './types/network';
import { calculateVlsmSubnets, CalculationResult } from './utils/subnetCalculator';
import { buildTopologyData } from './utils/topologyGenerator';
import { generateCiscoIosCommands } from './utils/ciscoConfigGenerator';
import { downloadSubnetPlanCsv } from './utils/exportUtils';
import { autoDetectArchitecture } from './utils/architectureSelector';
import { NetworkInputTab } from './components/NetworkInputTab';
import { TopologyCanvas } from './components/TopologyCanvas';
import { SubnetTable } from './components/SubnetTable';
import { BOMCard } from './components/BOMCard';
import { CiscoCliModal } from './components/CiscoCliModal';
import {
  Network,
  Printer,
  Download,
  Terminal,
  Settings2,
  Shield,
} from 'lucide-react';

const INITIAL_NETWORKS: NetworkRequirement[] = [
  { id: 'dept-1', name: 'Engineering', hosts: 28, vlanId: 10, color: '#059669' },
  { id: 'dept-2', name: 'Sales & Marketing', hosts: 14, vlanId: 20, color: '#0284c7' },
  { id: 'dept-3', name: 'Human Resources', hosts: 6, vlanId: 30, color: '#d97706' },
  { id: 'dept-4', name: 'Research Lab', hosts: 22, vlanId: 40, color: '#7c3aed' },
  { id: 'dept-5', name: 'Finance & Ops', hosts: 10, vlanId: 50, color: '#db2777' },
  { id: 'dept-6', name: 'Server Farm', hosts: 8, vlanId: 60, color: '#0d9488' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'inputs' | 'topology'>('inputs');

  const [baseCidr, setBaseCidr] = useState<string>('192.168.1.0/24');
  const [numNetworks, setNumNetworks] = useState<number>(3);
  const [networks, setNetworks] = useState<NetworkRequirement[]>(INITIAL_NETWORKS);

  // Automatic architecture detection
  const [isAutoArch, setIsAutoArch] = useState<boolean>(true);
  const [architecture, setArchitecture] = useState<ArchitectureMode>('hierarchical');

  // CLI modal state
  const [isCliModalOpen, setIsCliModalOpen] = useState<boolean>(false);

  // Auto-detect architecture whenever host counts or networks change if isAutoArch is active
  useEffect(() => {
    if (!isAutoArch) return;
    const activeReqs = networks.slice(0, numNetworks);
    const totalHosts = activeReqs.reduce((sum, n) => sum + (Number(n.hosts) || 0), 0);
    const rec = autoDetectArchitecture(numNetworks, totalHosts);
    setArchitecture(rec.mode);
  }, [numNetworks, networks, isAutoArch]);

  // Subnet calculation
  const calculationResult: CalculationResult = useMemo(() => {
    const activeSubnetRequirements = networks.slice(0, numNetworks);
    return calculateVlsmSubnets(baseCidr, activeSubnetRequirements);
  }, [baseCidr, networks, numNetworks]);

  // Topology dataset generation
  const topologyData: TopologyData = useMemo(() => {
    if (!calculationResult.success || calculationResult.subnets.length === 0) {
      return {
        nodes: [],
        edges: [],
        subnets: [],
        bom: {
          routers: 0,
          distributionSwitches: 0,
          accessSwitches: 0,
          totalEndpoints: 0,
          copperCables: 0,
          fiberUplinks: 0,
          serialHeartbeats: 0,
        },
        totalAddressSpace: calculationResult.baseCapacity,
        allocatedAddresses: 0,
        utilizationPercent: 0,
        baseIpCidr: baseCidr,
        architecture,
      };
    }

    return buildTopologyData(
      architecture,
      calculationResult.subnets,
      baseCidr,
      calculationResult.baseCapacity,
      calculationResult.totalAllocatedHosts
    );
  }, [architecture, calculationResult, baseCidr]);

  // Cisco CLI commands
  const ciscoCliCommands = useMemo(() => {
    if (!calculationResult.success) return '';
    return generateCiscoIosCommands(architecture, calculationResult.subnets);
  }, [architecture, calculationResult]);

  const handleGenerateDesign = () => {
    setActiveTab('topology');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNumNetworksChange = (num: number) => {
    setNumNetworks(num);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (calculationResult.subnets.length > 0) {
      downloadSubnetPlanCsv(calculationResult.subnets, topologyData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Network className="w-5 h-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Network Topology Designer
            </span>
          </div>

          {/* Zone 2: Two Distinct Primary Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('inputs')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === 'inputs'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Network Inputs & Requirements
            </button>

            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'topology'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>2. Topology Map & Subnets</span>
              {calculationResult.success && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              )}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'inputs' ? (
              <button
                onClick={handleGenerateDesign}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Generate Design</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCliModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cisco CLI Snippets</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: Network Inputs & Requirements */}
        {activeTab === 'inputs' && (
          <NetworkInputTab
            baseCidr={baseCidr}
            setBaseCidr={setBaseCidr}
            architecture={architecture}
            setArchitecture={setArchitecture}
            isAutoArch={isAutoArch}
            setIsAutoArch={setIsAutoArch}
            networks={networks}
            setNetworks={setNetworks}
            numNetworks={numNetworks}
            handleNumNetworksChange={handleNumNetworksChange}
            onGenerate={handleGenerateDesign}
          />
        )}

        {/* TAB 2: Topology Map & Subnet Details */}
        {activeTab === 'topology' && (
          <div className="space-y-7 animate-in fade-in duration-200">
            {/* Top Sub-Bar with Export Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Canvas
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Root: {baseCidr} · {numNetworks} Subnets
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                  Network Topology & Subnet Infrastructure Map
                </h2>
              </div>

              {/* Utility Export Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
                <button
                  onClick={() => setIsCliModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cisco CLI</span>
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Report</span>
                </button>

                <button
                  onClick={() => setActiveTab('inputs')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Edit Requirements</span>
                </button>
              </div>
            </div>

            {/* Error fallback if pool exhausted */}
            {!calculationResult.success ? (
              <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-rose-900">
                  Subnet Allocation Error
                </h3>
                <p className="text-sm text-rose-700 max-w-lg mx-auto">
                  {calculationResult.errorMessage}
                </p>
                <button
                  onClick={() => setActiveTab('inputs')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  Return to Network Inputs
                </button>
              </div>
            ) : (
              <>
                {/* 1. Vis-Network Interactive Canvas */}
                <TopologyCanvas
                  topologyData={topologyData}
                />

                {/* 2. Bill of Materials (BOM) & Hardware Summary */}
                <BOMCard
                  bom={topologyData.bom}
                  utilizationPercent={topologyData.utilizationPercent}
                  totalAddressSpace={topologyData.totalAddressSpace}
                  allocatedAddresses={topologyData.allocatedAddresses}
                />

                {/* 3. Subnet Allocation Table */}
                <SubnetTable
                  subnets={calculationResult.subnets}
                  baseCidr={baseCidr}
                />
              </>
            )}
          </div>
        )}
      </main>

      {/* Cisco IOS CLI Modal */}
      <CiscoCliModal
        cliConfig={ciscoCliCommands}
        isOpen={isCliModalOpen}
        onClose={() => setIsCliModalOpen(false)}
      />
    </div>
  );
}
