# Network Topology Designer

An automated, interactive web application for designing network topologies and planning VLSM subnets, tailored for Computer Networks Laboratory projects, networking students, and network engineers.

---

## Overview

**Network Topology Designer** simplifies the process of subnetting and network architecture planning. Users provide a base IPv4 CIDR block and departmental host requirements, and the engine automatically:
1. Calculates non-overlapping **Variable-Length Subnet Masking (VLSM)** allocations.
2. Selects the optimal **architectural topology pattern** based on network scale.
3. Automatically computes hardware requirements, including **24-port switch cascading** when host thresholds are exceeded.
4. Renders an interactive visual network graph with authentic Cisco-style vector device icons.
5. Generates **Bill of Materials (BOM)**, ready-to-paste **Cisco IOS CLI configuration scripts**, and downloadable CSV reports.

---

## Key Features

### 1. Network Inputs & Requirements (Tab 1)
- **Base Network IP / CIDR**: Configurable IPv4 root block (defaults to `192.168.1.0/24`) with one-click presets for Class C (`192.168.1.0/24`), Class B Campus (`172.16.0.0/20`), and Class A Enterprise (`10.0.0.0/16`).
- **Department & Subnet Configuration**:
  - Dynamically configure between 1 and 6 departments/VLANs.
  - Set custom department names, host PC requirements, and VLAN IDs.
- **Smart Architecture Recommender**:
  - Automatically recommends and selects the optimal topology pattern based on total host count and subnet quantity:
    - **Star (Single Gateway)**: Recommended for small lab footprints ($\le 20$ PCs, $\le 2$ subnets).
    - **Hierarchical (Core-Distribution)**: Standard 3-tier enterprise campus model for medium subnet loads.
    - **Multi-Router (WAN / Edge Routers)**: Multi-department scale ($\ge 4$ subnets) with autonomous edge routers.
    - **Redundant Mesh Core**: High-availability dual-core setup with HSRP/VRRP heartbeat for high-density environments ($\ge 45$ PCs).
  - Supports manual override to test different architectural models.

### 2. Subnetting & Hardware Logic
- **Non-Overlapping VLSM Partitioning**: Subnets are prioritized and sorted in descending host order according to standard VLSM principles to maximize address space utilization and eliminate overlapping ranges.
- **Full IP Addressing Plan**: Computes Network Address, CIDR Notation, Dotted-Decimal Subnet Mask, Default Gateway, First/Last Usable Host IP Range, Broadcast Address, and Wildcard Mask.
- **24-Port Switch Cascading**: Automatically calculates required switches per subnet; if a department exceeds 20 hosts, an additional cascaded Access Switch is provisioned.

### 3. Interactive Topology Map (Tab 2)
- **Vector Device Icons**: Clean, recognizable SVG icons rendered natively via Data URIs:
  - **Router**: Traditional networking cylinder/disc with 4 crossing arrows.
  - **Core Router**: Emerald high-throughput backbone core router.
  - **Switch**: 24-port rackmount switch chassis with bidirectional traffic arrows.
  - **PC Workstation**: Desktop monitor with stand and keyboard.
  - **Security Gateway / Firewall**: Shield firewall appliance for perimeter routing.
  - **Host Cluster Node**: Stacked workstation icon representing pooled endpoints for dense subnets.
- **Physics Stabilization & Freeze**: Physics simulation runs initial organic layout iterations and freezes coordinates so dragging nodes or zooming remains rock-solid and responsive.
- **Interactive Controls**:
  - Drag and reposition nodes anywhere on the dot-grid canvas.
  - Center-preserving Zoom In / Zoom Out and Fit-to-Screen controls.
  - Re-center and align action to re-run layout calculations.
  - **Non-Intrusive Floating Device Inspector**: Clicking any node opens a floating card displaying device role, IP address, subnet mask, default gateway, MAC address, VLAN ID, and port interface mapping with one-click copy buttons.

### 4. Summary Panels & Lab Export Tools
- **Bill of Materials (BOM)**:
  - Equipment tally of Routers, Distribution Switches, Access Switches, and PC Endpoints.
  - Estimated physical media requirements: Cat6 UTP copper patch cords, 10G SFP+ fiber uplinks, and heartbeat sync cables.
  - Address space utilization meter with remaining free IP capacity.
- **VLSM Subnet Allocation Table**: Detailed tabular breakdown with individual row copying.
- **Cisco IOS CLI Script Generator**: Ready-to-paste CLI commands for Cisco Packet Tracer, GNS3, or physical hardware (ROAS sub-interfaces, 802.1Q dot1Q encapsulation, DHCP pools, and switchport VLAN trunking).
- **Download CSV**: Exports the full subnet plan and hardware summary to a `.csv` file.
- **Print Report**: Formatted CSS print layout for laboratory report submissions.

---

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 with custom dot-grid canvas utilities
- **Graph & Topology Canvas**: `vis-network` & `vis-data`
- **Iconography**: Lucide React & Custom SVG Network Device Vectors
- **Build Tool**: Vite 8

---

## Getting Started

### Prerequisites

- Node.js (version 18+ recommended)
- npm or yarn

### Installation

1. Clone or download the repository:
```bash
git clone <repository-url>
cd network-topology-designer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Production Build

To build the application for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

### Type Checking & Linting

```bash
npm run lint
```

---

## Project Structure

```
├── index.html                     # Application entry HTML with typography & meta tags
├── metadata.json                  # App metadata and permissions
├── package.json                   # Project dependencies and npm scripts
├── src/
│   ├── App.tsx                    # Main container component (tab management & state)
│   ├── main.tsx                   # React root mount and error guards
│   ├── index.css                  # Global styles, Tailwind v4 imports, canvas dot grid
│   ├── types/
│   │   └── network.ts             # TypeScript definitions for subnets, topology & BOM
│   ├── utils/
│   │   ├── subnetCalculator.ts    # IPv4 bit math, VLSM allocation & validation
│   │   ├── architectureSelector.ts# Auto architecture detection heuristics
│   │   ├── deviceIcons.ts         # High-resolution vector SVG network device icons
│   │   ├── topologyGenerator.ts   # Graph node and edge construction logic
│   │   ├── ciscoConfigGenerator.ts# Cisco IOS CLI commands generator
│   │   └── exportUtils.ts         # CSV export utility
│   └── components/
│       ├── NetworkInputTab.tsx    # Tab 1: Base IP, department inputs & architecture
│       ├── TopologyCanvas.tsx     # Tab 2: Vis-network canvas & floating device inspector
│       ├── SubnetTable.tsx        # Tab 2: Subnet allocation data table
│       ├── BOMCard.tsx            # Tab 2: Bill of Materials & hardware summary card
│       └── CiscoCliModal.tsx      # Modal displaying generated Cisco IOS configs
└── tsconfig.json                  # TypeScript compiler configuration
```

---

## License

This project is licensed under the Apache-2.0 License.
