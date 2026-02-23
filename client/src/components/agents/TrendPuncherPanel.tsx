import { useState } from "react";
import { Zap, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface Narrative {
  id: string;
  tag: string;
  virality: number;
  momentum: "up" | "down" | "flat";
  shares: number;
  price: number;
  change24h: number;
}

const MOCK_NARRATIVES: Narrative[] = [
  { id: "1", tag: "#AI", virality: 94, momentum: "up", shares: 0, price: 2.45, change24h: 18.2 },
  { id: "2", tag: "#Solana", virality: 87, momentum: "up", shares: 0, price: 1.82, change24h: 7.5 },
  { id: "3", tag: "#RWA", virality: 72, momentum: "flat", shares: 0, price: 0.94, change24h: -2.1 },
  { id: "4", tag: "#DePIN", virality: 68, momentum: "down", shares: 0, price: 0.67, change24h: -12.4 },
  { id: "5", tag: "#Memecoins", virality: 81, momentum: "up", shares: 0, price: 1.23, change24h: 34.7 },
  { id: "6", tag: "#ZK", virality: 59, momentum: "down", shares: 0, price: 0.45, change24h: -8.3 },
];

export default function TrendPuncherPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const [narratives, setNarratives] = useState<Narrative[]>(MOCK_NARRATIVES);

  const buyShares = (narrative: Narrative) => {
    setNarratives(prev => prev.map(n => n.id === narrative.id ? { ...n, shares: n.shares + 100 } : n));
    onSendChat(`Buy 100 attention shares on ${narrative.tag} at $${narrative.price}`);
  };

  const sellShares = (narrative: Narrative) => {
    if (narrative.shares <= 0) return;
    setNarratives(prev => prev.map(n => n.id === narrative.id ? { ...n, shares: Math.max(0, n.shares - 100) } : n));
    onSendChat(`Sell 100 attention shares on ${narrative.tag} at $${narrative.price}`);
  };

  const totalValue = narratives.reduce((sum, n) => sum + (n.shares * n.price), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-display text-[11px] text-white">ATTENTION MARKETS</span>
        </div>
        {totalValue > 0 && (
          <div className="flex items-center gap-1 text-[10px]">
            <BarChart3 className="w-3 h-3 text-yellow-400" />
            <span className="font-display text-yellow-400">${totalValue.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 max-h-[350px] overflow-y-auto custom-scrollbar">
        {narratives.map(n => (
          <div key={n.id} className="p-2.5 border border-border bg-black/30 hover:bg-black/50 transition-colors" data-testid={`narrative-${n.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-xs text-white">{n.tag}</span>
                {n.momentum === 'up' ? <TrendingUp className="w-3 h-3 text-green-400" /> : n.momentum === 'down' ? <TrendingDown className="w-3 h-3 text-red-400" /> : null}
              </div>
              <span className={`text-[10px] font-display ${n.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {n.change24h >= 0 ? '+' : ''}{n.change24h}%
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-muted-foreground">Virality: <span className="text-white font-display">{n.virality}</span></span>
                <span className="text-muted-foreground">Price: <span className="text-yellow-400 font-display">${n.price}</span></span>
              </div>
              {n.shares > 0 && <span className="text-[9px] text-yellow-400 font-display">{n.shares} SHARES</span>}
            </div>

            <div className="w-full h-1.5 bg-black/50 border border-border mb-2">
              <div className="h-full bg-yellow-500/60 transition-all" style={{ width: `${n.virality}%` }} />
            </div>

            <div className="flex gap-1.5">
              <button onClick={() => buyShares(n)} data-testid={`button-buy-${n.id}`} className="flex-1 py-1 border border-green-500/50 text-green-400 text-[9px] font-display hover:bg-green-500/10 transition-colors">
                BUY 100
              </button>
              <button onClick={() => sellShares(n)} disabled={n.shares <= 0} data-testid={`button-sell-${n.id}`} className="flex-1 py-1 border border-red-500/50 text-red-400 text-[9px] font-display hover:bg-red-500/10 transition-colors disabled:opacity-30">
                SELL 100
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
