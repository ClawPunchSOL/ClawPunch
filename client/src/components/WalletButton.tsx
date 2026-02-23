import { useState, useEffect, useCallback } from "react";
import { Wallet, LogOut, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import {
  connectWallet, disconnectWallet, refreshBalance,
  subscribeWallet, getWalletState, shortAddress, isPhantomInstalled,
  type WalletState
} from "@/lib/solanaWallet";

export function useWalletState(): WalletState {
  const [state, setState] = useState<WalletState>(getWalletState);
  useEffect(() => subscribeWallet(setState), []);
  return state;
}

export default function WalletButton() {
  const wallet = useWalletState();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refreshBalance();
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const copyAddress = () => {
    if (!wallet.publicKey) return;
    navigator.clipboard.writeText(wallet.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!wallet.connected) {
    return (
      <button
        onClick={connectWallet}
        disabled={wallet.connecting}
        data-testid="button-connect-wallet"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 text-purple-400 text-[10px] font-display hover:bg-purple-500/30 transition-colors disabled:opacity-50"
      >
        <Wallet className="w-3.5 h-3.5" />
        {wallet.connecting ? "CONNECTING..." : isPhantomInstalled() ? "CONNECT WALLET" : "GET PHANTOM"}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        data-testid="button-wallet-info"
        className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/40 text-green-400 text-[10px] font-display hover:bg-green-500/20 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="font-mono">{shortAddress(wallet.publicKey)}</span>
        {wallet.balance !== null && (
          <span className="text-white/70 font-mono">{wallet.balance.toFixed(3)} SOL</span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-[240px] bg-black/95 border border-border shadow-xl">
            <div className="p-3 border-b border-border">
              <div className="font-display text-[9px] text-muted-foreground mb-1">CONNECTED WALLET</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="font-mono text-[10px] text-white flex-1 truncate">{wallet.publicKey}</span>
              </div>
            </div>

            <div className="p-3 border-b border-border">
              <div className="font-display text-[9px] text-muted-foreground mb-1">BALANCE</div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-white font-mono">
                  {wallet.balance !== null ? `${wallet.balance.toFixed(4)} SOL` : "Loading..."}
                </span>
                <button onClick={handleRefresh} disabled={refreshing}
                  className="text-muted-foreground hover:text-white transition-colors">
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-1.5 space-y-0.5">
              <button onClick={() => { copyAddress(); setShowDropdown(false); }}
                data-testid="button-copy-address"
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "COPIED" : "COPY ADDRESS"}
              </button>
              <a href={`https://solscan.io/account/${wallet.publicKey}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => setShowDropdown(false)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                <ExternalLink className="w-3 h-3" /> VIEW ON SOLSCAN
              </a>
              <button onClick={() => { disconnectWallet(); setShowDropdown(false); }}
                data-testid="button-disconnect-wallet"
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
                <LogOut className="w-3 h-3" /> DISCONNECT
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
