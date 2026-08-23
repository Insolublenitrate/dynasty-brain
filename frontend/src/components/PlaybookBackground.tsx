"use client";

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function PlaybookBackground() {
  const { currentTheme } = useTheme();

  // Field Geometry:
  // Total Canvas: 1920 x 1080
  // Left Endzone: 0 to 160 (10 yds)
  // Left Goal Line: x = 160 (0 yd)
  // 100-Yard Field: x = 160 to 1760 (16px per yard, 160px per 10 yards)
  // 10yd: 320, 20yd: 480, 30yd: 640, 40yd: 800, 50yd: 960 (Midfield)
  // 40yd: 1120, 30yd: 1280, 20yd: 1440, 10yd: 1600
  // Right Goal Line: x = 1760 (0 yd)
  // Right Endzone: 1760 to 1920 (10 yds)

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      <svg 
        className="absolute inset-0 w-full h-full opacity-[0.32] transition-all duration-700" 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Turf Grain Pattern */}
          <pattern id="fieldTurfGrain" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#060907" />
            <circle cx="2" cy="2" r="1" fill="#0d140e" />
            <circle cx="6" cy="6" r="1" fill="#0d140e" />
          </pattern>

          {/* Endzone Diagonal Chevrons */}
          <pattern id="endzoneChevrons" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="40" y2="40" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.15" />
            <line x1="0" y1="40" x2="40" y2="0" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.15" />
          </pattern>

          {/* Arrowheads for Playbook Routes */}
          <marker 
            id="field-arrow-primary" 
            viewBox="0 0 10 10" 
            refX="6" 
            refY="5" 
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={currentTheme.primary} />
          </marker>

          <marker 
            id="field-arrow-cyan" 
            viewBox="0 0 10 10" 
            refX="6" 
            refY="5" 
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#06b6d4" />
          </marker>

          <marker 
            id="field-arrow-white" 
            viewBox="0 0 10 10" 
            refX="6" 
            refY="5" 
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ffffff" />
          </marker>
        </defs>

        {/* Base Field */}
        <rect width="1920" height="1080" fill="url(#fieldTurfGrain)" />

        {/* ========================================================================= */}
        {/* 1. ALTERNATING 10-YARD TURF STRIPES (100-Yard Field: Exactly 160px each) */}
        {/* ========================================================================= */}
        
        {/* Left Endzone (0 - 160) */}
        <rect x="0" y="0" width="160" height="1080" fill="#0a120c" opacity="0.8" />
        <rect x="0" y="80" width="160" height="920" fill="url(#endzoneChevrons)" />

        {/* 10-Yard Turf Bands */}
        <rect x="160" y="0" width="160" height="1080" fill="#0b130e" opacity="0.5" /> {/* 0-10yd */}
        <rect x="320" y="0" width="160" height="1080" fill="#060a08" opacity="0.5" /> {/* 10-20yd */}
        <rect x="480" y="0" width="160" height="1080" fill="#0b130e" opacity="0.5" /> {/* 20-30yd */}
        <rect x="640" y="0" width="160" height="1080" fill="#060a08" opacity="0.5" /> {/* 30-40yd */}
        <rect x="800" y="0" width="160" height="1080" fill="#0b130e" opacity="0.5" /> {/* 40-50yd */}
        <rect x="960" y="0" width="160" height="1080" fill="#060a08" opacity="0.5" /> {/* 50-40yd */}
        <rect x="1120" y="0" width="160" height="1080" fill="#0b130e" opacity="0.5" /> {/* 40-30yd */}
        <rect x="1280" y="0" width="160" height="1080" fill="#060a08" opacity="0.5" /> {/* 30-20yd */}
        <rect x="1440" y="0" width="160" height="1080" fill="#0b130e" opacity="0.5" /> {/* 20-10yd */}
        <rect x="1600" y="0" width="160" height="1080" fill="#060a08" opacity="0.5" /> {/* 10-0yd */}

        {/* Right Endzone (1760 - 1920) */}
        <rect x="1760" y="0" width="160" height="1080" fill="#0a120c" opacity="0.8" />
        <rect x="1760" y="80" width="160" height="920" fill="url(#endzoneChevrons)" />

        {/* Sideline Solid White Borders (Top y=80, Bottom y=1000) */}
        <line x1="0" y1="80" x2="1920" y2="80" stroke="#ffffff" strokeWidth="4" opacity="0.85" />
        <line x1="0" y1="1000" x2="1920" y2="1000" stroke="#ffffff" strokeWidth="4" opacity="0.85" />

        {/* Left Goal Line (x=160) & Right Goal Line (x=1760) */}
        <line x1="160" y1="80" x2="160" y2="1000" stroke="#ffffff" strokeWidth="5" opacity="0.95" />
        <line x1="1760" y1="80" x2="1760" y2="1000" stroke="#ffffff" strokeWidth="5" opacity="0.95" />

        {/* 5-Yard Dashed Lines (every 80px: 240, 400, 560, 720, 880, 1040, 1200, 1360, 1520, 1680) */}
        {[240, 400, 560, 720, 880, 1040, 1200, 1360, 1520, 1680].map((x) => (
          <line 
            key={`5yd-${x}`} 
            x1={x} 
            y1="80" 
            x2={x} 
            y2="1000" 
            stroke="#ffffff" 
            strokeWidth="1.2" 
            strokeDasharray="8 6" 
            opacity="0.35" 
          />
        ))}

        {/* 10-Yard Solid Lines (every 160px: 320, 480, 640, 800, 1120, 1280, 1440, 1600) */}
        {[320, 480, 640, 800, 1120, 1280, 1440, 1600].map((x) => (
          <line 
            key={`10yd-${x}`} 
            x1={x} 
            y1="80" 
            x2={x} 
            y2="1000" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            opacity="0.75" 
          />
        ))}

        {/* 50-Yard Midfield Highlight Stripe (x=960) */}
        <line x1="960" y1="80" x2="960" y2="1000" stroke="#ffffff" strokeWidth="4.5" opacity="0.95" />

        {/* Individual 1-Yard Hash Marks across the 100-Yard Field (16px per yard) */}
        {Array.from({ length: 99 }).map((_, i) => {
          const yard = i + 1;
          if (yard % 5 === 0) return null; // skip 5 and 10-yard lines
          const x = 160 + yard * 16;
          return (
            <g key={`hash-${yard}`} stroke="#ffffff" strokeWidth="1.2" opacity="0.65">
              {/* Top Sideline Hash */}
              <line x1={x} y1="95" x2={x} y2="110" />
              {/* Inbounds Top Hash (NFL Hash = y=440) */}
              <line x1={x} y1="440" x2={x} y2="455" />
              {/* Inbounds Bottom Hash (NFL Hash = y=640) */}
              <line x1={x} y1="625" x2={x} y2="640" />
              {/* Bottom Sideline Hash */}
              <line x1={x} y1="970" x2={x} y2="985" />
            </g>
          );
        })}

        {/* ========================================================================= */}
        {/* 2. AUTHENTIC FOOTBALL FIELD YARD NUMBERS & POSSESSION ARROWS              */}
        {/* Exact Sequence: 10 -> 20 -> 30 -> 40 -> 50 -> 40 -> 30 -> 20 -> 10       */}
        {/* ========================================================================= */}
        
        {/* Top Sideline Numbers (Right-Side Up, Readable from Top View) */}
        <g 
          fill="#ffffff" 
          opacity="0.7" 
          fontSize="48" 
          fontFamily="'Impact', 'Arial Black', sans-serif" 
          fontWeight="bold" 
          letterSpacing="4" 
          textAnchor="middle"
        >
          {/* Own Side (10 to 40) */}
          <text x="320" y="210">1 0</text>
          <text x="480" y="210">2 0</text>
          <text x="640" y="210">3 0</text>
          <text x="800" y="210">4 0</text>
          
          {/* 50-Yard Midfield */}
          <text x="960" y="210">5 0</text>

          {/* Opponent Side (40 down to 10) */}
          <text x="1120" y="210">4 0</text>
          <text x="1280" y="210">3 0</text>
          <text x="1440" y="210">2 0</text>
          <text x="1600" y="210">1 0</text>

          {/* Directional Arrows pointing toward closest goal line */}
          {/* Left half arrows point LEFT (◄) toward left goal line */}
          <polygon points="270,195 255,202 270,209" fill="#ffffff" />
          <polygon points="430,195 415,202 430,209" fill="#ffffff" />
          <polygon points="590,195 575,202 590,209" fill="#ffffff" />
          <polygon points="750,195 735,202 750,209" fill="#ffffff" />

          {/* Right half arrows point RIGHT (►) toward right goal line */}
          <polygon points="1170,195 1185,202 1170,209" fill="#ffffff" />
          <polygon points="1330,195 1345,202 1330,209" fill="#ffffff" />
          <polygon points="1490,195 1505,202 1490,209" fill="#ffffff" />
          <polygon points="1650,195 1665,202 1650,209" fill="#ffffff" />
        </g>

        {/* Bottom Sideline Numbers (Readable from Bottom View) */}
        <g 
          fill="#ffffff" 
          opacity="0.7" 
          fontSize="48" 
          fontFamily="'Impact', 'Arial Black', sans-serif" 
          fontWeight="bold" 
          letterSpacing="4" 
          textAnchor="middle"
        >
          {/* Own Side (10 to 40) */}
          <text x="320" y="890">1 0</text>
          <text x="480" y="890">2 0</text>
          <text x="640" y="890">3 0</text>
          <text x="800" y="890">4 0</text>
          
          {/* 50-Yard Midfield */}
          <text x="960" y="890">5 0</text>

          {/* Opponent Side (40 down to 10) */}
          <text x="1120" y="890">4 0</text>
          <text x="1280" y="890">3 0</text>
          <text x="1440" y="890">2 0</text>
          <text x="1600" y="890">1 0</text>

          {/* Bottom Directional Arrows */}
          <polygon points="270,875 255,882 270,889" fill="#ffffff" />
          <polygon points="430,875 415,882 430,889" fill="#ffffff" />
          <polygon points="590,875 575,882 590,889" fill="#ffffff" />
          <polygon points="750,875 735,882 750,889" fill="#ffffff" />

          <polygon points="1170,875 1185,882 1170,889" fill="#ffffff" />
          <polygon points="1330,875 1345,882 1330,889" fill="#ffffff" />
          <polygon points="1490,875 1505,882 1490,889" fill="#ffffff" />
          <polygon points="1650,875 1665,882 1650,889" fill="#ffffff" />
        </g>


        {/* ========================================================================= */}
        {/* 3. PLAY SIMULATION 1: MIDFIELD 11-PERSONNEL DRIVE (Starts on Own 30-YD)   */}
        {/* Line of Scrimmage = x=640 (30 Yard Line) -> Driving Right toward Midfield */}
        {/* ========================================================================= */}
        <g className="play-sim-midfield">
          
          {/* Blue Line of Scrimmage at 30 Yard Line (x=640) */}
          <line x1="640" y1="110" x2="640" y2="970" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.85" />
          
          {/* Yellow First Down Line at 40 Yard Line (x=800) */}
          <line x1="800" y1="110" x2="800" y2="970" stroke="#eab308" strokeWidth="2.5" strokeDasharray="8 4" opacity="0.8" />

          {/* Offensive Line (O's) lined up directly on LOS (x=630, facing right toward x=640) */}
          <circle cx="630" cy="540" r="10" fill="none" stroke={currentTheme.primary} strokeWidth="3" /> {/* Center */}
          <circle cx="630" cy="510" r="9" fill="none" stroke="#ffffff" strokeWidth="2" /> {/* LG */}
          <circle cx="630" cy="480" r="9" fill="none" stroke="#ffffff" strokeWidth="2" /> {/* LT */}
          <circle cx="630" cy="570" r="9" fill="none" stroke="#ffffff" strokeWidth="2" /> {/* RG */}
          <circle cx="630" cy="600" r="9" fill="none" stroke="#ffffff" strokeWidth="2" /> {/* RT */}
          <circle cx="630" cy="630" r="9" fill="none" stroke="#ffffff" strokeWidth="2" /> {/* TE */}

          {/* QB in Shotgun (x=560, 5 yards behind LOS) */}
          <circle cx="560" cy="540" r="12" fill="none" stroke={currentTheme.primary} strokeWidth="2.5" />
          <text x="560" y="544" fill={currentTheme.primary} fontSize="10" fontWeight="bold" textAnchor="middle">QB</text>

          {/* Running Back in backfield (x=530, y=500) */}
          <circle cx="530" cy="500" r="9" fill="none" stroke="#ffffff" strokeWidth="2" />

          {/* WR1 (X) Split Wide Top (x=630, y=240) */}
          <circle cx="630" cy="240" r="9" fill="none" stroke={currentTheme.primary} strokeWidth="2.5" />
          
          {/* Slot WR (Y) (x=615, y=360) */}
          <circle cx="615" cy="360" r="9" fill="none" stroke="#ffffff" strokeWidth="2" />

          {/* WR2 (Z) Split Wide Bottom (x=630, y=840) */}
          <circle cx="630" cy="840" r="9" fill="none" stroke={currentTheme.primary} strokeWidth="2.5" />

          {/* Defensive Alignment (X's) at 31-yard line (x=656) */}
          <g stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
            {/* Defensive Line */}
            <line x1="650" y1="475" x2="662" y2="487" /><line x1="662" y1="475" x2="650" y2="487" /> {/* LE */}
            <line x1="650" y1="520" x2="662" y2="532" /><line x1="662" y1="520" x2="650" y2="532" /> {/* DT */}
            <line x1="650" y1="550" x2="662" y2="562" /><line x1="662" y1="550" x2="650" y2="562" /> {/* DT */}
            <line x1="650" y1="600" x2="662" y2="612" /><line x1="662" y1="600" x2="650" y2="612" /> {/* RE */}

            {/* Linebackers at 35 Yard Line (x=720) */}
            <line x1="715" y1="500" x2="727" y2="512" /><line x1="727" y1="500" x2="715" y2="512" /> {/* WLB */}
            <line x1="715" y1="540" x2="727" y2="552" /><line x1="727" y1="540" x2="715" y2="552" /> {/* MLB */}
            <line x1="715" y1="580" x2="727" y2="592" /><line x1="727" y1="580" x2="715" y2="592" /> {/* SLB */}

            {/* Cornerbacks at x=700 */}
            <line x1="695" y1="235" x2="707" y2="247" /><line x1="707" y1="235" x2="695" y2="247" /> {/* CB1 */}
            <line x1="695" y1="835" x2="707" y2="847" /><line x1="707" y1="835" x2="695" y2="847" /> {/* CB2 */}

            {/* Safeties (Two-High Shell at 50 Yard Line x=960) */}
            <line x1="955" y1="360" x2="967" y2="372" /><line x1="967" y1="360" x2="955" y2="372" /> {/* FS */}
            <line x1="955" y1="720" x2="967" y2="732" /><line x1="967" y1="720" x2="955" y2="732" /> {/* SS */}
          </g>

          {/* ================= DOWNFIELD ROUTES (Driving Right across Yard Lines) ================= */}
          
          {/* WR1 Boundary 15-Yard Comeback (From 30yd x=640 to 45yd x=880, then cuts back to x=840) */}
          <path 
            d="M 640 240 L 880 240 L 830 205" 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="3" 
            markerEnd="url(#field-arrow-primary)"
            className="playbook-route-draw"
          />

          {/* Slot WR Deep Post (From 30yd x=640 to 45yd x=880, then breaks inside to 50yd x=960 / y=470) */}
          <path 
            d="M 625 360 L 860 360 Q 900 370 1060 480" 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="3" 
            markerEnd="url(#field-arrow-primary)"
            className="playbook-route-draw"
          />

          {/* Tight End Seam Route down the Hash (Runs straight down the hash from x=640 to x=1020) */}
          <path 
            d="M 640 630 L 1020 630" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            strokeDasharray="8 4"
            markerEnd="url(#field-arrow-white)"
            className="playbook-route-draw-delay"
          />

          {/* Running Back Wheel Route out of Backfield */}
          <path 
            d="M 530 500 Q 580 420 650 420 L 920 420" 
            fill="none" 
            stroke="#06b6d4" 
            strokeWidth="2.5" 
            markerEnd="url(#field-arrow-cyan)"
            className="playbook-route-draw-fast"
          />

          {/* WR2 Dig Route over the Middle */}
          <path 
            d="M 640 840 L 800 840 L 800 500" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            markerEnd="url(#field-arrow-white)"
            className="playbook-route-draw-delay"
          />

          {/* Pass Trajectory from QB to Slot Receiver at Breakpoint */}
          <line 
            x1="560" 
            y1="540" 
            x2="880" 
            y2="370" 
            stroke={currentTheme.primary} 
            strokeWidth="1.8" 
            strokeDasharray="6 4" 
            opacity="0.9" 
            className="playbook-motion-pulse"
          />
        </g>


        {/* ========================================================================= */}
        {/* 4. PLAY SIMULATION 2: RED ZONE STRIKE (Starts on Opponent 20-YD: x=1440)  */}
        {/* Line of Scrimmage = x=1440 -> Driving Right across Goal Line (x=1760)     */}
        {/* ========================================================================= */}
        <g className="play-sim-redzone">
          
          {/* Red Zone Line of Scrimmage at 20-Yard Line (x=1440) */}
          <line x1="1440" y1="110" x2="1440" y2="970" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.85" />

          {/* Offensive Line (O's) at x=1430 */}
          <circle cx="1430" cy="540" r="10" fill="none" stroke={currentTheme.primary} strokeWidth="3" />
          <circle cx="1430" cy="510" r="9" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="1430" cy="480" r="9" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="1430" cy="570" r="9" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="1430" cy="600" r="9" fill="none" stroke="#ffffff" strokeWidth="2" />

          {/* QB in Pistol (x=1360, 5 yds back at 25-yd line) */}
          <circle cx="1360" cy="540" r="12" fill="none" stroke={currentTheme.primary} strokeWidth="2.5" />
          <text x="1360" y="544" fill={currentTheme.primary} fontSize="10" fontWeight="bold" textAnchor="middle">QB</text>

          {/* Pre-snap Jet Motion from Slot WR (x=1460 -> curves behind QB to x=1280) */}
          <circle cx="1460" cy="300" r="9" fill="none" stroke="#10b981" strokeWidth="2" />
          <path 
            d="M 1460 300 Q 1390 400 1280 520" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="2.5" 
            strokeDasharray="6 4"
            className="playbook-motion-pulse"
          />

          {/* WR Corner Fade into Endzone (From 20yd x=1440 across Goal Line x=1760 into corner x=1860, y=140) */}
          <circle cx="1430" cy="240" r="9" fill="none" stroke={currentTheme.primary} strokeWidth="2.5" />
          <path 
            d="M 1440 240 L 1680 240 Q 1740 240 1860 140" 
            fill="none" 
            stroke={currentTheme.primary} 
            strokeWidth="3" 
            markerEnd="url(#field-arrow-primary)"
            className="playbook-route-draw"
          />

          {/* Goal Line Slant into Endzone (From 20yd x=1440 across Goal Line to x=1800, y=560) */}
          <circle cx="1430" cy="820" r="9" fill="none" stroke="#ffffff" strokeWidth="2" />
          <path 
            d="M 1440 820 L 1560 820 L 1800 560" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            markerEnd="url(#field-arrow-white)"
            className="playbook-route-draw-delay"
          />

          {/* Defensive Goal Line Standoff (X's defending Goal Line at x=1740) */}
          <g stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
            <line x1="1735" y1="230" x2="1747" y2="242" /><line x1="1747" y1="230" x2="1735" y2="242" /> {/* DB */}
            <line x1="1735" y1="520" x2="1747" y2="532" /><line x1="1747" y1="520" x2="1735" y2="532" /> {/* Safety */}
            <line x1="1735" y1="810" x2="1747" y2="822" /><line x1="1747" y1="810" x2="1735" y2="822" /> {/* DB */}
          </g>

          {/* Touchdown Throw Line to Corner of Endzone */}
          <line 
            x1="1360" 
            y1="540" 
            x2="1850" 
            y2="150" 
            stroke="#06b6d4" 
            strokeWidth="1.8" 
            strokeDasharray="6 4" 
            opacity="0.85" 
            className="playbook-motion-pulse"
          />
        </g>
      </svg>
    </div>
  );
}
