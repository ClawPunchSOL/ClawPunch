import { useState, useEffect, useRef } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, refreshBalance } from "@/lib/solanaWallet";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import { Rocket, Loader2, Wallet, ExternalLink, AlertTriangle, Copy, Check, ChevronDown, ChevronUp, ImagePlus, Globe, X, Zap, ArrowRight, RotateCcw, Search } from "lucide-react";

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
  { name: "BREAKING NEWS WEEK", desc: "Launch tokens from breaking headlines", color: "from-red-500/30 to-orange-500/20" },
  { name: "CULTURE HIJACK WEEK", desc: "Ride the wave of viral culture moments", color: "from-purple-500/30 to-pink-500/20" },
  { name: "AI VS AI WEEK", desc: "Let the AI battle for best narrative", color: "from-cyan-500/30 to-blue-500/20" },
  { name: "MARKET REACTION WEEK", desc: "React to market moves in real-time", color: "from-green-500/30 to-emerald-500/20" },
  { name: "MEME LORD WEEK", desc: "Pure meme energy", color: "from-yellow-500/30 to-amber-500/20" },
];

function getCurrentTheme() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_THEMES[weekNum % WEEKLY_THEMES.length];
}

function getCreatorScore(launches: TokenLaunch[]) {
  if (launches.length === 0) return { score: 0, rank: "ROOKIE", launches: 0, aiLaunches: 0, avgSpeed: 0 };
  const confirmed = launches.filter(l => l.status === "confirmed" || l.status === "launched");
  const aiLaunches = launches.filter(l => l.launchMethod === "ai").length;
  const speeds = launches.filter(l => l.scanToLaunchMs).map(l => l.scanToLaunchMs!);
  const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length / 1000) : 0;
  const hasSocials = launches.filter(l => l.twitter || l.telegram || l.website).length;
  let score = Math.min(confirmed.length * 20 + aiLaunches * 10 + hasSocials * 5 + (avgSpeed > 0 && avgSpeed < 120 ? 15 : 0), 100);
  let rank = score >= 80 ? "CANNON MASTER" : score >= 60 ? "TREND SNIPER" : score >= 40 ? "DEGEN APE" : score >= 20 ? "LAUNCHER" : "ROOKIE";
  return { score, rank, launches: confirmed.length, aiLaunches, avgSpeed };
}

export default function BananaCannonPanel({ onSendChat, fullscreen }: { onSendChat?: (msg: string) => void; fullscreen?: boolean }) {
  const wallet = useWalletState();
  const [launches, setLaunches] = useState<TokenLaunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState<"select" | "manual" | "ai">("select");
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
      setTimeout(() => { setAiPhase("idle"); setAiConcept(null); setAiConcepts([]); setAiLog([]); setAiDevBuy("0"); setAiTwitterOverride(""); setMode("select"); refreshBalance(); }, 3000);
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
      setTokenName(""); setTokenSymbol(""); setDescription(""); setDevBuyAmount("0"); setImagePreview(null); setTwitter(""); setTelegram(""); setWebsite(""); setManualStep(1); setMode("select"); refreshBalance();
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
    const base: Record<string, string> = {
      prompt: "mt-1 mb-2 text-[11px] text-yellow-900 font-display",
      text: "text-[10px] text-yellow-800/60 pl-2 my-0.5",
      skill: "flex items-center gap-2 mt-2",
      "skill-sub": "text-[9px] text-yellow-700/50 pl-7",
      "code-header": "flex items-center gap-2 mt-2",
      code: "text-[9px] text-amber-700/60 pl-7 font-mono",
      bash: "flex items-center gap-2 mt-2",
      "bash-sub": "text-[9px] text-yellow-700/40 pl-7",
      success: "text-[11px] text-green-700 pl-2 mt-2 font-display font-bold",
      error: "text-[11px] text-red-600 pl-2 mt-1 font-display font-bold",
      gap: "h-1.5",
      thinking: "text-[9px] text-yellow-600/40",
    };
    if (line.type === "skill") return <div key={i} className={base.skill}><span className="text-lg">🍌</span><span className="text-[9px] text-amber-700 font-display tracking-wider font-bold">{line.text}</span></div>;
    if (line.type === "code-header") return <div key={i} className={base["code-header"]}><span className="text-lg">🔥</span><span className="text-[10px] text-orange-700 font-display tracking-wider font-bold">{line.text}</span></div>;
    if (line.type === "bash") return <div key={i} className={base.bash}><span className="text-lg">🚀</span><span className="text-[9px] text-orange-700 font-display tracking-wider font-bold">{line.text}</span></div>;
    if (line.type === "success") return <div key={i} className={base.success}>✓ {line.text}</div>;
    if (line.type === "error") return <div key={i} className={base.error}>✗ {line.text}</div>;
    return <div key={i} className={base[line.type] || base.text}>{line.text}</div>;
  };

  const resetToSelect = () => {
    setMode("select"); setAiPhase("idle"); setAiLog([]); setAiConcept(null); setAiConcepts([]);
    setManualStep(1); setError(null); setIsThinking(false); setAiTwitterOverride("");
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-yellow-400 via-amber-300 to-orange-400">
        <img src={fighterMonkey} alt="" className="w-20 h-20 animate-bounce pixel-art-rendering drop-shadow-lg" style={{ imageRendering: 'pixelated' }} />
        <span className="text-sm text-yellow-900 font-display tracking-[0.2em] animate-pulse font-bold">LOADING CANNON...</span>
      </div>
    );
  }

  return (
    <div className={`${fullscreen ? 'h-full' : ''} flex flex-col bg-gradient-to-b from-yellow-400 via-amber-300 to-orange-400 overflow-y-auto`}>

      <div className="relative overflow-hidden border-b-4 border-yellow-600/40">
        <div className="absolute inset-0">
          <img src={bananaLab} alt="" className="w-full h-full object-cover pixel-art-rendering opacity-25" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/60 via-amber-400/70 to-orange-500/80" />
        <div className="relative px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
            <img src={fighterMonkey} alt="" className="w-16 h-16 pixel-art-rendering drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] border-4 border-yellow-800/40" style={{ imageRendering: 'pixelated' }} />
            <div className="flex-1">
              <h1 className="font-display text-xl md:text-2xl text-yellow-950 tracking-wider drop-shadow-[0_2px_0px_rgba(255,255,255,0.3)]" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.15)' }}>
                BANANA CANNON
              </h1>
              <p className="font-display text-[10px] text-yellow-800/70 tracking-widest mt-0.5">
                TOKEN LAUNCHER ON SOLANA
              </p>
            </div>
            {mode !== "select" && (
              <button onClick={resetToSelect}
                className="font-display text-[10px] text-yellow-900/70 hover:text-yellow-950 border-3 border-yellow-800/30 bg-yellow-500/40 hover:bg-yellow-500/60 px-3 py-1.5 transition-all"
                style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.15)' }}>
                ← BACK
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-3 bg-yellow-800/20 border-2 border-yellow-800/30 overflow-hidden" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)' }}>
              <div className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all" style={{ width: `${creatorStats.score}%`, boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
            </div>
            <span className="font-display text-[9px] text-yellow-900/80 font-bold tracking-wider">{creatorStats.rank}</span>
          </div>
        </div>
      </div>

      <div className={`bg-gradient-to-r ${theme.color} border-b-2 border-yellow-600/20 px-5 py-2.5 flex items-center gap-3`}>
        <div className="flex-1">
          <div className="font-display text-[9px] text-yellow-950/80 tracking-[0.15em] font-bold">{theme.name}</div>
          <div className="font-display text-[8px] text-yellow-900/40 mt-0.5">{theme.desc}</div>
        </div>
        <div className="flex items-center gap-1.5 border-2 border-yellow-800/20 bg-yellow-500/30 px-2.5 py-1">
          <span className="font-display text-[10px] text-yellow-950 font-bold">{launches.length}</span>
          <span className="font-display text-[7px] text-yellow-900/50">LAUNCHED</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">

        {mode === "select" && (
          <div className="space-y-3">
            <button onClick={() => setMode("ai")} data-testid="button-ai-mode"
              className="w-full border-4 border-yellow-700/30 bg-gradient-to-br from-yellow-300/80 via-amber-200/80 to-orange-300/80 p-5 hover:border-yellow-600/60 hover:from-yellow-200 hover:via-amber-100 hover:to-orange-200 transition-all group text-left"
              style={{ boxShadow: '6px 6px 0px rgba(120,53,15,0.25)' }}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-yellow-700/30 bg-yellow-500/30 flex items-center justify-center group-hover:border-yellow-600 transition-colors overflow-hidden" style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.15)' }}>
                    <img src={fighterMonkey} alt="" className="w-14 h-14 pixel-art-rendering group-hover:scale-110 transition-transform" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-green-500 border-2 border-green-700 font-display text-[6px] text-white font-bold tracking-wider" style={{ boxShadow: '1px 1px 0px rgba(0,0,0,0.3)' }}>AI</div>
                </div>
                <div className="flex-1">
                  <div className="font-display text-sm text-yellow-950 tracking-wider flex items-center gap-2 font-bold" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.3)' }}>
                    AI TREND LAUNCH
                    <span className="text-[7px] text-green-700 border-2 border-green-600/40 px-1.5 py-0.5 bg-green-400/30 animate-pulse font-display">LIVE</span>
                  </div>
                  <p className="font-display text-[9px] text-yellow-800/60 mt-1.5 leading-relaxed">
                    Claude scans breaking news, finds the narrative, builds your token
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-yellow-700/30 group-hover:text-yellow-800 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button onClick={() => setMode("manual")} data-testid="button-manual-mode"
              className="w-full border-4 border-yellow-700/15 bg-yellow-500/15 p-5 hover:border-yellow-700/30 hover:bg-yellow-500/25 transition-all group text-left"
              style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.1)' }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-4 border-yellow-700/15 bg-yellow-500/10 flex items-center justify-center group-hover:border-yellow-700/30 transition-colors">
                  <Rocket className="w-7 h-7 text-yellow-800/30 group-hover:text-yellow-800/60 transition-colors" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-sm text-yellow-900/60 tracking-wider group-hover:text-yellow-950 transition-colors font-bold">MANUAL LAUNCH</div>
                  <p className="font-display text-[9px] text-yellow-800/30 mt-1 group-hover:text-yellow-800/50 transition-colors">Your token, your narrative, your rules</p>
                </div>
                <ArrowRight className="w-6 h-6 text-yellow-700/15 group-hover:text-yellow-700/40 transition-all" />
              </div>
            </button>

            {creatorStats.launches > 0 && (
              <div className="border-4 border-yellow-700/20 bg-yellow-500/20 p-4" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.12)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🏆</span>
                  <span className="font-display text-[9px] text-yellow-900/60 tracking-[0.15em] font-bold">CREATOR STATS</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: creatorStats.launches, label: "DEPLOYS" },
                    { val: creatorStats.aiLaunches, label: "AI PICKS" },
                    { val: creatorStats.score, label: "SCORE" },
                    { val: creatorStats.avgSpeed ? `${creatorStats.avgSpeed}s` : '—', label: "AVG SPEED" },
                  ].map(s => (
                    <div key={s.label} className="border-2 border-yellow-700/15 bg-yellow-400/20 p-2 text-center" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                      <div className="font-display text-base text-yellow-950 font-bold">{s.val}</div>
                      <div className="font-display text-[6px] text-yellow-800/40 mt-0.5 tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "ai" && (
          <div className="space-y-3">
            <div className="border-4 border-yellow-700/30 bg-yellow-100/60 overflow-hidden" style={{ boxShadow: '6px 6px 0px rgba(120,53,15,0.2)' }}>
              <div className="bg-gradient-to-r from-yellow-400/60 to-amber-400/60 px-4 py-2.5 flex items-center gap-2 border-b-4 border-yellow-700/20">
                <span className="text-lg">🍌</span>
                <span className="font-display text-[10px] text-yellow-900/70 tracking-[0.15em] flex-1 font-bold">NARRATIVE SCANNER</span>
                {(aiPhase === "running" || isThinking) && (
                  <span className="font-display text-[8px] text-green-700 animate-pulse tracking-wider font-bold">SCANNING...</span>
                )}
              </div>

              <div className="p-5 min-h-[220px] max-h-[380px] overflow-y-auto custom-scrollbar bg-gradient-to-b from-yellow-50/60 to-amber-50/40">
                {aiPhase === "idle" && aiLog.length === 0 && (
                  <div className="space-y-5 py-3">
                    <div className="text-center space-y-4">
                      <img src={crabClaw} alt="" className="w-24 h-24 pixel-art-rendering mx-auto drop-shadow-lg" style={{ imageRendering: 'pixelated' }} />
                      <div>
                        <div className="font-display text-sm text-yellow-900/80 tracking-wider font-bold">READY TO SCAN</div>
                        <p className="font-display text-[10px] text-yellow-800/40 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                          Claude pulls live news, finds the hottest narrative, builds 3 token concepts
                        </p>
                      </div>
                    </div>
                    <button onClick={runAiGenerate} data-testid="button-ai-scan"
                      className="w-full border-4 border-orange-600/40 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 py-4 font-display text-sm text-yellow-950 tracking-[0.15em] hover:from-orange-300 hover:via-amber-300 hover:to-yellow-300 hover:border-orange-500 transition-all flex items-center justify-center gap-3 font-bold"
                      style={{ boxShadow: '5px 5px 0px rgba(120,53,15,0.3)', textShadow: '1px 1px 0px rgba(255,255,255,0.4)' }}>
                      <Zap className="w-5 h-5" />
                      SCAN TRENDS NOW
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
                <div className="flex items-center gap-2 px-1">
                  <span className="text-lg">🎯</span>
                  <span className="font-display text-[10px] text-yellow-900/70 tracking-[0.15em] font-bold">PICK YOUR BANANA</span>
                </div>
                {aiConcepts.map((c, i) => (
                  <button key={i} data-testid={`button-pick-concept-${i}`}
                    onClick={() => { setAiConcept(c); setAiTwitterOverride(""); setAiPhase("ready"); addLog({ type: "gap", text: "" }); addLog({ type: "success", text: `Selected: $${c.tokenSymbol}` }); onSendChat?.(`AI trend token: $${c.tokenSymbol} — ${c.tokenName}`); }}
                    className="w-full text-left border-4 border-yellow-700/20 bg-gradient-to-r from-yellow-200/60 to-amber-200/60 hover:from-yellow-200 hover:to-amber-200 hover:border-yellow-600/40 p-4 transition-all group"
                    style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.15)' }}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-9 h-9 border-3 border-yellow-700/30 bg-yellow-400/40 flex items-center justify-center group-hover:bg-yellow-400/60 transition-colors" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                        <span className="font-display text-sm text-yellow-950 font-bold">{i + 1}</span>
                      </div>
                      <span className="font-display text-sm text-yellow-950 tracking-wider font-bold">${c.tokenSymbol}</span>
                      <span className="font-display text-[10px] text-yellow-800/40 truncate">{c.tokenName}</span>
                    </div>
                    {c.headlineUsed && (
                      <div className="text-[9px] text-green-700/60 pl-12 mb-1 truncate font-display">📰 {c.headlineUsed.slice(0, 60)}...</div>
                    )}
                    <div className="text-[9px] text-yellow-800/40 leading-relaxed line-clamp-2 pl-12 font-display">{c.description}</div>
                    {c.xSearchUrl && (
                      <div className="flex items-center gap-1 pl-12 mt-1.5">
                        <Search className="w-3 h-3 text-blue-600/40" />
                        <span className="text-[8px] text-blue-600/40 font-display font-bold">X SEARCH AVAILABLE</span>
                      </div>
                    )}
                  </button>
                ))}
                <button onClick={() => { setAiPhase("idle"); setAiConcepts([]); setAiLog([]); setIsThinking(false); }}
                  className="w-full flex items-center gap-2 justify-center py-3 font-display text-[10px] border-4 border-yellow-700/15 bg-yellow-500/10 text-yellow-800/50 hover:text-yellow-900 hover:bg-yellow-500/20 transition-all tracking-widest">
                  <RotateCcw className="w-3.5 h-3.5" /> SCAN AGAIN
                </button>
              </div>
            )}

            {aiPhase === "ready" && aiConcept && (
              <div className="flex gap-2">
                <button onClick={() => { setAiPhase("picking"); setAiConcept(null); setAiTwitterOverride(""); }}
                  className="px-4 py-3 font-display text-[10px] border-4 border-yellow-700/15 bg-yellow-500/10 text-yellow-800/50 hover:bg-yellow-500/20 transition-all">BACK</button>
                <button onClick={() => setAiPhase("config")} data-testid="button-ai-accept"
                  className="flex-1 py-3 font-display text-sm border-4 border-yellow-700/30 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-950 hover:from-yellow-300 hover:to-amber-300 transition-all flex items-center justify-center gap-2 tracking-wider font-bold"
                  style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.25)', textShadow: '1px 1px 0px rgba(255,255,255,0.3)' }}>
                  <Zap className="w-4 h-4" /> LOAD CANNON
                </button>
              </div>
            )}

            {aiPhase === "config" && aiConcept && (
              <div className="space-y-3">
                <div className="border-4 border-orange-600/30 bg-gradient-to-b from-orange-200/60 via-amber-200/40 to-yellow-200/60 p-5 space-y-4" style={{ boxShadow: '6px 6px 0px rgba(120,53,15,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl animate-bounce">🍌</span>
                    <span className="font-display text-sm text-orange-900 tracking-[0.15em] font-bold animate-pulse">CANNON LOADED</span>
                    <div className="w-3 h-3 bg-green-500 animate-pulse ml-auto border-2 border-green-700" />
                  </div>

                  <div className="border-4 border-yellow-700/20 bg-yellow-300/30 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 border-4 border-yellow-700/20 bg-yellow-400/30 flex items-center justify-center" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                      <Rocket className="w-6 h-6 text-yellow-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base text-yellow-950 tracking-wider font-bold">${aiConcept.tokenSymbol}</div>
                      <div className="font-display text-[10px] text-yellow-800/50 truncate">{aiConcept.tokenName}</div>
                    </div>
                  </div>

                  <div className="border-4 border-blue-500/20 bg-blue-100/30 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-blue-700/60" />
                      <span className="font-display text-[9px] text-blue-700/60 tracking-wider font-bold">VERIFY ON X</span>
                    </div>
                    {aiConcept.xSearchUrl && (
                      <a href={aiConcept.xSearchUrl} target="_blank" rel="noopener noreferrer" data-testid="link-x-search"
                        className="flex items-center gap-2 px-4 py-2.5 border-4 border-blue-500/30 bg-blue-200/40 text-blue-800 font-display text-[10px] hover:bg-blue-200/60 hover:border-blue-500/50 transition-all w-full justify-center tracking-wider font-bold"
                        style={{ boxShadow: '3px 3px 0px rgba(37,99,235,0.15)' }}>
                        <ExternalLink className="w-3.5 h-3.5" /> FIND VIRAL POSTS ON X
                      </a>
                    )}
                    <input value={aiTwitterOverride} onChange={e => setAiTwitterOverride(e.target.value)}
                      placeholder="Paste viral tweet URL here..." data-testid="input-ai-twitter"
                      className="w-full bg-white/40 border-2 border-blue-400/20 text-blue-900 px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-blue-500/40 transition-colors placeholder:text-blue-400/30" />
                  </div>

                  {!wallet.connected ? (
                    <button onClick={connectWallet} data-testid="button-connect-ai-cannon"
                      className="w-full flex items-center justify-center gap-2 p-3 border-4 border-purple-500/30 bg-purple-200/30 text-purple-800 font-display text-[10px] hover:bg-purple-200/50 hover:border-purple-500/50 transition-all tracking-wider font-bold"
                      style={{ boxShadow: '3px 3px 0px rgba(147,51,234,0.15)' }}>
                      <Wallet className="w-4 h-4" /> CONNECT PHANTOM
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 border-4 border-green-500/25 bg-green-200/30">
                      <div className="w-3 h-3 bg-green-500 border-2 border-green-700" />
                      <span className="font-display text-[10px] text-green-800 font-bold">CONNECTED</span>
                      <span className="text-[10px] text-green-700/50 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                      {wallet.balance !== null && <span className="font-display text-[10px] text-yellow-900 ml-auto font-bold">{wallet.balance.toFixed(4)} SOL</span>}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-display text-[8px] text-yellow-800/50 tracking-wider font-bold">DEV BUY (SOL) — OPTIONAL</label>
                    <input value={aiDevBuy} onChange={e => setAiDevBuy(e.target.value)}
                      type="number" step="0.1" min="0" data-testid="input-ai-dev-buy"
                      className="w-full bg-white/40 border-2 border-yellow-600/20 text-yellow-950 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-yellow-600/40 transition-colors" />
                  </div>

                  <div className="border-4 border-yellow-700/15 bg-yellow-300/20 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display text-[8px] text-yellow-800/40 tracking-wider">DEPLOY FEE</span>
                      <span className="font-display text-[10px] text-yellow-900/60">{PUMP_PORTAL_FEE} SOL</span>
                    </div>
                    {parseFloat(aiDevBuy || "0") > 0 && (
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-display text-[8px] text-yellow-800/40 tracking-wider">DEV BUY</span>
                        <span className="font-display text-[10px] text-yellow-900/60">{parseFloat(aiDevBuy || "0")} SOL</span>
                      </div>
                    )}
                    <div className="h-[2px] bg-yellow-700/15 my-2" />
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[10px] text-yellow-900/70 font-bold">TOTAL</span>
                      <span className="font-display text-base text-yellow-950 font-bold">{aiTotalCost.toFixed(4)} SOL</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-red-200/40 border-4 border-red-500/30 text-red-800 font-display text-[10px]" style={{ boxShadow: '3px 3px 0px rgba(220,38,38,0.15)' }}>
                    <AlertTriangle className="w-4 h-4 shrink-0" /><span className="font-bold">{error}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setAiPhase("ready")}
                    className="px-4 py-3 font-display text-[10px] border-4 border-yellow-700/15 bg-yellow-500/10 text-yellow-800/50 hover:bg-yellow-500/20 transition-all">BACK</button>
                  <button onClick={handleAiLaunch} disabled={launching || !wallet.connected} data-testid="button-ai-launch"
                    className="flex-1 py-4 font-display text-sm disabled:opacity-30 flex items-center justify-center gap-3 border-4 border-red-600/50 transition-all relative overflow-hidden group tracking-wider font-bold"
                    style={{
                      background: launching ? 'rgba(220,38,38,0.1)' : 'linear-gradient(135deg, #ef4444, #f97316, #eab308)',
                      boxShadow: launching ? 'none' : '6px 6px 0px rgba(120,53,15,0.35)',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                      color: '#fff',
                    }}>
                    <span className="relative flex items-center gap-2">
                      {launching ? <><Loader2 className="w-5 h-5 animate-spin" /> FIRING...</> : <><img src={crabClaw} alt="" className="w-7 h-7 pixel-art-rendering" style={{ imageRendering: 'pixelated' }} /> FIRE CANNON</>}
                    </span>
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
                  <div className={`flex items-center gap-1.5 px-3 py-2 border-4 transition-all ${
                    manualStep === s ? 'border-yellow-700/40 bg-yellow-300/50 text-yellow-950'
                      : manualStep > s ? 'border-green-600/30 bg-green-300/30 text-green-800'
                      : 'border-yellow-700/10 bg-yellow-500/5 text-yellow-800/20'
                  }`} style={manualStep === s ? { boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' } : {}}>
                    <div className={`w-5 h-5 flex items-center justify-center font-display text-[9px] border-2 font-bold ${
                      manualStep === s ? 'border-yellow-700/50 text-yellow-950' : manualStep > s ? 'border-green-600/40 text-green-700' : 'border-yellow-700/10 text-yellow-800/20'
                    }`}>{manualStep > s ? '✓' : s}</div>
                    <span className="font-display text-[8px] tracking-wider hidden sm:inline font-bold">
                      {s === 1 ? 'CREATE' : s === 2 ? 'CONFIG' : 'FIRE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {manualStep === 1 && (
              <div className="space-y-3">
                <div className="border-4 border-yellow-700/20 bg-yellow-200/40 p-5 space-y-4" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍌</span>
                    <span className="font-display text-[10px] text-yellow-900/70 tracking-[0.15em] font-bold">DEFINE YOUR TOKEN</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <label className="font-display text-[8px] text-yellow-800/40 tracking-wider block mb-1.5 font-bold">IMAGE</label>
                      <div className="relative w-24 h-24 border-4 border-yellow-700/20 bg-yellow-300/20 flex items-center justify-center cursor-pointer hover:border-yellow-700/40 transition-colors overflow-hidden group" style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.08)' }}>
                        {imagePreview ? (
                          <>
                            <img src={imagePreview} alt="Token" className="w-full h-full object-cover pixel-art-rendering" />
                            <button onClick={(e) => { e.preventDefault(); setImagePreview(null); }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-2 border-red-700">
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-1 p-2 w-full h-full justify-center">
                            <ImagePlus className="w-6 h-6 text-yellow-700/25" />
                            <span className="font-display text-[7px] text-yellow-700/25 font-bold">UPLOAD</span>
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" data-testid="input-token-image" />
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="font-display text-[8px] text-yellow-800/40 tracking-wider font-bold">NAME</label>
                          <input value={tokenName} onChange={e => { setTokenName(e.target.value); setError(null); }}
                            placeholder="e.g. Banana Coin" data-testid="input-token-name"
                            className="w-full bg-white/50 border-2 border-yellow-600/20 text-yellow-950 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-yellow-600/40 placeholder:text-yellow-600/20 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-display text-[8px] text-yellow-800/40 tracking-wider font-bold">TICKER</label>
                          <input value={tokenSymbol} onChange={e => { setTokenSymbol(e.target.value.toUpperCase()); setError(null); }}
                            placeholder="$BNNA" maxLength={10} data-testid="input-token-symbol"
                            className="w-full bg-white/50 border-2 border-yellow-600/20 text-yellow-950 px-3 py-2.5 text-sm font-display focus:outline-none focus:border-yellow-600/40 placeholder:text-yellow-600/20 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-display text-[8px] text-yellow-800/40 tracking-wider font-bold">DESCRIPTION</label>
                        <textarea value={description} onChange={e => { setDescription(e.target.value); setError(null); }}
                          placeholder="What's this token about?" rows={3} data-testid="input-token-description"
                          className="w-full bg-white/50 border-2 border-yellow-600/20 text-yellow-950 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-yellow-600/40 placeholder:text-yellow-600/20 resize-none transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 border-yellow-700/10 pt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Globe className="w-3.5 h-3.5 text-yellow-700/25" />
                      <span className="font-display text-[8px] text-yellow-800/30 tracking-wider font-bold">SOCIALS (OPTIONAL)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: twitter, set: setTwitter, label: "TWITTER", ph: "https://x.com/...", tid: "input-twitter" },
                        { val: telegram, set: setTelegram, label: "TELEGRAM", ph: "https://t.me/...", tid: "input-telegram" },
                        { val: website, set: setWebsite, label: "WEBSITE", ph: "https://...", tid: "input-website" },
                      ].map(f => (
                        <div key={f.label} className="space-y-1">
                          <label className="font-display text-[7px] text-yellow-800/25 tracking-wider font-bold">{f.label}</label>
                          <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} data-testid={f.tid}
                            className="w-full bg-white/30 border-2 border-yellow-600/10 text-yellow-950 px-2 py-1.5 text-[9px] font-mono focus:outline-none focus:border-yellow-600/30 placeholder:text-yellow-600/15 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {error && <div className="flex items-center gap-2 px-4 py-2.5 bg-red-200/40 border-4 border-red-500/30 text-red-800 font-display text-[10px]"><AlertTriangle className="w-4 h-4 shrink-0" /><span className="font-bold">{error}</span></div>}
                <button onClick={() => { setError(null); setManualStep(2); }} disabled={!canProceedToStep2}
                  className="w-full py-3 font-display text-sm border-4 border-yellow-700/30 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-950 hover:from-yellow-300 hover:to-amber-300 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider font-bold"
                  style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.2)', textShadow: '1px 1px 0px rgba(255,255,255,0.3)' }}>
                  NEXT →
                </button>
              </div>
            )}

            {manualStep === 2 && (
              <div className="space-y-3">
                <div className="border-4 border-yellow-700/20 bg-yellow-200/40 p-5 space-y-4" style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚙️</span>
                    <span className="font-display text-[10px] text-yellow-900/70 tracking-[0.15em] font-bold">CONFIGURE</span>
                  </div>
                  <div className="border-4 border-yellow-700/15 bg-yellow-300/30 p-3 flex items-center gap-3">
                    {imagePreview ? <div className="w-10 h-10 border-2 border-yellow-700/20 overflow-hidden shrink-0"><img src={imagePreview} alt="" className="w-full h-full object-cover pixel-art-rendering" /></div> : <span className="text-2xl">🍌</span>}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base text-yellow-950 font-bold">${tokenSymbol || '???'}</div>
                      <div className="font-display text-[10px] text-yellow-800/40 truncate">{tokenName || 'Untitled'}</div>
                    </div>
                    <button onClick={() => setManualStep(1)} className="font-display text-[8px] text-yellow-800/50 hover:text-yellow-950 border-2 border-yellow-700/20 px-2 py-1 bg-yellow-400/20 transition-colors">EDIT</button>
                  </div>
                  {!wallet.connected ? (
                    <button onClick={connectWallet} data-testid="button-connect-cannon"
                      className="w-full flex items-center justify-center gap-2 p-3 border-4 border-purple-500/30 bg-purple-200/30 text-purple-800 font-display text-[10px] hover:bg-purple-200/50 transition-all tracking-wider font-bold"
                      style={{ boxShadow: '3px 3px 0px rgba(147,51,234,0.15)' }}>
                      <Wallet className="w-4 h-4" /> CONNECT PHANTOM
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 border-4 border-green-500/25 bg-green-200/30">
                      <div className="w-3 h-3 bg-green-500 border-2 border-green-700" />
                      <span className="font-display text-[10px] text-green-800 font-bold">CONNECTED</span>
                      <span className="text-[10px] text-green-700/50 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                      {wallet.balance !== null && <span className="font-display text-[10px] text-yellow-900 ml-auto font-bold">{wallet.balance.toFixed(4)} SOL</span>}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="font-display text-[8px] text-yellow-800/40 tracking-wider font-bold">DEV BUY (SOL)</label>
                    <input value={devBuyAmount} onChange={e => { setDevBuyAmount(e.target.value); setError(null); }}
                      type="number" step="0.1" min="0" data-testid="input-dev-buy"
                      className="w-full bg-white/40 border-2 border-yellow-600/20 text-yellow-950 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-yellow-600/40 transition-colors" />
                  </div>
                  <div className="border-4 border-yellow-700/15 bg-yellow-300/20 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display text-[8px] text-yellow-800/40">DEPLOY FEE</span>
                      <span className="font-display text-[10px] text-yellow-900/60">{PUMP_PORTAL_FEE} SOL</span>
                    </div>
                    {parseFloat(devBuyAmount || "0") > 0 && (
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-display text-[8px] text-yellow-800/40">DEV BUY</span>
                        <span className="font-display text-[10px] text-yellow-900/60">{parseFloat(devBuyAmount || "0")} SOL</span>
                      </div>
                    )}
                    <div className="h-[2px] bg-yellow-700/15 my-2" />
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[10px] text-yellow-900/70 font-bold">TOTAL</span>
                      <span className="font-display text-base text-yellow-950 font-bold" data-testid="text-total-cost">{totalCost.toFixed(4)} SOL</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setManualStep(1)} className="px-4 py-3 font-display text-[10px] border-4 border-yellow-700/15 bg-yellow-500/10 text-yellow-800/50 hover:bg-yellow-500/20 transition-all">BACK</button>
                  <button onClick={() => setManualStep(3)} disabled={!wallet.connected}
                    className="flex-1 py-3 font-display text-sm border-4 border-yellow-700/30 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-950 hover:from-yellow-300 hover:to-amber-300 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider font-bold"
                    style={{ boxShadow: '4px 4px 0px rgba(120,53,15,0.2)', textShadow: '1px 1px 0px rgba(255,255,255,0.3)' }}>
                    REVIEW →
                  </button>
                </div>
              </div>
            )}

            {manualStep === 3 && (
              <div className="space-y-3">
                <div className="border-4 border-orange-600/30 bg-gradient-to-b from-orange-200/60 to-yellow-200/60 p-5 space-y-4" style={{ boxShadow: '6px 6px 0px rgba(120,53,15,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl animate-bounce">🍌</span>
                    <span className="font-display text-sm text-orange-900 tracking-[0.15em] font-bold animate-pulse">CANNON LOADED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-4 border-yellow-700/15 bg-yellow-300/30 p-3" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                      <div className="font-display text-[7px] text-yellow-800/30 tracking-wider mb-1 font-bold">TOKEN</div>
                      <div className="font-display text-sm text-yellow-950">{tokenName}</div>
                      <div className="font-display text-sm text-yellow-800 font-bold">${tokenSymbol}</div>
                    </div>
                    <div className="border-4 border-yellow-700/15 bg-yellow-300/30 p-3" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                      <div className="font-display text-[7px] text-yellow-800/30 tracking-wider mb-1 font-bold">COST</div>
                      <div className="font-display text-lg text-yellow-950 font-bold">{totalCost.toFixed(4)} SOL</div>
                    </div>
                  </div>
                  <div className="border-4 border-yellow-700/10 bg-yellow-300/20 p-3">
                    <div className="font-display text-[7px] text-yellow-800/30 tracking-wider mb-1 font-bold">DESCRIPTION</div>
                    <div className="text-[10px] text-yellow-800/60 leading-relaxed font-display">{description.slice(0, 150)}</div>
                  </div>
                  <div className="border-4 border-yellow-700/10 bg-yellow-300/20 p-3">
                    <div className="font-display text-[7px] text-yellow-800/30 tracking-wider mb-1 font-bold">WALLET</div>
                    <div className="text-[9px] text-yellow-800/40 font-mono break-all">{wallet.publicKey}</div>
                  </div>
                </div>
                {error && <div className="flex items-center gap-2 px-4 py-2.5 bg-red-200/40 border-4 border-red-500/30 text-red-800 font-display text-[10px]"><AlertTriangle className="w-4 h-4 shrink-0" /><span className="font-bold">{error}</span></div>}
                <div className="flex gap-2">
                  <button onClick={() => setManualStep(2)} className="px-4 py-3 font-display text-[10px] border-4 border-yellow-700/15 bg-yellow-500/10 text-yellow-800/50 hover:bg-yellow-500/20 transition-all">BACK</button>
                  <button onClick={handleManualLaunch} disabled={launching || !wallet.connected} data-testid="button-launch-token"
                    className="flex-1 py-4 font-display text-sm disabled:opacity-30 flex items-center justify-center gap-3 border-4 border-red-600/50 transition-all relative overflow-hidden group tracking-wider font-bold"
                    style={{
                      background: launching ? 'rgba(220,38,38,0.1)' : 'linear-gradient(135deg, #ef4444, #f97316, #eab308)',
                      boxShadow: launching ? 'none' : '6px 6px 0px rgba(120,53,15,0.35)',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                      color: '#fff',
                    }}>
                    <span className="relative flex items-center gap-2">
                      {launching ? <><Loader2 className="w-5 h-5 animate-spin" /> FIRING...</> : <><img src={crabClaw} alt="" className="w-7 h-7 pixel-art-rendering" style={{ imageRendering: 'pixelated' }} /> FIRE CANNON</>}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {launches.length > 0 && (
          <div className="space-y-2">
            <button onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-4 py-3 border-4 border-yellow-700/15 bg-yellow-400/20 hover:bg-yellow-400/30 transition-colors" style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <span className="font-display text-[10px] text-yellow-900/60 tracking-[0.15em] font-bold">LAUNCH HISTORY</span>
                <span className="font-display text-[10px] text-yellow-950 border-2 border-yellow-700/20 px-2 py-0.5 bg-yellow-400/30 font-bold">{launches.length}</span>
              </div>
              {showHistory ? <ChevronUp className="w-4 h-4 text-yellow-800/30" /> : <ChevronDown className="w-4 h-4 text-yellow-800/30" />}
            </button>
            {showHistory && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {launches.map(launch => (
                  <div key={launch.id} className="p-4 border-4 border-yellow-700/10 bg-yellow-200/30 hover:border-yellow-700/20 transition-colors space-y-2" data-testid={`launch-${launch.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🍌</span>
                        <span className="font-display text-sm text-yellow-950 font-bold" data-testid={`text-launch-symbol-${launch.id}`}>${launch.tokenSymbol}</span>
                        <span className="font-display text-[10px] text-yellow-800/30">{launch.tokenName}</span>
                      </div>
                      <span className={`font-display text-[8px] px-2 py-1 border-2 tracking-wider font-bold ${
                        launch.status === 'launched' || launch.status === 'confirmed' ? 'border-green-600/30 text-green-700 bg-green-200/40' :
                        launch.status === 'pending' ? 'border-yellow-600/30 text-yellow-800 bg-yellow-300/30' :
                        'border-red-500/30 text-red-700 bg-red-200/30'
                      }`} data-testid={`text-launch-status-${launch.id}`}>{launch.status.toUpperCase()}</span>
                    </div>
                    <p className="font-display text-[9px] text-yellow-800/30 leading-relaxed">{launch.description.slice(0, 80)}...</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {launch.mintAddress && (
                        <div className="flex items-center gap-1">
                          <span className="font-display text-[8px] text-yellow-800/25 font-bold">MINT:</span>
                          <span className="text-[9px] text-yellow-800/50 font-mono">{launch.mintAddress.slice(0, 10)}...{launch.mintAddress.slice(-4)}</span>
                          <button onClick={() => copyToClipboard(launch.mintAddress!, launch.id)} className="p-0.5 text-yellow-700/30 hover:text-yellow-900" data-testid={`button-copy-mint-${launch.id}`}>
                            {copiedId === launch.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                      {launch.pumpUrl && (
                        <a href={launch.pumpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-display text-[8px] text-orange-700/60 hover:text-orange-900 font-bold" data-testid={`link-pump-${launch.id}`}>
                          VIEW <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {launch.txSignature && (
                        <a href={`https://solscan.io/tx/${launch.txSignature}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-display text-[8px] text-blue-700/60 hover:text-blue-900 font-bold" data-testid={`link-tx-${launch.id}`}>
                          SOLSCAN <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
