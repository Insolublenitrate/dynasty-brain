"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Volume2, VolumeX, Mic, MicOff, Flame, HelpCircle, ArrowRight, Trophy, RefreshCw, CheckCircle2, ChevronRight } from "lucide-react";
import { useLeague } from '@/context/LeagueContext';
import { useTheme } from '@/context/ThemeContext';
import { getApiUrl } from '@/config/api';

const QUICK_PROMPTS = [
  { label: "Trade Evaluation", query: "Should I trade away a veteran wide receiver for two future 1st-round draft picks?" },
  { label: "Lineup & Start/Sit", query: "Who should I start in my Flex spot this week: the high-volume running back or boom/bust deep-threat WR?" },
  { label: "Championship Window", query: "Break down my dynasty roster construction and tell me if my championship window is wide open or closed." },
  { label: "Rivalry Game Plan", query: "How do I exploit my biggest rival's roster weaknesses and dominate our head-to-head matchup?" },
  { label: "Madden Philosophy", query: "Explain why benching your studs and leaving points on the pine is un-American." },
  { label: "Rebuild vs Contend", query: "My team is 3-4. Should I sell my aging stars to rebuild or make a push for the playoffs?" },
];

export default function AskMaddenPage() {
  const { leagueId } = useLeague();
  const { currentTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Speech Recognition (Voice Input)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        handleAsk(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      (window as any)._maddenRecognition = recognition;
    }
  }, []);

  const toggleListen = () => {
    const recognition = (window as any)._maddenRecognition;
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  // Text-To-Speech (Madden Voice)
  const speakMadden = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    // Clean text of markdown brackets for smooth speech
    const cleanText = text
      .replace(/\[TELESTRATOR:.*?\]/gi, "Boom! Look at the telestrator!")
      .replace(/[*_#]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.08;
    utterance.pitch = 0.92; // Slightly deeper, energetic Madden cadence
    utterance.volume = 1.0;

    // Pick an energetic English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes("en-US") && (v.name.includes("David") || v.name.includes("Male") || v.name.includes("Natural")));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleAsk = async (customQuery?: string) => {
    const activeQuery = customQuery || query;
    if (!activeQuery.trim()) return;

    setLoading(true);
    stopSpeaking();

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/ai/ask-madden`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activeQuery,
          league_id: leagueId || "1312567432052760576"
        })
      });

      if (res.ok) {
        const json = await res.json();
        setResult(json);
      }
    } catch (err) {
      console.error("Madden API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBoomFeelingLucky = () => {
    const randomPrompt = QUICK_PROMPTS[Math.floor(Math.random() * QUICK_PROMPTS.length)].query;
    setQuery(randomPrompt);
    handleAsk(randomPrompt);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* Google-Style Centerpiece Header */}
      <div className="flex flex-col items-center justify-center pt-2 sm:pt-4 text-center space-y-3">
        
        {/* Legendary Madden Badge & Logo */}
        <div className="relative group cursor-pointer" onClick={handleBoomFeelingLucky}>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-900 border-2 border-amber-400/80 flex items-center justify-center shadow-[0_0_35px_rgba(251,191,36,0.25)] group-hover:scale-105 transition-transform">
            <Mic size={36} className="text-amber-400" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-coach text-xs tracking-wider uppercase shadow-lg border border-amber-300">
            BOOM!
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-white italic tracking-tight">
            ASK <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">MADDEN</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-1 max-w-lg">
            Tactical Dynasty Wisdom, Lineup Decisions, Trade Post-Mortems & Trench Warfare Analysis
          </p>
        </div>
      </div>

      {/* Google-Style Centered Search Box */}
      <div className="max-w-3xl mx-auto space-y-4 px-2 sm:px-0">
        
        {/* Search Input Bar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl blur-lg group-hover:opacity-100 transition-opacity opacity-75"></div>
          
          <div className="relative bg-zinc-900/95 border-2 border-zinc-700 hover:border-amber-400/80 focus-within:border-amber-400 rounded-2xl shadow-2xl transition-all flex items-center px-4 py-3 sm:py-3.5 gap-3">
            <Search className="text-zinc-500 flex-shrink-0" size={20} />
            
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask Coach Madden anything about your league, trades, or lineups..."
              className="w-full bg-transparent text-white text-sm sm:text-base font-medium placeholder-zinc-500 focus:outline-none"
            />

            {/* Clear Button */}
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="text-zinc-500 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-zinc-800"
              >
                ✕
              </button>
            )}

            {/* Voice Dictation Mic Button */}
            <button
              onClick={toggleListen}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                isListening 
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title={isListening ? "Listening... (Speak Now)" : "Speak Question"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
        </div>

        {/* Action Buttons (Google Style) */}
        <div className="flex justify-center items-center gap-3 pt-1">
          <button
            onClick={() => handleAsk()}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Coach is Dialing It Up...</span>
              </>
            ) : (
              <>
                <span>Ask Coach Madden</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          <button
            onClick={handleBoomFeelingLucky}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
          >
            <Flame size={14} className="text-amber-400" />
            <span className="font-coach tracking-wide text-amber-300">BOOM! Direct Call</span>
          </button>
        </div>

        {/* Quick Query Chips */}
        <div className="pt-4">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center mb-2.5">
            Quick Playbook Questions:
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(qp.query);
                  handleAsk(qp.query);
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>{qp.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Madden Tactical Response Card */}
      {result && (
        <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
          
          <div className="bg-zinc-900/90 backdrop-blur-md border-2 border-amber-400/60 rounded-3xl p-5 sm:p-8 shadow-[0_0_40px_rgba(251,191,36,0.15)] relative overflow-hidden space-y-6 playbook-chalk-grid">
            
            {/* Telestrator Chalkboard Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-xl shadow-md">
                  JM
                </div>
                <div>
                  <h3 className="text-lg font-black text-white italic tracking-tight font-coach">
                    COACH MADDEN'S VERDICT
                  </h3>
                  <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Broadcast • Telestrator Breakdown
                  </p>
                </div>
              </div>

              {/* Voice Speech Synthesis Toggle */}
              <button
                onClick={() => speakMadden(result.answer)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-md ${
                  isSpeaking 
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-zinc-950 border-amber-400/50 text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX size={15} />
                    <span>Mute Madden</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={15} />
                    <span>Listen to Madden</span>
                  </>
                )}
              </button>
            </div>

            {/* Telestrator Callout Box (Coach Whiteboard Marker) */}
            <div className="bg-zinc-950/90 border border-amber-400/30 rounded-2xl p-4 font-mono text-xs text-amber-300 leading-relaxed shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 font-mono">
                  TELESTRATOR CHALK BREAKDOWN:
                </span>
                <span className="font-coach text-xs text-amber-400 tracking-wider">X & O SCHEME</span>
              </div>
              <div className="font-coach text-sm text-amber-200 leading-snug">
                {result.telestrator || "[TELESTRATOR: Big yellow circle around the trenches]"}
              </div>
            </div>

            {/* Main Response Body */}
            <div className="text-zinc-200 text-sm sm:text-base leading-relaxed space-y-4 font-sans whitespace-pre-line">
              {result.answer}
            </div>

            {/* Tactical Takeaways Checklist */}
            {result.suggested_actions && result.suggested_actions.length > 0 && (
              <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block font-coach text-amber-400">
                  Madden Playbook Takeaways:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {result.suggested_actions.map((act: string, idx: number) => (
                    <div key={idx} className="bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Iconic John Madden Footer Quote */}
            {result.quote && (
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="font-coach text-sm text-amber-300 tracking-wide">"{result.quote}"</span>
                <span className="text-amber-400 font-bold font-sans uppercase text-[10px] tracking-wider">— John Madden</span>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
