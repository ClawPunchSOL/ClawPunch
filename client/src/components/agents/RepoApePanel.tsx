import { useState, useEffect } from "react";
import { FileCode, Search, Loader2, GitBranch, Users as UsersIcon } from "lucide-react";

interface RepoScan {
  id: number;
  repoUrl: string;
  repoName: string;
  legitScore: number;
  commitCount: number;
  contributorCount: number;
  findings: string;
  recommendation: string;
  scannedAt: string;
}

export default function RepoApePanel() {
  const [scans, setScans] = useState<RepoScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [activeScan, setActiveScan] = useState<RepoScan | null>(null);

  useEffect(() => {
    fetch("/api/repos/scans").then(r => r.json()).then(setScans).finally(() => setLoading(false));
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || scanning) return;
    setScanning(true);
    setActiveScan(null);

    try {
      const res = await fetch("/api/repos/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
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
            if (data.scan) {
              setActiveScan(data.scan);
              setScans(prev => [data.scan, ...prev]);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("Repo scan error:", err);
    } finally {
      setScanning(false);
      setRepoUrl("");
    }
  };

  const scoreColor = (score: number) => score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
  const scoreBg = (score: number) => score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  const scoreEmoji = (score: number) => score >= 70 ? "🐒" : score >= 40 ? "🤔" : "🚩";
  const recColor = (rec: string) => {
    if (rec === "HIGH_QUALITY" || rec === "LEGIT") return "border-green-500/50 bg-green-500/10 text-green-400";
    if (rec === "LIKELY_LARP") return "border-red-500/50 bg-red-500/10 text-red-400";
    return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
  };
  const recEmoji = (rec: string) => {
    if (rec === "HIGH_QUALITY" || rec === "LEGIT") return "✅";
    if (rec === "LIKELY_LARP") return "💀";
    return "⚠️";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-2 border-4 border-cyan-500/40 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🦧</span>
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-display text-[11px] text-cyan-400 drop-shadow-[2px_2px_0px_#000]">REPO ANALYZER</span>
          <span className="text-[10px] text-cyan-400 font-display border-2 border-cyan-500/30 px-1.5 bg-cyan-500/10">{scans.length} ANALYZED</span>
        </div>
      </div>

      <form onSubmit={handleScan} className="flex gap-2">
        <input
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          placeholder="github.com/user/repo"
          disabled={scanning}
          data-testid="input-repo-url"
          className="flex-1 bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-muted-foreground/50 disabled:opacity-50 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
        />
        <button type="submit" disabled={scanning || !repoUrl.trim()} data-testid="button-scan-repo"
          className="px-4 py-2 text-[10px] disabled:opacity-50 flex items-center gap-1.5 border-4 border-cyan-500/60 bg-cyan-500/20 text-cyan-400 font-display hover:bg-cyan-500/30 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]">
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          ANALYZE
        </button>
      </form>

      {scanning && !activeScan && (
        <div className="flex items-center gap-3 p-4 border-4 border-cyan-500/40 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
          <span className="text-xl animate-bounce">🔬</span>
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <div>
            <div className="font-display text-[10px] text-cyan-400 drop-shadow-[1px_1px_0px_#000]">ANALYZING REPOSITORY</div>
            <div className="text-[10px] text-muted-foreground">Scanning commits, code quality, contributors...</div>
          </div>
        </div>
      )}

      {activeScan && (
        <div className="p-4 border-4 border-foreground/20 bg-black/60 backdrop-blur-sm space-y-3 shadow-[4px_4px_0px_rgba(0,0,0,0.6)]" data-testid="repo-result-active">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{scoreEmoji(activeScan.legitScore)}</span>
              <div>
                <div className="font-display text-xs text-white drop-shadow-[1px_1px_0px_#000]">{activeScan.repoName}</div>
                <div className="text-[10px] text-muted-foreground">{activeScan.repoUrl}</div>
              </div>
            </div>
            <div className="text-right px-3 py-2 border-4 border-foreground/10 bg-black/40 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
              <div className={`font-display text-2xl ${scoreColor(activeScan.legitScore)} drop-shadow-[2px_2px_0px_#000]`}>{activeScan.legitScore}%</div>
              <div className="text-[9px] text-muted-foreground font-display">LEGIT SCORE</div>
            </div>
          </div>
          <div className="w-full h-3 bg-black/60 border-4 border-foreground/10">
            <div className={`h-full ${scoreBg(activeScan.legitScore)} transition-all`} style={{ width: `${activeScan.legitScore}%` }} />
          </div>
          <div className="flex gap-3 text-[10px]">
            <div className="flex items-center gap-1.5 p-2 border-4 border-foreground/10 bg-black/40 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"><GitBranch className="w-3 h-3 text-cyan-400" /> <span className="text-muted-foreground">Commits:</span> <span className="text-white font-display">{activeScan.commitCount.toLocaleString()}</span></div>
            <div className="flex items-center gap-1.5 p-2 border-4 border-foreground/10 bg-black/40 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"><UsersIcon className="w-3 h-3 text-cyan-400" /> <span className="text-muted-foreground">Contributors:</span> <span className="text-white font-display">{activeScan.contributorCount}</span></div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed border-l-4 border-cyan-500/40 pl-3 py-1 bg-black/30">{activeScan.findings}</p>
          <div className={`text-center py-2 font-display text-xs border-4 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] ${recColor(activeScan.recommendation)}`}>
            {recEmoji(activeScan.recommendation)} {activeScan.recommendation.replace('_', ' ')}
          </div>
        </div>
      )}

      {!loading && scans.length > (activeScan ? 1 : 0) && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
          <div className="font-display text-[9px] text-muted-foreground mb-1 flex items-center gap-1">🧾 SCAN HISTORY</div>
          {scans.filter(s => s.id !== activeScan?.id).slice(0, 5).map(scan => (
            <button key={scan.id} onClick={() => setActiveScan(scan)} className="w-full flex items-center justify-between p-2.5 border-4 border-foreground/15 bg-black/60 backdrop-blur-sm hover:border-cyan-500/30 transition-colors text-left shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]" data-testid={`repo-history-${scan.id}`}>
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-sm">{scoreEmoji(scan.legitScore)}</span>
                <div>
                  <span className="text-[10px] text-white font-display truncate block drop-shadow-[1px_1px_0px_#000]">{scan.repoName}</span>
                  <span className="text-[9px] text-muted-foreground">{scan.repoUrl}</span>
                </div>
              </div>
              <span className={`font-display text-sm ${scoreColor(scan.legitScore)} drop-shadow-[1px_1px_0px_#000]`}>{scan.legitScore}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
