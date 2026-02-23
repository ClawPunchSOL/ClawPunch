import { useState, useEffect, useCallback } from "react";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, shortAddress } from "@/lib/solanaWallet";
import { Zap, TrendingUp, TrendingDown, Loader2, Wallet, RefreshCw, ExternalLink, Flame, Twitter, MessageCircle, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import AgentScanner from "@/components/AgentScanner";

interface TrendingToken {
  address: string;
  name: string;
  symbol: string;
  price: string;
  priceChange5m: number;
  priceChange1h: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  boostAmount: number;
  dexUrl: string;
  socials: string[];
  pairAddress: string;
}

interface GlobalTrend {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  marketCapRank: number;
  priceChange24h: number;
  price: number;
  marketCap: string;
  volume: string;
}

const formatCompact = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  if (n > 0) return `$${n.toFixed(0)}`;
  return "$0";
};

const formatPrice = (price: string | number) => {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(p) || p === 0) return "$0";
  if (p < 0.0001) return `$${p.toExponential(2)}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ChangeTag = ({ val, size = "text-[9px]" }: { val: number; size?: string }) => {
  if (val === 0) return null;
  return (
    <span className={`${size} font-display ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>
      {val > 0 ? '+' : ''}{val.toFixed(1)}%
    </span>
  );
};

export default function TrendPuncherPanel({ onSendChat }: { onSendChat: (msg: string) => void }) {
  const wallet = useWalletState();
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [globalTrends, setGlobalTrends] = useState<GlobalTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"solana" | "global">("solana");
  const [showRawData, setShowRawData] = useState(false);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch("/api/trending/tokens");
      if (res.ok) setTokens(await res.json());
    } catch {}
  }, []);

  const fetchGlobal = useCallback(async () => {
    try {
      const res = await fetch("/api/trending/global");
      if (res.ok) setGlobalTrends(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchTrending(), fetchGlobal()]).finally(() => setLoading(false));
    const interval = setInterval(() => { fetchTrending(); fetchGlobal(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchTrending, fetchGlobal]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetch("/api/attention/refresh", { method: "POST" }).then(r => r.json()).then(setTokens),
        fetchGlobal(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
        <span className="text-[10px] text-muted-foreground font-display">SCANNING DEXSCREENER...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-display text-[11px] text-white">VIRAL SCANNER</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground font-display">
            {tokens.length} TRENDING
          </span>
          <button onClick={handleRefresh} disabled={refreshing} data-testid="button-refresh-trends"
            className="flex items-center gap-1 px-2 py-0.5 border border-yellow-500/30 text-yellow-400 text-[9px] font-display hover:bg-yellow-500/10 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'SCANNING' : 'SCAN'}
          </button>
        </div>
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => setActiveTab("solana")}
          data-testid="tab-solana-trending"
          className={`flex-1 py-1.5 text-[10px] font-display border-2 transition-colors ${activeTab === "solana" ? "border-yellow-500 bg-yellow-500/20 text-yellow-400" : "border-border text-muted-foreground hover:border-yellow-500/30"}`}
        >
          <Flame className="w-3 h-3 inline mr-1" />SOLANA VIRAL ({tokens.length})
        </button>
        <button
          onClick={() => setActiveTab("global")}
          data-testid="tab-global-trending"
          className={`flex-1 py-1.5 text-[10px] font-display border-2 transition-colors ${activeTab === "global" ? "border-yellow-500 bg-yellow-500/20 text-yellow-400" : "border-border text-muted-foreground hover:border-yellow-500/30"}`}
        >
          <BarChart3 className="w-3 h-3 inline mr-1" />GLOBAL TREND ({globalTrends.length})
        </button>
      </div>

      <AgentScanner
        agentType="trend-puncher"
        accentColor="yellow"
        label="🧠 TREND PUNCHER AI"
        autoScan={tokens.length > 0}
      />

      {wallet.connected && wallet.publicKey && (
        <div className="flex items-center gap-2 px-2 py-1.5 border border-yellow-500/20 bg-yellow-500/5">
          <Wallet className="w-3 h-3 text-yellow-400" />
          <span className="text-[9px] text-yellow-400 font-display">CONNECTED:</span>
          <span className="text-[9px] text-white font-mono">{shortAddress(wallet.publicKey)}</span>
          {wallet.balance !== null && (
            <span className="text-[9px] text-muted-foreground ml-auto font-display">{wallet.balance.toFixed(4)} SOL</span>
          )}
        </div>
      )}

      <button
        onClick={() => setShowRawData(!showRawData)}
        className="w-full flex items-center justify-between px-2 py-1.5 border border-border bg-black/20 hover:bg-black/40 transition-colors"
        data-testid="toggle-raw-data"
      >
        <span className="text-[9px] text-muted-foreground font-display">RAW TOKEN DATA ({tokens.length} tokens)</span>
        {showRawData ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>

      {showRawData && (
        <>
          {activeTab === "solana" && (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
              {tokens.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No trending tokens found. Hit SCAN to refresh.
                </div>
              ) : (
                <>
                  <div className="text-[8px] text-muted-foreground/60 px-1">
                    Live from DexScreener — most boosted Solana tokens right now
                  </div>
                  {tokens.map((t, i) => {
                    const isHot = t.priceChange5m > 5 || t.priceChange1h > 10;
                    const isDumping = t.priceChange1h < -15;
                    return (
                      <div key={t.address} className={`p-2.5 border bg-black/30 hover:bg-black/50 transition-colors ${isHot ? 'border-yellow-500/40' : isDumping ? 'border-red-500/30' : 'border-border'}`} data-testid={`trending-token-${t.address}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground font-display">#{i + 1}</span>
                            <span className="font-display text-xs text-white">${t.symbol}</span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">{t.name}</span>
                            {isHot && <Flame className="w-3 h-3 text-orange-400" />}
                            {t.socials.includes("twitter") && <Twitter className="w-2.5 h-2.5 text-blue-400/60" />}
                            {t.socials.includes("telegram") && <MessageCircle className="w-2.5 h-2.5 text-blue-400/60" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-display text-yellow-400">{formatPrice(t.price)}</span>
                            <span className="text-[8px] text-muted-foreground/50 font-display">BOOST:{t.boostAmount}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-1.5 text-[9px]">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">5m:</span>
                              <ChangeTag val={t.priceChange5m} />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">1h:</span>
                              <ChangeTag val={t.priceChange1h} />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">24h:</span>
                              <ChangeTag val={t.priceChange24h} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] mb-2">
                          <div className="flex items-center gap-3">
                            {t.volume24h > 0 && (
                              <span className="text-muted-foreground">Vol: <span className="text-white">{formatCompact(t.volume24h)}</span></span>
                            )}
                            {t.liquidity > 0 && (
                              <span className="text-muted-foreground">Liq: <span className="text-white">{formatCompact(t.liquidity)}</span></span>
                            )}
                            {t.marketCap > 0 && (
                              <span className="text-muted-foreground">MCap: <span className="text-white">{formatCompact(t.marketCap)}</span></span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <a href={t.dexUrl} target="_blank" rel="noopener noreferrer" data-testid={`dex-link-${t.address}`}
                            className="flex-1 py-1 border border-yellow-500/50 text-yellow-400 text-[9px] font-display hover:bg-yellow-500/10 transition-colors flex items-center justify-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" /> CHART
                          </a>
                          <a href={`https://jup.ag/swap/SOL-${t.address}`} target="_blank" rel="noopener noreferrer" data-testid={`buy-link-${t.address}`}
                            className="flex-1 py-1 border border-green-500/50 text-green-400 text-[9px] font-display hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5" /> BUY
                          </a>
                          <a href={`https://jup.ag/swap/${t.address}-SOL`} target="_blank" rel="noopener noreferrer" data-testid={`sell-link-${t.address}`}
                            className="flex-1 py-1 border border-red-500/50 text-red-400 text-[9px] font-display hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1">
                            <TrendingDown className="w-2.5 h-2.5" /> SELL
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
          {activeTab === "global" && (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
              {globalTrends.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  Loading global trends...
                </div>
              ) : (
                <>
                  <div className="text-[8px] text-muted-foreground/60 px-1">
                    CoinGecko trending — what the world is searching right now
                  </div>
                  {globalTrends.map((t, i) => (
                    <div key={t.id} className="p-2.5 border border-border bg-black/30 hover:bg-black/50 transition-colors" data-testid={`global-trend-${t.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground font-display">#{i + 1}</span>
                          {t.thumb && <img src={t.thumb} alt="" className="w-4 h-4 rounded-full" />}
                          <span className="font-display text-xs text-white">{t.symbol}</span>
                          <span className="text-[9px] text-muted-foreground">{t.name}</span>
                          {t.marketCapRank && (
                            <span className="text-[8px] text-muted-foreground/50">Rank #{t.marketCapRank}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {t.price > 0 && <span className="text-[10px] font-display text-yellow-400">{formatPrice(t.price)}</span>}
                          <ChangeTag val={t.priceChange24h} />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
