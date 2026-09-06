"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { 
  Pencil, ArrowUpRight, Circle, X as XIcon, Undo2, Trash2, 
  Download, Sparkles, Share2, Check, RefreshCw
} from "lucide-react";

interface TelestratorChalkboardProps {
  telestratorText?: string;
  onSnapshotTaken?: (dataUrl: string) => void;
  className?: string;
}

type ToolMode = "yellow_chalk" | "cyan_route" | "red_blitz" | "stamp_x" | "stamp_o";

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  tool: ToolMode;
  color: string;
  lineWidth: number;
  points: StrokePoint[];
  arrow?: boolean;
}

export default function TelestratorChalkboard({
  telestratorText,
  onSnapshotTaken,
  className = ""
}: TelestratorChalkboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<ToolMode>("yellow_chalk");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 700, height: 320 });

  // Color & styles per tool
  const getToolConfig = (t: ToolMode) => {
    switch (t) {
      case "yellow_chalk":
        return { color: "#facc15", width: 5, glow: "#f59e0b" };
      case "cyan_route":
        return { color: "#38bdf8", width: 4, glow: "#0284c7" };
      case "red_blitz":
        return { color: "#f43f5e", width: 5, glow: "#e11d48" };
      case "stamp_x":
        return { color: "#fb7185", width: 4, glow: "#e11d48" };
      case "stamp_o":
        return { color: "#34d399", width: 4, glow: "#059669" };
    }
  };

  // Sync canvas dimensions with parent container
  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    const w = Math.max(320, clientWidth);
    const h = Math.round(w * 0.44); // 16:7 aspect ratio
    setDimensions({ width: w, height: Math.max(260, Math.min(380, h)) });
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [updateSize]);

  // Draw the underlying tactical football field grid
  const drawFieldBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Deep chalkboard turf green background
    ctx.fillStyle = "#0c1712";
    ctx.fillRect(0, 0, w, h);

    // Subtle tactical field grid
    ctx.strokeStyle = "rgba(34, 197, 94, 0.08)";
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Yard lines
    const yardInterval = w / 6;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    for (let i = 1; i < 6; i++) {
      const x = i * yardInterval;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      // Yard numbers
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.textAlign = "center";
      const yardNum = i <= 3 ? i * 10 : (6 - i) * 10;
      ctx.fillText(`${yardNum}`, x, 18);
      ctx.fillText(`${yardNum}`, x, h - 8);
    }
    ctx.setLineDash([]); // Reset line dash

    // Hash marks in center
    const hashY1 = h * 0.42;
    const hashY2 = h * 0.58;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    for (let x = 20; x < w - 20; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, hashY1 - 3);
      ctx.lineTo(x, hashY1 + 3);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, hashY2 - 3);
      ctx.lineTo(x, hashY2 + 3);
      ctx.stroke();
    }

    // Line of scrimmage (blue) & First Down Line (yellow)
    const losX = w * 0.38;
    const fdX = w * 0.56;

    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(losX, 0);
    ctx.lineTo(losX, h);
    ctx.stroke();

    ctx.strokeStyle = "rgba(234, 179, 8, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fdX, 0);
    ctx.lineTo(fdX, h);
    ctx.stroke();

    // Field Watermark
    ctx.font = "bold 9px monospace";
    ctx.fillStyle = "rgba(251, 191, 36, 0.35)";
    ctx.textAlign = "right";
    ctx.fillText("MADDEN TELESTRATOR • 1ST & 10", w - 16, 20);
  };

  // Helper to draw an arrowhead at end of stroke
  const drawArrowhead = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string
  ) => {
    const headlen = 12;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // Redraw all strokes onto canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Field
    drawFieldBackground(ctx, width, height);

    // 2. Draw user strokes
    strokes.forEach((s) => {
      if (s.points.length === 0) return;

      const conf = getToolConfig(s.tool);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = conf.glow;
      ctx.shadowBlur = 8;

      if (s.tool === "stamp_x" || s.tool === "stamp_o") {
        const pt = s.points[0];
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = s.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.tool === "stamp_x" ? "✕" : "◯", pt.x, pt.y);
      } else {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);

        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();

        // Draw arrow if cyan route
        if (s.arrow && s.points.length > 2) {
          const last = s.points[s.points.length - 1];
          const prev = s.points[s.points.length - 2];
          drawArrowhead(ctx, prev.x, prev.y, last.x, last.y, s.color);
        }
      }
    });

    ctx.shadowBlur = 0; // Reset glow
  }, [dimensions, strokes]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle auto-diagramming when new telestrator prompt text arrives
  useEffect(() => {
    if (!telestratorText) return;

    const w = dimensions.width;
    const h = dimensions.height;
    const cx = w * 0.45;
    const cy = h * 0.5;

    // Generate Madden's auto-drawn circle around the key tactical point
    const autoCirclePoints: StrokePoint[] = [];
    const radius = Math.min(w, h) * 0.18;
    const steps = 24;

    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      // Add slight organic chalk wobble
      const wobble = (Math.sin(i * 3) + Math.cos(i * 2)) * 2;
      autoCirclePoints.push({
        x: cx + Math.cos(angle) * (radius + wobble),
        y: cy + Math.sin(angle) * (radius + wobble)
      });
    }

    // Auto-drawn route arrow bursting toward endzone
    const autoArrowPoints: StrokePoint[] = [
      { x: cx + radius * 0.7, y: cy - radius * 0.5 },
      { x: cx + radius * 1.5, y: cy - radius * 1.1 },
      { x: cx + radius * 2.1, y: cy - radius * 1.4 }
    ];

    const initialStrokes: Stroke[] = [
      {
        tool: "yellow_chalk",
        color: "#facc15",
        lineWidth: 5,
        points: autoCirclePoints
      },
      {
        tool: "cyan_route",
        color: "#38bdf8",
        lineWidth: 4,
        points: autoArrowPoints,
        arrow: true
      },
      {
        tool: "stamp_x",
        color: "#f43f5e",
        lineWidth: 4,
        points: [{ x: cx - radius * 1.1, y: cy }]
      },
      {
        tool: "stamp_o",
        color: "#34d399",
        lineWidth: 4,
        points: [{ x: cx, y: cy }]
      }
    ];

    setStrokes(initialStrokes);
  }, [telestratorText, dimensions.width, dimensions.height]);

  // Coordinate normalizer for Canvas (handles touch & mouse)
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Drawing event handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pt = getCanvasCoords(e);
    if (!pt) return;

    setIsDrawing(true);
    const conf = getToolConfig(tool);

    if (tool === "stamp_x" || tool === "stamp_o") {
      setStrokes((prev) => [
        ...prev,
        {
          tool,
          color: conf.color,
          lineWidth: conf.width,
          points: [pt]
        }
      ]);
      setIsDrawing(false);
      return;
    }

    setStrokes((prev) => [
      ...prev,
      {
        tool,
        color: conf.color,
        lineWidth: conf.width,
        points: [pt],
        arrow: tool === "cyan_route"
      }
    ]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);
    if (!pt) return;

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      const current = prev[lastIndex];

      const updated = {
        ...current,
        points: [...current.points, pt]
      };

      return [...prev.slice(0, lastIndex), updated];
    });
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
  };

  // Snapshot & Share to Clipboard or Download
  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    if (onSnapshotTaken) {
      onSnapshotTaken(dataUrl);
    }

    try {
      // Create download anchor
      const link = document.createElement("a");
      link.download = `Madden-Telestrator-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to export image:", err);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Toolbar Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-mono font-black text-amber-400 uppercase tracking-wider">
            John Madden Telestrator 2.0
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Undo last stroke"
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Clear chalkboard"
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Download size={12} />}
            <span>{copied ? "Saved!" : "Save Chalkboard"}</span>
          </button>
        </div>
      </div>

      {/* ── Interactive Chalkboard Canvas ─────────────────────────── */}
      <div 
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border-2 border-zinc-800 hover:border-amber-400/40 transition-colors shadow-2xl bg-zinc-950 touch-none"
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="w-full cursor-crosshair block"
        />

        {/* Live Telestrator Voiceover Ticker Badge */}
        {telestratorText && (
          <div className="absolute top-3 left-3 max-w-[85%] bg-black/80 backdrop-blur-md border border-amber-400/50 rounded-xl px-3 py-1.5 text-xs font-mono text-amber-300 shadow-lg pointer-events-none flex items-center gap-2">
            <Sparkles size={13} className="text-amber-400 flex-shrink-0" />
            <span className="truncate italic">{telestratorText}</span>
          </div>
        )}

        {/* Bottom Chalk Selection Dock */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-2xl">
          {/* Yellow Chalk */}
          <button
            type="button"
            onClick={() => setTool("yellow_chalk")}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-black transition-all flex items-center gap-1.5 ${
              tool === "yellow_chalk"
                ? "bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(250,204,21,0.6)]"
                : "text-amber-400 hover:bg-zinc-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block border border-black" />
            <span>Yellow Chalk</span>
          </button>

          {/* Cyan Route Arrow */}
          <button
            type="button"
            onClick={() => setTool("cyan_route")}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              tool === "cyan_route"
                ? "bg-cyan-400 text-zinc-950 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                : "text-cyan-400 hover:bg-zinc-800"
            }`}
          >
            <ArrowUpRight size={12} />
            <span>Route</span>
          </button>

          {/* Red Blitz Danger */}
          <button
            type="button"
            onClick={() => setTool("red_blitz")}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              tool === "red_blitz"
                ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                : "text-rose-400 hover:bg-zinc-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Blitz</span>
          </button>

          <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

          {/* Tactical Stamps (X and O) */}
          <button
            type="button"
            onClick={() => setTool("stamp_o")}
            className={`w-6 h-6 rounded-full font-black text-xs transition-all flex items-center justify-center ${
              tool === "stamp_o" ? "bg-emerald-400 text-zinc-950" : "text-emerald-400 hover:bg-zinc-800"
            }`}
            title="Stamp Offense (O)"
          >
            O
          </button>

          <button
            type="button"
            onClick={() => setTool("stamp_x")}
            className={`w-6 h-6 rounded-full font-black text-xs transition-all flex items-center justify-center ${
              tool === "stamp_x" ? "bg-rose-400 text-zinc-950" : "text-rose-400 hover:bg-zinc-800"
            }`}
            title="Stamp Defense (X)"
          >
            X
          </button>
        </div>
      </div>
    </div>
  );
}
