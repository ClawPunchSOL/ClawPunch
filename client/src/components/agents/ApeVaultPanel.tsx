import { useState } from "react";
import { Cpu, ArrowDown, ArrowUp, Percent } from "lucide-react";

interface Vault {
  id: string;
  name: string;
  protocol: string;
  apy: number;
  tvl: number;
  staked: number;
  token: string;
}

const MOCK_VAULTS: Vault[] = [
  { id: "1", name: "SOL-USDC", protocol: "Raydium", apy: 24.5, tvl: 12400000, staked: 0, token: "SOL" },
  { id: "2", name: "PUNCH-SOL", protocol: "Orca", apy: 142.8, tvl: 890000, staked: 0, token: "PUNCH" },
  { id: "3", name: "USDC Lending", protocol: "Meteora", apy: 8.2, tvl: 45000000, staked: 0, token: "USDC" },
  { id: "4", name: "JUP-USDC", protocol: "Raydium", apy: 34.1, tvl: 5600000, staked: 0, token: "JUP" },
  { id: "5", name: "BONK-SOL", protocol: "Orca", apy: 89.3, tvl: 2100000, staked: 0, token: "BONK" },
];

export default function ApeVaultPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const [vaults, setVaults] = useState<Vault[]>(MOCK_VAULTS);
  const [stakeAmount, setStakeAmount] = useState<Record<string, string>>({});

  const formatTVL = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${(n/1e3).toFixed(0)}K`;
  const totalStaked = vaults.reduce((sum, v) => sum + v.staked, 0);

  const handleStake = (vault: Vault) => {
    const amt = parseFloat(stakeAmount[vault.id] || "0");
    if (amt <= 0) return;
    setVaults(prev => prev.map(v => v.id === vault.id ? { ...v, staked: v.staked + amt } : v));
    setStakeAmount(prev => ({ ...prev, [vault.id]: "" }));
    onSendChat(`Stake ${amt} ${vault.token} in ${vault.name} vault on ${vault.protocol}`);
  };

  const handleUnstake = (vault: Vault) => {
    if (vault.staked <= 0) return;
    const unstaked = vault.staked;
    setVaults(prev => prev.map(v => v.id === vault.id ? { ...v, staked: 0 } : v));
    onSendChat(`Unstake ${unstaked} ${vault.token} from ${vault.name} vault`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-orange-400" />
          <span className="font-display text-[11px] text-white">DEFI VAULTS</span>
        </div>
        {totalStaked > 0 && (
          <span className="text-[10px] font-display text-orange-400">{totalStaked.toFixed(2)} STAKED</span>
        )}
      </div>

      <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
        {vaults.map(v => (
          <div key={v.id} className="p-3 border border-border bg-black/30" data-testid={`vault-${v.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-display text-xs text-white">{v.name}</span>
                <span className="text-[9px] text-muted-foreground ml-2">{v.protocol}</span>
              </div>
              <div className="flex items-center gap-1 text-green-400">
                <Percent className="w-3 h-3" />
                <span className="font-display text-sm">{v.apy}%</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] mb-2">
              <span className="text-muted-foreground">TVL: <span className="text-white">{formatTVL(v.tvl)}</span></span>
              {v.staked > 0 && <span className="text-orange-400 font-display">YOUR STAKE: {v.staked} {v.token}</span>}
            </div>

            <div className="flex gap-1.5">
              <input
                value={stakeAmount[v.id] || ""}
                onChange={e => setStakeAmount(prev => ({ ...prev, [v.id]: e.target.value }))}
                placeholder={`Amount (${v.token})`}
                type="number"
                className="flex-1 bg-black/50 border border-border text-white px-2 py-1 text-[10px] focus:outline-none focus:border-orange-500 placeholder:text-muted-foreground/50"
              />
              <button onClick={() => handleStake(v)} data-testid={`button-stake-${v.id}`} className="px-2 py-1 border border-green-500/50 text-green-400 text-[9px] font-display hover:bg-green-500/10 transition-colors flex items-center gap-1">
                <ArrowDown className="w-2.5 h-2.5" /> STAKE
              </button>
              {v.staked > 0 && (
                <button onClick={() => handleUnstake(v)} data-testid={`button-unstake-${v.id}`} className="px-2 py-1 border border-red-500/50 text-red-400 text-[9px] font-display hover:bg-red-500/10 transition-colors flex items-center gap-1">
                  <ArrowUp className="w-2.5 h-2.5" /> EXIT
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
