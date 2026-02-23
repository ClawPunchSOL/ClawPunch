import { useState, useEffect } from "react";
import { ShieldAlert, Search, Loader2, CheckCircle, XCircle, AlertTriangle, Globe } from "lucide-react";
import AgentIntel from "@/components/AgentIntel";

interface SecurityScan {
  id: number;
  contractAddress: string;
  tokenName: string | null;
  safetyScore: number;
  mintAuth: string;
  freezeAuth: string;
  lpLocked: string;
  holderDistribution: string;
  verdict: string;
  scannedAt: string;
}

export default function RugBusterPanel() {
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [address, setAddress] = useState("");
  const [activeScan, setActiveScan] = useState<SecurityScan | null>(null);
  const [scanStatus, setScanStatus] = useState("");

  useEffect(() => {
    fetch("/api/security/scans").then(r => r.json()).then(setScans).finally(() => setLoading(false));
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || scanning) return;
    setScanning(true);
    setActiveScan(null);
    setScanStatus("Connecting to Solana mainnet...");

    try {
      const res = await fetch("/api/security/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress: address.trim() }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.message) setScanStatus(data.message);
            if (data.scan) {
              setActiveScan(data.scan);
              setScans(prev => [data.scan, ...prev]);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setScanning(false);
      setAddress("");
      setScanStatus("");
    }
  };

  const scoreColor = (score: number) => score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
  const scoreBg = (score: number) => score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  const checkIcon = (val: string) => {
    if (val === "REVOKED" || val === "LOCKED" || val === "BURNED" || val === "HEALTHY") return <CheckCircle className="w-3 h-3 text-green-400" />;
    if (val === "ACTIVE" || val === "UNLOCKED" || val === "CONCENTRATED" || val === "WHALE_HEAVY") return <XCircle className="w-3 h-3 text-red-400" />;
    return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="font-display text-[11px] text-white">RUG SCANNER</span>
          <span className="text-[10px] text-red-400 font-display">{scans.length} SCANS</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Globe className="w-3 h-3" />
          <span className="font-display">SOLANA MAINNET</span>
        </div>
      </div>

      <form onSubmit={handleScan} className="flex gap-2">
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Paste Solana token mint address..."
          disabled={scanning}
          data-testid="input-contract-address"
          className="flex-1 bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-red-500 placeholder:text-muted-foreground/50 disabled:opacity-50 font-mono text-xs"
        />
        <button type="submit" disabled={scanning || !address.trim()} data-testid="button-scan-contract" className="retro-button retro-button-primary px-4 py-2 text-[10px] disabled:opacity-50 flex items-center gap-1.5">
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          SCAN
        </button>
      </form>

      {scanning && !activeScan && (
        <div className="p-4 border-2 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
            <div>
              <div className="font-display text-[10px] text-red-400">SCANNING ON-CHAIN DATA</div>
              <div className="text-[10px] text-muted-foreground">{scanStatus}</div>
            </div>
          </div>
          <div className="w-full h-1 bg-black/50 overflow-hidden">
            <div className="h-full bg-red-500/60 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {activeScan && (
        <AgentIntel
          agentType="rug-buster"
          data={{ address: activeScan.contractAddress, name: activeScan.tokenName, safetyScore: activeScan.safetyScore, mintAuth: activeScan.mintAuth, freezeAuth: activeScan.freezeAuth, lpLocked: activeScan.lpLocked, holders: activeScan.holderDistribution, verdict: activeScan.verdict }}
          accentColor="red"
          label="RUG BUSTER ANALYSIS"
        />
      )}

      {activeScan && (
        <div className="p-4 border-2 border-border bg-black/40 space-y-3" data-testid="scan-result-active">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-xs text-white">{activeScan.tokenName || "UNKNOWN TOKEN"}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{activeScan.contractAddress.slice(0, 8)}...{activeScan.contractAddress.slice(-6)}</div>
            </div>
            <div className="text-right">
              <div className={`font-display text-2xl ${scoreColor(activeScan.safetyScore)}`}>{activeScan.safetyScore}</div>
              <div className="text-[9px] text-muted-foreground font-display">SAFETY SCORE</div>
            </div>
          </div>
          <div className="w-full h-2 bg-black/50 border border-border">
            <div className={`h-full ${scoreBg(activeScan.safetyScore)} transition-all`} style={{ width: `${activeScan.safetyScore}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 p-1.5 bg-black/30 border border-border">{checkIcon(activeScan.mintAuth)} <span className="text-muted-foreground">Mint:</span> <span className="text-white font-display">{activeScan.mintAuth}</span></div>
            <div className="flex items-center gap-1.5 p-1.5 bg-black/30 border border-border">{checkIcon(activeScan.freezeAuth)} <span className="text-muted-foreground">Freeze:</span> <span className="text-white font-display">{activeScan.freezeAuth}</span></div>
            <div className="flex items-center gap-1.5 p-1.5 bg-black/30 border border-border">{checkIcon(activeScan.lpLocked)} <span className="text-muted-foreground">LP:</span> <span className="text-white font-display">{activeScan.lpLocked}</span></div>
            <div className="flex items-center gap-1.5 p-1.5 bg-black/30 border border-border">{checkIcon(activeScan.holderDistribution)} <span className="text-muted-foreground">Holders:</span> <span className="text-white font-display">{activeScan.holderDistribution}</span></div>
          </div>
          <div className="flex items-center gap-1 text-[8px] text-muted-foreground/60 justify-center">
            <Globe className="w-2.5 h-2.5" />
            <span>DATA FROM SOLANA MAINNET RPC</span>
          </div>
          <div className={`text-center py-1.5 font-display text-xs border ${
            activeScan.verdict === 'SAFE' ? 'border-green-500/50 bg-green-500/10 text-green-400' :
            activeScan.verdict === 'DANGER' || activeScan.verdict === 'HIGH_RISK' ? 'border-red-500/50 bg-red-500/10 text-red-400' :
            'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
          }`}>
            VERDICT: {activeScan.verdict}
          </div>
        </div>
      )}

      {!loading && scans.length > (activeScan ? 1 : 0) && (
        <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
          <div className="font-display text-[9px] text-muted-foreground mb-1">SCAN HISTORY</div>
          {scans.filter(s => s.id !== activeScan?.id).slice(0, 5).map(scan => (
            <button key={scan.id} onClick={() => setActiveScan(scan)} className="w-full flex items-center justify-between p-2 border border-border bg-black/20 hover:bg-black/40 transition-colors text-left" data-testid={`scan-history-${scan.id}`}>
              <div className="min-w-0">
                <span className="text-[10px] text-white font-display truncate block">{scan.tokenName || "UNKNOWN"}</span>
                <span className="text-[9px] text-muted-foreground font-mono">{scan.contractAddress.slice(0, 12)}...</span>
              </div>
              <span className={`font-display text-sm ${scoreColor(scan.safetyScore)}`}>{scan.safetyScore}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
