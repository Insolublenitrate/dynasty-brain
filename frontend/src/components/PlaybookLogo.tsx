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
      {/* Animated SVG Playbook Icon Badge */}
      <div 
        className="relative rounded-xl overflow-hidden flex items-center justify-center p-1 border shadow-lg transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          backgroundColor: "#060907",
          borderColor: "rgba(255, 255, 255, 0.12)",
          boxShadow: `0 0 16px ${currentTheme.glow || 'rgba(249, 115, 22, 0.25)'}`
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Turf Grid Background Pattern */}
            <pattern id="logoTurfGrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="16" y2="0" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.08" />
              <line x1="0" y1="0" x2="0" y2="16" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.08" />
            </pattern>

            {/* Glowing Arrowhead */}
            <marker 
              id="logo-arrowhead" 
              viewBox="0 0 10 10" 
              refX="6" 
              refY="5" 
              markerWidth="6" 
              markerHeight="6" 
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={currentTheme.primary || "#f97316"} />
            </marker>

            {/* Glow Filter */}
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Turf Background */}
          <rect width="100" height="100" rx="14" fill="#090d0a" />
          <rect width="100" height="100" fill="url(#logoTurfGrid)" />

          {/* Line of Scrimmage (Dotted Yard Line) */}
          <line 
            x1="50" 
            y1="8" 
            x2="50" 
            y2="92" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeDasharray="4 3" 
            strokeOpacity="0.3" 
          />

          {/* Animated Sweeping Playbook Route Curve */}
          <path 
            d="M 28 68 Q 24 32 50 24 T 76 34" 
            fill="none" 
            stroke={currentTheme.primary || "#f97316"} 
            strokeWidth="3.5" 
            strokeLinecap="round"
            markerEnd="url(#logo-arrowhead)"
            className={animated ? "animate-pulse" : ""}
            style={{
              filter: "drop-shadow(0 0 4px rgba(249, 115, 22, 0.6))",
              strokeDasharray: animated ? "80" : "none",
              strokeDashoffset: animated ? "0" : "0"
            }}
          />

          {/* Pass Vector Dotted Trajectory */}
          <line 
            x1="28" 
            y1="68" 
            x2="72" 
            y2="34" 
            stroke="#06b6d4" 
            strokeWidth="2" 
            strokeDasharray="4 3" 
            strokeOpacity="0.8" 
          />

          {/* Tactical 'O' (Offensive Quarterback / Playmaker) */}
          <g className={animated ? "animate-bounce" : ""} style={{ animationDuration: "3s" }}>
            {/* Outer Glow Halo */}
            <circle 
              cx="28" 
              cy="68" 
              r="13" 
              fill="none" 
              stroke={currentTheme.primary || "#f97316"} 
              strokeWidth="1" 
              strokeOpacity="0.4" 
              strokeDasharray="2 2"
            />
            {/* Core O Ring */}
            <circle 
              cx="28" 
              cy="68" 
              r="9.5" 
              fill="#060907" 
              stroke={currentTheme.primary || "#f97316"} 
              strokeWidth="3.5" 
            />
            {/* Inner Core Dot */}
            <circle 
              cx="28" 
              cy="68" 
              r="2.5" 
              fill="#ffffff" 
            />
          </g>

          {/* Tactical 'X' (Defensive Challenger / Rusher) */}
          <g 
            stroke="#f43f5e" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 3px rgba(244, 63, 94, 0.7))" }}
          >
            <line x1="64" y1="26" x2="80" y2="42" />
            <line x1="80" y1="26" x2="64" y2="42" />
          </g>

          {/* Secondary Defensive 'X' in Backfield */}
          <g 
            stroke="#ffffff" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeOpacity="0.5"
          >
            <line x1="68" y1="68" x2="78" y2="78" />
            <line x1="78" y1="68" x2="68" y2="78" />
          </g>

          {/* Secondary Offensive 'O' Receiver */}
          <circle 
            cx="24" 
            cy="28" 
            r="6" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="2" 
            strokeOpacity="0.6" 
          />
        </svg>
      </div>

      {/* Optional Brand Text */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black tracking-tight text-white font-sans text-base">
              DYNASTY<span style={{ color: currentTheme.primary }}>BRAIN</span>
            </span>
          </div>
          <span className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase mt-0.5">
            X's & O's QUANT ENGINE
          </span>
        </div>
      )}
    </div>
  );
}
