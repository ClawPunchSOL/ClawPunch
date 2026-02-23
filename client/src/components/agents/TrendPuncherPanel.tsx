import { useState, useEffect } from "react";
import { useWalletState } from "@/components/WalletButton";
import { Zap, TrendingUp, TrendingDown, BarChart3, Loader2, Wallet } from "lucide-react";

interface AttentionPosition {
  id: number;
  narrative: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  virality: number;
  momentum: string;
}

export default function TrendPuncherPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const wallet = useWalletState();
  const [positions, setPositions] = useState<AttentionPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/attention/positions").then(r => r.json()).then(setPositions).finally(() => setLoading(false));
  }, []);

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
        onSendChat(`${action === 'buy' ? 'Buy' : 'Sell'} ${shares} attention shares on ${narrative} at $${pos?.currentPrice || '?'}`);
      }
    } finally {
      setTrading(null);
    }
  };

  const totalValue = positions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
  const activePosCount = positions.filter(p => p.shares > 0).length;

  if (loading) {
    return (
      <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-yellow-400" /></div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-display text-[11px] text-white">ATTENTION MARKETS</span>
        </div>
        <div className="flex items-center gap-3">
          {activePosCount > 0 && (
            <span className="text-[9px] text-muted-foreground font-display">{activePosCount} POSITIONS</span>
          )}
          {totalValue > 0 && (
            <div className="flex items-center gap-1 text-[10px]">
              <BarChart3 className="w-3 h-3 text-yellow-400" />
              <span className="font-display text-yellow-400">${totalValue.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {wallet.connected && wallet.publicKey && (
        <div className="flex items-center gap-2 p-2 border border-yellow-500/20 bg-yellow-500/5">
          <Wallet className="w-3 h-3 text-yellow-400" />
          <span className="text-[9px] text-yellow-400 font-display">TRADING AS:</span>
          <span className="text-[9px] text-white font-mono">{wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-4)}</span>
        </div>
      )}

      <div className="space-y-1.5 max-h-[350px] overflow-y-auto custom-scrollbar">
        {positions.map(p => (
          <div key={p.id} className="p-2.5 border border-border bg-black/30 hover:bg-black/50 transition-colors" data-testid={`narrative-${p.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-xs text-white">{p.narrative}</span>
                {p.momentum === 'up' ? <TrendingUp className="w-3 h-3 text-green-400" /> : p.momentum === 'down' ? <TrendingDown className="w-3 h-3 text-red-400" /> : null}
              </div>
              <span className="text-[10px] font-display text-yellow-400">${p.currentPrice}</span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-muted-foreground">Virality: <span className="text-white font-display">{p.virality}</span></span>
              </div>
              {p.shares > 0 && (
                <span className="text-[9px] text-yellow-400 font-display">
                  {p.shares} SHARES (${(p.shares * p.currentPrice).toFixed(2)})
                </span>
              )}
            </div>

            <div className="w-full h-1.5 bg-black/50 border border-border mb-2">
              <div className="h-full bg-yellow-500/60 transition-all" style={{ width: `${p.virality}%` }} />
            </div>

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
        ))}
      </div>
    </div>
  );
}
