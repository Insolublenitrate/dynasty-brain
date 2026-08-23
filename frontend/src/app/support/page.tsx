"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  HelpCircle, Search, MessageSquare, Send, CheckCircle2, AlertTriangle, 
  Smartphone, Shield, RefreshCw, ChevronDown, ChevronUp, ExternalLink, 
  Mail, Sparkles, Crown, Radar, Trophy, BookOpen, Bug, Zap, ArrowRight,
  Apple
} from "lucide-react";
import PlaybookLogo from "@/components/PlaybookLogo";
import InstallAppModal from "@/components/InstallAppModal";
import { useTheme } from "@/context/ThemeContext";

const FAQS = [
  {
    category: "Multi-Platform League Linking (Sleeper, ESPN, Yahoo)",
    questions: [
      {
        q: "How do I link an ESPN Fantasy Football league?",
        a: "1. Open your ESPN Fantasy Football league on espn.com.\n2. Copy the League ID from your browser's URL (e.g. fantasy.espn.com/football/league?leagueId=123456789).\n3. In Waiver Wiretap, open Settings > Tap the '🔴 ESPN' tab > Enter your League ID and Season.\n4. If your ESPN league is Public, tap 'Connect & Sync'. If it is Private, enter your 'espn_s2' and 'SWID' cookies in the optional fields."
      },
      {
        q: "How do I link a Yahoo Fantasy Football league?",
        a: "1. Open your Yahoo Fantasy league on football.fantasysports.yahoo.com.\n2. Copy your Yahoo League ID / Key (e.g. 123456 or 449.l.123456).\n3. In Waiver Wiretap, open Settings > Tap the '🟣 Yahoo' tab > Enter your League ID and tap 'Connect & Sync'."
      },
      {
        q: "How does Waiver Wiretap sync with Sleeper dynasty leagues?",
        a: "Waiver Wiretap connects directly to the public Sleeper REST API. Simply enter your public Sleeper League ID in League Settings, and the quant engine instantly ingests all rosters, starters, bench depth, future draft picks, and historical matchups with zero login credentials required."
      },
      {
        q: "Where do I find my Sleeper League ID?",
        a: "In the Sleeper mobile app: Open your league > Tap the League Settings gear icon > Scroll down to 'General' > Tap 'League ID' to copy the 18-digit number (e.g. 1312567432052760576)."
      },
      {
        q: "Does Waiver Wiretap support Superflex, TE Premium, and Custom Scoring?",
        a: "Yes! The quant engine dynamically recognizes Superflex roster configurations, adjusts quarterback replacement-level VORP baselines, and properly values tight ends and multi-flex positions based on your league's starting requirements across all platforms."
      }
    ]
  },
  {
    category: "Dynasty Power Tiers & Matrix Math",
    questions: [
      {
        q: "How are the Dynasty Power Tiers and Composite Scores calculated?",
        a: "Every team is evaluated using statistical Z-score standardization centered on a 0–100 scale where 50.0 is the exact league median. The formula assigns 70% weight to Starter Firepower (active season Max PF potential ceiling) and 30% weight to Future Draft Capital Equity (evaluated via Time-Value-of-Money draft depreciation)."
      },
      {
        q: "What do the 4 Matrix Lifecycle Quadrants mean?",
        a: "• Q1 Top-Right (Championship Window): High Max PF + High Draft Capital. The dynasty juggernauts with both immediate firepower and long-term youth equity.\n• Q4 Bottom-Right (All-In Contender): High Max PF + Low Capital. Dominating today with veterans but facing an aging cliff.\n• Q2 Top-Left (Productive Struggle): Low Max PF + High Capital. Intentional rebuilders holding the league's top draft pick assets.\n• Q3 Bottom-Left (The Abyss / Retool): Low Max PF + Low Capital. Teams needing a strategic roster overhaul."
      },
      {
        q: "How are team archetypes (e.g. 'The Ground & Pound', 'The Draft Dragon') determined?",
        a: "The engine analyzes the relative distribution of every team across the league. Teams leading the league in running backs get 'The Ground & Pound', top draft pick holders get 'The Draft Dragon', top wideout rooms get 'The WR Oligarch', and deep QB rosters in Superflex get 'The Superflex QB Vault'."
      }
    ]
  },
  {
    category: "Ask Coach Madden AI War Room",
    questions: [
      {
        q: "How does the 'Ask Madden' AI War Room work?",
        a: "Ask Madden combines an open-source tactical football engine with Google Gemini AI. When you ask a question, the system injects your actual league standings, rosters, and recent trades, generating answers in Coach John Madden's iconic persona with chalkboard telestrator diagrams and audio speech synthesis."
      },
      {
        q: "Can Coach Madden evaluate trades and start/sit decisions?",
        a: "Yes! You can ask questions like 'Should I trade away Saquon Barkley for two 2025 1sts?' or 'Who do I start in my Flex spot: the high-volume running back or boom/bust WR?' and receive high-energy, volume-calibrated verdicts."
      }
    ]
  },
  {
    category: "Mobile Installation & App Setup",
    questions: [
      {
        q: "How do I install Waiver Wiretap on Apple iPhone or iPad?",
        a: "1. Open Safari on your iPhone and visit waiverwiretap.kindofabigdill.com.\n2. Tap the Share button (⎋ box with upward arrow) at the bottom toolbar.\n3. Scroll down and tap 'Add to Home Screen' (➕).\n4. Tap 'Add' in the top-right. The app will launch in full-screen standalone mode with no browser bars!"
      },
      {
        q: "How do I install Waiver Wiretap on Android?",
        a: "1. Open Chrome or Brave on your Android phone.\n2. Tap the 'Get App 📱' button in the top navigation bar (or tap the 3 vertical dots ⋮ menu).\n3. Tap 'Install app' or 'Add to Home screen' to generate a standalone Android WebAPK."
      }
    ]
  }
];

export default function SupportPage() {
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [openAccordion, setOpenAccordion] = useState<string | null>("Getting Started & Sleeper Sync-0");
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  
  // Contact Form State
  const [formData, setFormData] = useState({ name: "", email: "", leagueId: "", subject: "Question", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  // Filter FAQs based on search
  const filteredFAQs = FAQS.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16 animate-in fade-in duration-500 pb-20">
      
      {/* ========================================================================= */}
      {/* 1. SUPPORT HEADER & SEARCH BAR */}
      {/* ========================================================================= */}
      <section className="text-center pt-6 sm:pt-12 max-w-3xl mx-auto space-y-4">
        
        {/* Support Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-xs shadow-md">
          <HelpCircle size={14} style={{ color: currentTheme.primary }} />
          <span className="font-bold uppercase tracking-wider">Help Center & Technical Support</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white italic tracking-tight font-sans">
          HOW CAN WE HELP YOUR <span style={{ color: currentTheme.primary }}>DYNASTY TEAM</span>?
        </h1>
        
        <p className="text-sm text-zinc-400 font-mono max-w-lg mx-auto">
          Guides, FAQ documentation, math methodology, and direct engineering support for Waiver Wiretap.
        </p>

        {/* Knowledge Base Search Bar */}
        <div className="relative max-w-xl mx-auto pt-2">
          <div className="relative bg-zinc-900 border-2 border-zinc-700 hover:border-zinc-500 focus-within:border-orange-500 rounded-2xl p-3 flex items-center gap-3 shadow-xl transition-all">
            <Search className="text-zinc-500 flex-shrink-0" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g., Sleeper ID, Tiers, EPA, Mobile Install)..."
              className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-zinc-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-zinc-500 hover:text-white text-xs font-bold px-2 py-1 rounded bg-zinc-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

      </section>


      {/* ========================================================================= */}
      {/* 2. QUICK SUPPORT PILLARS */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div 
          onClick={() => setIsInstallModalOpen(true)}
          className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-5 shadow-lg cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Smartphone size={20} />
          </div>
          <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
            Mobile App Installation
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Step-by-step guides for installing Waiver Wiretap on Apple iOS and Android devices.
          </p>
        </div>

        <Link
          href="/dynasty-room"
          className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-5 shadow-lg transition-all hover:scale-[1.02] group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
            <Crown size={20} />
          </div>
          <h3 className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
            Quant Tiers & Power Math
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Understand how Z-Scores, Starter Max PF, and future draft capital depreciation work.
          </p>
        </Link>

        <Link
          href="/ask-madden"
          className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-5 shadow-lg transition-all hover:scale-[1.02] group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
            <Sparkles size={20} />
          </div>
          <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
            Ask Coach Madden War Room
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Learn how to use voice dictation and live league context for start/sit and trade advice.
          </p>
        </Link>

      </section>


      {/* ========================================================================= */}
      {/* 3. FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={18} style={{ color: currentTheme.primary }} />
            <h2 className="text-lg sm:text-xl font-black text-white italic tracking-tight">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {filteredFAQs.reduce((acc, cat) => acc + cat.questions.length, 0)} Topics
          </span>
        </div>

        <div className="space-y-6">
          {filteredFAQs.map((category, catIdx) => (
            <div key={catIdx} className="space-y-3">
              <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest px-1">
                {category.category}
              </h3>

              <div className="space-y-2">
                {category.questions.map((faq, qIdx) => {
                  const id = `${category.category}-${qIdx}`;
                  const isOpen = openAccordion === id;

                  return (
                    <div 
                      key={qIdx}
                      className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => toggleAccordion(id)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-zinc-800/40 transition-colors"
                      >
                        <span className="font-bold text-sm sm:text-base text-zinc-200">
                          {faq.q}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 sm:p-5 pt-0 border-t border-zinc-800/60 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed whitespace-pre-line bg-zinc-950/40">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. CONTACT & ENGINEERING SUPPORT FORM */}
      {/* ========================================================================= */}
      <section className="bg-zinc-900/90 border-2 border-zinc-700 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare size={14} /> Direct Engineering Support
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tight">
            NEED ASSISTANCE OR HAVE A FEATURE REQUEST?
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Send a ticket directly to the development team. We respond within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-2xl p-6 text-center space-y-3 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Support Ticket Submitted!</h3>
            <p className="text-xs text-zinc-300 max-w-md mx-auto font-sans">
              Thank you for reaching out. We have logged your request and our dynasty quant engineering team will get back to you shortly.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
            >
              Submit Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase font-bold text-[10px]">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Manager / Coach Name"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase font-bold text-[10px]">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@domain.com"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase font-bold text-[10px]">Sleeper League ID (Optional)</label>
                <input
                  type="text"
                  value={formData.leagueId}
                  onChange={(e) => setFormData({ ...formData, leagueId: e.target.value })}
                  placeholder="e.g. 1312567432052760576"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase font-bold text-[10px]">Topic Category</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                >
                  <option value="Question">General Question</option>
                  <option value="Sleeper Sync Issue">Sleeper League Sync Issue</option>
                  <option value="Feature Request">New Feature / Metric Suggestion</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Mobile App Help">iOS / Android Mobile App Help</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 uppercase font-bold text-[10px]">Message Details</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your question, feature idea, or issue in detail..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-600 focus:outline-none font-sans text-xs"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sending Ticket...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Support Ticket</span>
                </>
              )}
            </button>
          </form>
        )}
      </section>


      {/* ========================================================================= */}
      {/* 5. LEGAL & COMPLIANCE FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-zinc-800/80 pt-8 text-center space-y-3 font-mono text-xs text-zinc-500">
        <p>
          Waiver Wiretap Support & Documentation Hub • App Version 1.0.0
        </p>
        <p className="text-[11px] text-zinc-600">
          Disclaimer: Waiver Wiretap is an independent fantasy sports analytics platform. Not affiliated with the NFL or Sleeper.
        </p>
      </footer>

      {/* Mobile Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

    </div>
  );
}
