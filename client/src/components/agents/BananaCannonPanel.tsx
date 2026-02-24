import { useState, useEffect } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, sendSolTransfer, refreshBalance } from "@/lib/solanaWallet";
import { Rocket, Loader2, Wallet, ExternalLink, AlertTriangle, Sparkles, Flame, Copy, Check } from "lucide-react";

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
  createdAt: string;
}

const PUMP_PORTAL_FEE = 0.02;

export default function BananaCannonPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const wallet = useWalletState();
  const [launches, setLaunches] = useState<TokenLaunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [devBuyAmount, setDevBuyAmount] = useState("0");
  const [launching, setLaunching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/token-launches")
      .then(r => r.json())
      .then(setLaunches)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/token-launches/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setTokenName(data.tokenName);
        setTokenSymbol(data.tokenSymbol);
        setDescription(data.description);
        onSendChat(`AI generated token concept: ${data.tokenSymbol} — ${data.tokenName}`);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to generate concept");
      }
    } catch {
      setError("Failed to generate concept");
    } finally {
      setGenerating(false);
    }
  };

  const totalCost = PUMP_PORTAL_FEE + parseFloat(devBuyAmount || "0");

  const handleLaunch = async () => {
    if (!tokenName.trim() || !tokenSymbol.trim() || !description.trim()) {
      setError("Fill in all fields");
      return;
    }
    if (!wallet.connected || !wallet.publicKey) {
      setError("Connect your Phantom wallet first");
      return;
    }
    if (wallet.balance !== null && totalCost > wallet.balance) {
      setError(`Insufficient balance. You have ${wallet.balance.toFixed(4)} SOL, need ${totalCost.toFixed(4)} SOL`);
      return;
    }

    setError(null);
    setLaunching(true);

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
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Launch failed");
        return;
      }

      const launch = await res.json();

      if (launch.pumpPortalUrl) {
        window.open(launch.pumpPortalUrl, '_blank');
      }

      setLaunches(prev => [launch, ...prev]);
      onSendChat(`Token launched: ${tokenSymbol} — ${tokenName}. ${launch.mintAddress ? `Mint: ${launch.mintAddress}` : 'Finalizing deployment...'}`);
      setTokenName("");
      setTokenSymbol("");
      setDescription("");
      setDevBuyAmount("0");
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

  const statusBadge = (status: string) => {
    switch (status) {
      case "launched": return "border-green-500/40 text-green-400 bg-green-500/10";
      case "pending": return "border-yellow-500/40 text-yellow-400 bg-yellow-500/10";
      case "failed": return "border-red-500/40 text-red-400 bg-red-500/10";
      default: return "border-foreground/20 text-muted-foreground bg-black/40";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="text-2xl animate-bounce">🔫</div>
        <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
        <span className="text-[10px] text-pink-400 font-display drop-shadow-[2px_2px_0px_#000] tracking-widest">LOADING CANNON...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-2 border-4 border-pink-500/40 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔫</span>
          <Rocket className="w-4 h-4 text-pink-400" />
          <span className="font-display text-[11px] text-pink-400 drop-shadow-[2px_2px_0px_#000]">TOKEN LAUNCHER</span>
          <span className="text-[8px] text-muted-foreground/60 font-mono border border-foreground/10 px-1">Pump Portal</span>
        </div>
        <span className="text-[10px] text-pink-400 font-display border-2 border-pink-500/30 px-1.5 bg-pink-500/10">{launches.length} LAUNCHED</span>
      </div>

      {wallet.connected && wallet.publicKey ? (
        <div className="flex items-center gap-2 p-2 border-4 border-pink-500/30 bg-pink-500/10 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
          <span className="text-sm">🐒</span>
          <Wallet className="w-3 h-3 text-pink-400" />
          <span className="text-[9px] text-pink-400 font-display">DEPLOYER:</span>
          <span className="text-[9px] text-white font-mono">{wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-4)}</span>
          {wallet.balance !== null && (
            <span className="text-[9px] text-yellow-400 font-display ml-auto drop-shadow-[1px_1px_0px_#000]">{wallet.balance.toFixed(4)} SOL</span>
          )}
          <div className="w-2 h-2 bg-pink-400 animate-pulse shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
        </div>
      ) : (
        <button
          onClick={connectWallet}
          data-testid="button-connect-cannon"
          className="w-full flex items-center justify-center gap-2 p-2.5 border-4 border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px] font-display hover:bg-yellow-500/20 transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
        >
          <Wallet className="w-3 h-3" /> CONNECT PHANTOM TO LAUNCH
        </button>
      )}

      <div className="p-3 border-4 border-pink-500/30 bg-black/60 backdrop-blur-sm space-y-3 shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs">🍌</span>
            <span className="font-display text-[9px] text-pink-400 drop-shadow-[1px_1px_0px_#000]">CREATE TOKEN</span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            data-testid="button-ai-generate"
            className="flex items-center gap-1 px-2 py-1 border-4 border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-[9px] font-display hover:bg-yellow-500/20 transition-colors disabled:opacity-50 shadow-[2px_2px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI GENERATE
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={tokenName}
            onChange={e => { setTokenName(e.target.value); setError(null); }}
            placeholder="Token Name"
            data-testid="input-token-name"
            className="flex-1 bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500 placeholder:text-muted-foreground/50 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
          />
          <input
            value={tokenSymbol}
            onChange={e => { setTokenSymbol(e.target.value.toUpperCase()); setError(null); }}
            placeholder="SYMBOL"
            maxLength={10}
            data-testid="input-token-symbol"
            className="w-24 bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500 placeholder:text-muted-foreground/50 font-display shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
          />
        </div>

        <textarea
          value={description}
          onChange={e => { setDescription(e.target.value); setError(null); }}
          placeholder="Token description — what's this token about?"
          rows={2}
          data-testid="input-token-description"
          className="w-full bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500 placeholder:text-muted-foreground/50 resize-none shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
        />

        <div className="space-y-1">
          <label className="text-[9px] font-display text-muted-foreground">DEV BUY (SOL) — optional initial buy</label>
          <input
            value={devBuyAmount}
            onChange={e => { setDevBuyAmount(e.target.value); setError(null); }}
            type="number"
            step="0.1"
            min="0"
            data-testid="input-dev-buy"
            className="w-full bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-pink-500 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
          />
        </div>

        <div className="flex items-center justify-between p-2 border-4 border-foreground/10 bg-black/40 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span>Pump Portal Fee:</span>
              <span className="text-white font-display">{PUMP_PORTAL_FEE} SOL</span>
            </div>
            {parseFloat(devBuyAmount || "0") > 0 && (
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span>Dev Buy:</span>
                <span className="text-white font-display">{parseFloat(devBuyAmount || "0")} SOL</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[8px] text-muted-foreground">TOTAL</div>
            <div className="text-sm font-display text-pink-400 drop-shadow-[1px_1px_0px_#000]" data-testid="text-total-cost">{totalCost.toFixed(4)} SOL</div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-red-500/10 border-4 border-red-500/30 text-red-400 text-[10px] shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleLaunch}
          disabled={launching || !tokenName.trim() || !tokenSymbol.trim() || !description.trim() || !wallet.connected}
          data-testid="button-launch-token"
          className="w-full py-3 text-[11px] font-display disabled:opacity-50 flex items-center justify-center gap-2 border-4 border-pink-500/60 bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
        >
          {launching ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> LAUNCHING ON PUMP PORTAL...</>
          ) : (
            <><Flame className="w-4 h-4" /> FIRE BANANA CANNON 🍌🔫</>
          )}
        </button>

        <div className="text-center text-[8px] text-muted-foreground/60 border-2 border-foreground/10 py-1 bg-black/30">
          Launches via pump.fun. Token is 100% yours — no custody, no cuts.
        </div>
      </div>

      {launches.length > 0 && (
        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
          <div className="font-display text-[9px] text-muted-foreground flex items-center gap-1">🚀 LAUNCH HISTORY</div>
          {launches.map(launch => (
            <div key={launch.id} className="p-3 border-4 border-foreground/15 bg-black/60 backdrop-blur-sm shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:border-pink-500/30 transition-colors space-y-2" data-testid={`launch-${launch.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="w-3 h-3 text-pink-400 shrink-0" />
                  <span className="text-[11px] text-white font-display drop-shadow-[1px_1px_0px_#000]" data-testid={`text-launch-symbol-${launch.id}`}>${launch.tokenSymbol}</span>
                  <span className="text-[10px] text-muted-foreground">{launch.tokenName}</span>
                </div>
                <span className={`text-[9px] font-display border-2 px-1.5 py-0.5 ${statusBadge(launch.status)}`} data-testid={`text-launch-status-${launch.id}`}>
                  {launch.status.toUpperCase()}
                </span>
              </div>

              <p className="text-[9px] text-muted-foreground leading-relaxed">{launch.description.slice(0, 100)}{launch.description.length > 100 ? '...' : ''}</p>

              <div className="flex items-center gap-3 text-[9px]">
                {launch.devBuyAmount > 0 && (
                  <span className="text-muted-foreground">Dev Buy: <span className="text-white font-display">{launch.devBuyAmount} SOL</span></span>
                )}
              </div>

              {launch.mintAddress && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-muted-foreground">MINT:</span>
                  <span className="text-[9px] text-pink-400 font-mono">{launch.mintAddress.slice(0, 12)}...{launch.mintAddress.slice(-6)}</span>
                  <button
                    onClick={() => copyToClipboard(launch.mintAddress!, launch.id)}
                    className="p-0.5 text-muted-foreground hover:text-white"
                    data-testid={`button-copy-mint-${launch.id}`}
                  >
                    {copiedId === launch.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {launch.pumpUrl && (
                <a
                  href={launch.pumpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300"
                  data-testid={`link-pump-${launch.id}`}
                >
                  View on Pump Portal <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}

              {launch.txSignature && (
                <a
                  href={`https://solscan.io/tx/${launch.txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300"
                  data-testid={`link-tx-${launch.id}`}
                >
                  {launch.txSignature.slice(0, 16)}...{launch.txSignature.slice(-8)} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
