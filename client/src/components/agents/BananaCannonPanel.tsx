import { useState, useEffect, useRef } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, refreshBalance } from "@/lib/solanaWallet";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
import { Rocket, Loader2, Wallet, ExternalLink, AlertTriangle, Flame, Copy, Check, ChevronDown, ChevronUp, ImagePlus, Globe, X, Zap, Brain, ArrowRight, RotateCcw, Crosshair, Radio, Target, Shield, Search } from "lucide-react";

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

function RadarWidget({ active }: { active: boolean }) {
  return (
    <div className="relative w-16 h-16 border-4 border-pink-500/40 bg-black/80 overflow-hidden" style={{ imageRendering: 'pixelated' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[1px] h-full bg-pink-500/20 absolute" />
        <div className="h-[1px] w-full bg-pink-500/20 absolute" />
        <div className="w-8 h-8 border border-pink-500/15 absolute" />
        <div className="w-12 h-12 border border-pink-500/10 absolute" />
      </div>
      {active && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full cannon-radar origin-center" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(236,72,153,0.3) 30deg, transparent 60deg)' }} />
          </div>
          <div className="absolute top-2 right-3 w-1.5 h-1.5 bg-pink-400 cannon-blink" />
          <div className="absolute bottom-4 left-2 w-1 h-1 bg-pink-400/60 cannon-blink" style={{ animationDelay: '0.3s' }} />
          <div className="absolute top-5 left-4 w-1 h-1 bg-yellow-400/60 cannon-blink" style={{ animationDelay: '0.7s' }} />
        </>
      )}
      {!active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Crosshair className="w-5 h-5 text-pink-500/30" />
        </div>
      )}
    </div>
  );
}

function StatusBar({ status, count }: { status: string; count: number }) {
  const isLive = status === "SCANNING" || status === "DETECTING";
  return (
    <div className="flex items-center gap-3 border-4 border-foreground/20 bg-black/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 ${isLive ? 'bg-green-400 animate-pulse' : 'bg-pink-400/40'}`} />
        <span className="font-display text-[7px] text-white/60 tracking-widest">{status}</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <span className="font-display text-[7px] text-pink-400/50">{count} DEPLOYED</span>
      </div>
    </div>
  );
}

export default function BananaCannonPanel({ onSendChat }: { onSendChat?: (msg: string) => void }) {
  const wallet = useWalletState();
  const [launches, setLaunches] = useState<TokenLaunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(true);

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
  const logEndRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addLog = (line: LogLine) => {
    setAiLog(prev => [...prev, line]);
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runAiGenerate = async () => {
    setAiPhase("running");
    setAiLog([]);
    setAiConcept(null);
    setError(null);

    addLog({ type: "prompt", text: "> SCAN_NARRATIVES --live --max=3" });
    await delay(600);
    addLog({ type: "text", text: "Initializing narrative radar..." });
    await delay(500);

    addLog({ type: "gap", text: "" });
    addLog({ type: "skill", text: "FEED_INTERCEPT" });
    addLog({ type: "skill-sub", text: "  Pulling real-time headlines from news aggregators..." });
    await delay(600);

    addLog({ type: "text", text: "Headlines acquired. Running narrative analysis..." });
    await delay(400);

    addLog({ type: "gap", text: "" });
    addLog({ type: "skill", text: "NARRATIVE_ENGINE" });
    addLog({ type: "skill-sub", text: "  Scoring viral coefficient + memetic resonance..." });
    await delay(300);

    addLog({ type: "text", text: "Building deployment concepts. Extracting X search vectors..." });
    await delay(300);

    setIsThinking(true);
    addLog({ type: "gap", text: "" });

    try {
      const startTime = Date.now();
      const res = await fetch("/api/token-launches/generate", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();
      const concepts: AIConcept[] = result.concepts || [result];
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      setIsThinking(false);
      await delay(200);

      addLog({ type: "gap", text: "" });
      addLog({ type: "skill", text: "SCAN_COMPLETE" });
      addLog({ type: "skill-sub", text: `  ${result._headlines?.length || 0} headlines processed -> ${concepts.length} targets locked (${elapsed}s)` });
      await delay(200);

      for (let i = 0; i < concepts.length; i++) {
        const c = concepts[i];
        addLog({ type: "gap", text: "" });
        addLog({ type: "code-header", text: `TARGET_${i + 1}: $${c.tokenSymbol} [${c.tokenName}]` });
        if (c.headlineUsed) {
          addLog({ type: "skill-sub", text: `  src: "${c.headlineUsed.slice(0, 100)}"` });
          await delay(40);
        }
        addLog({ type: "code", text: `  "${c.description.slice(0, 100)}${c.description.length > 100 ? '...' : ''}"` });
        await delay(100);
      }

      addLog({ type: "gap", text: "" });
      addLog({ type: "text", text: "Narratives locked. Select target below." });

      setAiConcepts(concepts);
      setAiPhase("picking");
    } catch (err: any) {
      setIsThinking(false);
      addLog({ type: "error", text: `SCAN_FAILED: ${err.message}` });
      setAiPhase("idle");
      setError(err.message);
    }
  };

  const aiTotalCost = PUMP_PORTAL_FEE + parseFloat(aiDevBuy || "0");

  const launchViaPumpPortal = async (params: {
    tokenName: string; tokenSymbol: string; description: string;
    devBuyAmount: number; imageUrl: string | null;
    twitter: string | null; telegram: string | null; website: string | null;
    onLog?: (line: LogLine) => void;
  }) => {
    const { tokenName, tokenSymbol, description, devBuyAmount, imageUrl, twitter, telegram, website, onLog } = params;
    const log = onLog || (() => {});
    const phantom = (window as any).phantom?.solana;
    if (!phantom || !wallet.publicKey) throw new Error("Phantom wallet not connected");

    log({ type: "skill", text: "MINT_KEYGEN" });
    log({ type: "skill-sub", text: "  Generating mint address..." });
    const mintKeypair = Keypair.generate();
    const mintPubkey = mintKeypair.publicKey.toBase58();
    log({ type: "code", text: `  mint = "${mintPubkey.slice(0, 20)}..."` });

    log({ type: "gap", text: "" });
    log({ type: "skill", text: "IPFS_UPLOAD + TX_BUILD" });
    log({ type: "skill-sub", text: "  Uploading metadata + building Solana tx..." });

    const buildRes = await fetch("/api/token-launches/build-tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenName, tokenSymbol: tokenSymbol.toUpperCase(), description,
        devBuyAmount, walletAddress: wallet.publicKey,
        mintPublicKey: mintPubkey, imageUrl, twitter, telegram, website,
      }),
    });

    if (!buildRes.ok) {
      const err = await buildRes.json();
      throw new Error(err.error || "Failed to build transaction");
    }

    const { transaction: txBase64, metadataUri } = await buildRes.json();
    log({ type: "code", text: `  metadata = "${metadataUri?.slice(0, 45)}..."` });

    log({ type: "gap", text: "" });
    log({ type: "skill", text: "PHANTOM_SIGN" });
    log({ type: "skill-sub", text: "  Signing with mint keypair..." });

    const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
    const tx = VersionedTransaction.deserialize(txBytes);
    tx.sign([mintKeypair]);

    log({ type: "skill-sub", text: "  Requesting Phantom wallet signature..." });
    const signedTx = await phantom.signTransaction(tx);

    log({ type: "gap", text: "" });
    log({ type: "bash", text: "BROADCAST" });
    log({ type: "bash-sub", text: "  Sending to Solana mainnet..." });

    const connection = new Connection(SOLANA_RPC, "confirmed");
    const rawTx = signedTx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    log({ type: "code", text: `  tx = "${signature.slice(0, 30)}..."` });

    log({ type: "gap", text: "" });
    log({ type: "bash-sub", text: "  Awaiting confirmation..." });
    try {
      await connection.confirmTransaction(signature, "confirmed");
    } catch (confirmErr: any) {
      log({ type: "skill-sub", text: "  Confirmation timeout. Check Solscan." });
    }

    const saveRes = await fetch("/api/token-launches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenName, tokenSymbol: tokenSymbol.toUpperCase(), description,
        devBuyAmount, walletAddress: wallet.publicKey,
        imageUrl, twitter, telegram, website,
        mintAddress: mintPubkey, txSignature: signature, metadataUri,
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
    addLog({ type: "bash", text: `DEPLOY $${aiConcept.tokenSymbol}` });
    addLog({ type: "bash-sub", text: "  Firing via PumpPortal..." });

    try {
      const devBuy = parseFloat(aiDevBuy || "0");
      const tw = aiTwitterOverride.trim().startsWith("https://x.com/") || aiTwitterOverride.trim().startsWith("https://twitter.com/")
        ? aiTwitterOverride.trim() : null;

      addLog({ type: "bash-sub", text: `  Fee: ${PUMP_PORTAL_FEE} SOL | Dev buy: ${devBuy} SOL` });

      const result = await launchViaPumpPortal({
        tokenName: aiConcept.tokenName,
        tokenSymbol: aiConcept.tokenSymbol,
        description: aiConcept.description,
        devBuyAmount: devBuy,
        imageUrl: null,
        twitter: tw, telegram: null, website: null,
        onLog: addLog,
      });

      addLog({ type: "gap", text: "" });
      addLog({ type: "success", text: `DEPLOYED: ${result.mintAddress.slice(0, 20)}...` });
      addLog({ type: "skill-sub", text: `  solscan.io/tx/${result.signature.slice(0, 20)}...` });
      addLog({ type: "skill-sub", text: `  pump.fun/coin/${result.mintAddress.slice(0, 20)}...` });

      if (result.launch) setLaunches(prev => [result.launch, ...prev]);
      onSendChat?.(`AI token launched on-chain: $${aiConcept.tokenSymbol} — ${aiConcept.tokenName} | mint: ${result.mintAddress}`);

      setTimeout(() => {
        setAiPhase("idle");
        setAiConcept(null);
        setAiConcepts([]);
        setAiLog([]);
        setAiDevBuy("0");
        setAiTwitterOverride("");
        setMode("select");
        refreshBalance();
      }, 3000);
    } catch (err: any) {
      const msg = err.message?.includes("User rejected") ? "Transaction rejected in Phantom" : (err.message || "Launch failed");
      addLog({ type: "error", text: msg });
      setError(msg);
    } finally {
      setLaunching(false);
    }
  };

  const totalCost = PUMP_PORTAL_FEE + parseFloat(devBuyAmount || "0");
  const canProceedToStep2 = tokenName.trim() && tokenSymbol.trim() && description.trim();
  const canProceedToStep3 = canProceedToStep2 && wallet.connected;

  const handleManualLaunch = async () => {
    if (!tokenName.trim() || !tokenSymbol.trim() || !description.trim()) { setError("Fill in all fields"); return; }
    if (!wallet.connected) { setError("Connect wallet first"); return; }
    setLaunching(true);
    setError(null);
    try {
      const devBuy = parseFloat(devBuyAmount || "0");
      const result = await launchViaPumpPortal({
        tokenName: tokenName.trim(),
        tokenSymbol: tokenSymbol.trim(),
        description: description.trim(),
        devBuyAmount: devBuy,
        imageUrl: imagePreview || null,
        twitter: twitter.trim() || null,
        telegram: telegram.trim() || null,
        website: website.trim() || null,
      });
      if (result.launch) setLaunches(prev => [result.launch, ...prev]);
      onSendChat?.(`Token launched on-chain: $${tokenSymbol.toUpperCase()} | mint: ${result.mintAddress}`);
      setTokenName(""); setTokenSymbol(""); setDescription(""); setDevBuyAmount("0");
      setImagePreview(null); setTwitter(""); setTelegram(""); setWebsite("");
      setManualStep(1); setMode("select"); refreshBalance();
    } catch (err: any) {
      setError(err.message?.includes("User rejected") ? "Transaction rejected in Phantom" : err.message || "Launch failed");
    } finally { setLaunching(false); }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatus = () => {
    if (aiPhase === "running" || isThinking) return "SCANNING";
    if (aiPhase === "picking") return "TARGETS LOCKED";
    if (aiPhase === "config") return "CANNON LOADED";
    if (launching) return "FIRING";
    return "STANDBY";
  };

  const renderLogLine = (line: LogLine, i: number) => {
    switch (line.type) {
      case "prompt":
        return (
          <div key={i} className="mt-1 mb-2 flex items-center gap-2">
            <span className="text-pink-500 font-display text-[8px]">$</span>
            <span className="text-pink-300 text-[9px] font-mono tracking-wide">{line.text}</span>
          </div>
        );
      case "text":
        return <div key={i} className="text-[9px] text-stone-400 leading-relaxed pl-3 my-1 font-mono">{line.text}</div>;
      case "skill":
        return (
          <div key={i} className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-green-400" />
            <span className="text-[8px] text-green-400 font-display tracking-wider">{line.text}</span>
          </div>
        );
      case "skill-sub":
        return <div key={i} className="text-[8px] text-stone-500 pl-4 font-mono">{line.text}</div>;
      case "code-header":
        return (
          <div key={i} className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-yellow-400" />
            <span className="text-[8px] text-yellow-400 font-display tracking-wider">{line.text}</span>
          </div>
        );
      case "code":
        return <div key={i} className="text-[9px] text-amber-300/70 pl-4 font-mono">{line.text}</div>;
      case "thinking":
        return (
          <div key={i} className="flex items-center gap-2 mt-2">
            <span className="text-red-400 text-[9px] font-display">*</span>
            <span className="text-red-400 text-[8px] font-display">PROCESSING{line.text}</span>
          </div>
        );
      case "bash":
        return (
          <div key={i} className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-yellow-400" />
            <span className="text-[8px] text-yellow-400 font-display tracking-wider">{line.text}</span>
          </div>
        );
      case "bash-sub":
        return <div key={i} className="text-[8px] text-stone-500 pl-4 font-mono">{line.text}</div>;
      case "success":
        return <div key={i} className="text-[9px] text-green-400 pl-3 mt-2 font-display tracking-wide">{line.text}</div>;
      case "error":
        return <div key={i} className="text-[9px] text-red-400 pl-3 mt-1 font-display">{line.text}</div>;
      case "gap":
        return <div key={i} className="h-1" />;
      default:
        return <div key={i} className="text-[9px] text-stone-500 font-mono">{line.text}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <RadarWidget active={true} />
        <span className="text-[7px] text-pink-400/60 font-display tracking-[0.3em]">INITIALIZING CANNON...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <RadarWidget active={aiPhase === "running" || isThinking || launching} />
        <div className="flex-1 min-w-0">
          <div className="font-display text-[8px] text-pink-400 tracking-[0.2em] mb-1">NARRATIVE DEPLOYMENT SYSTEM</div>
          <div className="font-display text-[6px] text-white/20 tracking-widest">SOLANA MAINNET // PUMPPORTAL API</div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 ${getStatus() === 'STANDBY' ? 'bg-pink-400/30' : getStatus() === 'FIRING' ? 'bg-red-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
            <span className={`font-display text-[7px] tracking-[0.15em] ${getStatus() === 'FIRING' ? 'text-red-400' : getStatus() === 'STANDBY' ? 'text-white/30' : 'text-green-400'}`}>{getStatus()}</span>
            {mode !== "select" && (
              <button
                onClick={() => { setMode("select"); setAiPhase("idle"); setAiLog([]); setAiConcept(null); setAiConcepts([]); setManualStep(1); setError(null); setIsThinking(false); setAiTwitterOverride(""); }}
                className="font-display text-[6px] text-white/20 hover:text-white/40 transition-colors border-2 border-white/10 px-2 py-0.5 ml-auto"
              >
                ABORT
              </button>
            )}
          </div>
        </div>
      </div>

      <StatusBar status={getStatus()} count={launches.length} />

      {mode === "select" && (
        <div className="space-y-3">
          <button
            onClick={() => setMode("ai")}
            data-testid="button-ai-mode"
            className="w-full border-4 border-pink-500/40 bg-black/60 p-4 hover:border-pink-500/70 hover:bg-pink-500/5 transition-all group text-left relative overflow-hidden"
            style={{ boxShadow: '4px 4px 0px rgba(236,72,153,0.3)' }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/40 to-transparent cannon-scan-bar" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-4 border-pink-500/30 bg-black/80 flex items-center justify-center group-hover:border-pink-500/60 transition-colors relative">
                <Target className="w-5 h-5 text-pink-400" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 group-hover:animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="font-display text-[8px] text-pink-400 tracking-[0.2em] flex items-center gap-2">
                  AI NARRATIVE SCAN
                  <span className="text-[6px] text-green-400/60 border-2 border-green-500/30 px-1.5 py-0.5 bg-green-500/5">CLAUDE</span>
                </div>
                <div className="text-[8px] text-white/30 mt-1 font-display leading-relaxed">
                  SCAN LIVE TRENDS. LOCK NARRATIVE. DEPLOY ON-CHAIN.
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-pink-400/30 group-hover:text-pink-400/60 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => setMode("manual")}
            data-testid="button-manual-mode"
            className="w-full border-4 border-white/10 bg-black/40 p-4 hover:border-white/20 transition-all group text-left"
            style={{ boxShadow: '4px 4px 0px rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-4 border-white/10 bg-black/60 flex items-center justify-center group-hover:border-white/20 transition-colors">
                <Rocket className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" />
              </div>
              <div className="flex-1">
                <div className="font-display text-[8px] text-white/50 tracking-[0.15em]">MANUAL DEPLOY</div>
                <div className="text-[8px] text-white/20 mt-1 font-display">DEFINE TOKEN. CONFIGURE. LAUNCH.</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
            </div>
          </button>
        </div>
      )}

      {mode === "ai" && (
        <div className="space-y-3">
          <div className="border-4 border-foreground/15 bg-black/80 overflow-hidden" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.4)' }}>
            <div className="bg-black/60 px-3 py-2 flex items-center gap-2 border-b-4 border-foreground/10">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500/70" />
                <div className="w-2 h-2 bg-yellow-500/70" />
                <div className="w-2 h-2 bg-green-500/70" />
              </div>
              <div className="flex-1 text-center">
                <span className="font-display text-[6px] text-white/30 tracking-[0.2em]">NARRATIVE SCANNER // LIVE</span>
              </div>
              {(aiPhase === "running" || isThinking) && (
                <div className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                </div>
              )}
            </div>

            <div className="p-4 min-h-[280px] max-h-[400px] overflow-y-auto custom-scrollbar relative">
              {(aiPhase === "running" || isThinking) && (
                <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
                  <div className="h-full bg-pink-500/50 cannon-scan-bar" />
                </div>
              )}

              {aiPhase === "idle" && aiLog.length === 0 && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-2 border-pink-500/30 bg-pink-500/5 flex items-center justify-center">
                      <Crosshair className="w-4 h-4 text-pink-400/60" />
                    </div>
                    <div>
                      <div className="font-display text-[7px] text-white/50 tracking-wider">CANNON READY</div>
                      <div className="font-display text-[6px] text-white/20">AWAITING SCAN ORDER</div>
                    </div>
                  </div>

                  <div className="border-2 border-white/5 bg-white/[0.02] p-3 space-y-2">
                    <div className="font-display text-[6px] text-white/20 tracking-widest">SCAN PROTOCOL</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400/40" />
                        <span className="text-[8px] text-white/30 font-display">INTERCEPT LIVE NEWS FEEDS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400/40" />
                        <span className="text-[8px] text-white/30 font-display">ANALYZE NARRATIVE MOMENTUM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400/40" />
                        <span className="text-[8px] text-white/30 font-display">GENERATE 3 DEPLOYMENT TARGETS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-400/40" />
                        <span className="text-[8px] text-white/30 font-display">VERIFY VIA X SEARCH INTEL</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={runAiGenerate}
                    data-testid="button-ai-scan"
                    className="w-full border-4 border-pink-500/40 bg-pink-500/10 py-3 font-display text-[8px] text-pink-400 tracking-[0.2em] hover:bg-pink-500/20 hover:border-pink-500/60 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                    style={{ boxShadow: '3px 3px 0px rgba(236,72,153,0.2)' }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-400/40 to-transparent cannon-scan-bar" />
                    </div>
                    <Crosshair className="w-3.5 h-3.5" />
                    INITIATE NARRATIVE SCAN
                  </button>
                </div>
              )}

              {aiLog.length > 0 && (
                <div className="space-y-0 font-mono">
                  {aiLog.map((line, i) => renderLogLine(line, i))}

                  {isThinking && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-1.5 h-1.5 bg-red-400 cannon-blink" />
                      <span className="text-red-400 text-[8px] font-display tracking-wider">PROCESSING{thinkingDots}</span>
                    </div>
                  )}
                </div>
              )}

              <div ref={logEndRef} />
            </div>

            {(aiPhase === "running" || isThinking) && (
              <div className="bg-black/60 border-t-2 border-foreground/5 px-3 py-2 flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-pink-400/40 animate-spin" />
                <span className="font-display text-[6px] text-white/20 tracking-widest">SCANNING NARRATIVES...</span>
              </div>
            )}
          </div>

          {aiPhase === "picking" && aiConcepts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Target className="w-3 h-3 text-yellow-400/60" />
                <span className="font-display text-[7px] text-yellow-400/60 tracking-[0.2em]">TARGETS DETECTED</span>
                <span className="font-display text-[7px] text-yellow-400/30">{aiConcepts.length}</span>
              </div>

              {aiConcepts.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAiConcept(c);
                    setAiTwitterOverride("");
                    setAiPhase("ready");
                    addLog({ type: "gap", text: "" });
                    addLog({ type: "success", text: `TARGET LOCKED: $${c.tokenSymbol}` });
                    onSendChat?.(`AI generated trend-based token: $${c.tokenSymbol} — ${c.tokenName}`);
                  }}
                  data-testid={`button-pick-concept-${i}`}
                  className="w-full text-left border-4 border-white/10 bg-black/60 hover:border-pink-500/40 hover:bg-pink-500/5 p-3 transition-all group"
                  style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.3)' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 border-2 border-pink-500/30 bg-pink-500/10 flex items-center justify-center group-hover:border-pink-500/50 transition-colors">
                      <span className="font-display text-[7px] text-pink-400">{i + 1}</span>
                    </div>
                    <span className="font-display text-[8px] text-pink-400 tracking-wider">${c.tokenSymbol}</span>
                    <span className="font-display text-[7px] text-white/30">{c.tokenName}</span>
                  </div>
                  {c.headlineUsed && (
                    <div className="text-[7px] text-green-400/50 pl-7 mb-1 truncate font-display">
                      SRC: {c.headlineUsed.slice(0, 60)}...
                    </div>
                  )}
                  <div className="text-[8px] text-white/30 leading-relaxed line-clamp-2 pl-7 font-display">{c.description}</div>
                  {c.xSearchUrl && (
                    <div className="flex items-center gap-1 pl-7 mt-1.5">
                      <Search className="w-2.5 h-2.5 text-blue-400/40" />
                      <span className="text-[6px] text-blue-400/40 font-display">X SEARCH INTEL AVAILABLE</span>
                    </div>
                  )}
                </button>
              ))}

              <button
                onClick={() => { setAiPhase("idle"); setAiConcepts([]); setAiLog([]); setIsThinking(false); }}
                className="w-full flex items-center gap-2 justify-center px-4 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:text-white/50 hover:border-white/15 transition-all tracking-widest"
              >
                <RotateCcw className="w-3 h-3" /> RESCAN
              </button>
            </div>
          )}

          {aiPhase === "ready" && aiConcept && (
            <div className="flex gap-2">
              <button
                onClick={() => { setAiPhase("picking"); setAiConcept(null); setAiTwitterOverride(""); }}
                className="px-3 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:text-white/50 hover:border-white/15 transition-all tracking-wider"
              >
                BACK
              </button>
              <button
                onClick={() => setAiPhase("config")}
                data-testid="button-ai-accept"
                className="flex-1 py-2.5 font-display text-[7px] border-4 border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/60 transition-all flex items-center justify-center gap-2 tracking-[0.15em]"
                style={{ boxShadow: '3px 3px 0px rgba(236,72,153,0.2)' }}
              >
                <Zap className="w-3.5 h-3.5" /> LOAD CANNON
              </button>
            </div>
          )}

          {aiPhase === "config" && aiConcept && (
            <div className="space-y-3">
              <div className="border-4 border-pink-500/30 bg-black/60 p-4 space-y-3 cannon-loaded">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-pink-400 cannon-blink" />
                  <span className="font-display text-[7px] text-pink-400 tracking-[0.2em]">CANNON LOADED</span>
                </div>

                <div className="border-4 border-foreground/10 bg-black/40 p-3 flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-pink-500/40 bg-pink-500/10 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[8px] text-pink-400 tracking-wider">${aiConcept.tokenSymbol}</div>
                    <div className="font-display text-[7px] text-white/30 truncate">{aiConcept.tokenName}</div>
                  </div>
                  <button
                    onClick={() => setAiPhase("ready")}
                    className="font-display text-[6px] text-white/20 hover:text-white/40 transition-colors border-2 border-white/10 px-2 py-0.5"
                  >
                    CHANGE
                  </button>
                </div>

                <div className="border-4 border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-blue-400/50" />
                    <span className="font-display text-[6px] text-blue-400/50 tracking-[0.15em]">X NARRATIVE INTEL</span>
                  </div>
                  {aiConcept.xSearchUrl && (
                    <a
                      href={aiConcept.xSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-x-search"
                      className="flex items-center gap-2 px-3 py-2 border-4 border-blue-500/30 bg-blue-500/10 text-blue-400 font-display text-[7px] hover:bg-blue-500/20 hover:border-blue-500/50 transition-all w-full justify-center tracking-wider"
                      style={{ boxShadow: '2px 2px 0px rgba(59,130,246,0.2)' }}
                    >
                      <ExternalLink className="w-3 h-3" /> SEARCH X FOR VIRAL POSTS
                    </a>
                  )}
                  <div className="font-display text-[6px] text-white/20">PASTE VIRAL TWEET URL BELOW:</div>
                  <input
                    value={aiTwitterOverride}
                    onChange={e => setAiTwitterOverride(e.target.value)}
                    placeholder="https://x.com/user/status/..."
                    data-testid="input-ai-twitter"
                    className="w-full bg-black/50 border-2 border-white/10 text-white px-3 py-2 text-[9px] font-mono focus:outline-none focus:border-blue-500/40 transition-colors placeholder:text-white/10"
                  />
                </div>

                {!wallet.connected ? (
                  <button
                    onClick={connectWallet}
                    data-testid="button-connect-ai-cannon"
                    className="w-full flex items-center justify-center gap-2 p-3 border-4 border-yellow-500/30 bg-yellow-500/5 text-yellow-400 font-display text-[7px] hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all tracking-wider"
                  >
                    <Wallet className="w-4 h-4" /> CONNECT PHANTOM
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 border-4 border-green-500/20 bg-green-500/5">
                    <div className="w-2 h-2 bg-green-400" />
                    <span className="font-display text-[7px] text-green-400 tracking-wider">LINKED</span>
                    <span className="text-[8px] text-white/30 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                    {wallet.balance !== null && (
                      <span className="font-display text-[7px] text-yellow-400 ml-auto">{wallet.balance.toFixed(4)} SOL</span>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-display text-[6px] text-white/30 tracking-wider">DEV BUY (SOL)</label>
                  <input
                    value={aiDevBuy}
                    onChange={e => setAiDevBuy(e.target.value)}
                    type="number" step="0.1" min="0"
                    data-testid="input-ai-dev-buy"
                    className="w-full bg-black/50 border-2 border-white/10 text-white px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-pink-500/40 transition-colors"
                  />
                </div>

                <div className="border-4 border-foreground/10 bg-black/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-[6px] text-white/30 tracking-wider">DEPLOY FEE</span>
                    <span className="font-display text-[7px] text-white/60">{PUMP_PORTAL_FEE} SOL</span>
                  </div>
                  {parseFloat(aiDevBuy || "0") > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-[6px] text-white/30 tracking-wider">DEV BUY</span>
                      <span className="font-display text-[7px] text-white/60">{parseFloat(aiDevBuy || "0")} SOL</span>
                    </div>
                  )}
                  <div className="h-[2px] bg-foreground/10 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[7px] text-white/50 tracking-wider">TOTAL</span>
                    <span className="font-display text-[9px] text-pink-400">{aiTotalCost.toFixed(4)} SOL</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border-4 border-red-500/20 text-red-400 font-display text-[7px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setAiPhase("ready")}
                  className="px-3 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:text-white/50 hover:border-white/15 transition-all tracking-wider"
                >
                  BACK
                </button>
                <button
                  onClick={handleAiLaunch}
                  disabled={launching || !wallet.connected}
                  data-testid="button-ai-launch"
                  className="flex-1 py-3 font-display text-[8px] disabled:opacity-30 flex items-center justify-center gap-2 border-4 border-red-500/50 text-red-400 transition-all relative overflow-hidden group tracking-[0.15em]"
                  style={{
                    background: launching ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.15)',
                    boxShadow: launching ? 'none' : '4px 4px 0px rgba(239,68,68,0.3)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {launching ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> FIRING...</>
                    ) : (
                      <><Flame className="w-4 h-4" /> FIRE CANNON</>
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
                  manualStep === s ? 'border-pink-500/40 bg-pink-500/10 text-pink-400'
                    : manualStep > s ? 'border-green-500/30 bg-green-500/5 text-green-400/70'
                    : 'border-white/5 bg-black/30 text-white/15'
                }`}>
                  <div className={`w-4 h-4 flex items-center justify-center font-display text-[7px] border-2 ${
                    manualStep === s ? 'border-pink-400 text-pink-400' : manualStep > s ? 'border-green-400/50 text-green-400' : 'border-white/10 text-white/15'
                  }`}>
                    {manualStep > s ? '+' : s}
                  </div>
                  <span className="font-display text-[6px] tracking-wider hidden sm:inline">
                    {s === 1 ? 'DEFINE' : s === 2 ? 'CONFIG' : 'FIRE'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {manualStep === 1 && (
            <div className="space-y-3">
              <div className="border-4 border-foreground/10 bg-black/50 p-4 space-y-3" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-400/60" />
                  <span className="font-display text-[7px] text-pink-400/60 tracking-[0.15em]">DEFINE TARGET</span>
                </div>
                <div className="flex gap-3">
                  <div className="shrink-0">
                    <label className="font-display text-[6px] text-white/20 tracking-wider block mb-1">IMAGE</label>
                    <div className="relative w-20 h-20 border-4 border-white/10 bg-black/60 flex items-center justify-center cursor-pointer hover:border-pink-500/30 transition-colors overflow-hidden group">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Token" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                          <button onClick={(e) => { e.preventDefault(); setImagePreview(null); }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-2.5 h-2.5 text-white/60" />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 p-2">
                          <ImagePlus className="w-5 h-5 text-white/15" />
                          <span className="font-display text-[5px] text-white/15 tracking-wider">UPLOAD</span>
                          <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" data-testid="input-token-image" />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="font-display text-[6px] text-white/20 tracking-wider">NAME</label>
                        <input value={tokenName} onChange={e => { setTokenName(e.target.value); setError(null); }}
                          placeholder="Token Name" data-testid="input-token-name"
                          className="w-full bg-black/60 border-2 border-white/10 text-white px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-pink-500/40 placeholder:text-white/10 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-display text-[6px] text-white/20 tracking-wider">TICKER</label>
                        <input value={tokenSymbol} onChange={e => { setTokenSymbol(e.target.value.toUpperCase()); setError(null); }}
                          placeholder="$TKR" maxLength={10} data-testid="input-token-symbol"
                          className="w-full bg-black/60 border-2 border-white/10 text-white px-3 py-2 text-[10px] font-display focus:outline-none focus:border-pink-500/40 placeholder:text-white/10 transition-colors" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-display text-[6px] text-white/20 tracking-wider">DESCRIPTION</label>
                      <textarea value={description} onChange={e => { setDescription(e.target.value); setError(null); }}
                        placeholder="What's this token about?" rows={2} data-testid="input-token-description"
                        className="w-full bg-black/60 border-2 border-white/10 text-white px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-pink-500/40 placeholder:text-white/10 resize-none transition-colors" />
                    </div>
                  </div>
                </div>
                <div className="border-t-2 border-white/5 pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Globe className="w-3 h-3 text-white/20" />
                    <span className="font-display text-[6px] text-white/20 tracking-[0.15em]">SOCIAL LINKS</span>
                    <span className="font-display text-[5px] text-white/10">(OPTIONAL)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-display text-[5px] text-white/15 tracking-wider">TWITTER</label>
                      <input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://x.com/..." data-testid="input-twitter"
                        className="w-full bg-black/60 border-2 border-white/10 text-white px-2 py-1.5 text-[9px] font-mono focus:outline-none focus:border-pink-500/40 placeholder:text-white/8 transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-display text-[5px] text-white/15 tracking-wider">TELEGRAM</label>
                      <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="https://t.me/..." data-testid="input-telegram"
                        className="w-full bg-black/60 border-2 border-white/10 text-white px-2 py-1.5 text-[9px] font-mono focus:outline-none focus:border-pink-500/40 placeholder:text-white/8 transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-display text-[5px] text-white/15 tracking-wider">WEBSITE</label>
                      <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." data-testid="input-website"
                        className="w-full bg-black/60 border-2 border-white/10 text-white px-2 py-1.5 text-[9px] font-mono focus:outline-none focus:border-pink-500/40 placeholder:text-white/8 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border-4 border-red-500/20 text-red-400 font-display text-[7px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" /><span>{error}</span>
                </div>
              )}
              <button onClick={() => { setError(null); setManualStep(2); }} disabled={!canProceedToStep2}
                className="w-full py-2.5 font-display text-[7px] border-4 border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-[0.15em]"
                style={{ boxShadow: '3px 3px 0px rgba(236,72,153,0.2)' }}>
                NEXT: CONFIGURE
              </button>
            </div>
          )}

          {manualStep === 2 && (
            <div className="space-y-3">
              <div className="border-4 border-foreground/10 bg-black/50 p-4 space-y-3" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-pink-400/60" />
                  <span className="font-display text-[7px] text-pink-400/60 tracking-[0.15em]">LAUNCH CONFIG</span>
                </div>
                <div className="border-4 border-pink-500/15 bg-pink-500/5 p-3 flex items-center gap-3">
                  {imagePreview ? (
                    <div className="w-8 h-8 border-2 border-white/10 overflow-hidden shrink-0">
                      <img src={imagePreview} alt="Token" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                    </div>
                  ) : <div className="w-8 h-8 border-2 border-pink-500/20 bg-pink-500/10 flex items-center justify-center"><Rocket className="w-4 h-4 text-pink-400/40" /></div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[8px] text-pink-400">${tokenSymbol || '???'}</div>
                    <div className="font-display text-[7px] text-white/30 truncate">{tokenName || 'Untitled'}</div>
                  </div>
                  <button onClick={() => setManualStep(1)} className="font-display text-[6px] text-white/20 hover:text-white/40 transition-colors border-2 border-white/10 px-2 py-0.5">EDIT</button>
                </div>
                {!wallet.connected ? (
                  <button onClick={connectWallet} data-testid="button-connect-cannon"
                    className="w-full flex items-center justify-center gap-2 p-3 border-4 border-yellow-500/30 bg-yellow-500/5 text-yellow-400 font-display text-[7px] hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all tracking-wider">
                    <Wallet className="w-4 h-4" /> CONNECT PHANTOM
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 border-4 border-green-500/20 bg-green-500/5">
                    <div className="w-2 h-2 bg-green-400" />
                    <span className="font-display text-[7px] text-green-400 tracking-wider">LINKED</span>
                    <span className="text-[8px] text-white/30 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                    {wallet.balance !== null && <span className="font-display text-[7px] text-yellow-400 ml-auto">{wallet.balance.toFixed(4)} SOL</span>}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="font-display text-[6px] text-white/20 tracking-wider">DEV BUY (SOL)</label>
                  <input value={devBuyAmount} onChange={e => { setDevBuyAmount(e.target.value); setError(null); }}
                    type="number" step="0.1" min="0" data-testid="input-dev-buy"
                    className="w-full bg-black/60 border-2 border-white/10 text-white px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-pink-500/40 transition-colors" />
                </div>
                <div className="border-4 border-foreground/10 bg-black/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-[6px] text-white/30 tracking-wider">DEPLOY FEE</span>
                    <span className="font-display text-[7px] text-white/60">{PUMP_PORTAL_FEE} SOL</span>
                  </div>
                  {parseFloat(devBuyAmount || "0") > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-[6px] text-white/30 tracking-wider">DEV BUY</span>
                      <span className="font-display text-[7px] text-white/60">{parseFloat(devBuyAmount || "0")} SOL</span>
                    </div>
                  )}
                  <div className="h-[2px] bg-foreground/10 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[7px] text-white/50 tracking-wider">TOTAL</span>
                    <span className="font-display text-[9px] text-pink-400" data-testid="text-total-cost">{totalCost.toFixed(4)} SOL</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setManualStep(1)} className="px-3 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:text-white/50 hover:border-white/15 transition-all tracking-wider">BACK</button>
                <button onClick={() => setManualStep(3)} disabled={!canProceedToStep3}
                  className="flex-1 py-2.5 font-display text-[7px] border-4 border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-[0.15em]"
                  style={{ boxShadow: '3px 3px 0px rgba(236,72,153,0.2)' }}>
                  NEXT: REVIEW
                </button>
              </div>
            </div>
          )}

          {manualStep === 3 && (
            <div className="space-y-3">
              <div className="border-4 border-pink-500/30 bg-black/60 p-4 space-y-3 cannon-loaded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 cannon-blink" />
                  <span className="font-display text-[7px] text-pink-400 tracking-[0.2em]">CANNON LOADED</span>
                </div>
                <div className="flex gap-3">
                  {imagePreview && (
                    <div className="shrink-0 w-14 h-14 border-4 border-white/10 overflow-hidden">
                      <img src={imagePreview} alt="Token" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="border-2 border-foreground/10 bg-black/40 p-2">
                      <div className="font-display text-[5px] text-white/20 tracking-wider mb-1">TARGET</div>
                      <div className="font-display text-[8px] text-white">{tokenName}</div>
                      <div className="font-display text-[7px] text-pink-400">${tokenSymbol}</div>
                    </div>
                    <div className="border-2 border-foreground/10 bg-black/40 p-2">
                      <div className="font-display text-[5px] text-white/20 tracking-wider mb-1">COST</div>
                      <div className="font-display text-[9px] text-pink-400">{totalCost.toFixed(4)} SOL</div>
                      <div className="font-display text-[5px] text-white/15">FEE {PUMP_PORTAL_FEE} + DEV {parseFloat(devBuyAmount || "0")}</div>
                    </div>
                  </div>
                </div>
                <div className="border-2 border-foreground/10 bg-black/40 p-2">
                  <div className="font-display text-[5px] text-white/20 tracking-wider mb-1">NARRATIVE</div>
                  <div className="text-[8px] text-white/50 leading-relaxed font-display">{description}</div>
                </div>
                {(twitter || telegram || website) && (
                  <div className="border-2 border-foreground/10 bg-black/40 p-2">
                    <div className="font-display text-[5px] text-white/20 tracking-wider mb-1">SOCIALS</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {twitter && <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-[7px] text-blue-400/60 hover:text-blue-300 font-display">{twitter.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\/?/, '')}</a>}
                      {telegram && <a href={telegram} target="_blank" rel="noopener noreferrer" className="text-[7px] text-blue-400/60 hover:text-blue-300 font-display">{telegram.replace(/^https?:\/\/(www\.)?t\.me\/?/, '')}</a>}
                      {website && <a href={website} target="_blank" rel="noopener noreferrer" className="text-[7px] text-blue-400/60 hover:text-blue-300 font-display flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{website.replace(/^https?:\/\/(www\.)?/, '')}</a>}
                    </div>
                  </div>
                )}
                <div className="border-2 border-foreground/10 bg-black/40 p-2">
                  <div className="font-display text-[5px] text-white/20 tracking-wider mb-1">DEPLOYER</div>
                  <div className="text-[8px] text-white/30 font-mono">{wallet.publicKey}</div>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border-4 border-red-500/20 text-red-400 font-display text-[7px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" /><span>{error}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setManualStep(2)} className="px-3 py-2.5 font-display text-[7px] border-4 border-white/10 text-white/30 hover:text-white/50 hover:border-white/15 transition-all tracking-wider">BACK</button>
                <button onClick={handleManualLaunch} disabled={launching || !wallet.connected} data-testid="button-launch-token"
                  className="flex-1 py-3 font-display text-[8px] disabled:opacity-30 flex items-center justify-center gap-2 border-4 border-red-500/50 text-red-400 transition-all relative overflow-hidden group tracking-[0.15em]"
                  style={{
                    background: launching ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.15)',
                    boxShadow: launching ? 'none' : '4px 4px 0px rgba(239,68,68,0.3)',
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {launching ? <><Loader2 className="w-4 h-4 animate-spin" /> FIRING...</> : <><Flame className="w-4 h-4" /> FIRE CANNON</>}
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
            className="w-full flex items-center justify-between px-3 py-2 border-4 border-foreground/10 bg-black/40 hover:bg-black/50 transition-colors">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-pink-400/40" />
              <span className="font-display text-[7px] text-white/40 tracking-[0.15em]">MISSION LOG</span>
              <span className="font-display text-[7px] text-pink-400/30">{launches.length}</span>
            </div>
            {showHistory ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
          </button>
          {showHistory && (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
              {launches.map(launch => (
                <div key={launch.id} className="p-3 border-4 border-foreground/5 bg-black/30 hover:border-pink-500/20 transition-colors space-y-2" data-testid={`launch-${launch.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-400/60" />
                      <span className="font-display text-[8px] text-pink-400" data-testid={`text-launch-symbol-${launch.id}`}>${launch.tokenSymbol}</span>
                      <span className="font-display text-[7px] text-white/20">{launch.tokenName}</span>
                    </div>
                    <span className={`font-display text-[6px] px-1.5 py-0.5 border-2 tracking-wider ${
                      launch.status === 'launched' ? 'border-green-500/30 text-green-400/80 bg-green-500/5' :
                      launch.status === 'pending' ? 'border-yellow-500/30 text-yellow-400/80 bg-yellow-500/5' :
                      launch.status === 'failed' ? 'border-red-500/30 text-red-400/80 bg-red-500/5' :
                      'border-white/10 text-white/20'
                    }`} data-testid={`text-launch-status-${launch.id}`}>{launch.status.toUpperCase()}</span>
                  </div>
                  <p className="font-display text-[7px] text-white/20 leading-relaxed">{launch.description.slice(0, 80)}{launch.description.length > 80 ? '...' : ''}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {launch.mintAddress && (
                      <div className="flex items-center gap-1">
                        <span className="font-display text-[6px] text-white/15">MINT:</span>
                        <span className="text-[7px] text-pink-400/50 font-mono">{launch.mintAddress.slice(0, 10)}...{launch.mintAddress.slice(-4)}</span>
                        <button onClick={() => copyToClipboard(launch.mintAddress!, launch.id)} className="p-0.5 text-white/15 hover:text-white/40" data-testid={`button-copy-mint-${launch.id}`}>
                          {copiedId === launch.id ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    )}
                    {launch.pumpUrl && (
                      <a href={launch.pumpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-display text-[6px] text-blue-400/50 hover:text-blue-300 tracking-wider" data-testid={`link-pump-${launch.id}`}>
                        VIEW <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {launch.txSignature && (
                      <a href={`https://solscan.io/tx/${launch.txSignature}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-display text-[6px] text-blue-400/50 hover:text-blue-300 tracking-wider" data-testid={`link-tx-${launch.id}`}>
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
