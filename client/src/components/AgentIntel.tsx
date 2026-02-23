import { useState, useCallback } from "react";
import { Brain, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface AgentIntelProps {
  agentType: string;
  data: any;
  accentColor?: string;
  label?: string;
}

export default function AgentIntel({ agentType, data, accentColor = "yellow", label = "AGENT INTEL" }: AgentIntelProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const colorMap: Record<string, { border: string; bg: string; text: string; button: string }> = {
    yellow: { border: "border-yellow-500/40", bg: "bg-yellow-500/5", text: "text-yellow-400", button: "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10" },
    purple: { border: "border-purple-500/40", bg: "bg-purple-500/5", text: "text-purple-400", button: "border-purple-500/50 text-purple-400 hover:bg-purple-500/10" },
    green: { border: "border-green-500/40", bg: "bg-green-500/5", text: "text-green-400", button: "border-green-500/50 text-green-400 hover:bg-green-500/10" },
    red: { border: "border-red-500/40", bg: "bg-red-500/5", text: "text-red-400", button: "border-red-500/50 text-red-400 hover:bg-red-500/10" },
    cyan: { border: "border-cyan-500/40", bg: "bg-cyan-500/5", text: "text-cyan-400", button: "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10" },
  };

  const colors = colorMap[accentColor] || colorMap.yellow;

  const runAnalysis = useCallback(async () => {
    if (!data || (Array.isArray(data) && data.length === 0)) return;
    setLoading(true);
    setAnalysis("");
    setHasAnalyzed(true);
    setExpanded(true);

    try {
      const res = await fetch(`/api/agent-intel/${agentType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) {
        setAnalysis("Analysis unavailable. Try again.");
        return;
      }

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
            } catch {}
          }
        }
      }
    } catch {
      setAnalysis("Analysis failed. Check connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [agentType, data]);

  return (
    <div className={`border ${colors.border} ${colors.bg} transition-all`}>
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer" onClick={() => hasAnalyzed && setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <Brain className={`w-3.5 h-3.5 ${colors.text}`} />
          <span className={`font-display text-[10px] ${colors.text}`}>{label}</span>
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1.5">
          {!hasAnalyzed ? (
            <button
              onClick={(e) => { e.stopPropagation(); runAnalysis(); }}
              disabled={loading || !data || (Array.isArray(data) && data.length === 0)}
              data-testid={`button-analyze-${agentType}`}
              className={`flex items-center gap-1 px-2 py-0.5 border text-[9px] font-display transition-colors disabled:opacity-50 ${colors.button}`}
            >
              <Brain className="w-2.5 h-2.5" /> ANALYZE
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); runAnalysis(); }}
                disabled={loading}
                className={`p-0.5 border text-[9px] transition-colors disabled:opacity-50 ${colors.button}`}
              >
                <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
            </>
          )}
        </div>
      </div>

      {hasAnalyzed && expanded && (
        <div className="px-3 pb-3">
          <div className="text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
            {analysis || (loading ? "Thinking..." : "")}
          </div>
        </div>
      )}
    </div>
  );
}
