import { useState, useEffect } from "react";
import { Users, Plus, Loader2, Wifi, WifiOff } from "lucide-react";

interface MoltbookAgent {
  id: number;
  name: string;
  type: string;
  status: string;
  apiKeyPrefix: string;
  capabilities: string;
  registeredAt: string;
}

const AGENT_TYPES = [
  { value: "monitor", label: "Monitor" },
  { value: "trader", label: "Trader" },
  { value: "scanner", label: "Scanner" },
  { value: "sentinel", label: "Sentinel" },
];

export default function SwarmMonkeyPanel() {
  const [agents, setAgents] = useState<MoltbookAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("monitor");
  const [capabilities, setCapabilities] = useState("");

  useEffect(() => {
    fetch("/api/moltbook/agents").then(r => r.json()).then(setAgents).finally(() => setLoading(false));
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/moltbook/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, capabilities: capabilities || "general" }),
      });
      if (res.ok) {
        const agent = await res.json();
        setAgents(prev => [agent, ...prev]);
        setName("");
        setCapabilities("");
        setShowForm(false);
      }
    } finally {
      setRegistering(false);
    }
  };

  const toggleStatus = async (id: number, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    const res = await fetch(`/api/moltbook/agents/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgents(prev => prev.map(a => a.id === id ? updated : a));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="font-display text-[11px] text-white">MOLTBOOK SWARM</span>
          <span className="text-[10px] text-blue-400 font-display">{agents.filter(a => a.status === 'active').length} ACTIVE</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          data-testid="button-register-agent"
          className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[10px] font-display hover:bg-blue-500/30 transition-colors"
        >
          <Plus className="w-3 h-3" /> REGISTER
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegister} className="p-3 border-2 border-blue-500/30 bg-blue-500/5 space-y-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Agent name (e.g. AlphaApe)"
            data-testid="input-agent-name"
            className="w-full bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50"
          />
          <div className="flex gap-2">
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              data-testid="select-agent-type"
              className="flex-1 bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              {AGENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              value={capabilities}
              onChange={e => setCapabilities(e.target.value)}
              placeholder="Capabilities"
              className="flex-1 bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="submit"
            disabled={registering || !name.trim()}
            data-testid="button-submit-agent"
            className="w-full retro-button retro-button-primary text-[10px] py-2 disabled:opacity-50"
          >
            {registering ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "DEPLOY TO MOLTBOOK NETWORK"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
      ) : agents.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-xs">No agents registered. Deploy your first agent above.</div>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center gap-3 p-2.5 border border-border bg-black/30 hover:bg-black/50 transition-colors" data-testid={`agent-row-${agent.id}`}>
              <button onClick={() => toggleStatus(agent.id, agent.status)} className="shrink-0" data-testid={`button-toggle-${agent.id}`}>
                {agent.status === 'active' ? <Wifi className="w-3.5 h-3.5 text-green-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[10px] text-white truncate">{agent.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-display">{agent.type.toUpperCase()}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{agent.apiKeyPrefix}••••••</span>
              </div>
              <span className={`text-[9px] font-display ${agent.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                {agent.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
