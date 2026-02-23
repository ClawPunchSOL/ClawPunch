import { useState, useEffect } from "react";
import { Cpu, ArrowDown, ArrowUp, Percent, Loader2 } from "lucide-react";

interface VaultPosition {
  id: number;
  vaultName: string;
  protocol: string;
  token: string;
  stakedAmount: number;
  apy: number;
  tvl: number;
}

export default function ApeVaultPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const [vaults, setVaults] = useState<VaultPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState<Record<number, string>>({});
  const [staking, setStaking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vaults").then(r => r.json()).then(setVaults).finally(() => setLoading(false));
  }, []);

  const formatTVL = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
  const totalStaked = vaults.reduce((sum, v) => sum + v.stakedAmount, 0);

  const handleStake = async (vault: VaultPosition) => {
    const amt = parseFloat(stakeAmount[vault.id] || "0");
    if (amt <= 0) return;
    setStaking(`stake-${vault.id}`);
    try {
      const res = await fetch(`/api/vaults/${vault.id}/stake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, action: "stake" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVaults(prev => prev.map(v => v.id === vault.id ? updated : v));
        setStakeAmount(prev => ({ ...prev, [vault.id]: "" }));
        onSendChat(`Stake ${amt} ${vault.token} in ${vault.vaultName} vault on ${vault.protocol}`);
      }
    } finally {
      setStaking(null);
    }
  };

  const handleUnstake = async (vault: VaultPosition) => {
    if (vault.stakedAmount <= 0) return;
    setStaking(`unstake-${vault.id}`);
    try {
      const res = await fetch(`/api/vaults/${vault.id}/stake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: vault.stakedAmount, action: "unstake" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVaults(prev => prev.map(v => v.id === vault.id ? updated : v));
        onSendChat(`Unstake ${vault.stakedAmount} ${vault.token} from ${vault.vaultName} vault`);
      }
    } finally {
      setStaking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-orange-400" />
          <span className="font-display text-[11px] text-white">DEFI VAULTS</span>
        </div>
        {totalStaked > 0 && (
          <span className="text-[10px] font-display text-orange-400">{totalStaked.toFixed(2)} TOTAL STAKED</span>
        )}
      </div>

      <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
        {vaults.map(v => (
          <div key={v.id} className="p-3 border border-border bg-black/30" data-testid={`vault-${v.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-display text-xs text-white">{v.vaultName}</span>
                <span className="text-[9px] text-muted-foreground ml-2">{v.protocol}</span>
              </div>
              <div className="flex items-center gap-1 text-green-400">
                <Percent className="w-3 h-3" />
                <span className="font-display text-sm">{v.apy}%</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] mb-2">
              <span className="text-muted-foreground">TVL: <span className="text-white">{formatTVL(v.tvl)}</span></span>
              {v.stakedAmount > 0 && <span className="text-orange-400 font-display">YOUR STAKE: {v.stakedAmount} {v.token}</span>}
            </div>

            <div className="flex gap-1.5">
              <input
                value={stakeAmount[v.id] || ""}
                onChange={e => setStakeAmount(prev => ({ ...prev, [v.id]: e.target.value }))}
                placeholder={`Amount (${v.token})`}
                type="number"
                className="flex-1 bg-black/50 border border-border text-white px-2 py-1 text-[10px] focus:outline-none focus:border-orange-500 placeholder:text-muted-foreground/50"
              />
              <button
                onClick={() => handleStake(v)}
                disabled={staking === `stake-${v.id}` || !stakeAmount[v.id]}
                data-testid={`button-stake-${v.id}`}
                className="px-2 py-1 border border-green-500/50 text-green-400 text-[9px] font-display hover:bg-green-500/10 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {staking === `stake-${v.id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <><ArrowDown className="w-2.5 h-2.5" /> STAKE</>}
              </button>
              {v.stakedAmount > 0 && (
                <button
                  onClick={() => handleUnstake(v)}
                  disabled={staking === `unstake-${v.id}`}
                  data-testid={`button-unstake-${v.id}`}
                  className="px-2 py-1 border border-red-500/50 text-red-400 text-[9px] font-display hover:bg-red-500/10 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {staking === `unstake-${v.id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <><ArrowUp className="w-2.5 h-2.5" /> EXIT</>}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
