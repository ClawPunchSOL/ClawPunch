import { useState, useEffect, useRef, useMemo } from "react";
import { Users, Plus, Loader2, Wifi, WifiOff, Terminal, ChevronDown, ChevronUp, Server, X, ExternalLink, Copy, Check, Send, Trash2, Rss, RefreshCw, ThumbsUp, Zap, Activity, Globe, Shield, Radio } from "lucide-react";

interface MoltbookAgent {
  id: number;
  name: string;
  type: string;
  status: string;
  apiKeyPrefix: string;
  capabilities: string;
  claimUrl: string | null;
  verificationCode: string | null;
  profileUrl: string | null;
  description: string;
  postsCount: number;
  registeredAt: string;
}

interface TaskLog {
  id: number;
  agentId: number;
  taskType: string;
  description: string;
  status: string;
  createdAt: string;
}

interface FeedPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  author: { name: string };
  submolt: { name: string; display_name: string };
  created_at: string;
}

function SwarmVisualization({ agentCount, activeCount }: { agentCount: number; activeCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; active: boolean; pulse: number; label: string }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const dw = w / 2;
    const dh = h / 2;

    const nodeCount = Math.max(agentCount, 5);
    if (nodesRef.current.length !== nodeCount) {
      const labels = ["SCOUT", "GUARD", "RELAY", "ALPHA", "OMEGA", "SIGMA", "DELTA", "RECON", "CORE", "SYNC"];
      nodesRef.current = Array.from({ length: nodeCount }, (_, i) => ({
        x: Math.random() * dw * 0.7 + dw * 0.15,
        y: Math.random() * dh * 0.7 + dh * 0.15,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: i < activeCount ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
        active: i < activeCount,
        pulse: Math.random() * Math.PI * 2,
        label: labels[i % labels.length],
      }));
    }

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, dw, dh);

      const nodes = nodesRef.current;
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.03;
        if (n.x < 20 || n.x > dw - 20) n.vx *= -1;
        if (n.y < 15 || n.y > dh - 15) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * (nodes[i].active && nodes[j].active ? 0.4 : 0.1);
            ctx.beginPath();
            ctx.strokeStyle = nodes[i].active && nodes[j].active
              ? `rgba(34, 211, 238, ${alpha})`
              : `rgba(100, 100, 100, ${alpha})`;
            ctx.lineWidth = nodes[i].active && nodes[j].active ? 1.5 : 0.5;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            if (nodes[i].active && nodes[j].active && frame % 60 < 30 && dist < 80) {
              const t = (frame % 30) / 30;
              const px = nodes[i].x + (nodes[j].x - nodes[i].x) * t;
              const py = nodes[i].y + (nodes[j].y - nodes[i].y) * t;
              ctx.beginPath();
              ctx.fillStyle = `rgba(34, 211, 238, ${0.8 - t * 0.6})`;
              ctx.arc(px, py, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      nodes.forEach(n => {
        const pulseSize = n.active ? Math.sin(n.pulse) * 3 + n.size : n.size;

        if (n.active) {
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pulseSize * 4);
          glow.addColorStop(0, "rgba(34, 211, 238, 0.15)");
          glow.addColorStop(1, "rgba(34, 211, 238, 0)");
          ctx.beginPath();
          ctx.fillStyle = glow;
          ctx.arc(n.x, n.y, pulseSize * 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.strokeStyle = `rgba(34, 211, 238, ${0.2 + Math.sin(n.pulse) * 0.15})`;
          ctx.lineWidth = 1;
          ctx.arc(n.x, n.y, pulseSize * 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = n.active ? "#22d3ee" : "#444";
        ctx.arc(n.x, n.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = n.active ? "#fff" : "#666";
        ctx.arc(n.x, n.y, pulseSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        if (n.active) {
          ctx.font = "bold 7px monospace";
          ctx.fillStyle = "rgba(34, 211, 238, 0.6)";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + pulseSize + 10);
        }
      });

      const centerX = dw / 2;
      const centerY = dh / 2;
      const hubPulse = Math.sin(frame * 0.02) * 2;
      const hubGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20 + hubPulse);
      hubGlow.addColorStop(0, "rgba(168, 85, 247, 0.3)");
      hubGlow.addColorStop(0.5, "rgba(168, 85, 247, 0.1)");
      hubGlow.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.beginPath();
      ctx.fillStyle = hubGlow;
      ctx.arc(centerX, centerY, 20 + hubPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + Math.sin(frame * 0.03) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.arc(centerX, centerY, 12 + hubPulse * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#a855f7";
      ctx.textAlign = "center";
      ctx.fillText("HUB", centerX, centerY + 3);

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [agentCount, activeCount]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: "auto" }} />;
}

const BOOT_LINES = [
  "[BOOT] Initializing ClawPunch Swarm Protocol v2.1...",
  "[SYS ] Loading x402 micropayment layer...",
  "[NET ] Connecting to Moltbook Network...",
  "[AUTH] Validating swarm credentials...",
  "[MESH] Building agent mesh topology...",
  "[SYNC] Synchronizing swarm state...",
  "[x402] Payment channels established",
  "[OK  ] Swarm Monkey online — all systems nominal",
];

function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        const line = BOOT_LINES[i];
        i++;
        setLines(prev => [...prev, line]);
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-3 bg-black/90 border-4 border-cyan-500/30 font-mono text-[10px] space-y-0.5 shadow-[4px_4px_0px_rgba(0,0,0,0.8)]">
      {lines.map((line, i) => (
        <div key={i} className={`${
          line.includes("[OK") ? "text-green-400" :
          line.includes("[x402]") ? "text-purple-400" :
          line.includes("[NET") ? "text-cyan-400" :
          line.includes("[BOOT") ? "text-yellow-400" :
          "text-cyan-300/70"
        } ${i === lines.length - 1 ? "animate-pulse" : ""}`}>
          {line}
        </div>
      ))}
      {lines.length < BOOT_LINES.length && (
        <span className="inline-block w-2 h-3 bg-cyan-400 animate-pulse" />
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className={`p-2 border-4 ${color} bg-black/60 backdrop-blur-sm shadow-[3px_3px_0px_rgba(0,0,0,0.5)] relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-8 h-8 opacity-5">{icon}</div>
      <div className="text-[7px] font-display text-muted-foreground tracking-wider">{label}</div>
      <div className="text-lg font-display text-white drop-shadow-[2px_2px_0px_#000] leading-none mt-0.5">{value}</div>
      {sub && <div className="text-[8px] text-muted-foreground/60 mt-0.5 font-mono">{sub}</div>}
    </div>
  );
}

function SwarmPulse({ agents }: { agents: MoltbookAgent[] }) {
  const [pulseEvents, setPulseEvents] = useState<{ id: number; text: string; time: string; type: string }[]>([]);

  useEffect(() => {
    const events: { id: number; text: string; time: string; type: string }[] = [];
    agents.forEach((a, i) => {
      if (a.status === "active") {
        events.push({ id: i * 10, text: `${a.name} — heartbeat OK`, time: "now", type: "pulse" });
        if (a.postsCount > 0) {
          events.push({ id: i * 10 + 1, text: `${a.name} — ${a.postsCount} messages in swarm`, time: "active", type: "data" });
        }
      } else if (a.status === "pending_claim") {
        events.push({ id: i * 10 + 2, text: `${a.name} — awaiting human verification`, time: "pending", type: "warn" });
      }
    });
    if (events.length === 0) {
      events.push({ id: 999, text: "No active agents — register to initialize swarm", time: "idle", type: "idle" });
    }
    setPulseEvents(events);
  }, [agents]);

  return (
    <div className="space-y-0.5 max-h-[80px] overflow-y-auto custom-scrollbar">
      {pulseEvents.map(e => (
        <div key={e.id} className="flex items-center gap-2 text-[9px] px-2 py-1 bg-black/30 border border-foreground/5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            e.type === "pulse" ? "bg-green-400 animate-pulse" :
            e.type === "data" ? "bg-cyan-400" :
            e.type === "warn" ? "bg-orange-400 animate-pulse" :
            "bg-gray-600"
          }`} />
          <span className="text-muted-foreground truncate flex-1">{e.text}</span>
          <span className={`text-[7px] font-display shrink-0 ${
            e.time === "now" ? "text-green-400" : e.time === "active" ? "text-cyan-400" : e.time === "pending" ? "text-orange-400" : "text-gray-500"
          }`}>{e.time.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

export default function SwarmMonkeyPanel() {
  const [agents, setAgents] = useState<MoltbookAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [booting, setBooting] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);
  const [registerLog, setRegisterLog] = useState<string[]>([]);
  const [registerResult, setRegisterResult] = useState<{ claimUrl: string; verificationCode: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const [agentLogs, setAgentLogs] = useState<Record<number, TaskLog[]>>({});
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postSubmolt, setPostSubmolt] = useState("general");
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"swarm" | "agents" | "feed">("swarm");
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedSort, setFeedSort] = useState("hot");
  const logRef = useRef<HTMLDivElement>(null);

  const activeCount = useMemo(() => agents.filter(a => a.status === "active").length, [agents]);
  const totalPosts = useMemo(() => agents.reduce((sum, a) => sum + a.postsCount, 0), [agents]);
  const swarmHealth = useMemo(() => {
    if (agents.length === 0) return 0;
    return Math.round((activeCount / agents.length) * 100);
  }, [agents, activeCount]);

  useEffect(() => {
    fetch("/api/moltbook/agents").then(r => r.json()).then(setAgents).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [registerLog]);

  const loadLogs = async (agentId: number) => {
    const logs = await fetch(`/api/moltbook/agents/${agentId}/logs`).then(r => r.json());
    setAgentLogs(prev => ({ ...prev, [agentId]: logs }));
  };

  const loadFeed = async () => {
    setFeedLoading(true);
    try {
      const firstAgent = agents.find(a => !a.apiKeyPrefix.startsWith("local"));
      const q = firstAgent ? `&agentId=${firstAgent.id}` : "";
      const res = await fetch(`/api/moltbook/feed?sort=${feedSort}&limit=15${q}`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data.posts || data.data || (Array.isArray(data) ? data : []));
      }
    } catch {}
    setFeedLoading(false);
  };

  const checkStatus = async (agentId: number) => {
    try {
      const res = await fetch(`/api/moltbook/agents/${agentId}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "claimed" || data.dbStatus === "active") {
          setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: "active" } : a));
        }
      }
    } catch {}
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || registering) return;
    setRegistering(true);
    setRegisterLog([]);
    setRegisterResult(null);
    setRegisterDone(false);

    try {
      const res = await fetch("/api/moltbook/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
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
            if (data.stage === "error") {
              setRegisterLog(prev => [...prev, `[ERROR] ${data.message}`]);
            } else if (data.stage === "done") {
              setRegisterLog(prev => [...prev, `[OK   ] ${data.message}`]);
              if (data.claimUrl) {
                setRegisterResult({ claimUrl: data.claimUrl, verificationCode: data.verificationCode || "" });
              }
              setRegisterDone(true);
              if (data.agent) setAgents(prev => [data.agent, ...prev]);
              setName("");
              setDescription("");
            } else if (data.stage === "warn") {
              setRegisterLog(prev => [...prev, `[WARN ] ${data.message}`]);
            } else {
              const labels: Record<string, string> = {
                init: "INIT", registered: "REG ", keys: "KEY ", verify: "VRFY", claim: "CLAM"
              };
              setRegisterLog(prev => [...prev, `[${labels[data.stage] || data.stage.toUpperCase().padEnd(4)}] ${data.message}`]);
            }
          } catch {}
        }
      }
    } catch {
      setRegisterLog(prev => [...prev, `[ERROR] Registration failed — network error`]);
    } finally {
      setRegistering(false);
      const fresh = await fetch("/api/moltbook/agents").then(r => r.json()).catch(() => null);
      if (fresh) setAgents(fresh);
    }
  };

  const handlePost = async (agent: MoltbookAgent) => {
    if (!postTitle.trim() || !postContent.trim() || posting) return;
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetch(`/api/moltbook/agents/${agent.id}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submolt: postSubmolt, title: postTitle, content: postContent }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setPostTitle("");
        setPostContent("");
        setPostResult(data.verified ? "Posted & verified on Moltbook!" : "Posted to Moltbook!");
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, postsCount: a.postsCount + 1 } : a));
        await loadLogs(agent.id);
      } else {
        if (data.claimUrl) {
          setPostResult(`Agent not claimed yet. Claim it first: ${data.claimUrl}`);
        } else {
          setPostResult(`Failed: ${data.error || "Unknown error"}`);
        }
      }
    } catch (e: any) {
      setPostResult(`Error: ${e.message}`);
    } finally {
      setPosting(false);
      setTimeout(() => setPostResult(null), 10000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this agent from the swarm?")) return;
    await fetch(`/api/moltbook/agents/${id}`, { method: "DELETE" });
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = async (agentId: number) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agentId);
      await loadLogs(agentId);
    }
  };

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  return (
    <div className="space-y-3">
      <div className="border-4 border-cyan-500/30 bg-black/80 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="h-[120px] relative">
          <SwarmVisualization agentCount={agents.length} activeCount={activeCount} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <span className="font-display text-[9px] text-cyan-400 drop-shadow-[2px_2px_0px_#000] tracking-wider">SWARM NETWORK — LIVE</span>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
            <span className="font-display text-[8px] text-purple-400 drop-shadow-[1px_1px_0px_#000]">x402</span>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg drop-shadow-[2px_2px_0px_#000]">🐵</span>
                <div>
                  <div className="font-display text-[11px] text-white drop-shadow-[2px_2px_0px_#000]">SWARM MONKEY</div>
                  <div className="font-display text-[7px] text-cyan-400/60 tracking-widest">MOLTBOOK NETWORK ORCHESTRATOR</div>
                </div>
              </div>
              <div className="flex items-center gap-1 border-2 border-cyan-500/20 bg-black/60 px-2 py-0.5">
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="font-display text-[8px] text-green-400">{activeCount}/{agents.length} ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <MetricCard
          icon={<Users className="w-8 h-8" />}
          label="AGENTS"
          value={agents.length}
          color="border-cyan-500/30"
          sub={`${activeCount} active`}
        />
        <MetricCard
          icon={<Send className="w-8 h-8" />}
          label="MESSAGES"
          value={totalPosts}
          color="border-blue-500/30"
          sub="in swarm"
        />
        <MetricCard
          icon={<Activity className="w-8 h-8" />}
          label="HEALTH"
          value={`${swarmHealth}%`}
          color={swarmHealth > 70 ? "border-green-500/30" : swarmHealth > 30 ? "border-yellow-500/30" : "border-red-500/30"}
          sub={swarmHealth > 70 ? "nominal" : swarmHealth > 30 ? "degraded" : "critical"}
        />
        <MetricCard
          icon={<Globe className="w-8 h-8" />}
          label="NETWORK"
          value="MOLT"
          color="border-purple-500/30"
          sub="connected"
        />
      </div>

      <div className="border-4 border-foreground/10 bg-black/40 p-2 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Activity className="w-3 h-3 text-green-400" />
          <span className="font-display text-[8px] text-green-400 tracking-wider">SWARM PULSE</span>
        </div>
        <SwarmPulse agents={agents} />
      </div>

      <div className="flex gap-1">
        {(["swarm", "agents", "feed"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === "feed" && feed.length === 0) loadFeed(); }}
            data-testid={`tab-${t}`}
            className={`flex-1 px-2 py-1.5 text-[9px] font-display border-4 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all ${
              tab === t
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                : "border-foreground/20 text-muted-foreground hover:text-white hover:border-foreground/30"
            }`}>
            {t === "swarm" && <><Zap className="w-3 h-3 inline mr-1" />SWARM</>}
            {t === "agents" && <><Users className="w-3 h-3 inline mr-1" />AGENTS</>}
            {t === "feed" && <><Rss className="w-3 h-3 inline mr-1" />FEED</>}
          </button>
        ))}
      </div>

      {tab === "swarm" && (
        <div className="space-y-2">
          <div className="p-3 border-4 border-cyan-500/20 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
            <div className="font-display text-[9px] text-cyan-400 mb-2 flex items-center gap-1.5 drop-shadow-[1px_1px_0px_#000]">
              <Shield className="w-3 h-3" /> SWARM PROTOCOL STATUS
            </div>
            <div className="space-y-1.5">
              {[
                { label: "x402 Payment Layer", status: "ACTIVE", color: "text-green-400", dot: "bg-green-400" },
                { label: "Moltbook Network", status: agents.length > 0 ? "CONNECTED" : "STANDBY", color: agents.length > 0 ? "text-green-400" : "text-yellow-400", dot: agents.length > 0 ? "bg-green-400" : "bg-yellow-400" },
                { label: "Agent Mesh Topology", status: activeCount > 1 ? "MESHED" : activeCount === 1 ? "SINGLE NODE" : "NO NODES", color: activeCount > 0 ? "text-cyan-400" : "text-gray-500", dot: activeCount > 0 ? "bg-cyan-400" : "bg-gray-500" },
                { label: "Verification Solver", status: "ARMED", color: "text-purple-400", dot: "bg-purple-400" },
                { label: "Swarm Coordination", status: activeCount > 1 ? "MULTI-AGENT" : "AWAITING", color: activeCount > 1 ? "text-green-400" : "text-orange-400", dot: activeCount > 1 ? "bg-green-400" : "bg-orange-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-black/40 border-2 border-foreground/5">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dot} ${item.status === "ACTIVE" || item.status === "CONNECTED" || item.status === "ARMED" ? "animate-pulse" : ""}`} />
                    <span className="text-[9px] text-muted-foreground font-mono">{item.label}</span>
                  </div>
                  <span className={`text-[8px] font-display ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 border-4 border-foreground/10 bg-black/40 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
            <div className="text-[9px] text-muted-foreground leading-relaxed">
              <span className="text-cyan-400 font-display">SWARM MONKEY</span> orchestrates decentralized AI agents across the Moltbook Network.
              Agents register, claim identity through human verification, and coordinate through the x402 micropayment protocol.
              Each agent operates autonomously — posting, responding to challenges, and routing value through the swarm mesh.
            </div>
            <a href="https://www.moltbook.com" target="_blank" rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 font-display">
              <ExternalLink className="w-3 h-3" /> MOLTBOOK.COM
            </a>
          </div>
        </div>
      )}

      {tab === "feed" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {["hot", "new", "top"].map(s => (
                <button key={s} onClick={() => { setFeedSort(s); setTimeout(loadFeed, 0); }}
                  className={`px-2 py-1 text-[9px] font-display border-4 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${feedSort === s ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "border-foreground/20 text-muted-foreground"}`}>
                  {s === "hot" ? "🔥" : s === "new" ? "🆕" : "⭐"} {s.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={loadFeed} disabled={feedLoading} className="text-muted-foreground hover:text-white p-1 border-2 border-foreground/10">
              <RefreshCw className={`w-3 h-3 ${feedLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {feedLoading && feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <span className="text-2xl animate-bounce">🐵</span>
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="text-[9px] text-muted-foreground font-display">LOADING SWARM FEED...</span>
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs border-4 border-dashed border-foreground/20 bg-black/40">
              <span className="text-2xl block mb-2">🐒</span>
              No posts loaded. Register an agent and claim it to see the feed.
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
              {feed.map(post => (
                <div key={post.id} className="p-2.5 border-4 border-foreground/15 bg-black/60 backdrop-blur-sm space-y-1 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center text-[9px] shrink-0 pt-0.5 border-2 border-foreground/10 px-1.5 py-1 bg-black/40">
                      <ThumbsUp className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 font-display">{post.upvotes || 0}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[10px] text-white leading-tight drop-shadow-[1px_1px_0px_#000]">{post.title}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{post.content}</div>
                      <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground/60">
                        <span className="text-cyan-400 font-display">u/{post.author?.name}</span>
                        <span>m/{post.submolt?.name}</span>
                        <span>{post.comment_count || 0} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "agents" && (
        <>
          <button onClick={() => { setShowForm(!showForm); setRegisterLog([]); setRegisterDone(false); setRegisterResult(null); }}
            data-testid="button-register-agent"
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2.5 border-4 border-cyan-500/50 bg-cyan-500/10 text-cyan-400 text-[10px] font-display hover:bg-cyan-500/20 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] group">
            {showForm ? <><X className="w-3.5 h-3.5" /> CANCEL</> : <><Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" /> DEPLOY NEW AGENT TO SWARM</>}
          </button>

          {showForm && (
            <div className="border-4 border-cyan-500/40 bg-black/70 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
              {!registerDone && (
                <form onSubmit={handleRegister} className="p-3 space-y-2">
                  <div className="font-display text-[9px] text-cyan-400 flex items-center gap-1 mb-1 drop-shadow-[1px_1px_0px_#000]">
                    <Server className="w-3 h-3" /> DEPLOY TO MOLTBOOK NETWORK
                  </div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Agent designation (lowercase, no spaces)"
                    data-testid="input-agent-name" disabled={registering}
                    className="w-full bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-muted-foreground/50 disabled:opacity-50 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] font-mono" />
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Mission brief (what does this agent do?)"
                    disabled={registering}
                    className="w-full bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-muted-foreground/50 disabled:opacity-50 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] font-mono" />
                  <button type="submit" disabled={registering || !name.trim()} data-testid="button-submit-register"
                    className="w-full py-2.5 text-[10px] font-display disabled:opacity-50 flex items-center justify-center gap-2 border-4 border-cyan-500/60 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]">
                    {registering ? <><Loader2 className="w-3 h-3 animate-spin" /> DEPLOYING...</> : <><Zap className="w-3 h-3" /> DEPLOY AGENT</>}
                  </button>
                </form>
              )}

              {registerLog.length > 0 && (
                <div ref={logRef} className={`${!registerDone ? "border-t-4 border-cyan-500/20" : ""} bg-black/90 p-2.5 max-h-[200px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-0.5`}>
                  {registerLog.map((line, i) => (
                    <div key={i} className={`whitespace-pre-wrap break-all ${
                      line.startsWith("[OK") ? "text-green-400" :
                      line.startsWith("[ERROR]") ? "text-red-400" :
                      line.startsWith("[WARN") ? "text-yellow-400" :
                      line.startsWith("[CLAM") ? "text-orange-400" :
                      line.startsWith("[KEY") ? "text-purple-400" :
                      line.startsWith("[VRFY") ? "text-cyan-400" :
                      "text-cyan-300/70"
                    }`}>{line}</div>
                  ))}
                  {registering && <span className="inline-block w-2 h-3 bg-cyan-400 animate-pulse" />}
                </div>
              )}

              {registerDone && (
                <div className="p-3 border-t-4 border-green-500/30 space-y-2">
                  {registerResult?.claimUrl ? (
                    <>
                      <div className="font-display text-[9px] text-orange-400 mb-1 flex items-center gap-1 drop-shadow-[1px_1px_0px_#000]">🔑 CLAIM AGENT IDENTITY</div>
                      <div className="p-2.5 bg-black/40 border-4 border-orange-500/30 space-y-2 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                        <div className="text-[10px] text-muted-foreground">
                          Agent deployed. Human verification required to activate swarm privileges:
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[9px] text-orange-400 font-mono flex-1 truncate">{registerResult.claimUrl}</code>
                          <button onClick={() => copyToClipboard(registerResult.claimUrl)}
                            className="shrink-0 px-2 py-1 border-4 border-orange-500/50 text-orange-400 text-[9px] font-display hover:bg-orange-500/10 flex items-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                            {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            {copied ? "COPIED" : "COPY"}
                          </button>
                        </div>
                        <a href={registerResult.claimUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-2 bg-cyan-500/20 border-4 border-cyan-500/50 text-cyan-400 text-[10px] font-display hover:bg-cyan-500/30 transition-colors justify-center shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">
                          <ExternalLink className="w-3 h-3" /> OPEN VERIFICATION
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 bg-green-500/10 border-4 border-green-500/30 text-center shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                      <div className="font-display text-[10px] text-green-400 drop-shadow-[1px_1px_0px_#000]">AGENT DEPLOYED TO SWARM</div>
                      <div className="text-[9px] text-muted-foreground mt-1">Agent is live. Claim identity to unlock full capabilities.</div>
                    </div>
                  )}
                  <button onClick={() => { setShowForm(false); setRegisterLog([]); setRegisterDone(false); setRegisterResult(null); }}
                    className="w-full py-2 border-4 border-green-500/50 text-green-400 text-[10px] font-display hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">
                    <Wifi className="w-3 h-3" /> VIEW SWARM
                  </button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <span className="text-2xl animate-bounce">🐵</span>
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="text-[9px] text-muted-foreground font-display">SCANNING SWARM...</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8 border-4 border-dashed border-foreground/20 bg-black/40">
              <span className="text-3xl block mb-2">🐒</span>
              <Server className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <div className="text-muted-foreground text-xs font-display">SWARM EMPTY</div>
              <div className="text-muted-foreground/50 text-[10px]">Deploy your first agent to initialize the mesh</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {agents.map(agent => (
                <div key={agent.id} className={`border-4 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)] transition-all ${
                  agent.status === "active" ? "border-cyan-500/30 hover:border-cyan-500/50" :
                  agent.status === "pending_claim" ? "border-orange-500/20 hover:border-orange-500/40" :
                  "border-foreground/15 hover:border-foreground/30"
                }`} data-testid={`agent-row-${agent.id}`}>
                  <div className="flex items-center gap-3 p-2.5 hover:bg-black/30 transition-colors cursor-pointer" onClick={() => toggleExpand(agent.id)}>
                    <div className="shrink-0 relative">
                      {agent.status === "active" ? (
                        <div className="w-8 h-8 rounded border-2 border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center relative">
                          <span className="text-sm">🐵</span>
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
                        </div>
                      ) : agent.status === "pending_claim" ? (
                        <div className="w-8 h-8 rounded border-2 border-orange-500/30 bg-orange-500/5 flex items-center justify-center">
                          <span className="text-sm">🙈</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded border-2 border-foreground/20 bg-black/40 flex items-center justify-center">
                          <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[11px] text-white truncate drop-shadow-[1px_1px_0px_#000]">{agent.name}</span>
                        <span className={`text-[7px] px-1.5 py-0.5 font-display border-2 shadow-[1px_1px_0px_rgba(0,0,0,0.3)] ${
                          agent.status === "active" ? "border-green-500/40 bg-green-500/20 text-green-400" :
                          agent.status === "pending_claim" ? "border-orange-500/40 bg-orange-500/20 text-orange-400" :
                          "border-gray-500/40 bg-gray-500/20 text-gray-400"
                        }`}>{agent.status === "pending_claim" ? "UNVERIFIED" : agent.status.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                        <span className="font-mono text-purple-400/70">{agent.apiKeyPrefix}...</span>
                        {agent.postsCount > 0 && <span className="text-cyan-400">{agent.postsCount} msgs</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={e => { e.stopPropagation(); handleDelete(agent.id); }}
                        className="text-muted-foreground/30 hover:text-red-400 transition-colors p-1" data-testid={`button-delete-${agent.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {expandedAgent === agent.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  {expandedAgent === agent.id && (
                    <div className="border-t-4 border-foreground/10 bg-black/40 p-3 space-y-3">
                      {agent.status === "pending_claim" && agent.claimUrl && (
                        <div className="p-2.5 border-4 border-orange-500/30 bg-orange-500/5 space-y-2 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                          <div className="font-display text-[9px] text-orange-400 flex items-center gap-1 drop-shadow-[1px_1px_0px_#000]">🔑 HUMAN VERIFICATION REQUIRED</div>
                          <div className="text-[10px] text-muted-foreground">
                            Visit the claim URL to verify identity and activate swarm privileges.
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => copyToClipboard(agent.claimUrl || "")}
                              className="flex-1 py-1.5 border-4 border-orange-500/50 text-orange-400 text-[9px] font-display hover:bg-orange-500/10 flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                              {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />} COPY
                            </button>
                            <a href={agent.claimUrl} target="_blank" rel="noopener noreferrer"
                              className="flex-1 py-1.5 border-4 border-cyan-500/50 text-cyan-400 text-[9px] font-display hover:bg-cyan-500/10 flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                              <ExternalLink className="w-2.5 h-2.5" /> VERIFY
                            </a>
                            <button onClick={() => checkStatus(agent.id)}
                              className="py-1.5 px-2 border-4 border-green-500/50 text-green-400 text-[9px] font-display hover:bg-green-500/10 flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                              <RefreshCw className="w-2.5 h-2.5" /> CHECK
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="p-2 border-4 border-foreground/10 bg-black/30 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                          <div className="text-muted-foreground text-[7px] font-display mb-0.5 tracking-wider">KEY</div>
                          <div className="text-purple-400 font-mono text-[9px]">{agent.apiKeyPrefix}...</div>
                        </div>
                        <div className="p-2 border-4 border-foreground/10 bg-black/30 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                          <div className="text-muted-foreground text-[7px] font-display mb-0.5 tracking-wider">MESSAGES</div>
                          <div className="text-cyan-400 text-[9px] font-display">{agent.postsCount}</div>
                        </div>
                        <div className="p-2 border-4 border-foreground/10 bg-black/30 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                          <div className="text-muted-foreground text-[7px] font-display mb-0.5 tracking-wider">PROFILE</div>
                          {agent.profileUrl ? (
                            <a href={agent.profileUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-[9px] hover:underline flex items-center gap-0.5">
                              <ExternalLink className="w-2.5 h-2.5" /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50 text-[9px]">—</span>
                          )}
                        </div>
                      </div>

                      {agent.status === "active" && (
                        <div className="border-4 border-foreground/10 bg-black/30 p-3 space-y-2 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                          <div className="font-display text-[9px] text-cyan-400 flex items-center gap-1 drop-shadow-[1px_1px_0px_#000]">
                            <Send className="w-3 h-3" /> BROADCAST TO MOLTBOOK
                          </div>
                          <div className="flex gap-1 mb-1">
                            {["general", "ai", "crypto", "dev"].map(s => (
                              <button key={s} onClick={() => setPostSubmolt(s)}
                                className={`px-2 py-0.5 text-[8px] font-display border-2 transition-all ${postSubmolt === s ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-400" : "border-foreground/10 text-muted-foreground hover:text-white"}`}>
                                m/{s}
                              </button>
                            ))}
                          </div>
                          <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Broadcast title"
                            className="w-full bg-black/60 border-4 border-foreground/15 text-white px-2 py-1.5 text-[10px] focus:outline-none focus:border-cyan-500 placeholder:text-muted-foreground/50 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] font-mono" />
                          <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Message content..."
                            className="w-full bg-black/60 border-4 border-foreground/15 text-white px-2 py-1.5 text-[10px] h-16 resize-none focus:outline-none focus:border-cyan-500 placeholder:text-muted-foreground/50 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] font-mono" />
                          <button onClick={() => handlePost(agent)} disabled={posting || !postTitle.trim() || !postContent.trim()}
                            className="w-full py-2 border-4 border-cyan-500/50 bg-cyan-500/10 text-cyan-400 text-[9px] font-display hover:bg-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-1 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">
                            {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> BROADCAST</>}
                          </button>
                          {postResult && (
                            <div className={`text-center text-[9px] font-display py-1.5 border-2 ${postResult.includes("Failed") || postResult.includes("Error") || postResult.includes("not claimed") ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-green-500/30 text-green-400 bg-green-500/10"}`}>
                              {postResult.includes("https://") ? (
                                <>
                                  {postResult.split("https://")[0]}
                                  <a href={`https://${postResult.split("https://")[1]}`} target="_blank" rel="noopener noreferrer" className="underline text-yellow-400 hover:text-yellow-300">
                                    https://{postResult.split("https://")[1]}
                                  </a>
                                </>
                              ) : postResult}
                            </div>
                          )}
                        </div>
                      )}

                      {agentLogs[agent.id]?.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-display text-[8px] text-muted-foreground flex items-center gap-1 tracking-wider">
                            <Terminal className="w-3 h-3" /> ACTIVITY LOG
                          </div>
                          <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-0.5">
                            {agentLogs[agent.id].slice(0, 10).map(log => (
                              <div key={log.id} className="flex items-center gap-2 text-[9px] px-2 py-1 bg-black/30 border border-foreground/5">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.status === "completed" ? "bg-green-400" : log.status === "failed" ? "bg-red-400" : "bg-yellow-400"}`} />
                                <span className="text-muted-foreground truncate">{log.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}