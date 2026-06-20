"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "./context/UserContext";
import { useChat } from "@ai-sdk/react";

export default function Home() {
  const { sleeperId, setSleeperId } = useUser();
  const [inputValue, setInputValue] = useState("");
  const [chatInput, setChatInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    body: {
      data: { sleeperId }
    },
    onFinish: (message) => {
      console.log("Finished streaming response. Trigger ElevenLabs TTS for text:", message.content);
      playElevenLabsTTS(message.content);
    },
    onError: (err) => {
      console.error("[useChat Error]:", err);
    }
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("[handleFormSubmit] Triggered! Custom ChatInput:", chatInput, "useChat Input:", input);
    if (!chatInput || !chatInput.trim() || isLoading) return;
    
    // Actually submit to useChat
    handleSubmit(e);
    setChatInput(''); // Clear our custom input immediately
  };

  // Placeholder function for ElevenLabs integration
  const playElevenLabsTTS = async (text: string) => {
    console.log("[TTS Hook] Playing audio for:", text);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!sleeperId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[var(--color-madden-turf)] text-center relative overflow-hidden">
        {/* Retro scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10" />
        
        <div className="z-20 chalk-border p-12 bg-[var(--color-madden-turf-dark)] shadow-2xl relative max-w-2xl w-full border-[var(--color-madden-chalk)] border-4 rounded-xl">
          <h1 className="text-6xl font-bold text-[var(--color-madden-yellow)] mb-4 tracking-wider uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-athletic">
            Fantasy Football Oracle
          </h1>
          <p className="text-xl text-[var(--color-madden-chalk)] mb-8 font-retro tracking-widest uppercase">
            Powered by John Madden
          </p>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue.trim()) {
                setSleeperId(inputValue.trim());
              }
            }}
            className="flex flex-col gap-6 w-full max-w-md mx-auto"
          >
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="sleeperId" className="text-[var(--color-madden-chalk)] font-retro text-2xl">
                ENTER SLEEPER ID / USERNAME:
              </label>
              <input 
                id="sleeperId"
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="bg-black/50 border-2 border-[var(--color-madden-chalk)] p-4 text-2xl font-retro text-[var(--color-madden-yellow)] outline-none focus:border-[var(--color-madden-yellow)] uppercase tracking-wider"
                placeholder="e.g. BOOMTOUGH"
              />
            </div>
            
            <button 
              type="submit"
              className="bg-[var(--color-madden-red)] hover:bg-red-600 text-white font-bold py-4 px-8 border-b-4 border-red-800 hover:border-red-900 rounded uppercase tracking-widest text-2xl transition-all active:mt-1 active:border-b-0"
            >
              Take the Field
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-madden-turf)] relative overflow-hidden">
      {/* Retro scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10" />

      {/* Header / Jumbotron Top */}
      <header className="z-20 border-b-4 border-[var(--color-madden-chalk)] bg-[var(--color-madden-turf-dark)] p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-[var(--color-madden-yellow)] font-athletic uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            Madden Oracle
          </h1>
        </div>
        <div className="flex items-center gap-4 font-retro text-2xl text-[var(--color-madden-chalk)]">
          <span>USER: {sleeperId.toUpperCase()}</span>
          <button 
            onClick={() => setSleeperId(null)}
            className="text-[var(--color-madden-red)] hover:text-red-400 underline cursor-pointer pointer-events-auto"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Dashboard Body */}
      <div className="flex-1 flex flex-col p-8 z-20 relative gap-8 items-center justify-end">
        
        {/* Chat / Jumbotron Display */}
        <div className="w-full max-w-4xl bg-black/80 border-4 border-[var(--color-madden-chalk)] rounded-xl h-96 p-6 font-retro text-[var(--color-madden-yellow)] text-xl overflow-y-auto flex flex-col gap-4 shadow-2xl">
          {messages.length === 0 ? (
            <div className="opacity-50 text-center m-auto">
              [ JUMBOTRON DISPLAY ON STANDBY ]<br/>
              Awaiting Play Call...
            </div>
          ) : (
            messages.map((m) => (
              <div 
                key={m.id} 
                className={`p-4 rounded border-2 ${
                  m.role === 'user' 
                    ? 'bg-blue-900/50 border-blue-500 self-end max-w-[80%] text-white' 
                    : 'bg-[var(--color-madden-turf-dark)] border-[var(--color-madden-chalk)] self-start max-w-[90%]'
                }`}
              >
                <div className="text-xs opacity-50 mb-1">{m.role === 'user' ? 'YOU' : 'MADDEN'}</div>
                <div>{m.content}</div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-[var(--color-madden-red)] animate-pulse border-l-4 border-[var(--color-madden-red)] pl-4">
              Madden is drawing up the play...
            </div>
          )}
          {error && (
            <div className="text-red-500 bg-red-900/20 p-4 border border-red-500 rounded">
              <span className="font-bold">FLAG ON THE PLAY!</span> {error.message}
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* The Oracle Input */}
        <div className="w-full max-w-4xl">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-4 relative z-30">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-4 text-[var(--color-madden-chalk)] font-retro text-2xl font-bold">&gt;</div>
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => {
                  setChatInput(e.target.value);
                  // Sync Vercel AI SDK's internal state so handleSubmit works
                  handleInputChange(e);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Let the form handle submission naturally
                  }
                }}
                className="w-full bg-[var(--color-madden-turf-dark)] border-4 border-[var(--color-madden-chalk)] rounded-full py-4 pl-12 pr-6 text-xl font-retro text-white outline-none focus:border-[var(--color-madden-yellow)] shadow-2xl disabled:opacity-50 pointer-events-auto"
                placeholder="Hey Madden, who should I start?"
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading || !chatInput || !chatInput.trim()}
              className="shrink-0 bg-[var(--color-madden-red)] hover:bg-red-600 text-white font-bold py-4 px-8 border-4 border-[var(--color-madden-chalk)] hover:border-[var(--color-madden-yellow)] rounded-full uppercase tracking-widest text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-retro shadow-2xl z-50 pointer-events-auto cursor-pointer"
            >
              SEND
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
