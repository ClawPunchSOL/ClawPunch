import { useState, useEffect, useRef } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, refreshBalance } from "@/lib/solanaWallet";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import { Rocket, Loader2, Wallet, ExternalLink, AlertTriangle, Flame, Copy, Check, ChevronDown, ChevronUp, ImagePlus, Globe, X, Zap, Brain, ArrowRight, RotateCcw, Search } from "lucide-react";

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
  { name: "BREAKING NEWS WEEK", emoji: "📰", desc: "Launch tokens from breaking headlines" },
  { name: "CULTURE HIJACK WEEK", emoji: "🎭", desc: "Ride the wave of viral culture moments" },
  { name: "AI VS AI WEEK", emoji: "🤖", desc: "Let the AI battle for the best narrative" },
  { name: "MARKET REACTION WEEK", emoji: "📊", desc: "React to market moves in real-time" },
  { name: "MEME LORD WEEK", emoji: "🐒", desc: "Pure meme energy — unhinged launches" },
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

  let score = 0;
  score += confirmed.length * 20;
  score += aiLaunches * 10;
  score += hasSocials * 5;
  if (avgSpeed > 0 && avgSpeed < 120) score += 15;
  score = Math.min(score, 100);

  let rank = "ROOKIE";
  if (score >= 80) rank = "CANNON MASTER";
  else if (score >= 60) rank = "TREND SNIPER";
  else if (score >= 40) rank = "DEGEN APE";
  else if (score >= 20) rank = "LAUNCHER";

  return { score, rank, launches: confirmed.length, aiLaunches, avgSpeed };
}

export default function BananaCannonPanel({ onSendChat }: { onSendChat?: (msg: string) => void }) {
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
    fetch("/api/token-launches")
      .then(r => r.json())
      .then(setLaunches)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiLog, thinkingDots]);

  useEffect(() => {
    if (isThinking) {
      let count = 0;
      thinkingRef.current = setInterval(() => {
        count = (count + 1) % 4;
        setThinkingDots(".".repeat(count || 1));
      }, 400);
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
    setAiPhase("running");
    setAiLog([]);
    setAiConcept(null);
    setError(null);
    setScanStartTime(Date.now());

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

      for (let i = 0; i < concepts.length; i++) {
        const c = concepts[i];
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
      setAiPhase("idle");
      setError(err.message);
    }
  };

  const aiTotalCost = PUMP_PORTAL_FEE + parseFloat(aiDevBuy || "0");

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenName, tokenSymbol: tokenSymbol.toUpperCase(), description,
        devBuyAmount, walletAddress: wallet.publicKey,
        mintPublicKey: mintPubkey, imageUrl, twitter, telegram, website,
      }),
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
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false, preflightCommitment: "confirmed",
    });
    log({ type: "code", text: `tx = ${signature.slice(0, 30)}...` });

    log({ type: "bash-sub", text: "  Confirming..." });
    try { await connection.confirmTransaction(signature, "confirmed"); }
    catch { log({ type: "skill-sub", text: "  Confirmation slow — check Solscan." }); }

    const scanMs = scanStartTime ? Date.now() - scanStartTime : null;

    const saveRes = await fetch("/api/token-launches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenName, tokenSymbol: tokenSymbol.toUpperCase(), description,
        devBuyAmount, walletAddress: wallet.publicKey,
        imageUrl, twitter, telegram, website,
        mintAddress: mintPubkey, txSignature: signature, metadataUri,
        headlineUsed: headlineUsed || null,
        launchMethod: launchMethod || "manual",
        scanToLaunchMs: scanMs,
      }),
    });
    const launch = saveRes.ok ? await saveRes.json() : null;

    return { signature, mintAddress: mintPubkey, metadataUri, launch };
  };

  const handleAiLaunch = async () => {
    if (!aiConcept || !wallet.connected) return;
    setLaunching(true);
    setError(null);

    addLog({ type: "gap", text: "" });
    addLog({ type: "bash", text: `LAUNCHING $${aiConcept.tokenSymbol}` });

    try {
      const devBuy = parseFloat(aiDevBuy || "0");
      const tw = aiTwitterOverride.trim().startsWith("https://x.com/") || aiTwitterOverride.trim().startsWith("https://twitter.com/")
        ? aiTwitterOverride.trim() : null;

      const result = await launchViaPumpPortal({
        tokenName: aiConcept.tokenName, tokenSymbol: aiConcept.tokenSymbol,
        description: aiConcept.description, devBuyAmount: devBuy,
        imageUrl: null, twitter: tw, telegram: null, website: null,
        headlineUsed: aiConcept.headlineUsed, launchMethod: "ai",
        onLog: addLog,
      });

      addLog({ type: "gap", text: "" });
      addLog({ type: "success", text: `LIVE ON SOLANA! $${aiConcept.tokenSymbol}` });
      addLog({ type: "skill-sub", text: `  pump.fun/coin/${result.mintAddress.slice(0, 16)}...` });

      if (result.launch) setLaunches(prev => [result.launch, ...prev]);
      onSendChat?.(`Token launched: $${aiConcept.tokenSymbol} — ${aiConcept.tokenName} | mint: ${result.mintAddress}`);

      setTimeout(() => {
        setAiPhase("idle"); setAiConcept(null); setAiConcepts([]); setAiLog([]);
        setAiDevBuy("0"); setAiTwitterOverride(""); setMode("select"); refreshBalance();
      }, 3000);
    } catch (err: any) {
      const msg = err.message?.includes("User rejected") ? "Transaction rejected" : (err.message || "Launch failed");
      addLog({ type: "error", text: msg });
      setError(msg);
    } finally { setLaunching(false); }
  };

  const totalCost = PUMP_PORTAL_FEE + parseFloat(devBuyAmount || "0");
  const canProceedToStep2 = tokenName.trim() && tokenSymbol.trim() && description.trim();
  const canProceedToStep3 = canProceedToStep2 && wallet.connected;

  const handleManualLaunch = async () => {
    if (!tokenName.trim() || !tokenSymbol.trim() || !description.trim()) { setError("Fill in all fields"); return; }
    if (!wallet.connected) { setError("Connect wallet first"); return; }
    setLaunching(true); setError(null);
    try {
      const devBuy = parseFloat(devBuyAmount || "0");
      const result = await launchViaPumpPortal({
        tokenName: tokenName.trim(), tokenSymbol: tokenSymbol.trim(),
        description: description.trim(), devBuyAmount: devBuy,
        imageUrl: imagePreview || null, twitter: twitter.trim() || null,
        telegram: telegram.trim() || null, website: website.trim() || null,
        launchMethod: "manual",
      });
      if (result.launch) setLaunches(prev => [result.launch, ...prev]);
      onSendChat?.(`Token launched: $${tokenSymbol.toUpperCase()} | mint: ${result.mintAddress}`);
      setTokenName(""); setTokenSymbol(""); setDescription(""); setDevBuyAmount("0");
      setImagePreview(null); setTwitter(""); setTelegram(""); setWebsite("");
      setManualStep(1); setMode("select"); refreshBalance();
    } catch (err: any) {
      setError(err.message?.includes("User rejected") ? "Transaction rejected" : err.message || "Launch failed");
    } finally { setLaunching(false); }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text); setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderLogLine = (line: LogLine, i: number) => {
    switch (line.type) {
      case "prompt":
        return <div key={i} className="mt-1 mb-2 text-[10px] text-yellow-300 font-display">{line.text}</div>;
      case "text":
        return <div key={i} className="text-[9px] text-yellow-100/60 pl-2 my-0.5">{line.text}</div>;
      case "skill":
        return (
          <div key={i} className="flex items-center gap-2 mt-2">
            <span className="text-lg leading-none">🍌</span>
            <span className="text-[8px] text-yellow-400 font-display tracking-wider">{line.text}</span>
          </div>
        );
      case "skill-sub":
        return <div key={i} className="text-[8px] text-yellow-200/40 pl-7">{line.text}</div>;
      case "code-header":
        return (
          <div key={i} className="flex items-center gap-2 mt-2">
            <span className="text-lg leading-none">🔥</span>
            <span className="text-[9px] text-orange-400 font-display tracking-wider">{line.text}</span>
          </div>
        );
      case "code":
        return <div key={i} className="text-[8px] text-yellow-300/50 pl-7 font-mono">{line.text}</div>;
      case "bash":
        return (
          <div key={i} className="flex items-center gap-2 mt-2">
            <span className="text-lg leading-none">🚀</span>
            <span className="text-[8px] text-orange-400 font-display tracking-wider">{line.text}</span>
          </div>
        );
      case "bash-sub":
        return <div key={i} className="text-[8px] text-yellow-200/40 pl-7">{line.text}</div>;
      case "success":
        return <div key={i} className="text-[9px] text-green-400 pl-2 mt-2 font-display">✓ {line.text}</div>;
      case "error":
        return <div key={i} className="text-[9px] text-red-400 pl-2 mt-1 font-display">✗ {line.text}</div>;
      case "gap":
        return <div key={i} className="h-1" />;
      default:
        return <div key={i} className="text-[8px] text-yellow-200/30">{line.text}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <img src={fighterMonkey} alt="" className="w-16 h-16 animate-bounce pixel-art-rendering" />
        <span className="text-[8px] text-yellow-400 font-display tracking-[0.2em] animate-pulse">LOADING CANNON...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative border-4 border-yellow-500/60 overflow-hidden" style={{ boxShadow: '4px 4px 0px rgba(234,179,8,0.4)' }}>
        <div className="absolute inset-0 opacity-30">
          <img src={bananaLab} alt="" className="w-full h-full object-cover pixel-art-rendering" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black/90" />
        <div className="relative p-4">
          <div className="flex items-center gap-3">
            <img src={fighterMonkey} alt="" className="w-14 h-14 pixel-art-rendering border-2 border-yellow-500/50" style={{ imageRendering: 'pixelated' }} />
            <div className="flex-1">
              <div className="font-display text-[10px] text-yellow-400 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                BANANA CANNON
              </div>
              <div className="font-display text-[7px] text-yellow-200/40 tracking-widest mt-0.5">
                TOKEN LAUNCHER // SOLANA
              </div>
            </div>
            {mode !== "select" && (
              <button
                onClick={() => { setMode("select"); setAiPhase("idle"); setAiLog([]); setAiConcept(null); setAiConcepts([]); setManualStep(1); setError(null); setIsThinking(false); setAiTwitterOverride(""); }}
                className="font-display text-[7px] text-yellow-400/60 hover:text-yellow-400 transition-colors border-2 border-yellow-500/30 px-2 py-1 bg-black/40 hover:bg-black/60"
              >
                ← BACK
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-2 bg-black/60 border-2 border-yellow-500/30 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all" style={{ width: `${creatorStats.score}%` }} />
            </div>
            <span className="font-display text-[7px] text-yellow-400/80">{creatorStats.rank}</span>
          </div>
        </div>
      </div>

      <div className="border-4 border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-yellow-500/5 to-orange-500/10 p-3 flex items-center gap-3" style={{ boxShadow: '3px 3px 0px rgba(249,115,22,0.2)' }}>
        <span className="text-xl">{theme.emoji}</span>
        <div className="flex-1">
          <div className="font-display text-[7px] text-orange-400 tracking-[0.15em]">{theme.name}</div>
          <div className="font-display text-[6px] text-orange-300/40 mt-0.5">{theme.desc}</div>
        </div>
        <div className="flex items-center gap-1.5 border-2 border-yellow-500/20 bg-black/30 px-2 py-1">
          <span className="font-display text-[7px] text-yellow-400">{launches.length}</span>
          <span className="font-display text-[6px] text-yellow-400/40">LAUNCHED</span>
        </div>
      </div>

      {mode === "select" && (
        <div className="space-y-3">
          <button
            onClick={() => setMode("ai")}
            data-testid="button-ai-mode"
            className="w-full border-4 border-yellow-500/50 bg-gradient-to-br from-yellow-500/15 via-orange-500/10 to-yellow-600/15 p-4 hover:border-yellow-400 hover:from-yellow-500/25 hover:via-orange-500/20 hover:to-yellow-600/25 transition-all group text-left"
            style={{ boxShadow: '4px 4px 0px rgba(234,179,8,0.3)' }}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-yellow-500/40 bg-yellow-500/10 flex items-center justify-center group-hover:border-yellow-400 transition-colors overflow-hidden">
                  <img src={fighterMonkey} alt="" className="w-12 h-12 pixel-art-rendering group-hover:scale-110 transition-transform" style={{ imageRendering: 'pixelated' }} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black flex items-center justify-center">
                  <span className="font-display text-[5px] text-black">AI</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-display text-[9px] text-yellow-400 tracking-wider flex items-center gap-2">
                  AI TREND LAUNCH
                  <span className="text-[6px] text-green-400 border-2 border-green-500/30 px-1.5 py-0.5 bg-green-500/10 animate-pulse">LIVE</span>
                </div>
                <div className="font-display text-[7px] text-yellow-200/30 mt-1 leading-relaxed">
                  CLAUDE SCANS BREAKING NEWS, FINDS THE NARRATIVE, BUILDS YOUR TOKEN
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-yellow-500/30 group-hover:text-yellow-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => setMode("manual")}
            data-testid="button-manual-mode"
            className="w-full border-4 border-white/10 bg-black/30 p-4 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all group text-left"
            style={{ boxShadow: '4px 4px 0px rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 border-4 border-white/10 bg-black/40 flex items-center justify-center group-hover:border-yellow-500/30 transition-colors">
                <Rocket className="w-6 h-6 text-white/20 group-hover:text-yellow-400/60 transition-colors" />
              </div>
              <div className="flex-1">
                <div className="font-display text-[9px] text-white/50 tracking-wider group-hover:text-yellow-400/70 transition-colors">MANUAL LAUNCH</div>
                <div className="font-display text-[7px] text-white/20 mt-1">YOUR TOKEN, YOUR NARRATIVE, YOUR RULES</div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-colors" />
            </div>
          </button>

          {creatorStats.launches > 0 && (
            <div className="border-4 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 p-3" style={{ boxShadow: '3px 3px 0px rgba(234,179,8,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🏆</span>
                <span className="font-display text-[7px] text-yellow-400/60 tracking-[0.15em]">CREATOR STATS</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="border-2 border-yellow-500/15 bg-black/30 p-2 text-center">
                  <div className="font-display text-[11px] text-yellow-400">{creatorStats.launches}</div>
                  <div className="font-display text-[5px] text-yellow-400/30 mt-0.5">DEPLOYS</div>
                </div>
                <div className="border-2 border-yellow-500/15 bg-black/30 p-2 text-center">
                  <div className="font-display text-[11px] text-yellow-400">{creatorStats.aiLaunches}</div>
                  <div className="font-display text-[5px] text-yellow-400/30 mt-0.5">AI PICKS</div>
                </div>
                <div className="border-2 border-yellow-500/15 bg-black/30 p-2 text-center">
                  <div className="font-display text-[11px] text-yellow-400">{creatorStats.score}</div>
                  <div className="font-display text-[5px] text-yellow-400/30 mt-0.5">SCORE</div>
                </div>
                <div className="border-2 border-yellow-500/15 bg-black/30 p-2 text-center">
                  <div className="font-display text-[11px] text-yellow-400">{creatorStats.avgSpeed || '—'}s</div>
                  <div className="font-display text-[5px] text-yellow-400/30 mt-0.5">AVG SPEED</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "ai" && (
        <div className="space-y-3">
          <div className="border-4 border-yellow-500/30 bg-black/80 overflow-hidden" style={{ boxShadow: '4px 4px 0px rgba(234,179,8,0.2)' }}>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-2 flex items-center gap-2 border-b-4 border-yellow-500/20">
              <span className="text-sm">🍌</span>
              <span className="font-display text-[7px] text-yellow-400/60 tracking-[0.15em] flex-1">NARRATIVE SCANNER</span>
              {(aiPhase === "running" || isThinking) && (
                <span className="font-display text-[6px] text-green-400 animate-pulse tracking-wider">SCANNING...</span>
              )}
            </div>

            <div className="p-4 min-h-[240px] max-h-[380px] overflow-y-auto custom-scrollbar">
              {aiPhase === "idle" && aiLog.length === 0 && (
                <div className="space-y-4 py-2">
                  <div className="text-center space-y-3">
                    <div className="relative inline-block">
                      <img src={crabClaw} alt="" className="w-20 h-20 pixel-art-rendering mx-auto opacity-60" style={{ imageRendering: 'pixelated' }} />
                    </div>
                    <div>
                      <div className="font-display text-[8px] text-yellow-400/70 tracking-wider">READY TO SCAN</div>
                      <div className="font-display text-[6px] text-yellow-200/25 mt-1 max-w-[250px] mx-auto leading-relaxed">
                        CLAUDE WILL PULL LIVE NEWS, FIND THE HOTTEST NARRATIVE, AND BUILD 3 TOKEN CONCEPTS FOR YOU
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={runAiGenerate}
                    data-testid="button-ai-scan"
                    className="w-full border-4 border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 via-orange-500/15 to-yellow-500/20 py-3.5 font-display text-[9px] text-yellow-400 tracking-[0.2em] hover:border-yellow-400 hover:from-yellow-500/30 hover:via-orange-500/25 hover:to-yellow-500/30 transition-all flex items-center justify-center gap-2"
                    style={{ boxShadow: '4px 4px 0px rgba(234,179,8,0.3)' }}
                  >
                    <Zap className="w-4 h-4" />
                    SCAN TRENDS NOW
                  </button>
                </div>
              )}

              {aiLog.length > 0 && (
                <div className="space-y-0">
                  {aiLog.map((line, i) => renderLogLine(line, i))}
                  {isThinking && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm animate-spin">🍌</span>
                      <span className="text-yellow-400 text-[8px] font-display animate-pulse">THINKING{thinkingDots}</span>
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
                <span className="text-sm">🎯</span>
                <span className="font-display text-[7px] text-orange-400 tracking-[0.15em]">PICK YOUR BANANA</span>
              </div>

              {aiConcepts.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAiConcept(c); setAiTwitterOverride(""); setAiPhase("ready");
                    addLog({ type: "gap", text: "" });
                    addLog({ type: "success", text: `Selected: $${c.tokenSymbol}` });
                    onSendChat?.(`AI trend token: $${c.tokenSymbol} — ${c.tokenName}`);
                  }}
                  data-testid={`button-pick-concept-${i}`}
                  className="w-full text-left border-4 border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 hover:border-yellow-400/60 hover:from-yellow-500/15 hover:to-orange-500/10 p-3 transition-all group"
                  style={{ boxShadow: '3px 3px 0px rgba(234,179,8,0.15)' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 border-2 border-yellow-500/40 bg-yellow-500/10 flex items-center justify-center group-hover:border-yellow-400 group-hover:bg-yellow-500/20 transition-colors">
                      <span className="font-display text-[8px] text-yellow-400">{i + 1}</span>
                    </div>
                    <span className="font-display text-[9px] text-yellow-400 tracking-wider">${c.tokenSymbol}</span>
                    <span className="font-display text-[7px] text-white/30 truncate">{c.tokenName}</span>
                  </div>
                  {c.headlineUsed && (
                    <div className="text-[7px] text-green-400/50 pl-9 mb-1 truncate font-display">
                      📰 {c.headlineUsed.slice(0, 60)}...
                    </div>
                  )}
                  <div className="text-[7px] text-white/25 leading-relaxed line-clamp-2 pl-9 font-display">{c.description}</div>
                  {c.xSearchUrl && (
                    <div className="flex items-center gap-1 pl-9 mt-1.5">
                      <Search className="w-2.5 h-2.5 text-blue-400/40" />
                      <span className="text-[6px] text-blue-400/40 font-display">X SEARCH AVAILABLE</span>
                    </div>
                  )}
                </button>
              ))}

              <button
                onClick={() => { setAiPhase("idle"); setAiConcepts([]); setAiLog([]); setIsThinking(false); }}
                className="w-full flex items-center gap-2 justify-center py-2.5 font-display text-[7px] border-4 border-white/10 text-white/25 hover:text-yellow-400/60 hover:border-yellow-500/20 transition-all tracking-widest"
              >
                <RotateCcw className="w-3 h-3" /> SCAN AGAIN
              </button>
            </div>
          )}

          {aiPhase === "ready" && aiConcept && (
            <div className="flex gap-2">
              <button onClick={() => { setAiPhase("picking"); setAiConcept(null); setAiTwitterOverride(""); }}
                className="px-3 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:border-yellow-500/20 transition-all">BACK</button>
              <button onClick={() => setAiPhase("config")} data-testid="button-ai-accept"
                className="flex-1 py-2.5 font-display text-[8px] border-4 border-yellow-500/50 bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 hover:border-yellow-400 transition-all flex items-center justify-center gap-2 tracking-wider"
                style={{ boxShadow: '3px 3px 0px rgba(234,179,8,0.3)' }}>
                <Zap className="w-3.5 h-3.5" /> LOAD CANNON
              </button>
            </div>
          )}

          {aiPhase === "config" && aiConcept && (
            <div className="space-y-3">
              <div className="border-4 border-yellow-500/40 bg-gradient-to-b from-yellow-500/10 to-black/60 p-4 space-y-3" style={{ boxShadow: '4px 4px 0px rgba(234,179,8,0.25)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🍌</span>
                  <span className="font-display text-[8px] text-yellow-400 tracking-[0.2em]">CANNON LOADED</span>
                  <div className="w-2 h-2 bg-yellow-400 animate-pulse ml-auto" />
                </div>

                <div className="border-4 border-yellow-500/20 bg-black/40 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[9px] text-yellow-400 tracking-wider">${aiConcept.tokenSymbol}</div>
                    <div className="font-display text-[7px] text-white/30 truncate">{aiConcept.tokenName}</div>
                  </div>
                </div>

                <div className="border-4 border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-blue-400/60" />
                    <span className="font-display text-[7px] text-blue-400/60 tracking-wider">VERIFY ON X</span>
                  </div>
                  {aiConcept.xSearchUrl && (
                    <a href={aiConcept.xSearchUrl} target="_blank" rel="noopener noreferrer" data-testid="link-x-search"
                      className="flex items-center gap-2 px-3 py-2 border-4 border-blue-500/30 bg-blue-500/10 text-blue-400 font-display text-[7px] hover:bg-blue-500/20 hover:border-blue-400 transition-all w-full justify-center tracking-wider"
                      style={{ boxShadow: '2px 2px 0px rgba(59,130,246,0.2)' }}>
                      <ExternalLink className="w-3 h-3" /> FIND VIRAL POSTS ON X
                    </a>
                  )}
                  <input value={aiTwitterOverride} onChange={e => setAiTwitterOverride(e.target.value)}
                    placeholder="Paste viral tweet URL here..." data-testid="input-ai-twitter"
                    className="w-full bg-black/50 border-2 border-white/10 text-white px-3 py-2 text-[9px] font-mono focus:outline-none focus:border-blue-500/40 transition-colors placeholder:text-white/10" />
                </div>

                {!wallet.connected ? (
                  <button onClick={connectWallet} data-testid="button-connect-ai-cannon"
                    className="w-full flex items-center justify-center gap-2 p-3 border-4 border-yellow-500/30 bg-yellow-500/5 text-yellow-400 font-display text-[7px] hover:bg-yellow-500/10 hover:border-yellow-400 transition-all tracking-wider">
                    <Wallet className="w-4 h-4" /> CONNECT PHANTOM
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 border-4 border-green-500/20 bg-green-500/5">
                    <div className="w-2 h-2 bg-green-400" />
                    <span className="font-display text-[7px] text-green-400">CONNECTED</span>
                    <span className="text-[8px] text-white/30 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                    {wallet.balance !== null && <span className="font-display text-[7px] text-yellow-400 ml-auto">{wallet.balance.toFixed(4)} SOL</span>}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-display text-[6px] text-yellow-400/40 tracking-wider">DEV BUY (SOL) — OPTIONAL</label>
                  <input value={aiDevBuy} onChange={e => setAiDevBuy(e.target.value)}
                    type="number" step="0.1" min="0" data-testid="input-ai-dev-buy"
                    className="w-full bg-black/50 border-2 border-white/10 text-white px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-yellow-500/40 transition-colors" />
                </div>

                <div className="border-4 border-yellow-500/15 bg-black/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-[6px] text-white/25 tracking-wider">DEPLOY FEE</span>
                    <span className="font-display text-[8px] text-white/50">{PUMP_PORTAL_FEE} SOL</span>
                  </div>
                  {parseFloat(aiDevBuy || "0") > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-[6px] text-white/25 tracking-wider">DEV BUY</span>
                      <span className="font-display text-[8px] text-white/50">{parseFloat(aiDevBuy || "0")} SOL</span>
                    </div>
                  )}
                  <div className="h-[2px] bg-yellow-500/10 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[7px] text-yellow-400/60">TOTAL</span>
                    <span className="font-display text-[10px] text-yellow-400">{aiTotalCost.toFixed(4)} SOL</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border-4 border-red-500/20 text-red-400 font-display text-[7px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" /><span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setAiPhase("ready")}
                  className="px-3 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:border-yellow-500/20 transition-all">BACK</button>
                <button onClick={handleAiLaunch} disabled={launching || !wallet.connected} data-testid="button-ai-launch"
                  className="flex-1 py-3.5 font-display text-[9px] disabled:opacity-30 flex items-center justify-center gap-3 border-4 border-orange-500/60 text-orange-400 transition-all relative overflow-hidden group tracking-wider"
                  style={{
                    background: launching ? 'rgba(249,115,22,0.05)' : 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,179,8,0.2))',
                    boxShadow: launching ? 'none' : '4px 4px 0px rgba(249,115,22,0.35)',
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-yellow-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {launching ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> FIRING...</>
                    ) : (
                      <><img src={crabClaw} alt="" className="w-6 h-6 pixel-art-rendering" style={{ imageRendering: 'pixelated' }} /> FIRE CANNON</>
                    )}
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
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 px-2 py-1.5 flex-1 border-4 transition-all ${
                  manualStep === s ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                    : manualStep > s ? 'border-green-500/30 bg-green-500/5 text-green-400'
                    : 'border-white/5 bg-black/30 text-white/15'
                }`}>
                  <div className={`w-4 h-4 flex items-center justify-center font-display text-[7px] border-2 ${
                    manualStep === s ? 'border-yellow-400 text-yellow-400' : manualStep > s ? 'border-green-400/50 text-green-400' : 'border-white/10 text-white/15'
                  }`}>{manualStep > s ? '✓' : s}</div>
                  <span className="font-display text-[6px] tracking-wider hidden sm:inline">
                    {s === 1 ? 'CREATE' : s === 2 ? 'CONFIG' : 'FIRE'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {manualStep === 1 && (
            <div className="space-y-3">
              <div className="border-4 border-yellow-500/20 bg-black/40 p-4 space-y-3" style={{ boxShadow: '3px 3px 0px rgba(234,179,8,0.15)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🍌</span>
                  <span className="font-display text-[7px] text-yellow-400/60 tracking-[0.15em]">DEFINE YOUR TOKEN</span>
                </div>
                <div className="flex gap-3">
                  <div className="shrink-0">
                    <label className="font-display text-[6px] text-yellow-400/30 tracking-wider block mb-1">IMAGE</label>
                    <div className="relative w-20 h-20 border-4 border-yellow-500/20 bg-black/50 flex items-center justify-center cursor-pointer hover:border-yellow-500/40 transition-colors overflow-hidden group">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Token" className="w-full h-full object-cover pixel-art-rendering" />
                          <button onClick={(e) => { e.preventDefault(); setImagePreview(null); }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-2.5 h-2.5 text-white/60" />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 p-2">
                          <ImagePlus className="w-5 h-5 text-yellow-400/20" />
                          <span className="font-display text-[5px] text-yellow-400/20">UPLOAD</span>
                          <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" data-testid="input-token-image" />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="font-display text-[6px] text-yellow-400/30 tracking-wider">NAME</label>
                        <input value={tokenName} onChange={e => { setTokenName(e.target.value); setError(null); }}
                          placeholder="e.g. Banana Coin" data-testid="input-token-name"
                          className="w-full bg-black/50 border-2 border-yellow-500/15 text-white px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-yellow-500/40 placeholder:text-white/10 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-display text-[6px] text-yellow-400/30 tracking-wider">TICKER</label>
                        <input value={tokenSymbol} onChange={e => { setTokenSymbol(e.target.value.toUpperCase()); setError(null); }}
                          placeholder="$BNNA" maxLength={10} data-testid="input-token-symbol"
                          className="w-full bg-black/50 border-2 border-yellow-500/15 text-white px-3 py-2 text-[10px] font-display focus:outline-none focus:border-yellow-500/40 placeholder:text-white/10 transition-colors" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-display text-[6px] text-yellow-400/30 tracking-wider">DESCRIPTION</label>
                      <textarea value={description} onChange={e => { setDescription(e.target.value); setError(null); }}
                        placeholder="What's this token about?" rows={2} data-testid="input-token-description"
                        className="w-full bg-black/50 border-2 border-yellow-500/15 text-white px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-yellow-500/40 placeholder:text-white/10 resize-none transition-colors" />
                    </div>
                  </div>
                </div>
                <div className="border-t-2 border-yellow-500/10 pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Globe className="w-3 h-3 text-yellow-400/20" />
                    <span className="font-display text-[6px] text-yellow-400/20 tracking-wider">SOCIALS (OPTIONAL)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: twitter, set: setTwitter, label: "TWITTER", ph: "https://x.com/...", tid: "input-twitter" },
                      { val: telegram, set: setTelegram, label: "TELEGRAM", ph: "https://t.me/...", tid: "input-telegram" },
                      { val: website, set: setWebsite, label: "WEBSITE", ph: "https://...", tid: "input-website" },
                    ].map(f => (
                      <div key={f.label} className="space-y-1">
                        <label className="font-display text-[5px] text-yellow-400/15 tracking-wider">{f.label}</label>
                        <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} data-testid={f.tid}
                          className="w-full bg-black/50 border-2 border-yellow-500/10 text-white px-2 py-1.5 text-[8px] font-mono focus:outline-none focus:border-yellow-500/30 placeholder:text-white/8 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border-4 border-red-500/20 text-red-400 font-display text-[7px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" /><span>{error}</span>
                </div>
              )}
              <button onClick={() => { setError(null); setManualStep(2); }} disabled={!canProceedToStep2}
                className="w-full py-2.5 font-display text-[8px] border-4 border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider"
                style={{ boxShadow: '3px 3px 0px rgba(234,179,8,0.2)' }}>
                NEXT →
              </button>
            </div>
          )}

          {manualStep === 2 && (
            <div className="space-y-3">
              <div className="border-4 border-yellow-500/20 bg-black/40 p-4 space-y-3" style={{ boxShadow: '3px 3px 0px rgba(234,179,8,0.15)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚙️</span>
                  <span className="font-display text-[7px] text-yellow-400/60 tracking-[0.15em]">CONFIGURE</span>
                </div>
                <div className="border-4 border-yellow-500/15 bg-yellow-500/5 p-3 flex items-center gap-3">
                  {imagePreview ? (
                    <div className="w-8 h-8 border-2 border-yellow-500/30 overflow-hidden shrink-0">
                      <img src={imagePreview} alt="" className="w-full h-full object-cover pixel-art-rendering" />
                    </div>
                  ) : <span className="text-xl">🍌</span>}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[9px] text-yellow-400">${tokenSymbol || '???'}</div>
                    <div className="font-display text-[7px] text-white/30 truncate">{tokenName || 'Untitled'}</div>
                  </div>
                  <button onClick={() => setManualStep(1)} className="font-display text-[6px] text-yellow-400/40 hover:text-yellow-400 transition-colors border-2 border-yellow-500/20 px-2 py-0.5">EDIT</button>
                </div>
                {!wallet.connected ? (
                  <button onClick={connectWallet} data-testid="button-connect-cannon"
                    className="w-full flex items-center justify-center gap-2 p-3 border-4 border-yellow-500/30 bg-yellow-500/5 text-yellow-400 font-display text-[7px] hover:bg-yellow-500/10 hover:border-yellow-400 transition-all tracking-wider">
                    <Wallet className="w-4 h-4" /> CONNECT PHANTOM
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 border-4 border-green-500/20 bg-green-500/5">
                    <div className="w-2 h-2 bg-green-400" />
                    <span className="font-display text-[7px] text-green-400">CONNECTED</span>
                    <span className="text-[8px] text-white/30 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                    {wallet.balance !== null && <span className="font-display text-[7px] text-yellow-400 ml-auto">{wallet.balance.toFixed(4)} SOL</span>}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="font-display text-[6px] text-yellow-400/30 tracking-wider">DEV BUY (SOL)</label>
                  <input value={devBuyAmount} onChange={e => { setDevBuyAmount(e.target.value); setError(null); }}
                    type="number" step="0.1" min="0" data-testid="input-dev-buy"
                    className="w-full bg-black/50 border-2 border-yellow-500/15 text-white px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-yellow-500/40 transition-colors" />
                </div>
                <div className="border-4 border-yellow-500/15 bg-black/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-[6px] text-white/25">DEPLOY FEE</span>
                    <span className="font-display text-[8px] text-white/50">{PUMP_PORTAL_FEE} SOL</span>
                  </div>
                  {parseFloat(devBuyAmount || "0") > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-[6px] text-white/25">DEV BUY</span>
                      <span className="font-display text-[8px] text-white/50">{parseFloat(devBuyAmount || "0")} SOL</span>
                    </div>
                  )}
                  <div className="h-[2px] bg-yellow-500/10 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[7px] text-yellow-400/60">TOTAL</span>
                    <span className="font-display text-[10px] text-yellow-400" data-testid="text-total-cost">{totalCost.toFixed(4)} SOL</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setManualStep(1)} className="px-3 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:border-yellow-500/20 transition-all">BACK</button>
                <button onClick={() => setManualStep(3)} disabled={!canProceedToStep3}
                  className="flex-1 py-2.5 font-display text-[8px] border-4 border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider"
                  style={{ boxShadow: '3px 3px 0px rgba(234,179,8,0.2)' }}>
                  REVIEW →
                </button>
              </div>
            </div>
          )}

          {manualStep === 3 && (
            <div className="space-y-3">
              <div className="border-4 border-yellow-500/40 bg-gradient-to-b from-yellow-500/10 to-black/60 p-4 space-y-3" style={{ boxShadow: '4px 4px 0px rgba(234,179,8,0.25)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg animate-bounce">🍌</span>
                  <span className="font-display text-[8px] text-yellow-400 tracking-[0.2em] animate-pulse">CANNON LOADED</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border-4 border-yellow-500/15 bg-black/40 p-2">
                    <div className="font-display text-[5px] text-yellow-400/25 tracking-wider mb-1">TOKEN</div>
                    <div className="font-display text-[9px] text-white">{tokenName}</div>
                    <div className="font-display text-[8px] text-yellow-400">${tokenSymbol}</div>
                  </div>
                  <div className="border-4 border-yellow-500/15 bg-black/40 p-2">
                    <div className="font-display text-[5px] text-yellow-400/25 tracking-wider mb-1">COST</div>
                    <div className="font-display text-[10px] text-yellow-400">{totalCost.toFixed(4)} SOL</div>
                  </div>
                </div>
                <div className="border-4 border-yellow-500/10 bg-black/30 p-2">
                  <div className="font-display text-[5px] text-yellow-400/25 tracking-wider mb-1">DESCRIPTION</div>
                  <div className="text-[8px] text-white/40 leading-relaxed font-display">{description.slice(0, 150)}</div>
                </div>
                <div className="border-4 border-yellow-500/10 bg-black/30 p-2">
                  <div className="font-display text-[5px] text-yellow-400/25 tracking-wider mb-1">WALLET</div>
                  <div className="text-[7px] text-white/25 font-mono">{wallet.publicKey}</div>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border-4 border-red-500/20 text-red-400 font-display text-[7px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" /><span>{error}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setManualStep(2)} className="px-3 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:border-yellow-500/20 transition-all">BACK</button>
                <button onClick={handleManualLaunch} disabled={launching || !wallet.connected} data-testid="button-launch-token"
                  className="flex-1 py-3.5 font-display text-[9px] disabled:opacity-30 flex items-center justify-center gap-3 border-4 border-orange-500/60 text-orange-400 transition-all relative overflow-hidden group tracking-wider"
                  style={{
                    background: launching ? 'rgba(249,115,22,0.05)' : 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,179,8,0.2))',
                    boxShadow: launching ? 'none' : '4px 4px 0px rgba(249,115,22,0.35)',
                  }}>
                  <span className="relative flex items-center gap-2">
                    {launching ? <><Loader2 className="w-5 h-5 animate-spin" /> FIRING...</> : <><img src={crabClaw} alt="" className="w-6 h-6 pixel-art-rendering" style={{ imageRendering: 'pixelated' }} /> FIRE CANNON</>}
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
            className="w-full flex items-center justify-between px-3 py-2.5 border-4 border-yellow-500/15 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-sm">🚀</span>
              <span className="font-display text-[7px] text-yellow-400/50 tracking-[0.15em]">LAUNCH HISTORY</span>
              <span className="font-display text-[8px] text-yellow-400/70 border-2 border-yellow-500/20 px-1.5 py-0.5 bg-yellow-500/10">{launches.length}</span>
            </div>
            {showHistory ? <ChevronUp className="w-3 h-3 text-yellow-400/30" /> : <ChevronDown className="w-3 h-3 text-yellow-400/30" />}
          </button>
          {showHistory && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {launches.map(launch => (
                <div key={launch.id} className="p-3 border-4 border-yellow-500/10 bg-black/30 hover:border-yellow-500/25 transition-colors space-y-2" data-testid={`launch-${launch.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🍌</span>
                      <span className="font-display text-[9px] text-yellow-400" data-testid={`text-launch-symbol-${launch.id}`}>${launch.tokenSymbol}</span>
                      <span className="font-display text-[7px] text-white/20">{launch.tokenName}</span>
                    </div>
                    <span className={`font-display text-[6px] px-1.5 py-0.5 border-2 tracking-wider ${
                      launch.status === 'launched' || launch.status === 'confirmed' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                      launch.status === 'pending' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' :
                      'border-red-500/30 text-red-400 bg-red-500/5'
                    }`} data-testid={`text-launch-status-${launch.id}`}>{launch.status.toUpperCase()}</span>
                  </div>
                  <p className="font-display text-[7px] text-white/20 leading-relaxed">{launch.description.slice(0, 80)}...</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {launch.mintAddress && (
                      <div className="flex items-center gap-1">
                        <span className="font-display text-[6px] text-yellow-400/20">MINT:</span>
                        <span className="text-[7px] text-yellow-400/50 font-mono">{launch.mintAddress.slice(0, 10)}...{launch.mintAddress.slice(-4)}</span>
                        <button onClick={() => copyToClipboard(launch.mintAddress!, launch.id)} className="p-0.5 text-yellow-400/20 hover:text-yellow-400/50" data-testid={`button-copy-mint-${launch.id}`}>
                          {copiedId === launch.id ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    )}
                    {launch.pumpUrl && (
                      <a href={launch.pumpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-display text-[6px] text-blue-400/50 hover:text-blue-300" data-testid={`link-pump-${launch.id}`}>
                        VIEW <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {launch.txSignature && (
                      <a href={`https://solscan.io/tx/${launch.txSignature}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-display text-[6px] text-blue-400/50 hover:text-blue-300" data-testid={`link-tx-${launch.id}`}>
                        SOLSCAN <ExternalLink className="w-2.5 h-2.5" />
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
  );
}
