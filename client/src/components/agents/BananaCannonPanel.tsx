import { useState, useEffect, useRef } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, refreshBalance } from "@/lib/solanaWallet";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import { Rocket, Loader2, Wallet, ExternalLink, AlertTriangle, Copy, Check, ChevronDown, ChevronUp, ImagePlus, Globe, X, Zap, ArrowRight, RotateCcw, Search, Trophy, Flame, Star, TrendingUp, Clock, Users, Award, Target, Sparkles, Crown, Medal, Swords, Eye, MessageCircle } from "lucide-react";

import bananaLab from "@/assets/images/banana-lab.png";
import fighterMonkey from "@/assets/images/fighter-monkey.png";
import crabClaw from "@/assets/images/crab-claw.png";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

interface TokenLaunch {
  id: number;
  tokenName: string;
  tokenSymbol: string;
  description: string;
  personality: string;
  imageUrl: string | null;
  metadataUri: string | null;
  mintAddress: string | null;
  txSignature: string | null;
  pumpUrl: string | null;
  devBuyAmount: number;
  feeAmount: number;
  status: string;
  aiPromptUsed: string | null;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  headlineUsed: string | null;
  launchMethod: string | null;
  scanToLaunchMs: number | null;
  createdAt: string;
}

interface AIConcept {
  tokenName: string;
  tokenSymbol: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  xSearchUrl?: string;
  imagePrompt?: string;
  trendRationale?: string;
  headlineUsed?: string;
  xSearchTerms?: string;
  [key: string]: any;
}

type LogLine = {
  type: "prompt" | "text" | "skill" | "skill-sub" | "code-header" | "code" | "thinking" | "success" | "error" | "bash" | "bash-sub" | "gap";
  text: string;
};

const PUMP_PORTAL_FEE = 0.02;

const WEEKLY_THEMES = [
  { name: "MEME LORD WEEK", tag: "MEMES", desc: "Pure meme energy — unhinged launches only", gradient: "from-purple-600 via-pink-500 to-orange-500", icon: "🐒" },
  { name: "BREAKING NEWS WEEK", tag: "NEWS", desc: "First to the headline wins. Speed is alpha.", gradient: "from-red-600 via-orange-500 to-yellow-500", icon: "📰" },
  { name: "AI AGENT WEEK", tag: "AI", desc: "Build utility. Deploy intelligence. Win respect.", gradient: "from-cyan-500 via-blue-500 to-purple-600", icon: "🤖" },
  { name: "CULTURE WARS WEEK", tag: "CULTURE", desc: "Hijack the moment. Own the narrative.", gradient: "from-green-500 via-emerald-500 to-teal-500", icon: "🎭" },
  { name: "DEGEN SPEED RUN", tag: "SPEED", desc: "Fastest scan-to-launch wins. Clock is ticking.", gradient: "from-yellow-500 via-orange-500 to-red-600", icon: "⚡" },
];

function getCurrentTheme() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_THEMES[weekNum % WEEKLY_THEMES.length];
}

function getCreatorScore(launches: TokenLaunch[]) {
  if (launches.length === 0) return { score: 0, rank: "ROOKIE", launches: 0, aiLaunches: 0, avgSpeed: 0, tier: 0 };
  const confirmed = launches.filter(l => l.status === "confirmed" || l.status === "launched");
  const aiLaunches = launches.filter(l => l.launchMethod === "ai").length;
  const speeds = launches.filter(l => l.scanToLaunchMs).map(l => l.scanToLaunchMs!);
  const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length / 1000) : 0;
  const hasSocials = launches.filter(l => l.twitter || l.telegram || l.website).length;
  let score = Math.min(confirmed.length * 20 + aiLaunches * 10 + hasSocials * 5 + (avgSpeed > 0 && avgSpeed < 120 ? 15 : 0), 100);
  let rank = score >= 80 ? "CANNON MASTER" : score >= 60 ? "TREND SNIPER" : score >= 40 ? "DEGEN APE" : score >= 20 ? "LAUNCHER" : "ROOKIE";
  let tier = score >= 80 ? 5 : score >= 60 ? 4 : score >= 40 ? 3 : score >= 20 ? 2 : 1;
  return { score, rank, launches: confirmed.length, aiLaunches, avgSpeed, tier };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function BananaCannonPanel({ onSendChat, fullscreen }: { onSendChat?: (msg: string) => void; fullscreen?: boolean }) {
  const wallet = useWalletState();
  const [launches, setLaunches] = useState<TokenLaunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [mode, setMode] = useState<"home" | "manual" | "ai">("home");
  const [homeTab, setHomeTab] = useState<"launch" | "feed" | "rank" | "events">("launch");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [devBuyAmount, setDevBuyAmount] = useState("0");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [manualStep, setManualStep] = useState<1 | 2 | 3>(1);
  const [aiPhase, setAiPhase] = useState<"idle" | "running" | "ready" | "picking" | "config">("idle");
  const [aiLog, setAiLog] = useState<LogLine[]>([]);
  const [aiConcepts, setAiConcepts] = useState<AIConcept[]>([]);
  const [aiConcept, setAiConcept] = useState<AIConcept | null>(null);
  const [aiDevBuy, setAiDevBuy] = useState("0");
  const [aiTwitterOverride, setAiTwitterOverride] = useState("");
  const [thinkingDots, setThinkingDots] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const theme = getCurrentTheme();
  const creatorStats = getCreatorScore(launches);

  useEffect(() => {
    fetch("/api/token-launches").then(r => r.json()).then(setLaunches).finally(() => setLoading(false));
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiLog, thinkingDots]);

  useEffect(() => {
    if (isThinking) {
      let count = 0;
      thinkingRef.current = setInterval(() => { count = (count + 1) % 4; setThinkingDots(".".repeat(count || 1)); }, 400);
    } else {
      if (thinkingRef.current) clearInterval(thinkingRef.current);
      setThinkingDots("");
    }
    return () => { if (thinkingRef.current) clearInterval(thinkingRef.current); };
  }, [isThinking]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addLog = (line: LogLine) => setAiLog(prev => [...prev, line]);
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runAiGenerate = async () => {
    setAiPhase("running"); setAiLog([]); setAiConcept(null); setError(null); setScanStartTime(Date.now());
    addLog({ type: "prompt", text: "> Scanning live trends..." });
    await delay(600);
    addLog({ type: "skill", text: "FEED INTERCEPT" });
    addLog({ type: "skill-sub", text: "  Pulling headlines from news aggregators..." });
    await delay(600);
    addLog({ type: "text", text: "Headlines loaded. Analyzing narrative momentum..." });
    await delay(400);
    addLog({ type: "gap", text: "" });
    addLog({ type: "skill", text: "NARRATIVE ENGINE" });
    addLog({ type: "skill-sub", text: "  Scoring viral potential + building concepts..." });
    await delay(300);
    setIsThinking(true);
    addLog({ type: "gap", text: "" });
    try {
      const startTime = Date.now();
      const res = await fetch("/api/token-launches/generate", { method: "POST" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Generation failed"); }
      const result = await res.json();
      const concepts: AIConcept[] = result.concepts || [result];
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      setIsThinking(false);
      await delay(200);
      addLog({ type: "gap", text: "" });
      addLog({ type: "success", text: `${concepts.length} narratives locked in ${elapsed}s` });
      for (const c of concepts) {
        addLog({ type: "gap", text: "" });
        addLog({ type: "code-header", text: `$${c.tokenSymbol} — ${c.tokenName}` });
        if (c.headlineUsed) addLog({ type: "skill-sub", text: `  "${c.headlineUsed.slice(0, 90)}"` });
      }
      addLog({ type: "gap", text: "" });
      addLog({ type: "text", text: "Pick your banana below." });
      setAiConcepts(concepts);
      setAiPhase("picking");
    } catch (err: any) {
      setIsThinking(false);
      addLog({ type: "error", text: err.message });
      setAiPhase("idle"); setError(err.message);
    }
  };

  const launchViaPumpPortal = async (params: {
    tokenName: string; tokenSymbol: string; description: string;
    devBuyAmount: number; imageUrl: string | null;
    twitter: string | null; telegram: string | null; website: string | null;
    headlineUsed?: string | null; launchMethod?: string;
    onLog?: (line: LogLine) => void;
  }) => {
    const { tokenName, tokenSymbol, description, devBuyAmount, imageUrl, twitter, telegram, website, headlineUsed, launchMethod, onLog } = params;
    const log = onLog || (() => {});
    const phantom = (window as any).phantom?.solana;
    if (!phantom || !wallet.publicKey) throw new Error("Phantom wallet not connected");
    log({ type: "skill", text: "GENERATING MINT ADDRESS" });
    const mintKeypair = Keypair.generate();
    const mintPubkey = mintKeypair.publicKey.toBase58();
    log({ type: "code", text: `mint = ${mintPubkey.slice(0, 24)}...` });
    log({ type: "gap", text: "" });
    log({ type: "skill", text: "UPLOADING TO IPFS + BUILDING TX" });
    const buildRes = await fetch("/api/token-launches/build-tx", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenName, tokenSymbol: tokenSymbol.toUpperCase(), description, devBuyAmount, walletAddress: wallet.publicKey, mintPublicKey: mintPubkey, imageUrl, twitter, telegram, website }),
    });
    if (!buildRes.ok) { const err = await buildRes.json(); throw new Error(err.error || "Failed to build transaction"); }
    const { transaction: txBase64, metadataUri } = await buildRes.json();
    log({ type: "code", text: `metadata = ${metadataUri?.slice(0, 40)}...` });
    log({ type: "gap", text: "" });
    log({ type: "skill", text: "PHANTOM SIGNING" });
    const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
    const tx = VersionedTransaction.deserialize(txBytes);
    tx.sign([mintKeypair]);
    log({ type: "skill-sub", text: "  Requesting wallet signature..." });
    const signedTx = await phantom.signTransaction(tx);
    log({ type: "gap", text: "" });
    log({ type: "bash", text: "BROADCASTING TO SOLANA" });
    const connection = new Connection(SOLANA_RPC, "confirmed");
    const rawTx = signedTx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, { skipPreflight: false, preflightCommitment: "confirmed" });
    log({ type: "code", text: `tx = ${signature.slice(0, 30)}...` });
    log({ type: "bash-sub", text: "  Confirming..." });
    try { await connection.confirmTransaction(signature, "confirmed"); }
    catch { log({ type: "skill-sub", text: "  Confirmation slow — check Solscan." }); }
    const scanMs = scanStartTime ? Date.now() - scanStartTime : null;
    const saveRes = await fetch("/api/token-launches", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenName, tokenSymbol: tokenSymbol.toUpperCase(), description, devBuyAmount, walletAddress: wallet.publicKey, imageUrl, twitter, telegram, website, mintAddress: mintPubkey, txSignature: signature, metadataUri, headlineUsed: headlineUsed || null, launchMethod: launchMethod || "manual", scanToLaunchMs: scanMs }),
    });
    const launch = saveRes.ok ? await saveRes.json() : null;
    return { signature, mintAddress: mintPubkey, metadataUri, launch };
  };

  const handleAiLaunch = async () => {
    if (!aiConcept || !wallet.connected) return;
    setLaunching(true); setError(null);
    addLog({ type: "gap", text: "" }); addLog({ type: "bash", text: `LAUNCHING $${aiConcept.tokenSymbol}` });
    try {
      const devBuy = parseFloat(aiDevBuy || "0");
      const tw = aiTwitterOverride.trim().startsWith("https://x.com/") || aiTwitterOverride.trim().startsWith("https://twitter.com/") ? aiTwitterOverride.trim() : null;
      const result = await launchViaPumpPortal({ tokenName: aiConcept.tokenName, tokenSymbol: aiConcept.tokenSymbol, description: aiConcept.description, devBuyAmount: devBuy, imageUrl: null, twitter: tw, telegram: null, website: null, headlineUsed: aiConcept.headlineUsed, launchMethod: "ai", onLog: addLog });
      addLog({ type: "gap", text: "" }); addLog({ type: "success", text: `LIVE ON SOLANA! $${aiConcept.tokenSymbol}` });
      if (result.launch) setLaunches(prev => [result.launch, ...prev]);
      onSendChat?.(`Token launched: $${aiConcept.tokenSymbol} — ${aiConcept.tokenName} | mint: ${result.mintAddress}`);
      setTimeout(() => { setAiPhase("idle"); setAiConcept(null); setAiConcepts([]); setAiLog([]); setAiDevBuy("0"); setAiTwitterOverride(""); setMode("home"); refreshBalance(); }, 3000);
    } catch (err: any) {
      const msg = err.message?.includes("User rejected") ? "Transaction rejected" : (err.message || "Launch failed");
      addLog({ type: "error", text: msg }); setError(msg);
    } finally { setLaunching(false); }
  };

  const handleManualLaunch = async () => {
    if (!tokenName.trim() || !tokenSymbol.trim() || !description.trim()) { setError("Fill in all fields"); return; }
    if (!wallet.connected) { setError("Connect wallet first"); return; }
    setLaunching(true); setError(null);
    try {
      const devBuy = parseFloat(devBuyAmount || "0");
      const result = await launchViaPumpPortal({ tokenName: tokenName.trim(), tokenSymbol: tokenSymbol.trim(), description: description.trim(), devBuyAmount: devBuy, imageUrl: imagePreview || null, twitter: twitter.trim() || null, telegram: telegram.trim() || null, website: website.trim() || null, launchMethod: "manual" });
      if (result.launch) setLaunches(prev => [result.launch, ...prev]);
      onSendChat?.(`Token launched: $${tokenSymbol.toUpperCase()} | mint: ${result.mintAddress}`);
      setTokenName(""); setTokenSymbol(""); setDescription(""); setDevBuyAmount("0"); setImagePreview(null); setTwitter(""); setTelegram(""); setWebsite(""); setManualStep(1); setMode("home"); refreshBalance();
    } catch (err: any) {
      setError(err.message?.includes("User rejected") ? "Transaction rejected" : err.message || "Launch failed");
    } finally { setLaunching(false); }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text); setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const aiTotalCost = PUMP_PORTAL_FEE + parseFloat(aiDevBuy || "0");
  const totalCost = PUMP_PORTAL_FEE + parseFloat(devBuyAmount || "0");
  const canProceedToStep2 = tokenName.trim() && tokenSymbol.trim() && description.trim();

  const renderLogLine = (line: LogLine, i: number) => {
    if (line.type === "skill") return <div key={i} className="flex items-center gap-2 mt-2"><span className="text-lg">🍌</span><span className="text-[9px] text-amber-700 font-display tracking-wider font-bold">{line.text}</span></div>;
    if (line.type === "code-header") return <div key={i} className="flex items-center gap-2 mt-2"><span className="text-lg">🔥</span><span className="text-[10px] text-orange-700 font-display tracking-wider font-bold">{line.text}</span></div>;
    if (line.type === "bash") return <div key={i} className="flex items-center gap-2 mt-2"><span className="text-lg">🚀</span><span className="text-[9px] text-orange-700 font-display tracking-wider font-bold">{line.text}</span></div>;
    if (line.type === "success") return <div key={i} className="text-[11px] text-green-700 pl-2 mt-2 font-display font-bold">✓ {line.text}</div>;
    if (line.type === "error") return <div key={i} className="text-[11px] text-red-600 pl-2 mt-1 font-display font-bold">✗ {line.text}</div>;
    if (line.type === "prompt") return <div key={i} className="mt-1 mb-2 text-[11px] text-yellow-900 font-display">{line.text}</div>;
    if (line.type === "gap") return <div key={i} className="h-1.5" />;
    if (line.type === "code") return <div key={i} className="text-[9px] text-amber-700/60 pl-7 font-mono">{line.text}</div>;
    if (line.type === "skill-sub" || line.type === "bash-sub") return <div key={i} className="text-[9px] text-yellow-700/50 pl-7">{line.text}</div>;
    return <div key={i} className="text-[10px] text-yellow-800/60 pl-2 my-0.5">{line.text}</div>;
  };

  const resetToHome = () => {
    setMode("home"); setAiPhase("idle"); setAiLog([]); setAiConcept(null); setAiConcepts([]);
    setManualStep(1); setError(null); setIsThinking(false); setAiTwitterOverride("");
  };

  const confirmedLaunches = launches.filter(l => l.status === "confirmed" || l.status === "launched");
  const aiLaunches = launches.filter(l => l.launchMethod === "ai");
  const recentLaunches = [...launches].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const fastestLaunch = launches.filter(l => l.scanToLaunchMs).sort((a, b) => (a.scanToLaunchMs || Infinity) - (b.scanToLaunchMs || Infinity))[0];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-yellow-400 via-amber-300 to-orange-400">
        <img src={fighterMonkey} alt="" className="w-20 h-20 animate-bounce pixel-art-rendering drop-shadow-lg" style={{ imageRendering: 'pixelated' }} />
        <span className="text-sm text-yellow-900 font-display tracking-[0.2em] animate-pulse font-bold">LOADING CANNON...</span>
      </div>
    );
  }

  return (
    <div className={`${fullscreen ? 'h-full' : ''} flex flex-col bg-gradient-to-b from-yellow-400 via-amber-300 to-orange-300 overflow-y-auto`}>

      <div className={`relative overflow-hidden border-b-4 border-yellow-700/20`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-80`} />
        <div className="relative px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">{theme.icon}</span>
          <div className="flex-1">
            <div className="font-display text-[11px] text-white tracking-[0.15em] font-bold drop-shadow-md">{theme.name}</div>
            <div className="font-display text-[8px] text-white/60 mt-0.5">{theme.desc}</div>
          </div>
          {mode !== "home" ? (
            <button onClick={resetToHome}
              className="font-display text-[9px] text-white/80 hover:text-white border-2 border-white/30 bg-white/10 hover:bg-white/20 px-3 py-1.5 transition-all backdrop-blur-sm tracking-wider font-bold"
              style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.15)' }}>
              ← BACK
            </button>
          ) : (
            <div className="bg-white/20 border-2 border-white/30 px-3 py-1.5 backdrop-blur-sm">
              <div className="font-display text-[7px] text-white/60 tracking-wider">THIS WEEK</div>
              <div className="font-display text-sm text-white font-bold text-center">{launches.length}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {mode === "home" && (
          <>
            <div className="flex border-4 border-yellow-700/20 overflow-hidden" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.12)' }}>
              {([
                { key: "launch" as const, label: "LAUNCH", icon: <Rocket className="w-3.5 h-3.5" /> },
                { key: "feed" as const, label: "FEED", icon: <Flame className="w-3.5 h-3.5" />, badge: launches.length || undefined },
                { key: "rank" as const, label: "RANK", icon: <Trophy className="w-3.5 h-3.5" /> },
                { key: "events" as const, label: "EVENTS", icon: <Swords className="w-3.5 h-3.5" /> },
              ]).map((tab) => (
                <button key={tab.key} onClick={() => setHomeTab(tab.key)} data-testid={`tab-home-${tab.key}`}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-display text-[9px] tracking-wider font-bold transition-all border-r last:border-r-0 border-yellow-700/15 ${
                    homeTab === tab.key
                      ? 'bg-gradient-to-b from-yellow-300/80 to-amber-300/80 text-yellow-950'
                      : 'bg-yellow-400/15 text-yellow-800/35 hover:bg-yellow-400/30 hover:text-yellow-900/60'
                  }`}>
                  {tab.icon}
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="bg-orange-500 text-white text-[6px] px-1 py-0.5 border border-orange-700 font-bold min-w-[14px] text-center">{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {homeTab === "launch" && (
              <div className="space-y-3">
                <button onClick={() => setMode("ai")} data-testid="button-ai-mode"
                  className="w-full border-4 border-yellow-700/25 bg-gradient-to-br from-yellow-200/80 via-amber-100/80 to-orange-200/80 p-4 hover:border-yellow-600/50 hover:from-yellow-100 hover:to-orange-100 transition-all group text-left"
                  style={{ boxShadow: '5px 5px 0px rgba(120,53,15,0.2)' }}>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 border-3 border-yellow-700/25 bg-yellow-500/20 flex items-center justify-center overflow-hidden" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                        <img src={fighterMonkey} alt="" className="w-12 h-12 pixel-art-rendering group-hover:scale-110 transition-transform" style={{ imageRendering: 'pixelated' }} />
                      </div>
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-green-500 border border-green-700 font-display text-[6px] text-white font-bold">AI</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm text-yellow-950 tracking-wider font-bold flex items-center gap-2">
                        AI TREND LAUNCH
                        <span className="text-[7px] text-green-700 border border-green-500/40 px-1.5 py-0.5 bg-green-400/20 animate-pulse">LIVE</span>
                      </div>
                      <p className="font-display text-[9px] text-yellow-800/50 mt-1">Claude scans breaking news, finds the narrative, builds your token</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-yellow-700/20 group-hover:text-yellow-800 transition-all shrink-0" />
                  </div>
                </button>

                <button onClick={() => setMode("manual")} data-testid="button-manual-mode"
                  className="w-full border-4 border-yellow-700/12 bg-yellow-500/10 p-4 hover:border-yellow-700/25 hover:bg-yellow-500/20 transition-all group text-left"
                  style={{ boxShadow: '3px 3px 0px rgba(120,53,15,0.08)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 border-3 border-yellow-700/12 bg-yellow-400/10 flex items-center justify-center">
                      <Rocket className="w-7 h-7 text-yellow-800/25 group-hover:text-yellow-800/50 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-sm text-yellow-900/50 tracking-wider font-bold group-hover:text-yellow-950 transition-colors">MANUAL LAUNCH</div>
                      <p className="font-display text-[9px] text-yellow-800/30 mt-1">Custom name, image, socials — your vision, your ticker</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-yellow-700/10 group-hover:text-yellow-800/30 transition-all shrink-0" />
                  </div>
                </button>

                <div className="border-4 border-yellow-700/15 bg-gradient-to-br from-yellow-200/40 to-amber-200/40 p-4" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.1)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-orange-600/50" />
                    <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold">QUICK STATS</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: creatorStats.launches, label: "LAUNCHED", color: "text-yellow-950" },
                      { val: creatorStats.aiLaunches, label: "AI PICKS", color: "text-cyan-700" },
                      { val: creatorStats.avgSpeed ? `${creatorStats.avgSpeed}s` : '—', label: "AVG SPEED", color: "text-orange-700" },
                      { val: launches.filter(l => l.twitter || l.website).length, label: "W/ SOCIALS", color: "text-purple-700" },
                    ].map(s => (
                      <div key={s.label} className="border-2 border-yellow-700/10 bg-yellow-300/20 p-2.5 text-center" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.05)' }}>
                        <div className={`font-display text-lg font-bold ${s.color}`}>{s.val}</div>
                        <div className="font-display text-[6px] text-yellow-800/30 tracking-wider mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {launches.length > 0 && recentLaunches.slice(0, 2).length > 0 && (
                  <div className="border-4 border-yellow-700/12 bg-yellow-400/8 p-3" style={{ boxShadow: '3px 3px 0px rgba(120,53,15,0.06)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3.5 h-3.5 text-yellow-800/30" />
                      <span className="font-display text-[9px] text-yellow-800/35 tracking-wider font-bold">LATEST</span>
                    </div>
                    {recentLaunches.slice(0, 2).map(l => (
                      <div key={l.id} className="flex items-center gap-2 py-1.5">
                        <div className="w-7 h-7 border-2 border-yellow-700/10 bg-yellow-400/15 flex items-center justify-center shrink-0">
                          <span className="font-display text-[8px] text-yellow-950 font-bold">${l.tokenSymbol.slice(0, 3)}</span>
                        </div>
                        <span className="font-display text-[10px] text-yellow-950 font-bold flex-1">${l.tokenSymbol}</span>
                        <span className="font-display text-[8px] text-yellow-800/25">{timeAgo(l.createdAt)}</span>
                      </div>
                    ))}
                    <button onClick={() => setHomeTab("feed")} className="w-full mt-1 font-display text-[8px] text-yellow-800/30 hover:text-yellow-900 tracking-wider transition-colors">VIEW ALL →</button>
                  </div>
                )}
              </div>
            )}

            {homeTab === "feed" && (
              <div className="space-y-3">
                <div className="border-4 border-yellow-700/15 bg-gradient-to-br from-orange-200/30 via-yellow-100/30 to-amber-200/30 overflow-hidden" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.1)' }}>
                  <div className="bg-gradient-to-r from-orange-500/15 to-yellow-500/10 px-4 py-2.5 border-b-2 border-yellow-700/10 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-orange-600/50" />
                    <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold flex-1">DISCOVERY BOARD</span>
                    <span className="font-display text-[8px] text-yellow-800/30">{launches.length} tokens</span>
                  </div>
                  {launches.length === 0 ? (
                    <div className="p-8 text-center space-y-3">
                      <img src={crabClaw} alt="" className="w-14 h-14 mx-auto pixel-art-rendering opacity-25" style={{ imageRendering: 'pixelated' }} />
                      <div className="font-display text-[9px] text-yellow-800/30 tracking-wider">NO TOKENS LAUNCHED YET</div>
                      <button onClick={() => setHomeTab("launch")} className="font-display text-[9px] text-orange-700/50 hover:text-orange-800 border-2 border-orange-600/20 bg-orange-400/10 px-4 py-1.5 tracking-wider font-bold transition-colors">LAUNCH FIRST TOKEN →</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-yellow-700/8">
                      {[...launches].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(launch => (
                        <div key={launch.id} className="px-4 py-3.5 hover:bg-yellow-400/10 transition-colors group" data-testid={`launch-${launch.id}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border-2 border-yellow-700/15 bg-yellow-400/20 flex items-center justify-center shrink-0" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.06)' }}>
                              {launch.imageUrl ? (
                                <img src={launch.imageUrl} alt="" className="w-full h-full object-cover pixel-art-rendering" />
                              ) : (
                                <span className="font-display text-[10px] text-yellow-950 font-bold">${launch.tokenSymbol.slice(0, 3)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display text-[11px] text-yellow-950 font-bold" data-testid={`text-launch-symbol-${launch.id}`}>${launch.tokenSymbol}</span>
                                <span className="font-display text-[9px] text-yellow-800/35 truncate">{launch.tokenName}</span>
                                {launch.launchMethod === "ai" && <span className="font-display text-[6px] text-cyan-700 border border-cyan-500/30 px-1 bg-cyan-400/10 tracking-wider font-bold">AI TREND</span>}
                                <span className={`font-display text-[6px] px-1 border tracking-wider font-bold ${
                                  launch.status === 'launched' || launch.status === 'confirmed' ? 'text-green-700 border-green-500/30 bg-green-400/10' :
                                  launch.status === 'pending' ? 'text-yellow-800 border-yellow-600/30 bg-yellow-400/15' :
                                  'text-red-700 border-red-500/30 bg-red-400/10'
                                }`} data-testid={`text-launch-status-${launch.id}`}>{launch.status.toUpperCase()}</span>
                              </div>
                              <div className="font-display text-[8px] text-yellow-800/30 mt-1 line-clamp-2 leading-relaxed">{launch.description?.slice(0, 120)}</div>
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                              <div className="font-display text-[8px] text-yellow-800/25">{timeAgo(launch.createdAt)}</div>
                              {launch.scanToLaunchMs && <div className="font-display text-[7px] text-orange-600/50">⚡ {Math.round(launch.scanToLaunchMs / 1000)}s</div>}
                            </div>
                          </div>
                          {launch.headlineUsed && (
                            <div className="mt-2 ml-13 font-display text-[8px] text-green-700/40 truncate border-l-2 border-green-500/20 pl-2">📰 {launch.headlineUsed.slice(0, 80)}</div>
                          )}
                          <div className="flex items-center gap-2 mt-2 ml-13">
                            {launch.mintAddress && (
                              <button onClick={() => copyToClipboard(launch.mintAddress!, launch.id)}
                                className="flex items-center gap-1 px-2 py-1 border border-yellow-700/10 bg-yellow-400/10 text-yellow-800/40 hover:text-yellow-950 hover:bg-yellow-400/20 transition-all font-display text-[7px] tracking-wider"
                                data-testid={`button-copy-mint-${launch.id}`}>
                                {copiedId === launch.id ? <><Check className="w-2.5 h-2.5 text-green-600" /> COPIED</> : <><Copy className="w-2.5 h-2.5" /> MINT</>}
                              </button>
                            )}
                            {launch.pumpUrl && (
                              <a href={launch.pumpUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 border border-orange-500/15 bg-orange-400/10 text-orange-700/50 hover:text-orange-800 transition-all font-display text-[7px] tracking-wider"
                                data-testid={`link-pump-${launch.id}`}>
                                <ExternalLink className="w-2.5 h-2.5" /> PUMP.FUN
                              </a>
                            )}
                            {launch.txSignature && (
                              <a href={`https://solscan.io/tx/${launch.txSignature}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 border border-blue-500/15 bg-blue-400/10 text-blue-700/40 hover:text-blue-700 transition-all font-display text-[7px] tracking-wider"
                                data-testid={`link-tx-${launch.id}`}>
                                <ExternalLink className="w-2.5 h-2.5" /> SOLSCAN
                              </a>
                            )}
                            {(launch.twitter || launch.website) && (
                              <div className="flex items-center gap-1 ml-auto">
                                {launch.twitter && <a href={launch.twitter} target="_blank" rel="noopener noreferrer" className="text-yellow-800/20 hover:text-yellow-900 transition-colors"><MessageCircle className="w-3 h-3" /></a>}
                                {launch.website && <a href={launch.website} target="_blank" rel="noopener noreferrer" className="text-yellow-800/20 hover:text-yellow-900 transition-colors"><Globe className="w-3 h-3" /></a>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {launches.length > 0 && (
                  <div className="border-4 border-yellow-700/12 bg-yellow-400/8 p-4" style={{ boxShadow: '3px 3px 0px rgba(120,53,15,0.06)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-500/40" />
                      <span className="font-display text-[10px] text-yellow-900/50 tracking-[0.15em] font-bold">WEEKLY HIGHLIGHTS</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border-2 border-yellow-700/10 bg-yellow-300/15 p-3 text-center">
                        <div className="font-display text-[6px] text-yellow-800/25 tracking-wider mb-1">HOTTEST TOKEN</div>
                        <div className="font-display text-sm text-yellow-950 font-bold">${recentLaunches[0]?.tokenSymbol || '—'}</div>
                        <div className="font-display text-[7px] text-yellow-800/30 mt-0.5">{recentLaunches[0]?.tokenName?.slice(0, 15) || ''}</div>
                      </div>
                      <div className="border-2 border-yellow-700/10 bg-yellow-300/15 p-3 text-center">
                        <div className="font-display text-[6px] text-yellow-800/25 tracking-wider mb-1">FASTEST LAUNCH</div>
                        <div className="font-display text-sm text-yellow-950 font-bold">{fastestLaunch ? `${Math.round((fastestLaunch.scanToLaunchMs || 0) / 1000)}s` : '—'}</div>
                        <div className="font-display text-[7px] text-yellow-800/30 mt-0.5">{fastestLaunch ? `$${fastestLaunch.tokenSymbol}` : 'No speed runs'}</div>
                      </div>
                      <div className="border-2 border-yellow-700/10 bg-yellow-300/15 p-3 text-center">
                        <div className="font-display text-[6px] text-yellow-800/25 tracking-wider mb-1">AI HIT RATE</div>
                        <div className="font-display text-sm text-yellow-950 font-bold">{launches.length > 0 ? Math.round((aiLaunches.length / launches.length) * 100) : 0}%</div>
                        <div className="font-display text-[7px] text-yellow-800/30 mt-0.5">{aiLaunches.length} AI launches</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {homeTab === "rank" && (
              <div className="space-y-3">
                <div className="border-4 border-yellow-700/20 bg-gradient-to-br from-yellow-200/60 via-amber-100/50 to-orange-200/40 p-5" style={{ boxShadow: '5px 5px 0px rgba(120,53,15,0.15)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 border-3 border-yellow-700/25 bg-yellow-500/20 flex items-center justify-center overflow-hidden" style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.1)' }}>
                      <img src={fighterMonkey} alt="" className="w-14 h-14 pixel-art-rendering" style={{ imageRendering: 'pixelated' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-5 h-5 text-yellow-600" />
                        <span className="font-display text-lg text-yellow-950 font-bold tracking-wider">{creatorStats.rank}</span>
                      </div>
                      <div className="font-display text-[9px] text-yellow-800/40 tracking-wider">CREATOR SCORE {creatorStats.score}/100</div>
                      <div className="h-3 bg-yellow-800/10 border-2 border-yellow-800/15 overflow-hidden mt-1.5" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all" style={{ width: `${creatorStats.score}%`, boxShadow: '0 0 8px rgba(234,179,8,0.5)' }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(t => (
                      <div key={t} className={`flex-1 h-3 border-2 transition-all ${t <= creatorStats.tier ? 'bg-gradient-to-r from-yellow-400 to-orange-400 border-yellow-700/30' : 'bg-yellow-500/5 border-yellow-700/8'}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: creatorStats.launches, label: "LAUNCHES", icon: <Rocket className="w-4 h-4" />, color: "text-yellow-950" },
                      { val: creatorStats.aiLaunches, label: "AI PICKS", icon: <Zap className="w-4 h-4" />, color: "text-cyan-700" },
                      { val: creatorStats.avgSpeed ? `${creatorStats.avgSpeed}s` : '—', label: "SPEED", icon: <Clock className="w-4 h-4" />, color: "text-orange-700" },
                      { val: launches.filter(l => l.twitter || l.website).length, label: "SOCIAL", icon: <Users className="w-4 h-4" />, color: "text-purple-700" },
                    ].map(s => (
                      <div key={s.label} className="border-2 border-yellow-700/12 bg-yellow-300/20 p-3 text-center" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.06)' }}>
                        <div className="text-yellow-800/25 flex justify-center mb-1.5">{s.icon}</div>
                        <div className={`font-display text-lg font-bold ${s.color}`}>{s.val}</div>
                        <div className="font-display text-[6px] text-yellow-800/25 tracking-wider mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-4 border-yellow-700/15 bg-gradient-to-br from-purple-200/20 via-yellow-100/20 to-pink-200/20 p-4" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.08)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-purple-500/50" />
                    <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold">ACHIEVEMENTS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "FIRST BLOOD", desc: "Launch your first token", done: confirmedLaunches.length >= 1, icon: "🍌" },
                      { name: "AI NATIVE", desc: "Use AI trend scanner", done: aiLaunches.length >= 1, icon: "🤖" },
                      { name: "SPEED DEMON", desc: "Launch under 2 minutes", done: launches.some(l => l.scanToLaunchMs && l.scanToLaunchMs < 120000), icon: "⚡" },
                      { name: "SOCIAL BUTTERFLY", desc: "Launch with Twitter link", done: launches.some(l => l.twitter), icon: "🦋" },
                      { name: "TRIPLE THREAT", desc: "Launch 3 tokens", done: confirmedLaunches.length >= 3, icon: "🔥" },
                      { name: "NARRATIVE KING", desc: "5 AI-powered launches", done: aiLaunches.length >= 5, icon: "👑" },
                      { name: "FULL STACK", desc: "Launch with image + socials", done: launches.some(l => l.imageUrl && (l.twitter || l.website)), icon: "💎" },
                      { name: "CANNON MASTER", desc: "Reach max creator rank", done: creatorStats.score >= 80, icon: "🏆" },
                    ].map(a => (
                      <div key={a.name} className={`border-2 p-3 flex items-center gap-2.5 transition-all ${
                        a.done
                          ? 'border-green-500/30 bg-green-200/20'
                          : 'border-yellow-700/8 bg-yellow-500/5 opacity-50'
                      }`} style={a.done ? { boxShadow: '2px 2px 0px rgba(34,197,94,0.15)' } : {}}>
                        <span className={`text-xl ${a.done ? '' : 'grayscale'}`}>{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-display text-[9px] tracking-wider font-bold ${a.done ? 'text-green-800' : 'text-yellow-800/25'}`}>{a.name}</div>
                          <div className={`font-display text-[7px] mt-0.5 ${a.done ? 'text-green-700/50' : 'text-yellow-800/15'}`}>{a.desc}</div>
                        </div>
                        {a.done && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-4 border-yellow-700/15 bg-gradient-to-br from-cyan-200/15 via-yellow-100/15 to-blue-200/15 p-4" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.08)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-cyan-600/40" />
                    <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold">NEXT UNLOCK</span>
                  </div>
                  <div className="border-3 border-yellow-700/12 bg-yellow-300/15 p-4">
                    <div className="font-display text-[11px] text-yellow-950 font-bold mb-1">
                      {creatorStats.score < 20 ? '🍌 Launch your first token to start ranking' :
                       creatorStats.score < 40 ? '🤖 Try an AI trend launch for +10 creator points' :
                       creatorStats.score < 60 ? '🦋 Add Twitter or website links for +5pts each' :
                       creatorStats.score < 80 ? '⚡ Speed run: scan-to-launch under 2 minutes for +15pts' :
                       '🏆 You reached CANNON MASTER — respect earned.'}
                    </div>
                    <div className="font-display text-[8px] text-yellow-800/30 mt-1">
                      {creatorStats.score < 80
                        ? `${80 - creatorStats.score} points to next rank`
                        : 'Max rank achieved'}
                    </div>
                    {creatorStats.score < 80 && (
                      <div className="h-2 bg-yellow-800/8 border border-yellow-800/10 overflow-hidden mt-2">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${(creatorStats.score % 20) / 20 * 100}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-4 border-yellow-700/15 bg-gradient-to-br from-orange-200/20 via-yellow-100/20 to-amber-200/20 overflow-hidden" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.08)' }}>
                  <div className="bg-gradient-to-r from-orange-500/15 to-yellow-500/10 px-4 py-2.5 border-b-2 border-yellow-700/10 flex items-center gap-2">
                    <Medal className="w-4 h-4 text-orange-500/50" />
                    <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold flex-1">CREATOR LEADERBOARD</span>
                    <span className="font-display text-[7px] text-yellow-800/20 tracking-wider">ALL TIME</span>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3 py-2.5 border-b border-yellow-700/8">
                      <div className="w-8 h-8 border-2 border-yellow-500/40 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 flex items-center justify-center">
                        <span className="font-display text-sm font-bold text-yellow-800">1</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[11px] text-yellow-950 font-bold tracking-wider">YOU</span>
                          <span className="font-display text-[7px] text-yellow-600 border border-yellow-500/30 px-1.5 bg-yellow-400/15 tracking-wider font-bold">{creatorStats.rank}</span>
                        </div>
                        <div className="font-display text-[8px] text-yellow-800/30 mt-0.5">{creatorStats.launches} launches · {creatorStats.score} pts</div>
                      </div>
                      <Crown className="w-5 h-5 text-yellow-500/50" />
                    </div>
                    <div className="py-3 text-center">
                      <div className="font-display text-[8px] text-yellow-800/20 tracking-wider">More creators coming soon</div>
                      <div className="font-display text-[7px] text-yellow-800/15 mt-1">Launch tokens to climb the board</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {homeTab === "events" && (
              <div className="space-y-3">
                <div className={`border-4 border-yellow-700/20 overflow-hidden`} style={{ boxShadow: '5px 5px 0px rgba(120,53,15,0.15)' }}>
                  <div className={`relative bg-gradient-to-r ${theme.gradient} p-5`}>
                    <div className="absolute top-2 right-3">
                      <div className="bg-white/20 border border-white/30 px-2 py-1 backdrop-blur-sm">
                        <div className="font-display text-[6px] text-white/50 tracking-wider">ACTIVE NOW</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{theme.icon}</span>
                      <div>
                        <div className="font-display text-lg text-white tracking-wider font-bold drop-shadow-lg">{theme.name}</div>
                        <div className="font-display text-[9px] text-white/60 mt-0.5">{theme.desc}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="bg-white/10 border border-white/20 p-2.5 text-center backdrop-blur-sm">
                        <div className="font-display text-lg text-white font-bold">{launches.length}</div>
                        <div className="font-display text-[6px] text-white/40 tracking-wider">ENTRIES</div>
                      </div>
                      <div className="bg-white/10 border border-white/20 p-2.5 text-center backdrop-blur-sm">
                        <div className="font-display text-lg text-white font-bold">{aiLaunches.length}</div>
                        <div className="font-display text-[6px] text-white/40 tracking-wider">AI PICKS</div>
                      </div>
                      <div className="bg-white/10 border border-white/20 p-2.5 text-center backdrop-blur-sm">
                        <div className="font-display text-lg text-white font-bold">{fastestLaunch ? `${Math.round((fastestLaunch.scanToLaunchMs || 0) / 1000)}s` : '—'}</div>
                        <div className="font-display text-[6px] text-white/40 tracking-wider">BEST TIME</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-200/30 p-4 border-t-2 border-yellow-700/10">
                    <div className="font-display text-[9px] text-yellow-900/60 tracking-wider font-bold mb-2">HOW TO WIN</div>
                    <div className="space-y-2">
                      {[
                        { text: "Launch a token matching the weekly theme", pts: "+20 pts" },
                        { text: "Use AI trend scanner for narrative-based picks", pts: "+10 pts" },
                        { text: "Fastest scan-to-launch time wins Speed Crown", pts: "CROWN" },
                        { text: "Add socials (Twitter, website) to every launch", pts: "+5 pts" },
                      ].map((rule, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-yellow-700/15 bg-yellow-400/15 flex items-center justify-center shrink-0">
                            <span className="font-display text-[8px] text-yellow-900/40 font-bold">{i + 1}</span>
                          </div>
                          <span className="font-display text-[9px] text-yellow-900/50 flex-1">{rule.text}</span>
                          <span className="font-display text-[7px] text-orange-700/50 border border-orange-500/20 bg-orange-400/10 px-1.5 py-0.5 tracking-wider font-bold shrink-0">{rule.pts}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-4 border-yellow-700/15 bg-gradient-to-br from-yellow-200/30 to-amber-200/30 p-4" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.08)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-600/50" />
                    <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold">CREATOR SPOTLIGHT</span>
                  </div>
                  {recentLaunches.length > 0 ? (
                    <div className="border-3 border-yellow-700/15 bg-yellow-300/20 p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 border-2 border-yellow-700/15 bg-yellow-400/20 flex items-center justify-center" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                          <span className="font-display text-base text-yellow-950 font-bold">${recentLaunches[0].tokenSymbol.slice(0, 3)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-display text-sm text-yellow-950 font-bold">${recentLaunches[0].tokenSymbol}</div>
                          <div className="font-display text-[9px] text-yellow-800/35">{recentLaunches[0].tokenName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-[8px] text-yellow-800/25">{timeAgo(recentLaunches[0].createdAt)}</div>
                          {recentLaunches[0].launchMethod === "ai" && <div className="font-display text-[6px] text-cyan-700 mt-0.5 font-bold">AI TREND</div>}
                        </div>
                      </div>
                      <div className="font-display text-[8px] text-yellow-800/35 leading-relaxed line-clamp-3">{recentLaunches[0].description?.slice(0, 150)}</div>
                      {recentLaunches[0].headlineUsed && (
                        <div className="mt-2 font-display text-[7px] text-green-700/40 border-l-2 border-green-500/20 pl-2">📰 {recentLaunches[0].headlineUsed.slice(0, 90)}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <img src={crabClaw} alt="" className="w-12 h-12 mx-auto pixel-art-rendering opacity-20 mb-2" style={{ imageRendering: 'pixelated' }} />
                      <div className="font-display text-[9px] text-yellow-800/25">Launch a token to get featured</div>
                    </div>
                  )}
                </div>

                <div className="border-4 border-yellow-700/15 bg-gradient-to-br from-blue-200/15 via-yellow-100/15 to-purple-200/15 p-4" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.08)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Swords className="w-4 h-4 text-blue-500/40" />
                    <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold">UPCOMING THEMES</span>
                  </div>
                  <div className="space-y-2">
                    {WEEKLY_THEMES.filter(t => t.name !== theme.name).map((t, i) => (
                      <div key={t.name} className="flex items-center gap-3 p-2.5 border-2 border-yellow-700/8 bg-yellow-400/5 hover:bg-yellow-400/10 transition-colors">
                        <span className="text-xl">{t.icon}</span>
                        <div className="flex-1">
                          <div className="font-display text-[10px] text-yellow-950 tracking-wider font-bold">{t.name}</div>
                          <div className="font-display text-[7px] text-yellow-800/25 mt-0.5">{t.desc}</div>
                        </div>
                        <span className="font-display text-[7px] text-yellow-800/20 tracking-wider">WEEK {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {mode === "ai" && (
          <div className="space-y-3">
            <div className="border-4 border-yellow-700/25 bg-yellow-100/50 overflow-hidden" style={{ boxShadow: '5px 5px 0px rgba(120,53,15,0.15)' }}>
              <div className="bg-gradient-to-r from-yellow-400/50 to-amber-400/50 px-4 py-2.5 flex items-center gap-2 border-b-3 border-yellow-700/15">
                <span className="text-lg">🍌</span>
                <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] flex-1 font-bold">NARRATIVE SCANNER</span>
                {(aiPhase === "running" || isThinking) && <span className="font-display text-[8px] text-green-700 animate-pulse tracking-wider font-bold">SCANNING...</span>}
              </div>
              <div className="p-5 min-h-[200px] max-h-[380px] overflow-y-auto custom-scrollbar bg-gradient-to-b from-yellow-50/50 to-amber-50/30">
                {aiPhase === "idle" && aiLog.length === 0 && (
                  <div className="space-y-4 py-2">
                    <div className="text-center space-y-3">
                      <img src={crabClaw} alt="" className="w-20 h-20 pixel-art-rendering mx-auto drop-shadow-lg opacity-70" style={{ imageRendering: 'pixelated' }} />
                      <div>
                        <div className="font-display text-sm text-yellow-900/70 tracking-wider font-bold">READY TO SCAN</div>
                        <p className="font-display text-[9px] text-yellow-800/35 mt-1.5 max-w-[260px] mx-auto leading-relaxed">Claude pulls live news, finds the hottest narrative, builds 3 token concepts</p>
                      </div>
                    </div>
                    <button onClick={runAiGenerate} data-testid="button-ai-scan"
                      className="w-full border-4 border-orange-600/35 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 py-3.5 font-display text-sm text-yellow-950 tracking-[0.12em] hover:from-orange-300 hover:via-amber-300 hover:to-yellow-300 hover:border-orange-500 transition-all flex items-center justify-center gap-2 font-bold"
                      style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.25)', textShadow: '1px 1px 0px rgba(255,255,255,0.3)' }}>
                      <Zap className="w-4 h-4" /> SCAN TRENDS NOW
                    </button>
                  </div>
                )}
                {aiLog.length > 0 && (
                  <div className="space-y-0">
                    {aiLog.map((line, i) => renderLogLine(line, i))}
                    {isThinking && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-lg animate-spin">🍌</span>
                        <span className="text-yellow-800 text-[10px] font-display animate-pulse font-bold">THINKING{thinkingDots}</span>
                      </div>
                    )}
                  </div>
                )}
                <div ref={logEndRef} />
              </div>
            </div>

            {aiPhase === "picking" && aiConcepts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1"><span className="text-lg">🎯</span><span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold">PICK YOUR BANANA</span></div>
                {aiConcepts.map((c, i) => (
                  <button key={i} data-testid={`button-pick-concept-${i}`}
                    onClick={() => { setAiConcept(c); setAiTwitterOverride(""); setAiPhase("ready"); addLog({ type: "gap", text: "" }); addLog({ type: "success", text: `Selected: $${c.tokenSymbol}` }); onSendChat?.(`AI trend token: $${c.tokenSymbol} — ${c.tokenName}`); }}
                    className="w-full text-left border-4 border-yellow-700/15 bg-gradient-to-r from-yellow-200/50 to-amber-200/50 hover:from-yellow-200/80 hover:to-amber-200/80 hover:border-yellow-600/30 p-3.5 transition-all group"
                    style={{ boxShadow: '3px 3px 0px rgba(120,53,15,0.12)' }}>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 border-2 border-yellow-700/20 bg-yellow-400/30 flex items-center justify-center" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                        <span className="font-display text-sm text-yellow-950 font-bold">{i + 1}</span>
                      </div>
                      <span className="font-display text-sm text-yellow-950 tracking-wider font-bold">${c.tokenSymbol}</span>
                      <span className="font-display text-[9px] text-yellow-800/35 truncate">{c.tokenName}</span>
                    </div>
                    {c.headlineUsed && <div className="text-[8px] text-green-700/50 pl-11 mb-1 truncate font-display">📰 {c.headlineUsed.slice(0, 55)}...</div>}
                    <div className="text-[8px] text-yellow-800/35 leading-relaxed line-clamp-2 pl-11 font-display">{c.description}</div>
                    {c.xSearchUrl && <div className="flex items-center gap-1 pl-11 mt-1"><Search className="w-2.5 h-2.5 text-blue-600/35" /><span className="text-[7px] text-blue-600/35 font-display font-bold">X SEARCH</span></div>}
                  </button>
                ))}
                <button onClick={() => { setAiPhase("idle"); setAiConcepts([]); setAiLog([]); setIsThinking(false); }}
                  className="w-full flex items-center gap-2 justify-center py-2.5 font-display text-[9px] border-4 border-yellow-700/10 bg-yellow-500/8 text-yellow-800/40 hover:text-yellow-900 hover:bg-yellow-500/15 transition-all tracking-widest">
                  <RotateCcw className="w-3 h-3" /> SCAN AGAIN
                </button>
              </div>
            )}

            {(aiPhase === "ready" || aiPhase === "config") && aiConcept && (
              <div className="space-y-3">
                <div className="border-4 border-orange-600/25 bg-gradient-to-b from-orange-200/50 via-amber-100/40 to-yellow-200/50 p-4 space-y-3" style={{ boxShadow: '5px 5px 0px rgba(120,53,15,0.18)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg animate-bounce">🍌</span>
                    <span className="font-display text-[11px] text-orange-900 tracking-[0.12em] font-bold animate-pulse">CANNON LOADED</span>
                    <div className="w-2.5 h-2.5 bg-green-500 animate-pulse ml-auto border border-green-700" />
                  </div>

                  <div className="border-3 border-yellow-700/15 bg-yellow-300/25 p-3 flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-yellow-700/15 bg-yellow-400/20 flex items-center justify-center" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.06)' }}>
                      <Rocket className="w-5 h-5 text-yellow-900/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm text-yellow-950 tracking-wider font-bold">${aiConcept.tokenSymbol}</div>
                      <div className="font-display text-[9px] text-yellow-800/40 truncate">{aiConcept.tokenName}</div>
                    </div>
                  </div>

                  {aiConcept.xSearchUrl && (
                    <a href={aiConcept.xSearchUrl} target="_blank" rel="noopener noreferrer" data-testid="link-x-search"
                      className="flex items-center gap-2 px-3 py-2 border-3 border-blue-500/25 bg-blue-100/25 text-blue-800 font-display text-[9px] hover:bg-blue-100/40 transition-all w-full justify-center tracking-wider font-bold"
                      style={{ boxShadow: '2px 2px 0px rgba(37,99,235,0.1)' }}>
                      <ExternalLink className="w-3 h-3" /> VERIFY ON X
                    </a>
                  )}
                  <input value={aiTwitterOverride} onChange={e => setAiTwitterOverride(e.target.value)}
                    placeholder="Paste viral tweet URL (optional)" data-testid="input-ai-twitter"
                    className="w-full bg-white/35 border-2 border-yellow-600/15 text-yellow-950 px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-yellow-600/30 transition-colors placeholder:text-yellow-600/20" />

                  {!wallet.connected ? (
                    <button onClick={connectWallet} data-testid="button-connect-ai-cannon"
                      className="w-full flex items-center justify-center gap-2 p-2.5 border-3 border-purple-500/25 bg-purple-200/25 text-purple-800 font-display text-[9px] hover:bg-purple-200/40 transition-all tracking-wider font-bold"
                      style={{ boxShadow: '2px 2px 0px rgba(147,51,234,0.1)' }}>
                      <Wallet className="w-3.5 h-3.5" /> CONNECT PHANTOM
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 border-3 border-green-500/20 bg-green-200/20">
                      <div className="w-2.5 h-2.5 bg-green-500 border border-green-700" />
                      <span className="font-display text-[9px] text-green-800 font-bold">CONNECTED</span>
                      <span className="text-[9px] text-green-700/40 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                      {wallet.balance !== null && <span className="font-display text-[9px] text-yellow-900 ml-auto font-bold">{wallet.balance.toFixed(3)} SOL</span>}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-display text-[7px] text-yellow-800/40 tracking-wider font-bold">DEV BUY (SOL)</label>
                    <input value={aiDevBuy} onChange={e => setAiDevBuy(e.target.value)}
                      type="number" step="0.1" min="0" data-testid="input-ai-dev-buy"
                      className="w-full bg-white/35 border-2 border-yellow-600/15 text-yellow-950 px-3 py-2 text-sm font-mono focus:outline-none focus:border-yellow-600/30 transition-colors" />
                  </div>

                  <div className="border-3 border-yellow-700/10 bg-yellow-300/15 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-[7px] text-yellow-800/30">FEE</span>
                      <span className="font-display text-[9px] text-yellow-900/50">{PUMP_PORTAL_FEE} SOL</span>
                    </div>
                    {parseFloat(aiDevBuy || "0") > 0 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display text-[7px] text-yellow-800/30">DEV BUY</span>
                        <span className="font-display text-[9px] text-yellow-900/50">{parseFloat(aiDevBuy)} SOL</span>
                      </div>
                    )}
                    <div className="h-px bg-yellow-700/10 my-1.5" />
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[9px] text-yellow-900/60 font-bold">TOTAL</span>
                      <span className="font-display text-sm text-yellow-950 font-bold">{aiTotalCost.toFixed(4)} SOL</span>
                    </div>
                  </div>
                </div>

                {error && <div className="flex items-center gap-2 px-3 py-2 bg-red-200/30 border-3 border-red-500/25 text-red-800 font-display text-[9px]"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span className="font-bold">{error}</span></div>}

                <div className="flex gap-2">
                  <button onClick={() => { setAiPhase("picking"); setAiConcept(null); setAiTwitterOverride(""); }}
                    className="px-3 py-2.5 font-display text-[9px] border-3 border-yellow-700/12 bg-yellow-500/8 text-yellow-800/40 hover:bg-yellow-500/15 transition-all">BACK</button>
                  <button onClick={handleAiLaunch} disabled={launching || !wallet.connected} data-testid="button-ai-launch"
                    className="flex-1 py-3.5 font-display text-sm disabled:opacity-30 flex items-center justify-center gap-2 border-4 transition-all tracking-wider font-bold"
                    style={{
                      background: launching ? 'rgba(220,38,38,0.08)' : 'linear-gradient(135deg, #ef4444, #f97316, #eab308)',
                      borderColor: launching ? 'rgba(220,38,38,0.15)' : 'rgba(180,60,20,0.4)',
                      boxShadow: launching ? 'none' : '5px 5px 0px rgba(120,53,15,0.3)',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.15)',
                      color: '#fff',
                    }}>
                    {launching ? <><Loader2 className="w-4 h-4 animate-spin" /> FIRING...</> : <><img src={crabClaw} alt="" className="w-6 h-6 pixel-art-rendering" style={{ imageRendering: 'pixelated' }} /> FIRE CANNON</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-3">
            <div className="flex items-center gap-0">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex-1">
                  <div className={`flex items-center gap-1.5 px-3 py-2 border-3 transition-all ${
                    manualStep === s ? 'border-yellow-700/30 bg-yellow-300/40 text-yellow-950'
                      : manualStep > s ? 'border-green-600/20 bg-green-300/20 text-green-800'
                      : 'border-yellow-700/8 bg-yellow-500/5 text-yellow-800/15'
                  }`}>
                    <div className={`w-5 h-5 flex items-center justify-center font-display text-[8px] border-2 font-bold ${
                      manualStep === s ? 'border-yellow-700/40 text-yellow-950' : manualStep > s ? 'border-green-600/30 text-green-700' : 'border-yellow-700/8 text-yellow-800/15'
                    }`}>{manualStep > s ? '✓' : s}</div>
                    <span className="font-display text-[7px] tracking-wider hidden sm:inline font-bold">{s === 1 ? 'CREATE' : s === 2 ? 'CONFIG' : 'FIRE'}</span>
                  </div>
                </div>
              ))}
            </div>

            {manualStep === 1 && (
              <div className="space-y-3">
                <div className="border-4 border-yellow-700/15 bg-yellow-200/30 p-4 space-y-3" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.1)' }}>
                  <div className="flex items-center gap-2"><span className="text-lg">🍌</span><span className="font-display text-[10px] text-yellow-900/60 tracking-[0.12em] font-bold">DEFINE YOUR TOKEN</span></div>
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <label className="font-display text-[7px] text-yellow-800/30 tracking-wider block mb-1 font-bold">IMAGE</label>
                      <div className="relative w-20 h-20 border-3 border-yellow-700/15 bg-yellow-300/15 flex items-center justify-center cursor-pointer hover:border-yellow-700/30 transition-colors overflow-hidden group" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.06)' }}>
                        {imagePreview ? (
                          <>
                            <img src={imagePreview} alt="Token" className="w-full h-full object-cover pixel-art-rendering" />
                            <button onClick={(e) => { e.preventDefault(); setImagePreview(null); }} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-red-700"><X className="w-2.5 h-2.5 text-white" /></button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-1 w-full h-full justify-center">
                            <ImagePlus className="w-5 h-5 text-yellow-700/20" />
                            <span className="font-display text-[6px] text-yellow-700/20 font-bold">UPLOAD</span>
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" data-testid="input-token-image" />
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="font-display text-[7px] text-yellow-800/30 tracking-wider font-bold">NAME</label>
                          <input value={tokenName} onChange={e => { setTokenName(e.target.value); setError(null); }} placeholder="e.g. Banana Coin" data-testid="input-token-name"
                            className="w-full bg-white/40 border-2 border-yellow-600/15 text-yellow-950 px-3 py-2 text-sm font-mono focus:outline-none focus:border-yellow-600/30 placeholder:text-yellow-600/15 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-display text-[7px] text-yellow-800/30 tracking-wider font-bold">TICKER</label>
                          <input value={tokenSymbol} onChange={e => { setTokenSymbol(e.target.value.toUpperCase()); setError(null); }} placeholder="$BNN" maxLength={10} data-testid="input-token-symbol"
                            className="w-full bg-white/40 border-2 border-yellow-600/15 text-yellow-950 px-3 py-2 text-sm font-display focus:outline-none focus:border-yellow-600/30 placeholder:text-yellow-600/15 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-display text-[7px] text-yellow-800/30 tracking-wider font-bold">DESCRIPTION</label>
                        <textarea value={description} onChange={e => { setDescription(e.target.value); setError(null); }} placeholder="What's this token about?" rows={3} data-testid="input-token-description"
                          className="w-full bg-white/40 border-2 border-yellow-600/15 text-yellow-950 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-yellow-600/30 placeholder:text-yellow-600/15 resize-none transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 border-yellow-700/8 pt-3">
                    <div className="flex items-center gap-1.5 mb-2"><Globe className="w-3 h-3 text-yellow-700/20" /><span className="font-display text-[7px] text-yellow-800/20 tracking-wider font-bold">SOCIALS (OPTIONAL)</span></div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: twitter, set: setTwitter, label: "TWITTER", ph: "https://x.com/...", tid: "input-twitter" },
                        { val: telegram, set: setTelegram, label: "TELEGRAM", ph: "https://t.me/...", tid: "input-telegram" },
                        { val: website, set: setWebsite, label: "WEBSITE", ph: "https://...", tid: "input-website" },
                      ].map(f => (
                        <div key={f.label} className="space-y-1">
                          <label className="font-display text-[6px] text-yellow-800/18 tracking-wider font-bold">{f.label}</label>
                          <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} data-testid={f.tid}
                            className="w-full bg-white/25 border-2 border-yellow-600/8 text-yellow-950 px-2 py-1.5 text-[8px] font-mono focus:outline-none focus:border-yellow-600/25 placeholder:text-yellow-600/12 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {error && <div className="flex items-center gap-2 px-3 py-2 bg-red-200/30 border-3 border-red-500/25 text-red-800 font-display text-[9px]"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span className="font-bold">{error}</span></div>}
                <button onClick={() => { setError(null); setManualStep(2); }} disabled={!canProceedToStep2}
                  className="w-full py-3 font-display text-[11px] border-4 border-yellow-700/25 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-950 hover:from-yellow-300 hover:to-amber-300 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider font-bold"
                  style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.18)', textShadow: '1px 1px 0px rgba(255,255,255,0.3)' }}>
                  NEXT →
                </button>
              </div>
            )}

            {manualStep === 2 && (
              <div className="space-y-3">
                <div className="border-4 border-yellow-700/15 bg-yellow-200/30 p-4 space-y-3" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.1)' }}>
                  <div className="flex items-center gap-2"><span className="text-lg">⚙️</span><span className="font-display text-[10px] text-yellow-900/60 tracking-[0.12em] font-bold">CONFIGURE</span></div>
                  <div className="border-3 border-yellow-700/12 bg-yellow-300/20 p-3 flex items-center gap-3">
                    {imagePreview ? <div className="w-8 h-8 border-2 border-yellow-700/15 overflow-hidden shrink-0"><img src={imagePreview} alt="" className="w-full h-full object-cover pixel-art-rendering" /></div> : <span className="text-xl">🍌</span>}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm text-yellow-950 font-bold">${tokenSymbol || '???'}</div>
                      <div className="font-display text-[9px] text-yellow-800/35 truncate">{tokenName || 'Untitled'}</div>
                    </div>
                    <button onClick={() => setManualStep(1)} className="font-display text-[7px] text-yellow-800/40 hover:text-yellow-950 border-2 border-yellow-700/15 px-2 py-1 bg-yellow-400/15 transition-colors">EDIT</button>
                  </div>
                  {!wallet.connected ? (
                    <button onClick={connectWallet} data-testid="button-connect-cannon"
                      className="w-full flex items-center justify-center gap-2 p-2.5 border-3 border-purple-500/25 bg-purple-200/25 text-purple-800 font-display text-[9px] hover:bg-purple-200/40 transition-all tracking-wider font-bold"
                      style={{ boxShadow: '2px 2px 0px rgba(147,51,234,0.1)' }}><Wallet className="w-3.5 h-3.5" /> CONNECT PHANTOM</button>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 border-3 border-green-500/20 bg-green-200/20">
                      <div className="w-2.5 h-2.5 bg-green-500 border border-green-700" />
                      <span className="font-display text-[9px] text-green-800 font-bold">CONNECTED</span>
                      <span className="text-[9px] text-green-700/40 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                      {wallet.balance !== null && <span className="font-display text-[9px] text-yellow-900 ml-auto font-bold">{wallet.balance.toFixed(3)} SOL</span>}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="font-display text-[7px] text-yellow-800/35 tracking-wider font-bold">DEV BUY (SOL)</label>
                    <input value={devBuyAmount} onChange={e => { setDevBuyAmount(e.target.value); setError(null); }} type="number" step="0.1" min="0" data-testid="input-dev-buy"
                      className="w-full bg-white/35 border-2 border-yellow-600/15 text-yellow-950 px-3 py-2 text-sm font-mono focus:outline-none focus:border-yellow-600/30 transition-colors" />
                  </div>
                  <div className="border-3 border-yellow-700/10 bg-yellow-300/15 p-3">
                    <div className="flex items-center justify-between mb-1"><span className="font-display text-[7px] text-yellow-800/30">FEE</span><span className="font-display text-[9px] text-yellow-900/50">{PUMP_PORTAL_FEE} SOL</span></div>
                    {parseFloat(devBuyAmount || "0") > 0 && <div className="flex items-center justify-between mb-1"><span className="font-display text-[7px] text-yellow-800/30">DEV BUY</span><span className="font-display text-[9px] text-yellow-900/50">{parseFloat(devBuyAmount)} SOL</span></div>}
                    <div className="h-px bg-yellow-700/10 my-1.5" />
                    <div className="flex items-center justify-between"><span className="font-display text-[9px] text-yellow-900/60 font-bold">TOTAL</span><span className="font-display text-sm text-yellow-950 font-bold" data-testid="text-total-cost">{totalCost.toFixed(4)} SOL</span></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setManualStep(1)} className="px-3 py-2.5 font-display text-[9px] border-3 border-yellow-700/12 bg-yellow-500/8 text-yellow-800/40 hover:bg-yellow-500/15 transition-all">BACK</button>
                  <button onClick={() => setManualStep(3)} disabled={!wallet.connected}
                    className="flex-1 py-3 font-display text-[11px] border-4 border-yellow-700/25 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-950 hover:from-yellow-300 hover:to-amber-300 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider font-bold"
                    style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.18)', textShadow: '1px 1px 0px rgba(255,255,255,0.3)' }}>REVIEW →</button>
                </div>
              </div>
            )}

            {manualStep === 3 && (
              <div className="space-y-3">
                <div className="border-4 border-orange-600/25 bg-gradient-to-b from-orange-200/45 to-yellow-200/45 p-4 space-y-3" style={{ boxShadow: '5px 5px 0px rgba(120,53,15,0.18)' }}>
                  <div className="flex items-center gap-2"><span className="text-lg animate-bounce">🍌</span><span className="font-display text-[11px] text-orange-900 tracking-[0.12em] font-bold animate-pulse">CANNON LOADED</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border-3 border-yellow-700/12 bg-yellow-300/20 p-3">
                      <div className="font-display text-[6px] text-yellow-800/25 tracking-wider mb-1 font-bold">TOKEN</div>
                      <div className="font-display text-sm text-yellow-950">{tokenName}</div>
                      <div className="font-display text-sm text-yellow-800 font-bold">${tokenSymbol}</div>
                    </div>
                    <div className="border-3 border-yellow-700/12 bg-yellow-300/20 p-3">
                      <div className="font-display text-[6px] text-yellow-800/25 tracking-wider mb-1 font-bold">COST</div>
                      <div className="font-display text-lg text-yellow-950 font-bold">{totalCost.toFixed(4)}</div>
                      <div className="font-display text-[8px] text-yellow-800/30">SOL</div>
                    </div>
                  </div>
                </div>
                {error && <div className="flex items-center gap-2 px-3 py-2 bg-red-200/30 border-3 border-red-500/25 text-red-800 font-display text-[9px]"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span className="font-bold">{error}</span></div>}
                <div className="flex gap-2">
                  <button onClick={() => setManualStep(2)} className="px-3 py-2.5 font-display text-[9px] border-3 border-yellow-700/12 bg-yellow-500/8 text-yellow-800/40 hover:bg-yellow-500/15 transition-all">BACK</button>
                  <button onClick={handleManualLaunch} disabled={launching || !wallet.connected} data-testid="button-launch-token"
                    className="flex-1 py-3.5 font-display text-sm disabled:opacity-30 flex items-center justify-center gap-2 border-4 transition-all tracking-wider font-bold"
                    style={{
                      background: launching ? 'rgba(220,38,38,0.08)' : 'linear-gradient(135deg, #ef4444, #f97316, #eab308)',
                      borderColor: launching ? 'rgba(220,38,38,0.15)' : 'rgba(180,60,20,0.4)',
                      boxShadow: launching ? 'none' : '5px 5px 0px rgba(120,53,15,0.3)',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.15)',
                      color: '#fff',
                    }}>
                    {launching ? <><Loader2 className="w-4 h-4 animate-spin" /> FIRING...</> : <><img src={crabClaw} alt="" className="w-6 h-6 pixel-art-rendering" style={{ imageRendering: 'pixelated' }} /> FIRE CANNON</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
