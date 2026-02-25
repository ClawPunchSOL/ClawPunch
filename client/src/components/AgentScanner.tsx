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
    "CONNECTING TO TREND ENGINE...",
    "PULLING BOOSTED SOLANA TOKENS...",
    "CROSS-REFERENCING MARKET TRENDS...",
    "ANALYZING VOLUME/LIQUIDITY RATIOS...",
    "SCANNING FOR PUMP & DUMP SIGNALS...",
    "GENERATING ALPHA REPORT...",
  ],
  "ape-vault": [
    "QUERYING YIELD AGGREGATOR...",
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
  "swarm-monkey": [
    "CONNECTING TO MOLTBOOK NETWORK...",
    "SCANNING REGISTERED AGENTS...",
    "ANALYZING SWARM HEALTH METRICS...",
    "CHECKING AGENT ACTIVITY LOGS...",
    "GENERATING NETWORK INTEL...",
  ],
  "banana-cannon": [
    "LOADING TOKEN LAUNCH ENGINE...",
    "SCANNING RECENT DEPLOYMENTS...",
    "ANALYZING LAUNCH TRENDS...",
    "CHECKING DEPLOYMENT STATUS...",
    "GENERATING LAUNCH INTEL...",
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
  const [displayedAnalysis, setDisplayedAnalysis] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phaseInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoScanned = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisRef = useRef<string>("");

  const colors = colorMap[accentColor] || colorMap.yellow;
  const phases = SCAN_PHASES[agentType] || ["SCANNING...", "ANALYZING...", "GENERATING REPORT..."];

  useEffect(() => {
    analysisRef.current = analysis;
  }, [analysis]);

  useEffect(() => {
    if (!scanning && !analysis) {
      setDisplayedAnalysis("");
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
      return;
    }

    if (analysis && !typewriterRef.current) {
      typewriterRef.current = setInterval(() => {
        setDisplayedAnalysis(prev => {
          const full = analysisRef.current;
          if (prev.length >= full.length) {
            if (!scanning) {
              if (typewriterRef.current) {
                clearInterval(typewriterRef.current);
                typewriterRef.current = null;
              }
            }
            return full;
          }
          const charsToAdd = Math.min(3, full.length - prev.length);
          return full.slice(0, prev.length + charsToAdd);
        });
      }, 12);
    }

    return () => {};
  }, [analysis, scanning]);

  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  useEffect(() => {
    if (contentRef.current && (scanning || displayedAnalysis)) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedAnalysis, scanning]);

  const runScan = useCallback(async () => {
    setScanning(true);
    setAnalysis("");
    setDisplayedAnalysis("");
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
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
          <div className={`font-display ${isMain ? 'text-base md:text-lg' : 'text-xs md:text-sm'} tracking-wider drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]`} style={{ color: colors.accent }}>
            {text}
          </div>
          <div className="h-[3px] mt-2" style={{ background: `linear-gradient(90deg, ${colors.accent}80, transparent)` }} />
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
      background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(10,15,10,0.9) 100%)',
    }}>
      <div className="flex items-center justify-between px-5 md:px-6 py-3 border-b-4 border-foreground shrink-0 relative z-10 bg-black/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative p-1.5 border-2 bg-black/60" style={{ borderColor: `${colors.accent}60` }}>
            {scanning ? (
              <Radar className="w-5 h-5" style={{ color: colors.accent, animation: 'spin 2s linear infinite' }} />
            ) : (
              <Terminal className="w-5 h-5" style={{ color: colors.accent }} />
            )}
          </div>
          <span className="font-display text-xs md:text-sm tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" style={{ color: colors.accent }}>
            {label}
          </span>
          {scanning && (
            <div className="flex items-center gap-2 ml-2">
              <div className="flex gap-1">
                {phases.map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 border border-foreground/20 transition-all duration-500" style={{
                    backgroundColor: i <= phase ? colors.accent : 'rgba(255,255,255,0.04)',
                    boxShadow: i <= phase ? `0 0 8px ${colors.accent}` : 'none',
                  }} />
                ))}
              </div>
              <span className="text-[9px] text-muted-foreground/50 font-display hidden md:inline truncate max-w-[250px]">
                {phases[phase]}
              </span>
            </div>
          )}
          {hasScanned && !scanning && !error && (
            <span className="text-[10px] text-green-400 font-display flex items-center gap-1.5 ml-2 bg-green-500/10 border border-green-500/30 px-2 py-0.5">
              <Shield className="w-3 h-3" /> COMPLETE
            </span>
          )}
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          data-testid={`button-scan-${agentType}`}
          className="retro-button py-1.5 px-4 text-[10px] disabled:opacity-30 active:scale-95 bg-black border-2"
          style={{
            borderColor: `${colors.accent}70`,
            color: colors.accent,
            boxShadow: `3px 3px 0px rgba(0,0,0,0.4)`,
          }}
        >
          {scanning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : hasScanned ? (
            <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> RE-SCAN</span>
          ) : (
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> SCAN</span>
          )}
        </button>
      </div>

      {scanning && (
        <div className="h-1.5 shrink-0 overflow-hidden relative bg-black border-b-2 border-foreground/10">
          <div className="h-full transition-all duration-700 ease-out relative" style={{
            width: `${progressPercent}%`,
            backgroundColor: colors.accent,
            boxShadow: `0 0 20px ${colors.accent}, 0 0 40px ${colors.accent}50`,
          }}>
            <div className="absolute right-0 top-0 bottom-0 w-8" style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent})`,
              animation: 'pulse 1s ease-in-out infinite',
            }} />
          </div>
        </div>
      )}

      <div ref={contentRef} className={`${fullHeight ? 'flex-1 min-h-0' : 'max-h-[500px]'} overflow-y-auto custom-scrollbar relative z-10`}>
        {scanning && !displayedAnalysis && (
          <div className="px-6 py-16 md:py-20 flex flex-col items-center justify-center gap-8">
            <div className="relative w-28 h-28 md:w-32 md:h-32">
              <div className="absolute inset-0 border-4 border-foreground/10 animate-ping opacity-20" />
              <div className="absolute inset-4 border-4 border-foreground/10 animate-ping opacity-15" style={{ animationDelay: '0.4s' }} />
              <div className="absolute inset-8 border-4 border-foreground/10 animate-pulse opacity-30" />
              <Radar className="absolute inset-0 m-auto w-10 h-10 md:w-12 md:h-12" style={{ color: colors.accent, animation: 'spin 2s linear infinite', filter: `drop-shadow(0 0 12px ${colors.accent})` }} />
            </div>
            <div className="text-center space-y-4">
              <p className="font-display text-sm md:text-base tracking-[0.3em] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" style={{ color: colors.accent }}>
                ANALYZING LIVE DATA
              </p>
              <p className="text-[10px] text-muted-foreground/40 font-display tracking-wider max-w-[300px]">
                {phases[phase]}
              </p>
              <div className="flex justify-center gap-2 pt-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-1.5 h-5 border border-foreground/10" style={{
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
            <div className="retro-container p-4 bg-black/80 flex items-center gap-3 border-red-500/50 border-4">
              <Shield className="w-5 h-5 text-red-400" />
              <span className="text-[11px] text-red-400 font-display">{error}</span>
              <button onClick={runScan} className="retro-button py-1 px-3 border-2 border-red-500/50 text-red-400 text-[10px]">RETRY</button>
            </div>
          </div>
        )}

        {displayedAnalysis && (
          <div className="relative">
            <div className="px-6 md:px-8 py-6 md:py-8 relative">
              <div className="text-[12px] md:text-[13px] text-gray-300/90 leading-[1.9] whitespace-pre-wrap font-sans">
                {displayedAnalysis.split('\n').map(renderLine)}
                {(scanning || displayedAnalysis.length < analysis.length) && (
                  <span className="inline-block w-3 h-5 ml-1 align-middle border border-foreground/20" style={{
                    backgroundColor: colors.accent,
                    boxShadow: `0 0 10px ${colors.accent}`,
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
