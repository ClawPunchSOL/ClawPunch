import { useState, useEffect } from "react";
import { useWalletState } from "@/components/WalletButton";
import { Zap, TrendingUp, TrendingDown, BarChart3, Loader2, Wallet, RefreshCw, DollarSign } from "lucide-react";

interface AttentionPosition {
  id: number;
  narrative: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  virality: number;
  momentum: string;
  category: string;
  coinIds: string;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  updatedAt: string;
}

const formatCompact = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const categoryColors: Record<string, string> = {
  ai: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  l1: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  meme: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  infra: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  rwa: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  l2: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  defi: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  gaming: "text-pink-400 border-pink-500/30 bg-pink-500/10",
};

export default function TrendPuncherPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const wallet = useWalletState();
  const [positions, setPositions] = useState<AttentionPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trading, setTrading] = useState<string | null>(null);

  const loadPositions = () => {
    fetch("/api/attention/positions").then(r => r.json()).then(setPositions).finally(() => setLoading(false));
  };

  useEffect(() => { loadPositions(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/attention/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPositions(data);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const executeTrade = async (narrative: string, action: 'buy' | 'sell', shares: number) => {
    setTrading(`${action}-${narrative}`);
    try {
      const res = await fetch("/api/attention/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative, action, shares }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPositions(prev => prev.map(p => p.narrative === narrative ? updated : p));
        const pos = positions.find(p => p.narrative === narrative);
        onSendChat(`${action === 'buy' ? 'Bought' : 'Sold'} ${shares} attention shares on "${narrative}" at $${pos?.currentPrice?.toFixed(2) || '?'}`);
      }
    } finally {
      setTrading(null);
    }
  };

  const totalValue = positions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
  const activePosCount = positions.filter(p => p.shares > 0).length;
  const topNarrative = positions.length > 0
    ? [...positions].sort((a, b) => b.virality - a.virality)[0]
    : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
        <span className="text-[10px] text-muted-foreground font-display">FETCHING LIVE MARKET DATA...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-display text-[11px] text-white">NARRATIVE TRACKER</span>
          <span className="text-[10px] text-yellow-400 font-display">LIVE</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          {activePosCount > 0 && (
            <span className="text-[9px] text-muted-foreground font-display">{activePosCount} POSITIONS</span>
          )}
          {totalValue > 0 && (
            <div className="flex items-center gap-1 text-[10px]">
              <DollarSign className="w-3 h-3 text-yellow-400" />
              <span className="font-display text-yellow-400">{totalValue.toFixed(2)}</span>
            </div>
          )}
          <button onClick={handleRefresh} disabled={refreshing} data-testid="button-refresh-trends"
            className="flex items-center gap-1 px-2 py-0.5 border border-yellow-500/30 text-yellow-400 text-[9px] font-display hover:bg-yellow-500/10 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'UPDATING' : 'REFRESH'}
          </button>
        </div>
      </div>

      <div className="p-2 border border-border bg-black/20 text-[9px] text-muted-foreground flex items-center justify-between">
        <span>Data from <span className="text-yellow-400">CoinGecko</span> — {positions.length} narratives tracked</span>
        {topNarrative && (
          <span className="text-green-400 font-display">
            HOT: {topNarrative.narrative} ({topNarrative.virality}%)
          </span>
        )}
      </div>

      {wallet.connected && wallet.publicKey && (
        <div className="flex items-center gap-2 p-2 border border-yellow-500/20 bg-yellow-500/5">
          <Wallet className="w-3 h-3 text-yellow-400" />
          <span className="text-[9px] text-yellow-400 font-display">TRADING AS:</span>
          <span className="text-[9px] text-white font-mono">{wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-4)}</span>
        </div>
      )}

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
        {positions.map(p => {
          const catStyle = categoryColors[p.category] || "text-gray-400 border-gray-500/30 bg-gray-500/10";
          const change = p.priceChange24h || 0;
          const isUp = change > 0;
          const isDown = change < 0;

          return (
            <div key={p.id} className="p-2.5 border border-border bg-black/30 hover:bg-black/50 transition-colors" data-testid={`narrative-${p.id}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs text-white">{p.narrative}</span>
                  <span className={`text-[8px] px-1 py-0.5 font-display border ${catStyle}`}>
                    {p.category.toUpperCase()}
                  </span>
                  {p.momentum === 'up' ? <TrendingUp className="w-3 h-3 text-green-400" /> :
                   p.momentum === 'down' ? <TrendingDown className="w-3 h-3 text-red-400" /> : null}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-display text-yellow-400">${p.currentPrice.toFixed(2)}</span>
                  <span className={`text-[9px] font-display ml-1.5 ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {isUp ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-1.5 text-[9px]">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Virality: <span className="text-white font-display">{p.virality}</span></span>
                  {p.marketCap > 0 && <span className="text-muted-foreground">MCap: <span className="text-white">{formatCompact(p.marketCap)}</span></span>}
                  {p.volume24h > 0 && <span className="text-muted-foreground">Vol: <span className="text-white">{formatCompact(p.volume24h)}</span></span>}
                </div>
                {p.shares > 0 && (
                  <span className="text-yellow-400 font-display">
                    {p.shares} SHARES (${(p.shares * p.currentPrice).toFixed(2)})
                  </span>
                )}
              </div>

              <div className="w-full h-1.5 bg-black/50 border border-border mb-2 relative overflow-hidden">
                <div className={`h-full transition-all ${p.virality >= 70 ? 'bg-green-500/80' : p.virality >= 40 ? 'bg-yellow-500/60' : 'bg-red-500/60'}`}
                  style={{ width: `${p.virality}%` }} />
              </div>

              {p.coinIds && (
                <div className="text-[8px] text-muted-foreground/60 mb-1.5 truncate">
                  Tracking: {p.coinIds.split(',').map(c => c.split('-')[0]).join(', ')}
                </div>
              )}

              <div className="flex gap-1.5">
                <button
                  onClick={() => executeTrade(p.narrative, 'buy', 100)}
                  disabled={trading === `buy-${p.narrative}`}
                  data-testid={`button-buy-${p.id}`}
                  className="flex-1 py-1 border border-green-500/50 text-green-400 text-[9px] font-display hover:bg-green-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {trading === `buy-${p.narrative}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'BUY 100'}
                </button>
                <button
                  onClick={() => executeTrade(p.narrative, 'sell', 100)}
                  disabled={p.shares < 100 || trading === `sell-${p.narrative}`}
                  data-testid={`button-sell-${p.id}`}
                  className="flex-1 py-1 border border-red-500/50 text-red-400 text-[9px] font-display hover:bg-red-500/10 transition-colors disabled:opacity-30 flex items-center justify-center gap-1"
                >
                  {trading === `sell-${p.narrative}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'SELL 100'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
