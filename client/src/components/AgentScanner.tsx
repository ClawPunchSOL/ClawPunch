import { useState, useEffect, useCallback, useRef } from "react";
import { Radar, Loader2, RefreshCw, Zap, Shield, Terminal, ChevronRight } from "lucide-react";

interface AgentScannerProps {
  agentType: string;
  accentColor?: string;
  label?: string;
  context?: any;
  autoScan?: boolean;
  fullHeight?: boolean;
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

const colorMap: Record<string, { accent: string; dim: string }> = {
  yellow: { accent: "#eab308", dim: "rgba(234,179,8,0.15)" },
  purple: { accent: "#a855f7", dim: "rgba(168,85,247,0.15)" },
  green: { accent: "#22c55e", dim: "rgba(34,197,94,0.15)" },
  red: { accent: "#ef4444", dim: "rgba(239,68,68,0.15)" },
  cyan: { accent: "#06b6d4", dim: "rgba(6,182,212,0.15)" },
  orange: { accent: "#f97316", dim: "rgba(249,115,22,0.15)" },
};

export default function AgentScanner({ agentType, accentColor = "yellow", label = "AI SCANNER", context, autoScan = true, fullHeight = false }: AgentScannerProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phaseInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoScanned = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const colors = colorMap[accentColor] || colorMap.yellow;
  const phases = SCAN_PHASES[agentType] || ["SCANNING...", "ANALYZING...", "GENERATING REPORT..."];

  useEffect(() => {
    if (contentRef.current && (scanning || analysis)) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [analysis, scanning]);

  const runScan = useCallback(async () => {
    setScanning(true);
    setAnalysis("");
    setError(null);
    setPhase(0);
    setHasScanned(true);

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
        setError("Scanner unavailable");
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
              if (parsed.text) setAnalysis(prev => prev + parsed.text);
              if (parsed.source) setPhase(phases.length - 1);
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
    return () => { if (phaseInterval.current) clearInterval(phaseInterval.current); };
  }, []);

  const progressPercent = ((phase + 1) / phases.length) * 100;

  const renderLine = (line: string, i: number) => {
    if (line.startsWith('# ') || line.startsWith('## ')) {
      const text = line.replace(/^#+\s*/, '');
      const isMain = line.startsWith('# ');
      return (
        <div key={i} className={isMain ? 'mb-4 mt-2' : 'mb-3 mt-6'}>
          <div className={`font-display ${isMain ? 'text-base md:text-lg' : 'text-xs md:text-sm'} tracking-wider`} style={{ color: colors.accent, textShadow: `0 0 20px ${colors.accent}60` }}>
            {text}
          </div>
          <div className="h-px mt-2" style={{ background: `linear-gradient(90deg, ${colors.accent}60, transparent)` }} />
        </div>
      );
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <div key={i} className="text-white font-semibold mt-3 mb-1 text-[12px] md:text-[13px]">
          {line.replace(/\*\*/g, '')}
        </div>
      );
    }
    if (line.match(/^\*\*.*\*\*$/)) {
      return (
        <div key={i} className="text-white font-semibold mt-3 mb-1 text-[12px] md:text-[13px]">
          {line.replace(/\*\*/g, '')}
        </div>
      );
    }
    if (line.trim() === '') return <div key={i} className="h-3" />;
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <div key={i} className="mb-1 flex gap-2">
          <ChevronRight className="w-3 h-3 shrink-0 mt-1 opacity-50" style={{ color: colors.accent }} />
          <span className="flex-1">{renderInlineMarkdown(line.slice(2))}</span>
        </div>
      );
    }
    return <div key={i} className="mb-0.5">{renderInlineMarkdown(line)}</div>;
  };

  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="text-white font-semibold">{part.slice(2, -2)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`relative ${fullHeight ? 'flex flex-col flex-1 min-h-0' : ''}`} style={{
      background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)',
      }} />

      <div className="flex items-center justify-between px-5 md:px-6 py-3 border-b-2 shrink-0 relative z-10" style={{ borderColor: `${colors.accent}30` }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            {scanning ? (
              <Radar className="w-5 h-5" style={{ color: colors.accent, animation: 'spin 2s linear infinite' }} />
            ) : (
              <Terminal className="w-5 h-5" style={{ color: colors.accent }} />
            )}
            {scanning && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: colors.accent, opacity: 0.6 }} />
            )}
          </div>
          <span className="font-display text-[11px] md:text-xs tracking-widest" style={{ color: colors.accent, textShadow: `0 0 10px ${colors.accent}40` }}>
            {label}
          </span>
          {scanning && (
            <div className="flex items-center gap-2 ml-2">
              <div className="flex gap-1">
                {phases.map((_, i) => (
                  <div key={i} className="w-2 h-2 transition-all duration-500" style={{
                    backgroundColor: i <= phase ? colors.accent : 'rgba(255,255,255,0.06)',
                    boxShadow: i <= phase ? `0 0 6px ${colors.accent}` : 'none',
                  }} />
                ))}
              </div>
              <span className="text-[9px] text-muted-foreground/50 font-mono hidden md:inline truncate max-w-[250px]">
                {phases[phase]}
              </span>
            </div>
          )}
          {hasScanned && !scanning && !error && (
            <span className="text-[9px] text-green-400/70 font-display flex items-center gap-1.5 ml-2">
              <Shield className="w-3 h-3" /> SCAN COMPLETE
            </span>
          )}
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          data-testid={`button-scan-${agentType}`}
          className="flex items-center gap-2 px-4 py-1.5 border-2 font-display text-[10px] transition-all disabled:opacity-30 active:scale-95 hover:bg-white/5"
          style={{
            borderColor: `${colors.accent}50`,
            color: colors.accent,
            boxShadow: `2px 2px 0px rgba(0,0,0,0.3)`,
          }}
        >
          {scanning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : hasScanned ? (
            <><RefreshCw className="w-3.5 h-3.5" /> RE-SCAN</>
          ) : (
            <><Zap className="w-3.5 h-3.5" /> SCAN</>
          )}
        </button>
      </div>

      {scanning && (
        <div className="h-1 shrink-0 overflow-hidden relative" style={{ backgroundColor: `${colors.accent}10` }}>
          <div className="h-full transition-all duration-700 ease-out relative" style={{
            width: `${progressPercent}%`,
            backgroundColor: colors.accent,
            boxShadow: `0 0 15px ${colors.accent}, 0 0 40px ${colors.accent}50`,
          }}>
            <div className="absolute right-0 top-0 bottom-0 w-8" style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent})`,
              animation: 'pulse 1s ease-in-out infinite',
            }} />
          </div>
        </div>
      )}

      <div ref={contentRef} className={`${fullHeight ? 'flex-1 min-h-0' : 'max-h-[500px]'} overflow-y-auto custom-scrollbar relative z-10`}>
        {scanning && !analysis && (
          <div className="px-6 py-12 md:py-16 flex flex-col items-center justify-center gap-6">
            <div className="relative w-24 h-24 md:w-28 md:h-28">
              <div className="absolute inset-0 border-2 animate-ping opacity-20" style={{ borderColor: colors.accent }} />
              <div className="absolute inset-3 border-2 animate-ping opacity-15" style={{ borderColor: colors.accent, animationDelay: '0.4s' }} />
              <div className="absolute inset-6 border-2 animate-pulse opacity-30" style={{ borderColor: colors.accent }} />
              <div className="absolute inset-8 border-2 animate-pulse opacity-40" style={{ borderColor: colors.accent, animationDelay: '0.2s' }} />
              <Radar className="absolute inset-0 m-auto w-8 h-8 md:w-10 md:h-10" style={{ color: colors.accent, animation: 'spin 2s linear infinite', filter: `drop-shadow(0 0 8px ${colors.accent})` }} />
            </div>
            <div className="text-center space-y-3">
              <p className="font-display text-xs md:text-sm tracking-[0.3em]" style={{ color: colors.accent, textShadow: `0 0 15px ${colors.accent}50` }}>
                ANALYZING LIVE DATA
              </p>
              <p className="text-[10px] text-muted-foreground/40 font-mono max-w-[250px]">
                {phases[phase]}
              </p>
              <div className="flex justify-center gap-1.5 pt-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-1 h-4" style={{
                    backgroundColor: colors.accent,
                    opacity: 0.4,
                    animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-8 flex items-center justify-center">
            <div className="text-[11px] text-red-400 font-display flex items-center gap-3 p-4 border-2 border-red-500/30 bg-red-500/5" style={{ boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}>
              <Shield className="w-5 h-5" />
              <span>{error}</span>
              <button onClick={runScan} className="ml-3 px-3 py-1 border border-red-400/50 text-red-300 hover:bg-red-500/10 text-[10px] font-display">RETRY</button>
            </div>
          </div>
        )}

        {analysis && (
          <div className="relative">
            <div className="px-6 md:px-8 py-5 md:py-6 relative">
              <div className="text-[12px] md:text-[13px] text-gray-300/90 leading-[1.9] whitespace-pre-wrap font-sans">
                {analysis.split('\n').map(renderLine)}
                {scanning && (
                  <span className="inline-block w-2.5 h-5 ml-1 align-middle" style={{
                    backgroundColor: colors.accent,
                    boxShadow: `0 0 8px ${colors.accent}`,
                    animation: 'blink 0.6s step-end infinite',
                  }} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
