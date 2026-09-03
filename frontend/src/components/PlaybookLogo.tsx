"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

interface PlaybookLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  showText?: boolean;
}

export default function PlaybookLogo({
  size = 36,
  className = "",
  animated = true,
  showText = false
}: PlaybookLogoProps) {
  const { currentTheme } = useTheme();

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Animated Tactical Shield Badge */}
      <div 
        className="relative flex items-center justify-center transition-all duration-300 group"
        style={{
          width: size,
          height: size,
          filter: `drop-shadow(0 0 ${Math.max(6, Math.round(size * 0.25))}px ${currentTheme.glow || 'rgba(249, 115, 22, 0.4)'})`
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Tactical Carbon Fiber / Turf Grid Background Pattern */}
            <pattern id="shieldFieldGrid" width="12" height="12" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="12" y2="0" stroke="#ffffff" strokeWidth="0.4" strokeOpacity="0.06" />
              <line x1="0" y1="0" x2="0" y2="12" stroke="#ffffff" strokeWidth="0.4" strokeOpacity="0.06" />
            </pattern>

            {/* Shield Body Linear Gradient */}
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#080c09" />
              <stop offset="50%" stopColor="#050806" />
              <stop offset="100%" stopColor="#0f1612" />
            </linearGradient>

            {/* Football Facet Gradient */}
            <linearGradient id="footballGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a0f0c" />
              <stop offset="45%" stopColor="#131c17" />
              <stop offset="55%" stopColor="#1c2821" />
              <stop offset="100%" stopColor="#0e1410" />
            </linearGradient>

            {/* Razor Stealth Chevron Arrowhead Marker */}
            <marker 
              id="blindside-arrowhead" 
              viewBox="0 0 10 10" 
              refX="6.5" 
              refY="5" 
              markerWidth="6" 
              markerHeight="6" 
              orient="auto-start-reverse"
            >
              <path 
                d="M 0 1.5 L 9 5 L 0 8.5 L 2.5 5 Z" 
                fill={currentTheme.primary || "#f97316"} 
              />
            </marker>

            {/* Tactical Glow Filter */}
            <filter id="tacticalGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. TACTICAL SHIELD CREST SILHOUETTE */}
          <path 
            d="M 24 8 L 76 8 L 92 24 L 92 56 Q 92 78 50 94 Q 8 78 8 56 L 8 24 L 24 8 Z" 
            fill="url(#shieldGradient)"
            stroke={currentTheme.border || "rgba(249, 115, 22, 0.45)"}
            strokeWidth="2.2"
            strokeLinejoin="round"
            style={{
              transition: "stroke 0.3s ease"
            }}
          />

          {/* Tactical Turf Grid Overlay inside Shield */}
          <path 
            d="M 24 8 L 76 8 L 92 24 L 92 56 Q 92 78 50 94 Q 8 78 8 56 L 8 24 L 24 8 Z" 
            fill="url(#shieldFieldGrid)"
            opacity="0.85"
          />

          {/* Inner Shield Bevel Inset */}
          <path 
            d="M 26 12 L 74 12 L 88 26 L 88 55 Q 88 74 50 89 Q 12 74 12 55 L 12 26 L 26 12 Z" 
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.75"
            strokeOpacity="0.12"
            strokeLinejoin="round"
          />

          {/* 2. FIELD YARDLINES & LINE OF SCRIMMAGE */}
          {/* Vertical Center Line of Scrimmage */}
          <line 
            x1="50" 
            y1="12" 
            x2="50" 
            y2="88" 
            stroke="#ffffff" 
            strokeWidth="1.2" 
            strokeDasharray="3 3" 
            strokeOpacity="0.22" 
          />

          {/* Horizontal Yardline Hashes */}
          <line x1="46" y1="32" x2="54" y2="32" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" />
          <line x1="44" y1="50" x2="56" y2="50" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.3" />
          <line x1="46" y1="68" x2="54" y2="68" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" />

          {/* 3. CORE EMBLEM: THE TACTICAL FOOTBALL */}
          {/* Smooth Aerodynamic American Football Silhouette at 38° Diagonal */}
          <g>
            {/* Football Outer Shell */}
            <path 
              d="M 25 73 C 27 45, 45 27, 75 25 C 73 53, 55 71, 25 73 Z" 
              fill="url(#footballGradient)"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeOpacity="0.2"
              style={{
                filter: "drop-shadow(0 2px 5px rgba(0, 0, 0, 0.7))"
              }}
            />

            {/* Facet Shading Seam */}
            <path 
              d="M 25 73 L 75 25" 
              stroke="#000000" 
              strokeWidth="1" 
              strokeOpacity="0.3" 
            />

            {/* Football Laser Laces (White Stitches) */}
            <g className={animated ? "animate-playbook-laces" : ""}>
              {/* Main Center Lacing Seam */}
              <line 
                x1="43" 
                y1="55" 
                x2="57" 
                y2="41" 
                stroke="#ffffff" 
                strokeWidth="1.75" 
                strokeLinecap="round"
                strokeOpacity="0.95"
              />
              {/* 4 Cross Stitches */}
              <line x1="41" y1="51" x2="47" y2="57" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />
              <line x1="45" y1="47" x2="51" y2="53" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />
              <line x1="49" y1="43" x2="55" y2="49" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />
              <line x1="53" y1="39" x2="59" y2="45" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />
            </g>
          </g>

          {/* 4. DEFENSIVE THREAT 'X' (Pass Rusher coming from the Blindside) */}
          <g 
            className={animated ? "animate-playbook-x" : ""}
            style={{ filter: "drop-shadow(0 0 4px rgba(244, 63, 94, 0.75))" }}
          >
            <circle cx="70" cy="62" r="7" fill="none" stroke="#f43f5e" strokeWidth="0.75" strokeOpacity="0.4" strokeDasharray="2 2" />
            <line x1="66" y1="58" x2="74" y2="66" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="74" y1="58" x2="66" y2="66" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* 5. PASS VECTOR TELEMETRY (Cyan Dotted Projection Line) */}
          <line 
            x1="26" 
            y1="66" 
            x2="74" 
            y2="26" 
            stroke="#06b6d4" 
            strokeWidth="1.5" 
            strokeDasharray="3 3" 
            strokeOpacity="0.7" 
          />

          {/* 6. THE "BLINDSIDE" ROUTE CUT & STRIKE ARROW */}
          <path 
            d="M 26 66 Q 24 38 48 32 T 80 18" 
            fill="none" 
            stroke={currentTheme.primary || "#f97316"} 
            strokeWidth="3.2" 
            strokeLinecap="round"
            markerEnd="url(#blindside-arrowhead)"
            className={animated ? "animate-playbook-route" : ""}
            style={{
              filter: `drop-shadow(0 0 6px ${currentTheme.glow || 'rgba(249, 115, 22, 0.8)'})`,
            }}
          />

          {/* 7. OFFENSIVE PLAYMAKER / QB POCKET NODE */}
          <g className={animated ? "animate-playbook-node" : ""}>
            {/* Outer Expanding Radar Wave */}
            <circle 
              cx="26" 
              cy="66" 
              r="11" 
              fill="none" 
              stroke={currentTheme.primary || "#f97316"} 
              strokeWidth="0.75" 
              strokeOpacity="0.4" 
              strokeDasharray="2 2"
            />
            {/* Core Node Ring */}
            <circle 
              cx="26" 
              cy="66" 
              r="7" 
              fill="#060907" 
              stroke={currentTheme.primary || "#f97316"} 
              strokeWidth="2.8" 
            />
            {/* Core White Pulse Center */}
            <circle 
              cx="26" 
              cy="66" 
              r="2" 
              fill="#ffffff" 
            />
          </g>

          {/* 8. TACTICAL HUD CORNER BRACKETS */}
          <path d="M 18 20 L 14 20 L 14 24" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.35" />
          <path d="M 82 20 L 86 20 L 86 24" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.35" />
        </svg>
      </div>

      {/* Optional Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black italic tracking-wider text-white font-sans text-base">
              BLINDSIDE <span style={{ color: currentTheme.primary }}>DYNASTY</span>
            </span>
          </div>
          <span className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase mt-0.5">
            TACTICAL WAR ROOM • QUANT ENGINE
          </span>
        </div>
      )}
    </div>
  );
}
