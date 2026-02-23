import { useState, useEffect, useRef } from "react";
import { Users, Plus, Loader2, Wifi, WifiOff, Play, Activity, Clock, Terminal, ChevronDown, ChevronUp, Server, Zap, X } from "lucide-react";

interface MoltbookAgent {
  id: number;
  name: string;
  type: string;
  status: string;
  apiKeyPrefix: string;
  capabilities: string;
  endpoint: string;
  region: string;
  tasksCompleted: number;
  tasksFailed: number;
  uptimeSeconds: number;
  lastHeartbeat: string;
  registeredAt: string;
}

interface TaskLog {
  id: number;
  agentId: number;
  taskType: string;
  description: string;
  status: string;
  durationMs: number;
  createdAt: string;
}

const AGENT_TYPES = [
  { value: "monitor", label: "Monitor", desc: "Watches on-chain activity" },
  { value: "trader", label: "Trader", desc: "Executes trade strategies" },
  { value: "scanner", label: "Scanner", desc: "Scans contracts & wallets" },
  { value: "sentinel", label: "Sentinel", desc: "Security & threat detection" },
];

const REGIONS = [
  { value: "us-east-1", label: "US East" },
  { value: "eu-west-1", label: "EU West" },
  { value: "ap-southeast-1", label: "AP Southeast" },
];

const TASK_TYPES = [
  { value: "scan", label: "Blockchain Scan" },
  { value: "monitor", label: "Monitor Sweep" },
  { value: "trade", label: "Trade Analysis" },
  { value: "analyze", label: "Custom Analysis" },
];

export default function SwarmMonkeyPanel() {
  const [agents, setAgents] = useState<MoltbookAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployDone, setDeployDone] = useState(false);
  const [deployLog, setDeployLog] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("monitor");
  const [capabilities, setCapabilities] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const [agentLogs, setAgentLogs] = useState<Record<number, TaskLog[]>>({});
  const [dispatching, setDispatching] = useState<number | null>(null);
  const [dispatchLog, setDispatchLog] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState("scan");
  const [customPrompt, setCustomPrompt] = useState("");
  const deployLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/moltbook/agents").then(r => r.json()).then(setAgents).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    deployLogRef.current?.scrollTo({ top: deployLogRef.current.scrollHeight, behavior: 'smooth' });
  }, [deployLog, dispatchLog]);

  const loadLogs = async (agentId: number) => {
    const logs = await fetch(`/api/moltbook/agents/${agentId}/logs`).then(r => r.json());
    setAgentLogs(prev => ({ ...prev, [agentId]: logs }));
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || deploying) return;
    setDeploying(true);
    setDeployLog([]);

    try {
      const res = await fetch("/api/moltbook/agents/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, capabilities: capabilities || "general", region }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";
      let streamingConfig = "";

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
            if (data.stage === "configuring" && data.streaming) {
              streamingConfig += data.message;
              setDeployLog(prev => {
                const last = prev[prev.length - 1];
                if (last?.startsWith("[CONFIG] ")) {
                  return [...prev.slice(0, -1), `[CONFIG] ${streamingConfig}`];
                }
                return [...prev, `[CONFIG] ${streamingConfig}`];
              });
            } else if (data.stage === "live" && data.agent) {
              setDeployLog(prev => [...prev, `[LIVE] ✓ ${data.message}`, `[LIVE] Endpoint: ${data.agent.endpoint}`, `[LIVE] API Key: ${data.agent.apiKeyPrefix}••••••`, `[LIVE] Region: ${data.agent.region}`, ``, `[READY] Agent is online and accepting tasks.`]);
              setAgents(prev => [data.agent, ...prev]);
              setDeployDone(true);
              setName("");
              setCapabilities("");
            } else if (data.error) {
              setDeployLog(prev => [...prev, `[ERROR] ${data.error}`]);
            } else {
              const stageLabels: Record<string, string> = {
                init: "INIT", provisioning: "PROV", keys: "KEYS", configuring: "CONF", deploying: "DEPLOY", healthcheck: "HEALTH"
              };
              setDeployLog(prev => [...prev, `[${stageLabels[data.stage] || data.stage}] ${data.message}`]);
            }
          } catch {}
        }
      }
    } catch (err) {
      setDeployLog(prev => [...prev, `[ERROR] Deployment failed`]);
    } finally {
      setDeploying(false);
      const freshAgents = await fetch("/api/moltbook/agents").then(r => r.json()).catch(() => null);
      if (freshAgents) setAgents(freshAgents);
    }
  };

  const handleDispatch = async (agent: MoltbookAgent) => {
    if (dispatching) return;
    setDispatching(agent.id);
    setDispatchLog([]);

    try {
      const res = await fetch(`/api/moltbook/agents/${agent.id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType: selectedTask, prompt: customPrompt || undefined }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";
      let streamingResult = "";

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
            if (data.stage === "executing" && data.streaming) {
              streamingResult += data.message;
              setDispatchLog(prev => {
                const idx = prev.findIndex(l => l.startsWith("[EXEC] "));
                if (idx >= 0) {
                  return [...prev.slice(0, idx), `[EXEC] ${streamingResult}`, ...prev.slice(idx + 1)];
                }
                return [...prev, `[EXEC] ${streamingResult}`];
              });
            } else if (data.stage === "complete") {
              setDispatchLog(prev => [...prev, `[${data.success ? 'DONE' : 'FAIL'}] ${data.message}`]);
              setAgents(prev => prev.map(a => a.id === agent.id ? {
                ...a,
                tasksCompleted: a.tasksCompleted + (data.success ? 1 : 0),
                tasksFailed: a.tasksFailed + (data.success ? 0 : 1),
              } : a));
              loadLogs(agent.id);
            } else {
              setDispatchLog(prev => [...prev, `[${data.stage?.toUpperCase() || 'INFO'}] ${data.message}`]);
            }
          } catch {}
        }
      }
    } catch {
      setDispatchLog(prev => [...prev, `[ERROR] Dispatch failed`]);
    } finally {
      setDispatching(null);
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

  const toggleExpand = async (agentId: number) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
      setDispatchLog([]);
    } else {
      setExpandedAgent(agentId);
      setDispatchLog([]);
      await loadLogs(agentId);
    }
  };

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalTasks = agents.reduce((s, a) => s + a.tasksCompleted + a.tasksFailed, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="font-display text-[11px] text-white">MOLTBOOK SWARM</span>
          <span className="text-[10px] text-blue-400 font-display">{activeCount}/{agents.length} ACTIVE</span>
          {totalTasks > 0 && <span className="text-[9px] text-muted-foreground font-display">| {totalTasks} TASKS</span>}
        </div>
        <button onClick={() => { setShowForm(!showForm); setDeployLog([]); setDeployDone(false); }} data-testid="button-deploy-agent"
          className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[10px] font-display hover:bg-blue-500/30 transition-colors">
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? (deployDone ? 'CLOSE' : 'CANCEL') : 'DEPLOY NEW'}
        </button>
      </div>

      {showForm && (
        <div className="border-2 border-blue-500/30 bg-blue-500/5">
          {!deployDone && (
            <form onSubmit={handleDeploy} className="p-3 space-y-2">
              <div className="font-display text-[9px] text-blue-400 flex items-center gap-1 mb-1">
                <Server className="w-3 h-3" /> DEPLOYMENT CONFIGURATION
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Agent name (e.g. AlphaApe)"
                data-testid="input-agent-name" disabled={deploying}
                className="w-full bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 disabled:opacity-50" />
              <div className="grid grid-cols-3 gap-2">
                <select value={type} onChange={e => setType(e.target.value)} data-testid="select-agent-type" disabled={deploying}
                  className="bg-black/50 border-2 border-border text-white px-2 py-2 text-[11px] focus:outline-none focus:border-blue-500 disabled:opacity-50">
                  {AGENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select value={region} onChange={e => setRegion(e.target.value)} data-testid="select-region" disabled={deploying}
                  className="bg-black/50 border-2 border-border text-white px-2 py-2 text-[11px] focus:outline-none focus:border-blue-500 disabled:opacity-50">
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <input value={capabilities} onChange={e => setCapabilities(e.target.value)} placeholder="Capabilities"
                  disabled={deploying} className="bg-black/50 border-2 border-border text-white px-2 py-2 text-[11px] focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 disabled:opacity-50" />
              </div>
              <button type="submit" disabled={deploying || !name.trim()} data-testid="button-submit-deploy"
                className="w-full retro-button retro-button-primary text-[10px] py-2 disabled:opacity-50 flex items-center justify-center gap-2">
                {deploying ? <><Loader2 className="w-3 h-3 animate-spin" /> DEPLOYING...</> : <><Zap className="w-3 h-3" /> DEPLOY TO MOLTBOOK NETWORK</>}
              </button>
            </form>
          )}

          {deployLog.length > 0 && (
            <div ref={deployLogRef} className={`${!deployDone ? 'border-t border-blue-500/20' : ''} bg-black/60 p-2.5 max-h-[250px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-0.5`}>
              {deployDone && (
                <div className="font-display text-[9px] text-green-400 flex items-center gap-1 mb-2 pb-1.5 border-b border-green-500/20">
                  <Activity className="w-3 h-3" /> DEPLOYMENT LOG
                </div>
              )}
              {deployLog.map((line, i) => (
                <div key={i} className={`whitespace-pre-wrap break-all ${
                  line === '' ? 'h-1' :
                  line.startsWith('[LIVE]') || line.startsWith('[READY]') ? 'text-green-400' :
                  line.startsWith('[ERROR]') || line.startsWith('[FAIL]') ? 'text-red-400' :
                  line.startsWith('[CONFIG]') ? 'text-yellow-300' :
                  'text-blue-300'
                }`}>{line}</div>
              ))}
              {deploying && <span className="inline-block w-2 h-3 bg-blue-400 animate-pulse" />}
            </div>
          )}

          {deployDone && (
            <div className="p-2 border-t border-green-500/20">
              <button onClick={() => { setShowForm(false); setDeployLog([]); setDeployDone(false); }}
                className="w-full py-1.5 border border-green-500/50 text-green-400 text-[10px] font-display hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1">
                <Wifi className="w-3 h-3" /> VIEW DEPLOYED AGENTS
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
      ) : agents.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border">
          <Server className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-muted-foreground text-xs">No agents deployed</div>
          <div className="text-muted-foreground/50 text-[10px]">Deploy your first agent to the Moltbook Network</div>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
          {agents.map(agent => (
            <div key={agent.id} className="border border-border bg-black/30" data-testid={`agent-row-${agent.id}`}>
              <div className="flex items-center gap-3 p-2.5 hover:bg-black/50 transition-colors cursor-pointer" onClick={() => toggleExpand(agent.id)}>
                <button onClick={e => { e.stopPropagation(); toggleStatus(agent.id, agent.status); }} className="shrink-0" data-testid={`button-toggle-${agent.id}`}>
                  {agent.status === 'active' ? <Wifi className="w-3.5 h-3.5 text-green-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[10px] text-white truncate">{agent.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-display">{agent.type.toUpperCase()}</span>
                    <span className="text-[8px] text-muted-foreground">{agent.region}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                    <span className="font-mono">{agent.apiKeyPrefix}••••••</span>
                    <span className="text-green-400">{agent.tasksCompleted} done</span>
                    {agent.tasksFailed > 0 && <span className="text-red-400">{agent.tasksFailed} failed</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {agent.status === 'active' && <Activity className="w-3 h-3 text-green-400 animate-pulse" />}
                  {expandedAgent === agent.id ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </div>
              </div>

              {expandedAgent === agent.id && (
                <div className="border-t border-border bg-black/40 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 border border-border bg-black/30">
                      <div className="text-muted-foreground text-[8px] font-display mb-0.5">ENDPOINT</div>
                      {agent.endpoint.startsWith('/') ? (
                        <a href={agent.endpoint} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-mono text-[9px] break-all hover:text-blue-300 underline underline-offset-2">{agent.endpoint}</a>
                      ) : (
                        <div className="text-blue-400/50 font-mono text-[9px] break-all">{agent.endpoint} <span className="text-muted-foreground">(legacy)</span></div>
                      )}
                    </div>
                    <div className="p-2 border border-border bg-black/30">
                      <div className="text-muted-foreground text-[8px] font-display mb-0.5">CAPABILITIES</div>
                      <div className="text-white text-[9px]">{agent.capabilities}</div>
                    </div>
                  </div>

                  {agent.status === 'active' && (
                    <div className="border border-yellow-500/30 bg-yellow-500/5 p-2 space-y-2">
                      <div className="font-display text-[9px] text-yellow-400 flex items-center gap-1">
                        <Play className="w-3 h-3" /> DISPATCH TASK
                      </div>
                      <div className="flex gap-2">
                        <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)}
                          className="flex-1 bg-black/50 border border-border text-white px-2 py-1 text-[10px] focus:outline-none focus:border-yellow-500">
                          {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <button onClick={() => handleDispatch(agent)} disabled={dispatching === agent.id}
                          data-testid={`button-dispatch-${agent.id}`}
                          className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[9px] font-display hover:bg-yellow-500/30 transition-colors disabled:opacity-50 flex items-center gap-1">
                          {dispatching === agent.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                          RUN
                        </button>
                      </div>
                      {selectedTask === 'analyze' && (
                        <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Custom analysis prompt..."
                          className="w-full bg-black/50 border border-border text-white px-2 py-1 text-[10px] focus:outline-none focus:border-yellow-500 placeholder:text-muted-foreground/50" />
                      )}

                      {dispatchLog.length > 0 && (
                        <div className="bg-black/60 p-2 max-h-[150px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-0.5 border border-border">
                          {dispatchLog.map((line, i) => (
                            <div key={i} className={`whitespace-pre-wrap break-all ${
                              line.startsWith('[DONE]') ? 'text-green-400' :
                              line.startsWith('[ERROR]') || line.startsWith('[FAIL]') ? 'text-red-400' :
                              line.startsWith('[EXEC]') ? 'text-yellow-300' :
                              'text-blue-300'
                            }`}>{line}</div>
                          ))}
                          {dispatching === agent.id && <span className="inline-block w-2 h-3 bg-yellow-400 animate-pulse" />}
                        </div>
                      )}
                    </div>
                  )}

                  {agentLogs[agent.id] && agentLogs[agent.id].length > 0 && (
                    <div className="space-y-1">
                      <div className="font-display text-[8px] text-muted-foreground flex items-center gap-1">
                        <Terminal className="w-3 h-3" /> TASK HISTORY ({agentLogs[agent.id].length})
                      </div>
                      <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-0.5">
                        {agentLogs[agent.id].slice(0, 10).map(log => (
                          <div key={log.id} className="flex items-center gap-2 p-1.5 bg-black/20 border border-border text-[9px]">
                            <span className={`font-display ${log.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                              {log.status === 'completed' ? '✓' : '✗'}
                            </span>
                            <span className="text-blue-400 font-display shrink-0">{log.taskType.toUpperCase()}</span>
                            <span className="text-muted-foreground truncate flex-1">{log.description.slice(0, 80)}</span>
                            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{log.durationMs}ms</span>
                            </div>
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
    </div>
  );
}
