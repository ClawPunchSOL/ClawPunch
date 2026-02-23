import { useState, useEffect } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, shortAddress } from "@/lib/solanaWallet";
import { Target, Plus, Loader2, TrendingUp, Wallet, ChevronUp } from "lucide-react";

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
}

export default function PunchOraclePanel({ onSendChat }: { onSendChat?: (msg: string) => void }) {
  const wallet = useWalletState();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [betModal, setBetModal] = useState<Prediction | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [betAmount, setBetAmount] = useState("100");
  const [betSide, setBetSide] = useState<"yes" | "no">("yes");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/predictions").then(r => r.json()).then(setPredictions).finally(() => setLoading(false));
  }, []);

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

  const handleBet = async () => {
    if (!betModal) return;
    setSubmitting(true);
    const walletAddr = wallet.connected && wallet.publicKey ? wallet.publicKey : "anon_" + Math.random().toString(36).slice(2, 8);
    try {
      const res = await fetch(`/api/predictions/${betModal.id}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side: betSide, amount: betAmount, walletAddress: walletAddr }),
      });
      if (res.ok) {
        const { prediction } = await res.json();
        setPredictions(prev => prev.map(p => p.id === prediction.id ? prediction : p));
        onSendChat?.(`Bet ${betAmount} $PUNCH on ${betSide.toUpperCase()} for "${betModal.title}"`);
        setBetModal(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalPool = (p: Prediction) => p.poolYes + p.poolNo;
  const totalVolume = predictions.reduce((sum, p) => sum + totalPool(p), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="font-display text-[11px] text-white">PREDICTION MARKETS</span>
          <span className="text-[10px] text-purple-400 font-display">{predictions.filter(p => p.status === 'active').length} LIVE</span>
        </div>
        <div className="flex items-center gap-2">
          {totalVolume > 0 && (
            <span className="text-[9px] text-muted-foreground font-display">{totalVolume.toLocaleString()} $PUNCH TVL</span>
          )}
          <button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-prediction" className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 text-[10px] font-display hover:bg-purple-500/30 transition-colors">
            {showCreate ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {showCreate ? 'CLOSE' : 'CREATE'}
          </button>
        </div>
      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setBetModal(null)}>
          <div className="bg-card border-4 border-purple-500/50 p-5 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-sm text-white">{betModal.title}</h3>
            <div className="flex gap-2">
              <button onClick={() => setBetSide("yes")} data-testid="button-bet-yes" className={`flex-1 py-3 border-2 font-display text-xs transition-colors ${betSide === 'yes' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-border text-muted-foreground'}`}>
                YES ({betModal.oddsYes}%)
              </button>
              <button onClick={() => setBetSide("no")} data-testid="button-bet-no" className={`flex-1 py-3 border-2 font-display text-xs transition-colors ${betSide === 'no' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-border text-muted-foreground'}`}>
                NO ({betModal.oddsNo}%)
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" data-testid="input-bet-amount" className="flex-1 bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
              <span className="text-[10px] font-display text-purple-400">$PUNCH</span>
            </div>
            {!wallet.connected && (
              <button onClick={connectWallet} className="w-full flex items-center justify-center gap-2 py-2 border border-purple-500/30 text-purple-400 text-[10px] font-display hover:bg-purple-500/10 transition-colors">
                <Wallet className="w-3 h-3" /> CONNECT WALLET FOR TRACKING
              </button>
            )}
            {wallet.connected && wallet.publicKey && (
              <div className="flex items-center gap-1.5 text-[9px] text-green-400 font-mono px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {shortAddress(wallet.publicKey)}
              </div>
            )}
            <button onClick={handleBet} disabled={submitting} data-testid="button-place-bet" className="w-full retro-button retro-button-primary text-[10px] py-2.5 disabled:opacity-50">
              {submitting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : `STAKE ${betAmount} $PUNCH ON ${betSide.toUpperCase()}`}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-purple-400" /></div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-xs">No markets yet. Create the first prediction market above.</div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {predictions.map(p => (
            <div key={p.id} className="p-3 border border-border bg-black/30 space-y-2" data-testid={`prediction-card-${p.id}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-white font-semibold leading-tight">{p.title}</span>
                <span className={`text-[9px] font-display shrink-0 px-1.5 py-0.5 ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{p.status.toUpperCase()}</span>
              </div>
              <div className="flex gap-0.5 h-3">
                <div className="bg-green-500/60 transition-all" style={{ width: `${p.oddsYes}%` }} />
                <div className="bg-red-500/60 transition-all" style={{ width: `${p.oddsNo}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-green-400 font-display">YES {p.oddsYes}%</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>{totalPool(p).toLocaleString()} $PUNCH</span>
                </div>
                <span className="text-red-400 font-display">NO {p.oddsNo}%</span>
              </div>
              {p.status === 'active' && (
                <button onClick={() => { setBetModal(p); setBetSide("yes"); }} data-testid={`button-bet-${p.id}`} className="w-full py-1.5 border border-purple-500/50 text-purple-400 text-[10px] font-display hover:bg-purple-500/10 transition-colors">
                  PLACE BET
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
