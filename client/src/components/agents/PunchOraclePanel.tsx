import { useState, useEffect, useCallback } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, shortAddress, sendSolTransfer, refreshBalance } from "@/lib/solanaWallet";
import { Target, Plus, Loader2, TrendingUp, Wallet, ChevronUp, ChevronDown, Zap, RefreshCw, Clock, CheckCircle, XCircle, DollarSign, AlertTriangle } from "lucide-react";

interface Prediction {
  id: number;
  title: string;
  description: string;
  category: string;
  oddsYes: number;
  oddsNo: number;
  poolYes: number;
  poolNo: number;
  status: string;
  tokenId?: string;
  targetPrice?: number;
  currentPrice?: number;
  priceAtCreation?: number;
  expiresAt?: string;
  resolvedOutcome?: string;
}

interface TokenPrice {
  tokenId: string;
  symbol: string;
  price: number;
  change24h: number;
}

interface LiveMarket {
  id: string;
  question: string;
  slug: string;
  outcomePrices: number[];
  outcomes: string[];
  volume: number;
  volume24hr: number;
  liquidity: number;
  endDate: string;
  oneDayPriceChange: number;
}

export default function PunchOraclePanel({ onSendChat }: { onSendChat?: (msg: string) => void }) {
  const wallet = useWalletState();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [prices, setPrices] = useState<TokenPrice[]>([]);
  const [liveMarkets, setLiveMarkets] = useState<LiveMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [betModal, setBetModal] = useState<Prediction | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [betAmount, setBetAmount] = useState("0.01");
  const [betSide, setBetSide] = useState<"yes" | "no">("yes");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [betError, setBetError] = useState<string | null>(null);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions");
      if (res.ok) setPredictions(await res.json());
    } catch {}
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions/prices");
      if (res.ok) setPrices(await res.json());
    } catch {}
  }, []);

  const fetchLiveMarkets = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions/polymarket");
      if (res.ok) setLiveMarkets(await res.json());
    } catch {}
  }, []);

  const fetchPoolAddress = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions/pool-address");
      if (res.ok) {
        const data = await res.json();
        setPoolAddress(data.address);
      }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchPredictions(), fetchPrices(), fetchLiveMarkets(), fetchPoolAddress()]).finally(() => setLoading(false));
    const interval = setInterval(() => { fetchPredictions(); fetchPrices(); fetchLiveMarkets(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchPredictions, fetchPrices, fetchLiveMarkets, fetchPoolAddress]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/predictions/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        await fetchPredictions();
        onSendChat?.(`Generated ${data.count} new prediction markets from live market data`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      const res = await fetch("/api/predictions/resolve", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        await fetchPredictions();
        if (data.count > 0) {
          onSendChat?.(`Resolved ${data.count} expired predictions using real market data`);
        }
      }
    } finally {
      setResolving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category: "crypto" }),
      });
      if (res.ok) {
        const pred = await res.json();
        setPredictions(prev => [pred, ...prev]);
        setTitle("");
        setDescription("");
        setShowCreate(false);
        onSendChat?.(`Created prediction market: "${pred.title}"`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportAndBet = async (market: LiveMarket) => {
    setImportingId(market.id);
    try {
      const yesOdds = Math.round((market.outcomePrices[0] || 0.5) * 100);
      const res = await fetch("/api/predictions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: market.id,
          question: market.question,
          oddsYes: yesOdds,
          endDate: market.endDate,
          volume: market.volume,
        }),
      });
      if (res.ok) {
        const pred = await res.json();
        await fetchPredictions();
        setBetModal(pred);
        setBetSide("yes");
        setBetError(null);
      }
    } finally {
      setImportingId(null);
    }
  };

  const handleBet = async () => {
    if (!betModal || !poolAddress) return;
    setBetError(null);

    if (!wallet.connected || !wallet.publicKey) {
      setBetError("Connect your Phantom wallet first");
      return;
    }

    const solAmount = parseFloat(betAmount);
    if (isNaN(solAmount) || solAmount <= 0) {
      setBetError("Enter a valid SOL amount");
      return;
    }

    if (solAmount < 0.001) {
      setBetError("Minimum bet is 0.001 SOL");
      return;
    }

    if (wallet.balance !== null && solAmount > wallet.balance) {
      setBetError(`Insufficient balance. You have ${wallet.balance.toFixed(4)} SOL`);
      return;
    }

    setSubmitting(true);
    try {
      const txSignature = await sendSolTransfer(poolAddress, solAmount);

      const res = await fetch(`/api/predictions/${betModal.id}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side: betSide,
          amount: solAmount,
          walletAddress: wallet.publicKey,
          txSignature,
        }),
      });
      if (res.ok) {
        const { prediction } = await res.json();
        setPredictions(prev => prev.map(p => p.id === prediction.id ? prediction : p));
        onSendChat?.(`Bet ${solAmount} SOL on ${betSide.toUpperCase()} for "${betModal.title}" — tx: ${txSignature.slice(0, 8)}...`);
        setBetModal(null);
        refreshBalance();
      } else {
        const err = await res.json();
        setBetError(err.error || "Failed to record bet");
      }
    } catch (err: any) {
      if (err.message?.includes("User rejected")) {
        setBetError("Transaction rejected in wallet");
      } else {
        setBetError(err.message || "Transaction failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalPool = (p: Prediction) => p.poolYes + p.poolNo;

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatSol = (sol: number) => {
    if (sol < 0.01) return `${sol.toFixed(4)} SOL`;
    return `${sol.toFixed(2)} SOL`;
  };

  const timeLeft = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const isImported = (marketId: string) => {
    return predictions.some(p => p.description?.includes(`[EXT:${marketId}]`));
  };

  const getImportedPrediction = (marketId: string) => {
    return predictions.find(p => p.description?.includes(`[EXT:${marketId}]`));
  };

  const totalSolPool = predictions.reduce((sum, p) => sum + totalPool(p), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="font-display text-[11px] text-white">PREDICTION MARKETS</span>
          {totalSolPool > 0 && (
            <span className="text-[9px] text-purple-400 font-display">{formatSol(totalSolPool)} pooled</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleGenerate} disabled={generating} data-testid="button-generate-predictions" className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[10px] font-display hover:bg-yellow-500/30 transition-colors disabled:opacity-50">
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} AUTO
          </button>
          <button onClick={handleResolve} disabled={resolving} data-testid="button-resolve-predictions" className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-[10px] font-display hover:bg-cyan-500/30 transition-colors disabled:opacity-50">
            {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} RESOLVE
          </button>
          <button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-prediction" className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 text-[10px] font-display hover:bg-purple-500/30 transition-colors">
            {showCreate ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {prices.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {prices.map(p => (
            <div key={p.tokenId} className="flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-border shrink-0" data-testid={`price-ticker-${p.tokenId}`}>
              <DollarSign className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-white font-display">{p.symbol}</span>
              <span className="text-[10px] text-muted-foreground">{formatPrice(p.price)}</span>
              <span className={`text-[9px] font-display ${p.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="p-3 border-2 border-purple-500/30 bg-purple-500/5 space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Will SOL hit $300 by March?" data-testid="input-prediction-title" className="w-full bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-purple-500 placeholder:text-muted-foreground/50" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description of the prediction..." className="w-full bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-purple-500 placeholder:text-muted-foreground/50" />
          <button type="submit" disabled={submitting || !title.trim()} data-testid="button-submit-prediction" className="w-full retro-button retro-button-primary text-[10px] py-2 disabled:opacity-50">
            {submitting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "LAUNCH MARKET"}
          </button>
        </form>
      )}

      {betModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setBetModal(null); setBetError(null); }}>
          <div className="bg-card border-4 border-purple-500/50 p-5 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-sm text-white">{betModal.title}</h3>

            {betModal.currentPrice && betModal.targetPrice && (
              <div className="flex items-center justify-between px-2 py-1.5 bg-black/40 border border-border">
                <div className="text-[10px]">
                  <span className="text-muted-foreground">Now: </span>
                  <span className="text-white font-display">{formatPrice(betModal.currentPrice)}</span>
                </div>
                <div className="text-[10px]">
                  <span className="text-muted-foreground">Target: </span>
                  <span className="text-purple-400 font-display">{formatPrice(betModal.targetPrice)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setBetSide("yes")} data-testid="button-bet-yes" className={`flex-1 py-3 border-2 font-display text-xs transition-colors ${betSide === 'yes' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-border text-muted-foreground'}`}>
                YES ({betModal.oddsYes}%)
              </button>
              <button onClick={() => setBetSide("no")} data-testid="button-bet-no" className={`flex-1 py-3 border-2 font-display text-xs transition-colors ${betSide === 'no' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-border text-muted-foreground'}`}>
                NO ({betModal.oddsNo}%)
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" step="0.001" min="0.001" data-testid="input-bet-amount" className="flex-1 bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
                <span className="text-[10px] font-display text-purple-400">SOL</span>
              </div>
              <div className="flex gap-1">
                {[0.01, 0.05, 0.1, 0.5].map(amt => (
                  <button key={amt} onClick={() => setBetAmount(String(amt))} className={`flex-1 py-1 text-[9px] font-display border transition-colors ${betAmount === String(amt) ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-border text-muted-foreground hover:border-purple-500/30'}`}>
                    {amt} SOL
                  </button>
                ))}
              </div>
            </div>

            {!wallet.connected ? (
              <button onClick={connectWallet} data-testid="button-connect-to-bet" className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-purple-500/50 text-purple-400 text-[10px] font-display hover:bg-purple-500/10 transition-colors">
                <Wallet className="w-3 h-3" /> CONNECT PHANTOM TO BET
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-1.5 bg-black/40 border border-border">
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {shortAddress(wallet.publicKey)}
                  </div>
                  {wallet.balance !== null && (
                    <span className="text-[10px] text-muted-foreground font-display">{wallet.balance.toFixed(4)} SOL</span>
                  )}
                </div>
              </div>
            )}

            {betError && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px]">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{betError}</span>
              </div>
            )}

            <button
              onClick={handleBet}
              disabled={submitting || !wallet.connected}
              data-testid="button-place-bet"
              className="w-full retro-button retro-button-primary text-[10px] py-2.5 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> SIGNING IN PHANTOM...</span>
              ) : (
                `BET ${betAmount} SOL ON ${betSide.toUpperCase()}`
              )}
            </button>

            <div className="text-center text-[8px] text-muted-foreground/60">
              Real SOL transfer via Phantom wallet. View on Solscan after confirmation.
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-purple-400" /></div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {liveMarkets.length > 0 && (
            <>
              <div className="font-display text-[9px] text-muted-foreground flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                TRENDING MARKETS — BET WITH SOL
              </div>
              {liveMarkets.map(m => {
                const yesOdds = Math.round((m.outcomePrices[0] || 0.5) * 100);
                const noOdds = 100 - yesOdds;
                const imported = isImported(m.id);
                const importedPred = imported ? getImportedPrediction(m.id) : null;
                const localPool = importedPred ? importedPred.poolYes + importedPred.poolNo : 0;
                return (
                  <div key={m.id} className="p-3 border border-border bg-black/30 space-y-2" data-testid={`market-${m.id}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-white font-semibold leading-tight flex-1">{m.question}</span>
                      <span className="text-[9px] font-display px-1.5 py-0.5 bg-green-500/20 text-green-400 shrink-0">LIVE</span>
                    </div>

                    <div className="flex gap-0.5 h-3">
                      <div className="bg-green-500/60 transition-all" style={{ width: `${yesOdds}%` }} />
                      <div className="bg-red-500/60 transition-all" style={{ width: `${noOdds}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-green-400 font-display" data-testid={`odds-yes-${m.id}`}>YES {yesOdds}%</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span data-testid={`vol-${m.id}`}>{formatVolume(m.volume)}</span>
                        </div>
                        {localPool > 0 && (
                          <span className="text-purple-400 text-[9px] font-display">{formatSol(localPool)}</span>
                        )}
                        {m.endDate && (
                          <div className="flex items-center gap-0.5 text-yellow-400">
                            <Clock className="w-3 h-3" />
                            <span className="font-display">{timeLeft(m.endDate)}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-red-400 font-display" data-testid={`odds-no-${m.id}`}>NO {noOdds}%</span>
                    </div>

                    <button
                      onClick={() => handleImportAndBet(m)}
                      disabled={importingId === m.id}
                      data-testid={`bet-btn-${m.id}`}
                      className="w-full py-1.5 border border-purple-500/50 text-purple-400 text-[10px] font-display hover:bg-purple-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {importingId === m.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Wallet className="w-3 h-3" />
                          {imported ? "BET MORE SOL" : "BET SOL"}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {predictions.filter(p => p.category !== 'live').length > 0 && (
            <>
              <div className="font-display text-[9px] text-muted-foreground flex items-center gap-1.5 mt-2">
                <DollarSign className="w-3 h-3" />
                PRICE PREDICTIONS
              </div>
              {predictions.filter(p => p.category !== 'live').map(p => (
                <div key={p.id} className="p-3 border border-border bg-black/30 space-y-2" data-testid={`prediction-card-${p.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-white font-semibold leading-tight">{p.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {p.status === 'resolved' && p.resolvedOutcome && (
                        <span className={`text-[9px] font-display px-1.5 py-0.5 ${p.resolvedOutcome === 'yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`} data-testid={`resolution-${p.id}`}>
                          {p.resolvedOutcome === 'yes' ? <CheckCircle className="w-3 h-3 inline mr-0.5" /> : <XCircle className="w-3 h-3 inline mr-0.5" />}
                          {p.resolvedOutcome.toUpperCase()}
                        </span>
                      )}
                      <span className={`text-[9px] font-display px-1.5 py-0.5 ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : p.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{p.status.toUpperCase()}</span>
                    </div>
                  </div>

                  {p.currentPrice && p.targetPrice && (
                    <div className="flex items-center gap-3 text-[10px]">
                      <div>
                        <span className="text-muted-foreground">Now: </span>
                        <span className="text-white font-display" data-testid={`current-price-${p.id}`}>{formatPrice(p.currentPrice)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target: </span>
                        <span className="text-purple-400 font-display" data-testid={`target-price-${p.id}`}>{formatPrice(p.targetPrice)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-0.5 h-3">
                    <div className="bg-green-500/60 transition-all" style={{ width: `${p.oddsYes}%` }} />
                    <div className="bg-red-500/60 transition-all" style={{ width: `${p.oddsNo}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-green-400 font-display">YES {Math.round(p.oddsYes)}%</span>
                    <div className="flex items-center gap-2">
                      {totalPool(p) > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span>{formatSol(totalPool(p))}</span>
                        </div>
                      )}
                      {p.expiresAt && p.status === 'active' && (
                        <div className="flex items-center gap-0.5 text-yellow-400">
                          <Clock className="w-3 h-3" />
                          <span className="font-display" data-testid={`time-left-${p.id}`}>{timeLeft(p.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-red-400 font-display">NO {Math.round(p.oddsNo)}%</span>
                  </div>
                  {p.status === 'active' && (
                    <button onClick={() => { setBetModal(p); setBetSide("yes"); setBetError(null); }} data-testid={`button-bet-${p.id}`} className="w-full py-1.5 border border-purple-500/50 text-purple-400 text-[10px] font-display hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-1">
                      <Wallet className="w-3 h-3" /> BET SOL
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {liveMarkets.length === 0 && predictions.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <div className="text-muted-foreground text-xs">No markets yet.</div>
              <button onClick={handleGenerate} disabled={generating} data-testid="button-generate-first" className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[10px] font-display hover:bg-yellow-500/30 transition-colors disabled:opacity-50">
                {generating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "GENERATE FROM LIVE MARKET DATA"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
