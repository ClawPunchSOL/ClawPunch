import { useState, useEffect, useRef } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, refreshBalance } from "@/lib/solanaWallet";
import { Rocket, Loader2, Wallet, ExternalLink, AlertTriangle, Sparkles, Flame, Copy, Check, ChevronDown, ChevronUp, ImagePlus, Globe, X, Zap, Brain, TrendingUp, ArrowRight, RotateCcw } from "lucide-react";

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
  imagePrompt?: string;
  trendRationale?: string;
}

const PUMP_PORTAL_FEE = 0.02;

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

  const [aiPhase, setAiPhase] = useState<"idle" | "scanning" | "analyzing" | "building" | "ready" | "config">("idle");
  const [aiLog, setAiLog] = useState<string[]>([]);
  const [aiConcept, setAiConcept] = useState<AIConcept | null>(null);
  const [aiDevBuy, setAiDevBuy] = useState("0");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/token-launches")
      .then(r => r.json())
      .then(setLaunches)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiLog]);

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

  const addLog = (msg: string) => {
    setAiLog(prev => [...prev, msg]);
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runAiGenerate = async () => {
    setAiPhase("scanning");
    setAiLog([]);
    setAiConcept(null);
    setError(null);

    addLog("▸ INITIALIZING TREND SCANNER...");
    await delay(400);
    addLog("▸ Connecting to CoinGecko market feeds...");
    await delay(300);
    addLog("▸ Pulling trending coins, top volume, category data...");

    setAiPhase("analyzing");
    await delay(500);
    addLog("▸ Market data received. Feeding to Claude...");
    await delay(200);
    addLog("▸ Claude is analyzing current narratives...");
    addLog("▸ Scanning for alpha opportunities...");

    try {
      const res = await fetch("/api/token-launches/generate", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const data: AIConcept = await res.json();
      
      setAiPhase("building");
      addLog("▸ Trend identified. Building concept...");
      await delay(400);

      if (data.trendRationale) {
        addLog(`▸ SIGNAL: ${data.trendRationale}`);
        await delay(300);
      }

      addLog(`▸ Token: ${data.tokenName} ($${data.tokenSymbol})`);
      await delay(200);
      addLog(`▸ "${data.description}"`);
      await delay(200);

      if (data.twitter) addLog(`▸ Twitter: ${data.twitter}`);
      if (data.telegram) addLog(`▸ Telegram: ${data.telegram}`);
      if (data.website) addLog(`▸ Website: ${data.website}`);
      await delay(200);

      if (data.imagePrompt) {
        addLog(`▸ Image concept: ${data.imagePrompt.slice(0, 100)}...`);
        await delay(200);
      }

      addLog("");
      addLog("▸ ✓ CONCEPT READY — Review below");

      setAiConcept(data);
      setAiPhase("ready");
    } catch (err: any) {
      addLog(`▸ ✗ ERROR: ${err.message}`);
      setAiPhase("idle");
      setError(err.message);
    }
  };

  const acceptAiConcept = () => {
    if (!aiConcept) return;
    setAiPhase("config");
  };

  const aiTotalCost = PUMP_PORTAL_FEE + parseFloat(aiDevBuy || "0");

  const handleAiLaunch = async () => {
    if (!aiConcept || !wallet.connected) return;
    setLaunching(true);
    setError(null);

    try {
      const devBuy = parseFloat(aiDevBuy || "0");
      const tw = aiConcept.twitter?.startsWith("http") ? aiConcept.twitter : aiConcept.twitter ? `https://x.com/${aiConcept.twitter.replace(/^@/, "")}` : null;
      const tg = aiConcept.telegram?.startsWith("http") ? aiConcept.telegram : aiConcept.telegram ? `https://t.me/${aiConcept.telegram.replace(/^@/, "")}` : null;

      const res = await fetch("/api/token-launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenName: aiConcept.tokenName,
          tokenSymbol: aiConcept.tokenSymbol.toUpperCase(),
          description: aiConcept.description,
          devBuyAmount: devBuy,
          walletAddress: wallet.publicKey,
          imageUrl: null,
          twitter: tw,
          telegram: tg,
          website: aiConcept.website || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Launch failed");
        return;
      }

      const launch = await res.json();
      if (launch.launchUrl) window.open(launch.launchUrl, '_blank');
      setLaunches(prev => [launch, ...prev]);
      onSendChat?.(`AI-generated token launched: $${aiConcept.tokenSymbol} — ${aiConcept.tokenName}`);
      setAiPhase("idle");
      setAiConcept(null);
      setAiLog([]);
      setAiDevBuy("0");
      setMode("select");
      refreshBalance();
    } catch (err: any) {
      setError(err.message || "Launch failed");
    } finally {
      setLaunching(false);
    }
  };

  const totalCost = PUMP_PORTAL_FEE + parseFloat(devBuyAmount || "0");
  const canProceedToStep2 = tokenName.trim() && tokenSymbol.trim() && description.trim();
  const canProceedToStep3 = canProceedToStep2 && wallet.connected;

  const handleManualLaunch = async () => {
    if (!tokenName.trim() || !tokenSymbol.trim() || !description.trim()) {
      setError("Fill in all fields");
      return;
    }
    if (!wallet.connected) {
      setError("Connect wallet first");
      return;
    }
    setLaunching(true);
    setError(null);

    try {
      const devBuy = parseFloat(devBuyAmount || "0");
      const res = await fetch("/api/token-launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenName: tokenName.trim(),
          tokenSymbol: tokenSymbol.trim().toUpperCase(),
          description: description.trim(),
          devBuyAmount: devBuy,
          walletAddress: wallet.publicKey,
          imageUrl: imagePreview || null,
          twitter: twitter.trim() || null,
          telegram: telegram.trim() || null,
          website: website.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Launch failed");
        return;
      }

      const launch = await res.json();
      if (launch.launchUrl) window.open(launch.launchUrl, '_blank');
      setLaunches(prev => [launch, ...prev]);
      onSendChat?.(`Token launched: ${tokenSymbol} — ${tokenName}.`);
      setTokenName(""); setTokenSymbol(""); setDescription(""); setDevBuyAmount("0");
      setImagePreview(null); setTwitter(""); setTelegram(""); setWebsite("");
      setManualStep(1);
      setMode("select");
      refreshBalance();
    } catch (err: any) {
      if (err.message?.includes("User rejected")) {
        setError("Transaction rejected in wallet");
      } else {
        setError(err.message || "Launch failed");
      }
    } finally {
      setLaunching(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="relative">
          <Rocket className="w-8 h-8 text-pink-400 animate-bounce" />
          <div className="absolute -inset-2 border border-pink-500/20 animate-ping" />
        </div>
        <span className="text-[10px] text-pink-400/60 font-display tracking-widest">LOADING CANNON...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-pink-500/30 bg-pink-500/10">
            <Rocket className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <div className="font-display text-[10px] text-white tracking-wider">TOKEN LAUNCHER</div>
            <div className="text-[8px] text-pink-400/60 font-display">DEPLOY ON SOLANA</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode !== "select" && (
            <button
              onClick={() => { setMode("select"); setAiPhase("idle"); setAiLog([]); setAiConcept(null); setManualStep(1); setError(null); }}
              className="text-[8px] text-white/30 font-display hover:text-white/50 transition-colors border border-white/10 px-2 py-1"
            >
              ← MODES
            </button>
          )}
          {launches.length > 0 && (
            <div className="font-display text-[9px] text-pink-400/70 border border-pink-500/20 px-2 py-1 bg-pink-500/5">
              {launches.length} LAUNCHED
            </div>
          )}
        </div>
      </div>

      {mode === "select" && (
        <div className="space-y-3">
          <button
            onClick={() => setMode("ai")}
            data-testid="button-ai-mode"
            className="w-full border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-pink-500/10 p-4 hover:border-yellow-500/50 transition-all group text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 border border-yellow-500/40 bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                <Brain className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="font-display text-[11px] text-yellow-400 tracking-wider flex items-center gap-2">
                  AI LAUNCH
                  <span className="text-[7px] text-yellow-500/60 border border-yellow-500/30 px-1.5 py-0.5 bg-yellow-500/5">CLAUDE</span>
                </div>
                <div className="text-[9px] text-white/40 mt-0.5">Claude scans live trends, builds the concept, picks the narrative</div>
              </div>
              <ArrowRight className="w-4 h-4 text-yellow-400/40 group-hover:text-yellow-400/70 transition-colors" />
            </div>
            <div className="flex items-center gap-3 text-[8px] text-white/20 font-display">
              <span className="flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> TREND SCAN</span>
              <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> AUTO-CONCEPT</span>
              <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> SOCIAL LINKS</span>
            </div>
          </button>

          <button
            onClick={() => setMode("manual")}
            data-testid="button-manual-mode"
            className="w-full border border-white/10 bg-black/30 p-4 hover:border-white/20 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-white/15 bg-black/40 flex items-center justify-center group-hover:border-white/25 transition-colors">
                <Rocket className="w-5 h-5 text-pink-400/60" />
              </div>
              <div className="flex-1">
                <div className="font-display text-[11px] text-white/70 tracking-wider">MANUAL LAUNCH</div>
                <div className="text-[9px] text-white/30 mt-0.5">Define your own token — name, symbol, description, image, socials</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
          </button>
        </div>
      )}

      {mode === "ai" && (
        <div className="space-y-3">
          {aiPhase === "idle" && (
            <div className="border border-yellow-500/20 bg-black/40 p-5 text-center space-y-4">
              <div className="w-14 h-14 mx-auto border border-yellow-500/30 bg-yellow-500/5 flex items-center justify-center">
                <Brain className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <div className="font-display text-[11px] text-yellow-400 tracking-wider mb-1">AI TREND LAUNCHER</div>
                <p className="text-[9px] text-white/40 leading-relaxed max-w-[260px] mx-auto">
                  Claude will scan live crypto markets, identify the hottest narrative, and build a complete token concept — name, ticker, description, socials — all from real-time data.
                </p>
              </div>
              <button
                onClick={runAiGenerate}
                data-testid="button-ai-scan"
                className="mx-auto flex items-center gap-2 px-6 py-3 border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 font-display text-[10px] hover:bg-yellow-500/20 transition-all"
              >
                <Zap className="w-4 h-4" /> SCAN TRENDS & GENERATE
              </button>
            </div>
          )}

          {(aiPhase === "scanning" || aiPhase === "analyzing" || aiPhase === "building") && (
            <div className="border border-yellow-500/20 bg-black/60 overflow-hidden">
              <div className="px-3 py-2 border-b border-yellow-500/10 flex items-center gap-2 bg-yellow-500/5">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="font-display text-[8px] text-yellow-400/80 tracking-widest">
                  {aiPhase === "scanning" && "SCANNING MARKETS..."}
                  {aiPhase === "analyzing" && "CLAUDE ANALYZING..."}
                  {aiPhase === "building" && "BUILDING CONCEPT..."}
                </span>
                <Loader2 className="w-3 h-3 text-yellow-400/50 animate-spin ml-auto" />
              </div>
              <div className="p-3 max-h-[280px] overflow-y-auto font-mono text-[10px] leading-relaxed custom-scrollbar space-y-0.5">
                {aiLog.map((line, i) => (
                  <div key={i} className={`${
                    line.startsWith("▸ SIGNAL:") ? "text-yellow-400/90" :
                    line.startsWith("▸ Token:") ? "text-pink-400/90" :
                    line.startsWith("▸ ✓") ? "text-green-400/90" :
                    line.startsWith("▸ ✗") ? "text-red-400/90" :
                    line.startsWith("▸ \"") ? "text-white/50 italic" :
                    "text-white/30"
                  }`}>
                    {line}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {aiPhase === "ready" && aiConcept && (
            <div className="space-y-3">
              <div className="border border-yellow-500/25 bg-black/40 overflow-hidden">
                <div className="px-3 py-2 border-b border-yellow-500/10 bg-yellow-500/5 flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="font-display text-[8px] text-green-400/80 tracking-widest">CONCEPT GENERATED</span>
                </div>

                <div className="p-4 space-y-3">
                  {aiConcept.trendRationale && (
                    <div className="border border-yellow-500/15 bg-yellow-500/5 px-3 py-2 flex items-start gap-2">
                      <TrendingUp className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[7px] text-yellow-400/80 font-display">TREND SIGNAL</span>
                        <p className="text-[9px] text-white/50 mt-0.5 leading-relaxed">{aiConcept.trendRationale}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 border border-pink-500/15 bg-pink-500/5 p-3">
                    <div className="w-12 h-12 border border-pink-500/20 bg-pink-500/10 flex items-center justify-center shrink-0">
                      <Rocket className="w-6 h-6 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm text-white" data-testid="text-ai-token-name">{aiConcept.tokenName}</div>
                      <div className="font-display text-[11px] text-pink-400" data-testid="text-ai-token-symbol">${aiConcept.tokenSymbol}</div>
                    </div>
                  </div>

                  <div className="border border-white/5 bg-black/30 p-3">
                    <div className="text-[8px] text-white/30 font-display mb-1">DESCRIPTION</div>
                    <p className="text-[10px] text-white/60 leading-relaxed">{aiConcept.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {aiConcept.twitter && (
                      <div className="border border-white/5 bg-black/30 p-2">
                        <div className="text-[7px] text-white/20 font-display mb-1">𝕏 TWITTER</div>
                        <div className="text-[9px] text-blue-400/70 truncate">{aiConcept.twitter}</div>
                      </div>
                    )}
                    {aiConcept.telegram && (
                      <div className="border border-white/5 bg-black/30 p-2">
                        <div className="text-[7px] text-white/20 font-display mb-1">✈️ TELEGRAM</div>
                        <div className="text-[9px] text-blue-400/70 truncate">{aiConcept.telegram}</div>
                      </div>
                    )}
                    {aiConcept.website && (
                      <div className="border border-white/5 bg-black/30 p-2">
                        <div className="text-[7px] text-white/20 font-display mb-1">🌐 WEBSITE</div>
                        <div className="text-[9px] text-blue-400/70 truncate">{aiConcept.website}</div>
                      </div>
                    )}
                  </div>

                  {aiConcept.imagePrompt && (
                    <div className="border border-purple-500/15 bg-purple-500/5 p-2.5">
                      <div className="text-[7px] text-purple-400/80 font-display mb-1">IMAGE CONCEPT</div>
                      <p className="text-[9px] text-white/40 leading-relaxed italic">{aiConcept.imagePrompt}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setAiPhase("idle"); setAiConcept(null); setAiLog([]); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 font-display text-[9px] border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
                >
                  <RotateCcw className="w-3 h-3" /> REGENERATE
                </button>
                <button
                  onClick={acceptAiConcept}
                  data-testid="button-ai-accept"
                  className="flex-1 py-2.5 font-display text-[10px] border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" /> ACCEPT & CONFIGURE LAUNCH
                </button>
              </div>
            </div>
          )}

          {aiPhase === "config" && aiConcept && (
            <div className="space-y-3">
              <div className="border border-yellow-500/15 bg-black/30 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="font-display text-[9px] text-yellow-400/80 tracking-wider">AI CONCEPT — LAUNCH CONFIG</span>
                </div>

                <div className="border border-pink-500/15 bg-pink-500/5 p-3 flex items-center gap-3">
                  <Rocket className="w-5 h-5 text-pink-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[11px] text-white">${aiConcept.tokenSymbol}</div>
                    <div className="text-[10px] text-white/50 truncate">{aiConcept.tokenName}</div>
                  </div>
                  <button
                    onClick={() => setAiPhase("ready")}
                    className="text-[8px] text-yellow-400/60 font-display hover:text-yellow-400 transition-colors border border-yellow-500/20 px-2 py-0.5"
                  >
                    REVIEW
                  </button>
                </div>

                {!wallet.connected ? (
                  <button
                    onClick={connectWallet}
                    data-testid="button-connect-ai-cannon"
                    className="w-full flex items-center justify-center gap-2 p-3 border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-[10px] font-display hover:bg-yellow-500/10 transition-colors"
                  >
                    <Wallet className="w-4 h-4" /> CONNECT PHANTOM WALLET
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 border border-green-500/20 bg-green-500/5">
                    <Wallet className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[9px] text-green-400 font-display">CONNECTED</span>
                    <span className="text-[9px] text-white/50 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                    {wallet.balance !== null && (
                      <span className="text-[9px] text-yellow-400 font-display ml-auto">{wallet.balance.toFixed(4)} SOL</span>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[8px] text-white/30 font-display">DEV BUY AMOUNT (SOL)</label>
                  <div className="text-[8px] text-white/20 mb-1">Optional initial buy of your own token at launch</div>
                  <input
                    value={aiDevBuy}
                    onChange={e => setAiDevBuy(e.target.value)}
                    type="number"
                    step="0.1"
                    min="0"
                    data-testid="input-ai-dev-buy"
                    className="w-full bg-black/50 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors"
                  />
                </div>

                <div className="border border-white/5 bg-black/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-white/40">Deployment Fee</span>
                    <span className="text-[10px] text-white font-display">{PUMP_PORTAL_FEE} SOL</span>
                  </div>
                  {parseFloat(aiDevBuy || "0") > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] text-white/40">Dev Buy</span>
                      <span className="text-[10px] text-white font-display">{parseFloat(aiDevBuy || "0")} SOL</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white/60 font-display">TOTAL COST</span>
                    <span className="text-sm font-display text-yellow-400">{aiTotalCost.toFixed(4)} SOL</span>
                  </div>
                </div>

                <div className="text-[8px] text-white/15 text-center leading-relaxed">
                  Token deploys on Solana via pump.fun. 100% yours — no custody, no cuts.
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/20 text-red-400 text-[10px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setAiPhase("ready")}
                  className="px-4 py-2.5 font-display text-[10px] border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
                >
                  ← BACK
                </button>
                <button
                  onClick={handleAiLaunch}
                  disabled={launching || !wallet.connected}
                  data-testid="button-ai-launch"
                  className="flex-1 py-3 font-display text-[10px] disabled:opacity-30 flex items-center justify-center gap-2 border border-yellow-500/50 text-yellow-400 transition-all relative overflow-hidden group"
                  style={{ background: launching ? 'rgba(234,179,8,0.05)' : 'rgba(234,179,8,0.15)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {launching ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> DEPLOYING...</>
                    ) : (
                      <><Flame className="w-4 h-4" /> FIRE AI CANNON</>
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
                <div className={`flex items-center gap-1.5 px-2 py-1.5 flex-1 border transition-all ${
                  manualStep === s
                    ? 'border-pink-500/40 bg-pink-500/10 text-pink-400'
                    : manualStep > s
                    ? 'border-green-500/30 bg-green-500/5 text-green-400/70'
                    : 'border-white/5 bg-black/20 text-white/20'
                }`}>
                  <div className={`w-4 h-4 flex items-center justify-center font-display text-[8px] border ${
                    manualStep === s ? 'border-pink-400 text-pink-400' : manualStep > s ? 'border-green-400/50 text-green-400' : 'border-white/10 text-white/20'
                  }`}>
                    {manualStep > s ? '✓' : s}
                  </div>
                  <span className="font-display text-[7px] tracking-wider hidden sm:inline">
                    {s === 1 ? 'CONCEPT' : s === 2 ? 'CONFIG' : 'LAUNCH'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {manualStep === 1 && (
            <div className="space-y-3">
              <div className="border border-white/10 bg-black/30 p-4 space-y-3">
                <span className="font-display text-[9px] text-white/60 tracking-wider">DEFINE YOUR TOKEN</span>

                <div className="flex gap-3">
                  <div className="shrink-0">
                    <label className="text-[8px] text-white/30 font-display block mb-1">IMAGE</label>
                    <div className="relative w-20 h-20 border border-white/10 bg-black/50 flex items-center justify-center cursor-pointer hover:border-pink-500/30 transition-colors overflow-hidden group">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Token" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.preventDefault(); setImagePreview(null); }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5 text-white/60" />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 p-2">
                          <ImagePlus className="w-5 h-5 text-white/20" />
                          <span className="text-[7px] text-white/20 font-display">UPLOAD</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            data-testid="input-token-image"
                          />
                        </label>
                      )}
                    </div>
                    <span className="text-[7px] text-white/15 mt-0.5 block">Max 5MB</span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[8px] text-white/30 font-display">TOKEN NAME</label>
                        <input
                          value={tokenName}
                          onChange={e => { setTokenName(e.target.value); setError(null); }}
                          placeholder="e.g. Banana Coin"
                          data-testid="input-token-name"
                          className="w-full bg-black/50 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500/50 placeholder:text-white/15 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] text-white/30 font-display">SYMBOL</label>
                        <input
                          value={tokenSymbol}
                          onChange={e => { setTokenSymbol(e.target.value.toUpperCase()); setError(null); }}
                          placeholder="$BNNA"
                          maxLength={10}
                          data-testid="input-token-symbol"
                          className="w-full bg-black/50 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500/50 placeholder:text-white/15 font-display transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-white/30 font-display">DESCRIPTION</label>
                      <textarea
                        value={description}
                        onChange={e => { setDescription(e.target.value); setError(null); }}
                        placeholder="What's this token about?"
                        rows={2}
                        data-testid="input-token-description"
                        className="w-full bg-black/50 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500/50 placeholder:text-white/15 resize-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Globe className="w-3 h-3 text-white/25" />
                    <span className="font-display text-[8px] text-white/30 tracking-wider">SOCIAL LINKS</span>
                    <span className="text-[7px] text-white/15">(optional)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[7px] text-white/20 font-display flex items-center gap-1">
                        <span>𝕏</span> TWITTER
                      </label>
                      <input
                        value={twitter}
                        onChange={e => setTwitter(e.target.value)}
                        placeholder="https://x.com/..."
                        data-testid="input-twitter"
                        className="w-full bg-black/50 border border-white/10 text-white px-2 py-1.5 text-[11px] focus:outline-none focus:border-pink-500/50 placeholder:text-white/10 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] text-white/20 font-display flex items-center gap-1">
                        <span>✈️</span> TELEGRAM
                      </label>
                      <input
                        value={telegram}
                        onChange={e => setTelegram(e.target.value)}
                        placeholder="https://t.me/..."
                        data-testid="input-telegram"
                        className="w-full bg-black/50 border border-white/10 text-white px-2 py-1.5 text-[11px] focus:outline-none focus:border-pink-500/50 placeholder:text-white/10 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] text-white/20 font-display flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> WEBSITE
                      </label>
                      <input
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="https://..."
                        data-testid="input-website"
                        className="w-full bg-black/50 border border-white/10 text-white px-2 py-1.5 text-[11px] focus:outline-none focus:border-pink-500/50 placeholder:text-white/10 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/20 text-red-400 text-[10px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => { setError(null); setManualStep(2); }}
                disabled={!canProceedToStep2}
                className="w-full py-2.5 font-display text-[10px] border border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                NEXT: CONFIGURE LAUNCH →
              </button>
            </div>
          )}

          {manualStep === 2 && (
            <div className="space-y-3">
              <div className="border border-white/10 bg-black/30 p-4 space-y-3">
                <span className="font-display text-[9px] text-white/60 tracking-wider">LAUNCH CONFIGURATION</span>

                <div className="border border-pink-500/15 bg-pink-500/5 p-3 flex items-center gap-3">
                  {imagePreview ? (
                    <div className="w-8 h-8 border border-white/10 overflow-hidden shrink-0">
                      <img src={imagePreview} alt="Token" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-xl">🍌</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[11px] text-white">${tokenSymbol || '???'}</div>
                    <div className="text-[10px] text-white/50 truncate">{tokenName || 'Untitled Token'}</div>
                  </div>
                  <button
                    onClick={() => setManualStep(1)}
                    className="text-[8px] text-pink-400/60 font-display hover:text-pink-400 transition-colors border border-pink-500/20 px-2 py-0.5"
                  >
                    EDIT
                  </button>
                </div>

                {!wallet.connected ? (
                  <button
                    onClick={connectWallet}
                    data-testid="button-connect-cannon"
                    className="w-full flex items-center justify-center gap-2 p-3 border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-[10px] font-display hover:bg-yellow-500/10 transition-colors"
                  >
                    <Wallet className="w-4 h-4" /> CONNECT PHANTOM WALLET
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 border border-green-500/20 bg-green-500/5">
                    <Wallet className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[9px] text-green-400 font-display">CONNECTED</span>
                    <span className="text-[9px] text-white/50 font-mono">{wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}</span>
                    {wallet.balance !== null && (
                      <span className="text-[9px] text-yellow-400 font-display ml-auto">{wallet.balance.toFixed(4)} SOL</span>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[8px] text-white/30 font-display">DEV BUY AMOUNT (SOL)</label>
                  <div className="text-[8px] text-white/20 mb-1">Optional initial buy of your own token at launch</div>
                  <input
                    value={devBuyAmount}
                    onChange={e => { setDevBuyAmount(e.target.value); setError(null); }}
                    type="number"
                    step="0.1"
                    min="0"
                    data-testid="input-dev-buy"
                    className="w-full bg-black/50 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
                  />
                </div>

                <div className="border border-white/5 bg-black/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-white/40">Deployment Fee</span>
                    <span className="text-[10px] text-white font-display">{PUMP_PORTAL_FEE} SOL</span>
                  </div>
                  {parseFloat(devBuyAmount || "0") > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] text-white/40">Dev Buy</span>
                      <span className="text-[10px] text-white font-display">{parseFloat(devBuyAmount || "0")} SOL</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white/60 font-display">TOTAL COST</span>
                    <span className="text-sm font-display text-pink-400" data-testid="text-total-cost">{totalCost.toFixed(4)} SOL</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setManualStep(1)}
                  className="px-4 py-2.5 font-display text-[10px] border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
                >
                  ← BACK
                </button>
                <button
                  onClick={() => setManualStep(3)}
                  disabled={!canProceedToStep3}
                  className="flex-1 py-2.5 font-display text-[10px] border border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  NEXT: REVIEW & LAUNCH →
                </button>
              </div>
            </div>
          )}

          {manualStep === 3 && (
            <div className="space-y-3">
              <div className="border border-pink-500/20 bg-pink-500/5 p-4 space-y-3">
                <span className="font-display text-[9px] text-pink-400/80 tracking-widest">LAUNCH REVIEW</span>

                <div className="flex gap-3">
                  {imagePreview && (
                    <div className="shrink-0 w-16 h-16 border border-white/10 overflow-hidden">
                      <img src={imagePreview} alt="Token" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="border border-white/5 bg-black/30 p-3">
                      <div className="text-[8px] text-white/30 font-display mb-1">TOKEN</div>
                      <div className="font-display text-[11px] text-white">{tokenName}</div>
                      <div className="text-[10px] text-pink-400 font-display">${tokenSymbol}</div>
                    </div>
                    <div className="border border-white/5 bg-black/30 p-3">
                      <div className="text-[8px] text-white/30 font-display mb-1">COST</div>
                      <div className="font-display text-sm text-pink-400">{totalCost.toFixed(4)} SOL</div>
                      <div className="text-[8px] text-white/30">Fee: {PUMP_PORTAL_FEE} + Dev: {parseFloat(devBuyAmount || "0")}</div>
                    </div>
                  </div>
                </div>

                <div className="border border-white/5 bg-black/30 p-3">
                  <div className="text-[8px] text-white/30 font-display mb-1">DESCRIPTION</div>
                  <div className="text-[10px] text-white/70 leading-relaxed">{description}</div>
                </div>

                {(twitter || telegram || website) && (
                  <div className="border border-white/5 bg-black/30 p-3">
                    <div className="text-[8px] text-white/30 font-display mb-1">SOCIAL LINKS</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {twitter && (
                        <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:underline flex items-center gap-1">
                          <span>𝕏</span> {twitter.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\/?/, '')}
                        </a>
                      )}
                      {telegram && (
                        <a href={telegram} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:underline flex items-center gap-1">
                          <span>✈️</span> {telegram.replace(/^https?:\/\/(www\.)?t\.me\/?/, '')}
                        </a>
                      )}
                      {website && (
                        <a href={website} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:underline flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> {website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="border border-white/5 bg-black/30 p-3">
                  <div className="text-[8px] text-white/30 font-display mb-1">DEPLOYER WALLET</div>
                  <div className="text-[10px] text-white/50 font-mono">{wallet.publicKey}</div>
                </div>

                <div className="text-[8px] text-white/20 text-center leading-relaxed">
                  Token deploys on Solana via pump.fun. 100% yours — no custody, no cuts.
                  Your wallet signs the transaction directly.
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/20 text-red-400 text-[10px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setManualStep(2)}
                  className="px-4 py-2.5 font-display text-[10px] border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
                >
                  ← BACK
                </button>
                <button
                  onClick={handleManualLaunch}
                  disabled={launching || !wallet.connected}
                  data-testid="button-launch-token"
                  className="flex-1 py-3 font-display text-[10px] disabled:opacity-30 flex items-center justify-center gap-2 border border-pink-500/50 text-pink-400 transition-all relative overflow-hidden group"
                  style={{ background: launching ? 'rgba(236,72,153,0.05)' : 'rgba(236,72,153,0.15)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {launching ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> DEPLOYING TOKEN...</>
                    ) : (
                      <><Flame className="w-4 h-4" /> FIRE BANANA CANNON</>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {launches.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-3 py-2 border border-white/10 bg-black/20 hover:bg-black/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Rocket className="w-3 h-3 text-pink-400/60" />
              <span className="font-display text-[9px] text-white/50 tracking-wider">LAUNCH HISTORY</span>
              <span className="text-[8px] text-pink-400/40 font-display">{launches.length}</span>
            </div>
            {showHistory ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
          </button>

          {showHistory && (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
              {launches.map(launch => (
                <div
                  key={launch.id}
                  className="p-3 border border-white/5 bg-black/20 hover:border-pink-500/20 transition-colors space-y-2"
                  data-testid={`launch-${launch.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[10px] text-white" data-testid={`text-launch-symbol-${launch.id}`}>
                        ${launch.tokenSymbol}
                      </span>
                      <span className="text-[9px] text-white/30">{launch.tokenName}</span>
                    </div>
                    <span className={`text-[8px] font-display px-1.5 py-0.5 border ${
                      launch.status === 'launched' ? 'border-green-500/30 text-green-400/80 bg-green-500/5' :
                      launch.status === 'pending' ? 'border-yellow-500/30 text-yellow-400/80 bg-yellow-500/5' :
                      launch.status === 'failed' ? 'border-red-500/30 text-red-400/80 bg-red-500/5' :
                      'border-white/10 text-white/30'
                    }`} data-testid={`text-launch-status-${launch.id}`}>
                      {launch.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[9px] text-white/30 leading-relaxed">{launch.description.slice(0, 80)}{launch.description.length > 80 ? '...' : ''}</p>

                  <div className="flex items-center gap-3 flex-wrap">
                    {launch.mintAddress && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-white/20">MINT:</span>
                        <span className="text-[8px] text-pink-400/70 font-mono">{launch.mintAddress.slice(0, 10)}...{launch.mintAddress.slice(-4)}</span>
                        <button
                          onClick={() => copyToClipboard(launch.mintAddress!, launch.id)}
                          className="p-0.5 text-white/20 hover:text-white/50"
                          data-testid={`button-copy-mint-${launch.id}`}
                        >
                          {copiedId === launch.id ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    )}
                    {launch.pumpUrl && (
                      <a href={launch.pumpUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[8px] text-blue-400/70 hover:text-blue-300"
                        data-testid={`link-pump-${launch.id}`}
                      >
                        View Token <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {launch.txSignature && (
                      <a href={`https://solscan.io/tx/${launch.txSignature}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[8px] text-blue-400/70 hover:text-blue-300"
                        data-testid={`link-tx-${launch.id}`}
                      >
                        Solscan <ExternalLink className="w-2.5 h-2.5" />
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
