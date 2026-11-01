/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { TopologyData, DeviceNodeData } from '../types/network';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Info,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { DEVICE_ICONS } from '../utils/deviceIcons';

interface TopologyCanvasProps {
  topologyData: TopologyData;
  onSelectDevice?: (device: DeviceNodeData | null) => void;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  topologyData,
  onSelectDevice,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<Network | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceNodeData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build Vis DataSets
    const nodesDataSet = new DataSet(topologyData.nodes);
    const edgesDataSet = new DataSet(topologyData.edges);

    const isHierarchical = topologyData.architecture === 'hierarchical';

    const options = {
      autoResize: true,
      nodes: {
        shape: 'image',
        borderWidth: 2,
        margin: { top: 12, right: 12, bottom: 12, left: 12 },
        color: {
          border: '#e2e8f0',
          highlight: {
            border: '#059669',
            background: '#ecfdf5',
          },
          hover: {
            border: '#059669',
          },
        },
        font: {
          face: 'Plus Jakarta Sans',
          size: 11,
          color: '#0f172a',
          strokeWidth: 4,
          strokeColor: '#ffffff',
          multi: 'html' as const,
        },
      },
      edges: {
        width: 1.8,
        smooth: isHierarchical
          ? {
              enabled: true,
              type: 'cubicBezier',
              forceDirection: 'vertical',
              roundness: 0.3,
            }
          : {
              enabled: true,
              type: 'continuous',
              roundness: 0.15,
            },
        font: {
          face: 'JetBrains Mono',
          size: 10,
          color: '#475569',
          strokeWidth: 3,
          strokeColor: '#ffffff',
          align: 'middle' as const,
        },
        arrows: {
          to: {
            enabled: false,
          },
        },
      },
      // Controlled, gentle physics for initial arrangement
      physics: {
        enabled: true,
        maxVelocity: 40,
        minVelocity: 0.5,
        solver: isHierarchical ? 'hierarchicalRepulsion' : 'barnesHut',
        barnesHut: {
          gravitationalConstant: -2800,
          centralGravity: 0.25,
          springLength: 140,
          springConstant: 0.04,
          damping: 0.2,
          avoidOverlap: 0.5,
        },
        hierarchicalRepulsion: {
          centralGravity: 0.35,
          springLength: 120,
          springConstant: 0.04,
          nodeDistance: 190,
          damping: 0.25,
          avoidOverlap: 0.6,
        },
        stabilization: {
          enabled: true,
          iterations: 120,
          updateInterval: 25,
          fit: true,
        },
      },
      layout: isHierarchical
        ? {
            hierarchical: {
              enabled: true,
              direction: 'UD',
              sortMethod: 'directed',
              levelSeparation: 170,
              nodeSpacing: 240,
              treeSpacing: 260,
              blockShifting: true,
              edgeMinimization: true,
              parentCentralization: true,
            },
          }
        : {
            randomSeed: 42,
            improvedLayout: true,
          },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        zoomSpeed: 0.5,
        dragView: true,
        dragNodes: true,
        navigationButtons: false,
        keyboard: false,
        selectable: true,
        selectConnectedEdges: false,
      },
    };

    const network = new Network(
      containerRef.current,
      { nodes: nodesDataSet, edges: edgesDataSet },
      options
    );

    networkInstanceRef.current = network;

    // When physics finishes stabilizing, freeze physics so moving or dragging nodes NEVER blows up coordinates!
    network.on('stabilizationIterationsDone', () => {
      network.setOptions({ physics: { enabled: false } });
      requestAnimationFrame(() => {
        if (networkInstanceRef.current) {
          networkInstanceRef.current.fit({
            animation: {
              duration: 300,
              easingFunction: 'easeInOutQuad',
            },
          });
        }
      });
    });

    // Node selection - opens inline floating inspector without covering canvas
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeItem = topologyData.nodes.find((n) => n.id === nodeId);
        if (nodeItem && nodeItem.deviceData) {
          setSelectedDevice(nodeItem.deviceData);
          if (onSelectDevice) onSelectDevice(nodeItem.deviceData);
        }
      } else {
        setSelectedDevice(null);
        if (onSelectDevice) onSelectDevice(null);
      }
    });

    // Bound zoom level to prevent nodes from vanishing
    network.on('zoom', () => {
      const scale = network.getScale();
      if (scale > 3.0) {
        network.moveTo({ scale: 3.0 });
      } else if (scale < 0.2) {
        network.moveTo({ scale: 0.2 });
      }
    });

    // Initial safe fit after canvas settles
    const initTimer = setTimeout(() => {
      if (networkInstanceRef.current) {
        networkInstanceRef.current.redraw();
        networkInstanceRef.current.fit();
      }
    }, 150);

    return () => {
      clearTimeout(initTimer);
      network.destroy();
      networkInstanceRef.current = null;
    };
  }, [topologyData, onSelectDevice]);

  // Safe zoom controls that preserve the center of the current view
  const handleZoomIn = () => {
    if (!networkInstanceRef.current) return;
    const currentScale = networkInstanceRef.current.getScale();
    const viewPosition = networkInstanceRef.current.getViewPosition();
    networkInstanceRef.current.moveTo({
      position: viewPosition,
      scale: Math.min(2.8, currentScale * 1.25),
      animation: { duration: 200, easingFunction: 'easeInOutQuad' },
    });
  };

  const handleZoomOut = () => {
    if (!networkInstanceRef.current) return;
    const currentScale = networkInstanceRef.current.getScale();
    const viewPosition = networkInstanceRef.current.getViewPosition();
    networkInstanceRef.current.moveTo({
      position: viewPosition,
      scale: Math.max(0.25, currentScale * 0.8),
      animation: { duration: 200, easingFunction: 'easeInOutQuad' },
    });
  };

  const handleFit = () => {
    if (!networkInstanceRef.current) return;
    networkInstanceRef.current.fit({
      animation: { duration: 350, easingFunction: 'easeInOutQuad' },
    });
  };

  const handleResetLayout = () => {
    if (!networkInstanceRef.current) return;
    // Re-enable physics briefly to re-align, then fit and freeze
    networkInstanceRef.current.setOptions({ physics: { enabled: true } });
    setTimeout(() => {
      if (networkInstanceRef.current) {
        networkInstanceRef.current.setOptions({ physics: { enabled: false } });
        networkInstanceRef.current.fit({
          animation: { duration: 300, easingFunction: 'easeInOutQuad' },
        });
      }
    }, 300);
  };

  const copyToClipboard = (val: string, fieldName: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'core-router':
        return DEVICE_ICONS.coreRouter;
      case 'router':
        return DEVICE_ICONS.router;
      case 'dist-switch':
      case 'access-switch':
        return DEVICE_ICONS.switch;
      case 'gateway':
        return DEVICE_ICONS.gateway;
      case 'pc-cluster':
        return DEVICE_ICONS.pcCluster;
      default:
        return DEVICE_ICONS.pc;
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* Top Floating Utility Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Topology Title Indicator */}
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-slate-800">
            {topologyData.architecture === 'hierarchical'
              ? 'Hierarchical Topology (Core-Distribution-Access)'
              : topologyData.architecture === 'multi-router'
              ? 'Multi-Router WAN Architecture'
              : topologyData.architecture === 'redundant-mesh'
              ? 'Dual Core Redundant Mesh (HSRP / VRRP)'
              : 'Star Topology (Central Gateway)'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {topologyData.nodes.length} Nodes · {topologyData.edges.length} Links
          </span>
        </div>

        {/* Floating Zoom & View Action Controls */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/80 p-1 rounded-lg shadow-xs pointer-events-auto">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <button
            onClick={handleFit}
            title="Fit to Screen"
            className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetLayout}
            title="Re-Center & Align Topology"
            className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Vis-Network Canvas with Dot Grid Background */}
      <div
        ref={containerRef}
        className="w-full flex-1 canvas-dot-grid cursor-grab active:cursor-grabbing outline-none"
        style={{ minHeight: '480px' }}
      />

      {/* Floating Device Inspector Drawer (Shown when node is selected, does not obscure canvas) */}
      {selectedDevice && (
        <div className="absolute top-14 right-3 z-20 w-80 max-w-[calc(100%-24px)] bg-white/98 backdrop-blur-md border border-slate-300 rounded-xl shadow-lg p-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                <img
                  src={getDeviceIcon(selectedDevice.type)}
                  alt={selectedDevice.label}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-tight">
                  {selectedDevice.label.replace('\n', ' ')}
                </h4>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                  {selectedDevice.type.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDevice(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {selectedDevice.ipAddress && (
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">IP Address</span>
                  <span className="font-mono text-xs font-bold text-slate-900">{selectedDevice.ipAddress}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedDevice.ipAddress!, 'ip')}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                >
                  {copiedField === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {selectedDevice.subnetMask && (
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Subnet Mask</span>
                  <span className="font-mono text-xs text-slate-800">{selectedDevice.subnetMask}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedDevice.subnetMask!, 'mask')}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                >
                  {copiedField === 'mask' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {selectedDevice.gateway && (
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Default Gateway</span>
                  <span className="font-mono text-xs font-semibold text-emerald-700">{selectedDevice.gateway}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedDevice.gateway!, 'gw')}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                >
                  {copiedField === 'gw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">MAC Address</span>
                <span className="font-mono text-[11px] text-slate-700">{selectedDevice.macAddress}</span>
              </div>
              <button
                onClick={() => copyToClipboard(selectedDevice.macAddress, 'mac')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
              >
                {copiedField === 'mac' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {selectedDevice.networkName && (
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Department</span>
                <span className="font-semibold text-xs text-slate-800">{selectedDevice.networkName}</span>
              </div>
            )}

            {selectedDevice.vlanId && (
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">VLAN ID</span>
                <span className="font-mono text-xs font-semibold text-slate-800">{selectedDevice.vlanId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Floating Legend Bar */}
      <div className="p-3 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <img
              src={DEVICE_ICONS.router}
              alt="Router"
              className="w-4 h-4 object-contain"
            />
            <span className="font-medium text-slate-700">Router</span>
          </div>

          <div className="flex items-center gap-1.5">
            <img
              src={DEVICE_ICONS.switch}
              alt="Switch"
              className="w-4 h-4 object-contain"
            />
            <span className="font-medium text-slate-700">Switch (24-Port)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <img
              src={DEVICE_ICONS.pc}
              alt="PC"
              className="w-4 h-4 object-contain"
            />
            <span className="font-medium text-slate-700">PC Workstation</span>
          </div>

          <div className="flex items-center gap-1.5">
            <img
              src={DEVICE_ICONS.pcCluster}
              alt="Host Cluster"
              className="w-4 h-4 object-contain"
            />
            <span className="font-medium text-slate-700">Expanded Host Pool</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Click any device to inspect IP, MAC & ports. Drag to move, scroll to zoom.</span>
        </div>
      </div>
    </div>
  );
};
