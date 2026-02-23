import { useState, useEffect } from "react";
import { useWalletState } from "@/components/WalletButton";
import { Cpu, ArrowDown, ArrowUp, Percent, Loader2, Wallet, PieChart, RefreshCw } from "lucide-react";

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
  const wallet = useWalletState();
  const [vaults, setVaults] = useState<VaultPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState<Record<number, string>>({});
  const [staking, setStaking] = useState<string | null>(null);

  const loadVaults = (data: any) => {
    if (Array.isArray(data)) {
      setVaults(data);
    } else if (data.vaults) {
      setVaults(data.vaults);
      if (data.lastRefresh) setLastRefresh(data.lastRefresh);
    }
  };

  useEffect(() => {
    fetch("/api/vaults").then(r => r.json()).then(loadVaults).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/vaults/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        loadVaults(data);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const formatTVL = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
  const totalStaked = vaults.reduce((sum, v) => sum + v.stakedAmount, 0);
  const avgApy = vaults.length > 0 ? vaults.reduce((sum, v) => sum + v.apy, 0) / vaults.length : 0;

  const timeSinceRefresh = lastRefresh > 0 ? Math.floor((Date.now() - lastRefresh) / 60000) : null;

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
          <span className="font-display text-[11px] text-white">SOLANA DEFI VAULTS</span>
          <span className="text-[8px] text-muted-foreground/60 font-mono">via DeFi Llama</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            data-testid="button-refresh-vaults"
            className="p-1 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {timeSinceRefresh !== null && (
            <span className="text-[8px] text-muted-foreground/50 font-mono">{timeSinceRefresh}m ago</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px]">
        {totalStaked > 0 && (
          <span className="font-display text-orange-400">{totalStaked.toFixed(2)} STAKED</span>
        )}
        <span className="text-muted-foreground font-display">AVG APY: <span className="text-green-400">{avgApy.toFixed(1)}%</span></span>
        <span className="text-muted-foreground font-display">{vaults.length} POOLS</span>
      </div>

      {wallet.connected && wallet.publicKey && (
        <div className="flex items-center gap-2 p-2 border border-orange-500/20 bg-orange-500/5">
          <Wallet className="w-3 h-3 text-orange-400" />
          <span className="text-[9px] text-orange-400 font-display">STAKING AS:</span>
          <span className="text-[9px] text-white font-mono">{wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-4)}</span>
          {totalStaked > 0 && (
            <div className="ml-auto flex items-center gap-1">
              <PieChart className="w-3 h-3 text-orange-400" />
              <span className="text-[9px] text-orange-400 font-display">{vaults.filter(v => v.stakedAmount > 0).length} ACTIVE</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
        {vaults.map(v => (
          <div key={v.id} className="p-3 border border-border bg-black/30" data-testid={`vault-${v.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-display text-xs text-white" data-testid={`text-vault-name-${v.id}`}>{v.vaultName}</span>
                <span className="text-[9px] text-muted-foreground ml-2" data-testid={`text-vault-protocol-${v.id}`}>{v.protocol}</span>
              </div>
              <div className="flex items-center gap-1 text-green-400">
                <Percent className="w-3 h-3" />
                <span className="font-display text-sm" data-testid={`text-vault-apy-${v.id}`}>{v.apy}%</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] mb-2">
              <span className="text-muted-foreground">TVL: <span className="text-white" data-testid={`text-vault-tvl-${v.id}`}>{formatTVL(v.tvl)}</span></span>
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
