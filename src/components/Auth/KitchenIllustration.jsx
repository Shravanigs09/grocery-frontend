// src/components/Auth/KitchenIllustration.jsx
// Vector SVG illustration matching the GROVIO kitchen illustration from the design mockup
import React from 'react';

export default function KitchenIllustration() {
  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto', position: 'relative' }}>
      <svg
        viewBox="0 0 540 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Ground shadow / floor line */}
        <ellipse cx="270" cy="365" rx="230" ry="10" fill="#000000" fillOpacity="0.06" />

        {/* ─── 1. POTTED PLANT ON TOP OF REFRIGERATOR ──────────────────────── */}
        <g id="plant-pot">
          {/* Terracotta pot */}
          <path d="M78 105 L118 105 L112 124 L84 124 Z" fill="#d28666" stroke="#2c3521" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="74" y="99" width="48" height="6" rx="2" fill="#df9473" stroke="#2c3521" strokeWidth="2" />
          {/* Cascading leaves */}
          {/* Top leaves */}
          <path d="M88 98 C82 82 72 82 66 88 C60 96 74 102 88 98 Z" fill="#4d7c31" stroke="#2c3521" strokeWidth="2" />
          <path d="M102 98 C108 80 120 80 126 88 C132 96 116 102 102 98 Z" fill="#588b37" stroke="#2c3521" strokeWidth="2" />
          <path d="M96 96 C94 76 100 70 106 72 C114 74 104 92 96 96 Z" fill="#669d3f" stroke="#2c3521" strokeWidth="2" />
          {/* Vine 1 trailing down left */}
          <path d="M78 112 Q64 125 60 148 Q54 180 50 205" stroke="#2c3521" strokeWidth="2" fill="none" />
          <path d="M60 128 C50 124 45 132 50 140 C56 148 64 136 60 128 Z" fill="#588b37" stroke="#2c3521" strokeWidth="1.8" />
          <path d="M58 152 C46 150 42 160 48 168 C56 176 64 162 58 152 Z" fill="#4d7c31" stroke="#2c3521" strokeWidth="1.8" />
          <path d="M52 180 C40 182 38 192 44 198 C52 204 58 192 52 180 Z" fill="#669d3f" stroke="#2c3521" strokeWidth="1.8" />
          <path d="M48 206 C40 210 38 220 45 224 C52 228 56 216 48 206 Z" fill="#4d7c31" stroke="#2c3521" strokeWidth="1.8" />
        </g>

        {/* ─── 2. CLOSED REFRIGERATOR (LEFT) ───────────────────────────────── */}
        <g id="refrigerator-body">
          {/* Top trim box on fridge */}
          <rect x="126" y="102" width="46" height="22" rx="3" fill="#e5d4be" stroke="#2c3521" strokeWidth="2" />

          {/* Main Fridge Shell */}
          <rect x="70" y="124" width="112" height="236" rx="8" fill="#f4f5f0" stroke="#2c3521" strokeWidth="2.8" />
          {/* Feet */}
          <rect x="76" y="360" width="12" height="8" rx="2" fill="#2c3521" />
          <rect x="162" y="360" width="12" height="8" rx="2" fill="#2c3521" />

          {/* Left / Right door divide */}
          <line x1="126" y1="124" x2="126" y2="360" stroke="#2c3521" strokeWidth="2" />

          {/* Door Handles */}
          <rect x="117" y="170" width="4" height="90" rx="2" fill="#d2d5cc" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="131" y="170" width="4" height="90" rx="2" fill="#d2d5cc" stroke="#2c3521" strokeWidth="1.8" />

          {/* Water dispenser on left door */}
          <rect x="78" y="165" width="28" height="42" rx="4" fill="#e1e3dc" stroke="#2c3521" strokeWidth="2" />
          <rect x="83" y="170" width="18" height="24" rx="2" fill="#2c3521" />
          <rect x="88" y="174" width="8" height="12" rx="1" fill="#758267" />
          <rect x="84" y="200" width="16" height="3" rx="1" fill="#a0a596" />
        </g>

        {/* ─── 3. WOODEN PANTRY CABINET (CENTER) ───────────────────────────── */}
        <g id="pantry-cabinet">
          {/* Main Wooden Cabinet Frame */}
          <rect x="186" y="80" width="122" height="280" rx="4" fill="#decbb3" stroke="#2c3521" strokeWidth="2.8" />

          {/* Upper Shelf 1 */}
          <line x1="186" y1="130" x2="308" y2="130" stroke="#2c3521" strokeWidth="2.5" />
          {/* Jars on Shelf 1 */}
          {/* Jar 1 */}
          <rect x="195" y="96" width="18" height="26" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="198" y="93" width="12" height="3" rx="1" fill="#c39d6e" stroke="#2c3521" strokeWidth="1.2" />
          <rect x="199" y="104" width="10" height="10" fill="#df8e59" rx="1" />
          {/* Jar 2 */}
          <rect x="219" y="96" width="18" height="26" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="222" y="93" width="12" height="3" rx="1" fill="#c39d6e" stroke="#2c3521" strokeWidth="1.2" />
          <rect x="223" y="104" width="10" height="10" fill="#91af6b" rx="1" />
          {/* Jar 3 */}
          <rect x="243" y="96" width="18" height="26" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="246" y="93" width="12" height="3" rx="1" fill="#c39d6e" stroke="#2c3521" strokeWidth="1.2" />
          <rect x="247" y="104" width="10" height="10" fill="#f5cf75" rx="1" />
          {/* Small spice bottles */}
          <rect x="268" y="94" width="10" height="28" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.6" />
          <rect x="270" y="90" width="6" height="4" fill="#a07a4c" stroke="#2c3521" strokeWidth="1" />
          <rect x="284" y="94" width="10" height="28" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.6" />
          <rect x="286" y="90" width="6" height="4" fill="#4d7c31" stroke="#2c3521" strokeWidth="1" />

          {/* Upper Shelf 2 */}
          <line x1="186" y1="180" x2="308" y2="180" stroke="#2c3521" strokeWidth="2.5" />
          {/* Jars on Shelf 2 */}
          {/* Big Jar A */}
          <rect x="195" y="146" width="18" height="26" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="198" y="143" width="12" height="3" rx="1" fill="#f5cf75" stroke="#2c3521" strokeWidth="1.2" />
          <rect x="198" y="153" width="12" height="11" fill="#f5cf75" rx="1" />
          {/* Big Jar B */}
          <rect x="218" y="146" width="18" height="26" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="221" y="143" width="12" height="3" rx="1" fill="#c39d6e" stroke="#2c3521" strokeWidth="1.2" />
          <rect x="221" y="153" width="12" height="11" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1" rx="1" />
          {/* Big Jar C */}
          <rect x="241" y="146" width="18" height="26" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="244" y="143" width="12" height="3" rx="1" fill="#c39d6e" stroke="#2c3521" strokeWidth="1.2" />
          <rect x="244" y="153" width="12" height="11" fill="#88684d" rx="1" />
          {/* Small canisters */}
          <rect x="265" y="152" width="14" height="20" rx="1" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.5" />
          <rect x="284" y="152" width="14" height="20" rx="1" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.5" />

          {/* Countertop line */}
          <line x1="186" y1="262" x2="308" y2="262" stroke="#2c3521" strokeWidth="2.8" />

          {/* ── Center Countertop Produce ── */}
          {/* Bowl with Leafy Greens / Spinach */}
          <g id="greens-bowl">
            {/* Bowl base */}
            <path d="M192 254 Q188 262 200 262 L228 262 Q240 262 236 254 Z" fill="#e8ded0" stroke="#2c3521" strokeWidth="2" />
            {/* Lush Spinach leaves */}
            <path d="M194 250 C188 236 198 226 206 232 C214 238 206 252 194 250 Z" fill="#4d7c31" stroke="#2c3521" strokeWidth="1.8" />
            <path d="M206 248 C204 228 216 222 222 228 C228 234 220 250 206 248 Z" fill="#588b37" stroke="#2c3521" strokeWidth="1.8" />
            <path d="M218 248 C220 226 234 226 238 234 C242 242 230 252 218 248 Z" fill="#669d3f" stroke="#2c3521" strokeWidth="1.8" />
          </g>

          {/* Bowl with Bananas */}
          <g id="banana-bowl">
            {/* Bowl base */}
            <path d="M246 254 Q242 262 254 262 L286 262 Q298 262 294 254 Z" fill="#e8ded0" stroke="#2c3521" strokeWidth="2" />
            {/* Bananas */}
            <path d="M250 250 Q262 256 278 246 Q288 240 292 230 Q286 238 274 246 Q260 252 250 250 Z" fill="#f7cf45" stroke="#2c3521" strokeWidth="1.8" />
            <path d="M252 244 Q266 252 282 240 Q292 232 296 220 Q290 230 278 238 Q262 244 252 244 Z" fill="#f7cf45" stroke="#2c3521" strokeWidth="1.8" />
            <circle cx="295" cy="221" r="1.5" fill="#534027" />
          </g>

          {/* Lower Cabinet / Drawers */}
          {/* Left Cupboard Door */}
          <rect x="186" y="264" width="56" height="96" fill="#decbb3" stroke="#2c3521" strokeWidth="2" />
          <line x1="242" y1="264" x2="242" y2="360" stroke="#2c3521" strokeWidth="2" />
          <rect x="233" y="284" width="3" height="20" rx="1.5" fill="#2c3521" />

          {/* Right 4 Drawers */}
          {/* Drawer 1 */}
          <rect x="244" y="264" width="64" height="24" fill="#decbb3" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="268" y="274" width="16" height="3" rx="1.5" fill="#2c3521" />
          {/* Drawer 2 */}
          <rect x="244" y="288" width="64" height="24" fill="#decbb3" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="268" y="298" width="16" height="3" rx="1.5" fill="#2c3521" />
          {/* Drawer 3 */}
          <rect x="244" y="312" width="64" height="24" fill="#decbb3" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="268" y="322" width="16" height="3" rx="1.5" fill="#2c3521" />
          {/* Drawer 4 */}
          <rect x="244" y="336" width="64" height="24" fill="#decbb3" stroke="#2c3521" strokeWidth="1.8" />
          <rect x="268" y="346" width="16" height="3" rx="1.5" fill="#2c3521" />

          {/* Cabinet Feet */}
          <rect x="194" y="360" width="10" height="8" rx="2" fill="#2c3521" />
          <rect x="290" y="360" width="10" height="8" rx="2" fill="#2c3521" />
        </g>

        {/* ─── 4. OPEN REFRIGERATOR DOOR (RIGHT) ───────────────────────────── */}
        <g id="refrigerator-door-open">
          {/* Door Frame */}
          <rect x="312" y="80" width="68" height="280" rx="6" fill="#f4f5f0" stroke="#2c3521" strokeWidth="2.8" />
          {/* Outer door hinge line */}
          <line x1="378" y1="80" x2="378" y2="360" stroke="#2c3521" strokeWidth="2.5" />
          {/* Door Foot */}
          <rect x="364" y="360" width="12" height="8" rx="2" fill="#2c3521" />

          {/* Door Shelf 1 (Top) */}
          <rect x="316" y="116" width="56" height="8" rx="2" fill="#d2d5cc" stroke="#2c3521" strokeWidth="1.6" />
          <rect x="320" y="98" width="14" height="18" rx="2" fill="#e8c792" stroke="#2c3521" strokeWidth="1.4" />
          <rect x="338" y="98" width="14" height="18" rx="2" fill="#e8c792" stroke="#2c3521" strokeWidth="1.4" />
          <rect x="356" y="98" width="14" height="18" rx="2" fill="#e8c792" stroke="#2c3521" strokeWidth="1.4" />

          {/* Door Shelf 2 */}
          <rect x="316" y="184" width="56" height="8" rx="2" fill="#d2d5cc" stroke="#2c3521" strokeWidth="1.6" />
          {/* Milk / Juice carton */}
          <path d="M320 178 L320 152 L326 146 L332 152 L332 178 Z" fill="#f9f7f2" stroke="#2c3521" strokeWidth="1.5" />
          <rect x="323" y="156" width="6" height="12" fill="#e2af65" />
          {/* Bottle 1 */}
          <rect x="338" y="156" width="10" height="22" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.4" />
          <rect x="340" y="148" width="6" height="8" fill="#4d7c31" stroke="#2c3521" strokeWidth="1" />
          {/* Bottle 2 */}
          <rect x="354" y="156" width="10" height="22" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.4" />
          <rect x="356" y="148" width="6" height="8" fill="#4d7c31" stroke="#2c3521" strokeWidth="1" />

          {/* Door Shelf 3 */}
          <rect x="316" y="254" width="56" height="8" rx="2" fill="#d2d5cc" stroke="#2c3521" strokeWidth="1.6" />
          {/* Tall bottle */}
          <path d="M322 248 L322 224 L324 216 L328 216 L330 224 L330 248 Z" fill="#ffffff" stroke="#2c3521" strokeWidth="1.5" />
          {/* Small jar */}
          <rect x="336" y="234" width="10" height="14" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.4" />
          {/* Milk carton box */}
          <rect x="350" y="228" width="18" height="20" rx="2" fill="#df9857" stroke="#2c3521" strokeWidth="1.5" />

          {/* Door Shelf 4 (Bottom) */}
          <rect x="316" y="322" width="56" height="8" rx="2" fill="#d2d5cc" stroke="#2c3521" strokeWidth="1.6" />
          <rect x="320" y="300" width="16" height="16" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.4" />
          <rect x="342" y="300" width="16" height="16" rx="2" fill="#fdfbf7" stroke="#2c3521" strokeWidth="1.4" />
        </g>

        {/* ─── 5. FLOATING STATUS PILLS (INTERACTIVE AESTHETIC) ─────────────── */}
        {/* Badge 1: Optimal (Left Fridge) */}
        <g id="badge-optimal" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.08))">
          <rect x="138" y="166" width="68" height="26" rx="13" fill="#ffffff" stroke="#e0e4d8" strokeWidth="1.5" />
          {/* Green leaf icon */}
          <path d="M148 179 C148 174 153 172 156 172 C156 177 152 181 148 179 Z" fill="#588b37" />
          <path d="M148 179 C151 178 153 176 156 172" stroke="#ffffff" strokeWidth="0.8" />
          <text x="160" y="183.5" fill="#2d3521" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">Optimal</text>
        </g>

        {/* Badge 2: Tracking (Right Door) */}
        <g id="badge-tracking" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.08))">
          <rect x="310" y="258" width="76" height="26" rx="13" fill="#ffffff" stroke="#e0e4d8" strokeWidth="1.5" />
          {/* Bell / alert icon */}
          <circle cx="322" cy="271" r="5" fill="#588b37" />
          <path d="M320 273 L324 273 M322 268 L322 272" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          <text x="332" y="275.5" fill="#2d3521" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">Tracking</text>
        </g>
      </svg>
    </div>
  );
}
