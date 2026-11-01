/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Encodes SVG string to standard Data URI for Vis-Network image rendering
 */
function svgToDataUri(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

// 1. Classic Networking Router: Cylinder / Disc with 4 crossing directional arrows
export const ROUTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="routerBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="routerTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0ea5e9" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Router Cylinder 3D Base -->
  <g filter="url(#shadow)">
    <!-- Base Cylinder Wall -->
    <path d="M 12,48 C 12,48 12,68 12,68 C 12,82 88,82 88,68 L 88,48 Z" fill="url(#routerBody)" />
    <!-- Cylinder Rim Accent Line -->
    <path d="M 12,68 C 12,82 88,82 88,68" fill="none" stroke="#0284c7" stroke-width="2" />
    <!-- Router Top Disc -->
    <ellipse cx="50" cy="46" rx="38" ry="18" fill="url(#routerTop)" stroke="#bae6fd" stroke-width="1.5" />
    
    <!-- Cisco-Style 4 Crossing Arrows on top face -->
    <!-- Top-left to Center-in -->
    <g stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <!-- Arrow 1: Upper-left to Inward -->
      <path d="M 28,40 L 42,44" />
      <path d="M 37,39 L 43,44 L 38,47" fill="#ffffff" />
      
      <!-- Arrow 2: Lower-right to Inward -->
      <path d="M 72,52 L 58,48" />
      <path d="M 63,53 L 57,48 L 62,45" fill="#ffffff" />

      <!-- Arrow 3: Center to Upper-right Outward -->
      <path d="M 54,44 L 68,39" />
      <path d="M 62,37 L 69,39 L 63,42" fill="#ffffff" />

      <!-- Arrow 4: Center to Lower-left Outward -->
      <path d="M 46,48 L 32,53" />
      <path d="M 38,55 L 31,53 L 37,50" fill="#ffffff" />
    </g>

    <!-- Center pivot dot -->
    <circle cx="50" cy="46" r="3" fill="#ffffff" />
    <!-- Status LEDs on front wall -->
    <circle cx="36" cy="65" r="2" fill="#4ade80" />
    <circle cx="44" cy="66" r="2" fill="#38bdf8" />
    <circle cx="52" cy="66" r="2" fill="#4ade80" />
    <circle cx="60" cy="65" r="2" fill="#facc15" />
  </g>
</svg>
`;

// 2. Core / Redundant Primary Router: Emerald / Mint Core Router
export const CORE_ROUTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="coreRouterBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="coreRouterTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <filter id="coreShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#047857" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#coreShadow)">
    <path d="M 12,48 C 12,48 12,68 12,68 C 12,82 88,82 88,68 L 88,48 Z" fill="url(#coreRouterBody)" />
    <path d="M 12,68 C 12,82 88,82 88,68" fill="none" stroke="#047857" stroke-width="2" />
    <ellipse cx="50" cy="46" rx="38" ry="18" fill="url(#coreRouterTop)" stroke="#a7f3d0" stroke-width="1.8" />
    
    <!-- 4 Crossing Arrows -->
    <g stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M 28,40 L 42,44" />
      <path d="M 37,39 L 43,44 L 38,47" fill="#ffffff" />
      
      <path d="M 72,52 L 58,48" />
      <path d="M 63,53 L 57,48 L 62,45" fill="#ffffff" />

      <path d="M 54,44 L 68,39" />
      <path d="M 62,37 L 69,39 L 63,42" fill="#ffffff" />

      <path d="M 46,48 L 32,53" />
      <path d="M 38,55 L 31,53 L 37,50" fill="#ffffff" />
    </g>

    <circle cx="50" cy="46" r="3.5" fill="#ffffff" />
    <!-- Core Golden Badge on front -->
    <circle cx="36" cy="65" r="2.2" fill="#a7f3d0" />
    <circle cx="44" cy="66" r="2.2" fill="#fef08a" />
    <circle cx="52" cy="66" r="2.2" fill="#a7f3d0" />
    <circle cx="60" cy="65" r="2.2" fill="#34d399" />
  </g>
</svg>
`;

// 3. Network Switch: Rectangular switch box with bidirectional arrows
export const SWITCH_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="switchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="switchFront" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <filter id="swShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/>
    </filter>
  </defs>

  <g filter="url(#swShadow)">
    <!-- Switch Box Isometric / Front Body -->
    <rect x="10" y="32" width="80" height="40" rx="6" fill="url(#switchGrad)" stroke="#64748b" stroke-width="1.5" />
    
    <!-- Top Face 3D Rim -->
    <path d="M 12,33 L 22,23 L 78,23 L 88,33 Z" fill="#64748b" opacity="0.6" stroke="#94a3b8" stroke-width="1" />

    <!-- Front Port Panel Area -->
    <rect x="16" y="52" width="68" height="14" rx="2" fill="url(#switchFront)" />
    
    <!-- 8 RJ45 Port Indicators -->
    <g fill="#10b981">
      <rect x="20" y="55" width="4" height="4" rx="0.8" />
      <rect x="27" y="55" width="4" height="4" rx="0.8" />
      <rect x="34" y="55" width="4" height="4" rx="0.8" />
      <rect x="41" y="55" width="4" height="4" rx="0.8" />
      <rect x="52" y="55" width="4" height="4" rx="0.8" />
      <rect x="59" y="55" width="4" height="4" rx="0.8" />
      <rect x="66" y="55" width="4" height="4" rx="0.8" />
      <rect x="73" y="55" width="4" height="4" rx="0.8" />
    </g>

    <!-- Classic 4 Bidirectional Switch Arrows on upper chassis -->
    <g stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <!-- Arrow pointing Right -->
      <line x1="24" y1="41" x2="44" y2="41" />
      <polyline points="40,38 45,41 40,44" fill="#ffffff" />

      <!-- Arrow pointing Left -->
      <line x1="76" y1="41" x2="56" y2="41" />
      <polyline points="60,38 55,41 60,44" fill="#ffffff" />
      
      <!-- Counter-direction Left Arrow -->
      <line x1="44" y1="46" x2="24" y2="46" />
      <polyline points="28,43 23,46 28,49" fill="#ffffff" />

      <!-- Counter-direction Right Arrow -->
      <line x1="56" y1="46" x2="76" y2="46" />
      <polyline points="72,43 77,46 72,49" fill="#ffffff" />
    </g>

    <!-- Uplink Indicator Light -->
    <circle cx="16" cy="40" r="2" fill="#38bdf8" />
  </g>
</svg>
`;

// 4. PC Workstation: Monitor with stand, keyboard, and crisp screen graphic
export const PC_WORKSTATION_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <filter id="pcShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.2"/>
    </filter>
  </defs>

  <g filter="url(#pcShadow)">
    <!-- Monitor Outer Bezel -->
    <rect x="18" y="20" width="64" height="44" rx="4" fill="#334155" stroke="#64748b" stroke-width="1.5" />
    
    <!-- Screen Display -->
    <rect x="22" y="24" width="56" height="34" rx="2" fill="url(#screenGrad)" />
    
    <!-- Code / Terminal content lines on screen -->
    <rect x="26" y="28" width="18" height="2.5" rx="1" fill="#10b981" />
    <rect x="26" y="34" width="32" height="2" rx="1" fill="#94a3b8" />
    <rect x="26" y="39" width="24" height="2" rx="1" fill="#38bdf8" />
    <rect x="26" y="44" width="38" height="2" rx="1" fill="#cbd5e1" />
    <rect x="26" y="49" width="12" height="2" rx="1" fill="#facc15" />

    <!-- Monitor Stand Pillar -->
    <path d="M 46,64 L 46,73 L 54,73 L 54,64 Z" fill="#64748b" />
    <!-- Stand Base -->
    <path d="M 36,73 L 64,73 L 66,76 L 34,76 Z" fill="#475569" stroke="#64748b" stroke-width="1" />

    <!-- Keyboard Profile -->
    <rect x="24" y="80" width="52" height="7" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1" />
    <!-- Key grids -->
    <line x1="28" y1="83.5" x2="72" y2="83.5" stroke="#94a3b8" stroke-dasharray="2,2" stroke-width="1.5" />
    
    <!-- Tiny Mouse -->
    <rect x="80" y="81" width="5" height="6" rx="2" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8" />
  </g>
</svg>
`;

// 5. Gateway / Security Firewall Router
export const GATEWAY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="gwGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>
    <filter id="gwShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#3730a3" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#gwShadow)">
    <!-- Security Shield Outer -->
    <path d="M 50,14 L 78,26 C 78,56 50,78 50,86 C 50,78 22,56 22,26 Z" fill="url(#gwGrad)" stroke="#c7d2fe" stroke-width="2" />
    
    <!-- Firewall Brick / Wall Emblem -->
    <g stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.9">
      <!-- Brick row 1 -->
      <line x1="36" y1="36" x2="64" y2="36" />
      <!-- Brick row 2 -->
      <line x1="32" y1="46" x2="68" y2="46" />
      <!-- Brick row 3 -->
      <line x1="38" y1="56" x2="62" y2="56" />

      <!-- Vertical Mortar lines -->
      <line x1="50" y1="26" x2="50" y2="36" />
      <line x1="42" y1="36" x2="42" y2="46" />
      <line x1="58" y1="36" x2="58" y2="46" />
      <line x1="50" y1="46" x2="50" y2="56" />
      <line x1="44" y1="56" x2="44" y2="66" />
      <line x1="56" y1="56" x2="56" y2="66" />
    </g>

    <!-- Center Security Lock/Keyhole -->
    <circle cx="50" cy="46" r="4.5" fill="#facc15" stroke="#ffffff" stroke-width="1" />
  </g>
</svg>
`;

// 6. PC Cluster / High Density Host Stack (for large networks with >4 PCs)
export const PC_CLUSTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <filter id="clustShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.2"/>
    </filter>
  </defs>

  <g filter="url(#clustShadow)">
    <!-- Back Workstation -->
    <rect x="36" y="16" width="46" height="30" rx="3" fill="#64748b" opacity="0.7" />
    <!-- Middle Workstation -->
    <rect x="26" y="24" width="48" height="32" rx="3" fill="#475569" opacity="0.9" />
    
    <!-- Front Workstation -->
    <rect x="16" y="32" width="52" height="34" rx="3" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5" />
    <rect x="20" y="36" width="44" height="24" rx="2" fill="#0f172a" />
    
    <!-- Network Matrix Nodes on front screen -->
    <circle cx="30" cy="48" r="2.5" fill="#10b981" />
    <circle cx="42" cy="44" r="2.5" fill="#38bdf8" />
    <circle cx="54" cy="48" r="2.5" fill="#10b981" />
    <line x1="30" y1="48" x2="42" y2="44" stroke="#64748b" stroke-width="1" />
    <line x1="42" y1="44" x2="54" y2="48" stroke="#64748b" stroke-width="1" />

    <!-- Plus / Cluster Expansion Badge on bottom right -->
    <circle cx="74" cy="68" r="16" fill="#10b981" stroke="#ffffff" stroke-width="2.5" />
    <text x="74" y="73" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle">++</text>
  </g>
</svg>
`;

export const DEVICE_ICONS = {
  router: svgToDataUri(ROUTER_SVG),
  coreRouter: svgToDataUri(CORE_ROUTER_SVG),
  switch: svgToDataUri(SWITCH_SVG),
  pc: svgToDataUri(PC_WORKSTATION_SVG),
  gateway: svgToDataUri(GATEWAY_SVG),
  pcCluster: svgToDataUri(PC_CLUSTER_SVG),
};
