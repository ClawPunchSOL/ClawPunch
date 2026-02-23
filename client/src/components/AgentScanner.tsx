import { useState, useEffect, useCallback, useRef } from "react";
import { Brain, Loader2, RefreshCw, ChevronDown, ChevronUp, Radar, Zap, Shield, Eye } from "lucide-react";

interface AgentScannerProps {
  agentType: string;
  accentColor?: string;
  label?: string;
  context?: any;
  autoScan?: boolean;
}

const SCAN_PHASES: Record<string, string[]> = {
  "trend-puncher": [
    "CONNECTING TO DEXSCREENER API...",
    "PULLING BOOSTED SOLANA TOKENS...",
    "CROSS-REFERENCING COINGECKO TRENDS...",
    "ANALYZING VOLUME/LIQUIDITY RATIOS...",
    "SCANNING FOR PUMP & DUMP SIGNALS...",
    "GENERATING ALPHA REPORT...",
  ],
  "ape-vault": [
    "QUERYING DEFI LLAMA YIELDS API...",
    "FILTERING SOLANA PROTOCOLS...",
    "COMPARING APY VS TVL RISK PROFILES...",
    "CHECKING PROTOCOL HEALTH METRICS...",
    "BUILDING YIELD STRATEGY...",
  ],
  "punch-oracle": [
    "FETCHING LIVE PREDICTION MARKETS...",
    "PULLING REAL-TIME CRYPTO PRICES...",
    "ANALYZING ODDS VS MARKET SENTIMENT...",
    "SCANNING FOR MISPRICED MARKETS...",
    "GENERATING CONVICTION PICKS...",
  ],
  "rug-buster": [
    "READING ON-CHAIN TOKEN DATA...",
    "CHECKING MINT & FREEZE AUTHORITIES...",
    "ANALYZING HOLDER DISTRIBUTION...",
    "SCANNING LP LOCK STATUS...",
    "GENERATING SAFETY VERDICT...",
  ],
  "banana-bot": [
    "CHECKING SOLANA NETWORK STATUS...",
    "ANALYZING GAS FEES & CONGESTION...",
    "SCANNING RECENT TRANSFER PATTERNS...",
    "GENERATING TX RECOMMENDATIONS...",
  ],
};

const colorMap: Record<string, { border: string; bg: string; text: string; glow: string; scanLine: string }> = {
  yellow: { border: "border-yellow-500/50", bg: "bg-yellow-500/5", text: "text-yellow-400", glow: "shadow-yellow-500/20", scanLine: "bg-yellow-500/30" },
  purple: { border: "border-purple-500/50", bg: "bg-purple-500/5", text: "text-purple-400", glow: "shadow-purple-500/20", scanLine: "bg-purple-500/30" },
  green: { border: "border-green-500/50", bg: "bg-green-500/5", text: "text-green-400", glow: "shadow-green-500/20", scanLine: "bg-green-500/30" },
  red: { border: "border-red-500/50", bg: "bg-red-500/5", text: "text-red-400", glow: "shadow-red-500/20", scanLine: "bg-red-500/30" },
  cyan: { border: "border-cyan-500/50", bg: "bg-cyan-500/5", text: "text-cyan-400", glow: "shadow-cyan-500/20", scanLine: "bg-cyan-500/30" },
  orange: { border: "border-orange-500/50", bg: "bg-orange-500/5", text: "text-orange-400", glow: "shadow-orange-500/20", scanLine: "bg-orange-500/30" },
};

export default function AgentScanner({ agentType, accentColor = "yellow", label = "AI SCANNER", context, autoScan = true }: AgentScannerProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const phaseInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoScanned = useRef(false);

  const colors = colorMap[accentColor] || colorMap.yellow;
  const phases = SCAN_PHASES[agentType] || ["SCANNING...", "ANALYZING...", "GENERATING REPORT..."];

  const runScan = useCallback(async () => {
    setScanning(true);
    setAnalysis("");
    setError(null);
    setPhase(0);
    setHasScanned(true);
    setExpanded(true);

    phaseInterval.current = setInterval(() => {
      setPhase(prev => Math.min(prev + 1, phases.length - 1));
    }, 1800);

    try {
      const res = await fetch(`/api/agent-scan/${agentType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: context || {} }),
      });

      if (!res.ok) {
        setError("Scanner unavailable. Retrying...");
        return;
      }

      if (phaseInterval.current) clearInterval(phaseInterval.current);
      setPhase(phases.length - 1);

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
          if (line.startsWith("data: ")) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.text) {
                setAnalysis(prev => prev + parsed.text);
              }
              if (parsed.source) {
                setPhase(phases.length - 1);
              }
            } catch {}
          }
        }
      }
    } catch {
      setError("Connection lost. Try re-scanning.");
    } finally {
      if (phaseInterval.current) clearInterval(phaseInterval.current);
      setScanning(false);
    }
  }, [agentType, context, phases.length]);

  useEffect(() => {
    if (autoScan && !hasAutoScanned.current) {
      hasAutoScanned.current = true;
      runScan();
    }
  }, [autoScan, runScan]);

  useEffect(() => {
    return () => {
      if (phaseInterval.current) clearInterval(phaseInterval.current);
    };
  }, []);

  return (
    <div className={`border-2 ${colors.border} ${colors.bg} transition-all relative overflow-hidden`}>
      {scanning && (
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${colors.scanLine}`}>
          <div className="h-full bg-current animate-pulse" style={{ width: `${((phase + 1) / phases.length) * 100}%`, transition: 'width 0.5s ease' }} />
        </div>
      )}

      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={() => hasScanned && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {scanning ? (
            <Radar className={`w-3.5 h-3.5 ${colors.text} animate-pulse`} />
          ) : (
            <Brain className={`w-3.5 h-3.5 ${colors.text}`} />
          )}
          <span className={`font-display text-[10px] ${colors.text}`}>{label}</span>
          {scanning && (
            <span className="text-[8px] text-muted-foreground font-mono animate-pulse">
              {phases[phase]}
            </span>
          )}
          {hasScanned && !scanning && (
            <span className="text-[8px] text-green-400 font-display flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" /> INTEL READY
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); runScan(); }}
            disabled={scanning}
            data-testid={`button-scan-${agentType}`}
            className={`flex items-center gap-1 px-2 py-0.5 border text-[9px] font-display transition-colors disabled:opacity-50 ${colors.border} ${colors.text} hover:${colors.bg}`}
          >
            {scanning ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : hasScanned ? (
              <><RefreshCw className="w-2.5 h-2.5" /> RE-SCAN</>
            ) : (
              <><Zap className="w-2.5 h-2.5" /> SCAN</>
            )}
          </button>
          {hasScanned && (
            expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </div>

      {scanning && !analysis && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${colors.text} opacity-60`}
                  style={{ animation: `pulse 1s ease-in-out ${i * 0.3}s infinite` }} />
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">
              Claude is analyzing live data...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="px-3 pb-3">
          <div className="text-[10px] text-red-400 font-display flex items-center gap-1">
            <Shield className="w-3 h-3" /> {error}
          </div>
        </div>
      )}

      {hasScanned && expanded && analysis && (
        <div className="px-3 pb-3">
          <div className="text-[10px] text-gray-200 leading-relaxed whitespace-pre-wrap font-mono border-t border-white/5 pt-2">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
