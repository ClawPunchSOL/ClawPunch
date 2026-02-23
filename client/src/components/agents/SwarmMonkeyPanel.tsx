import { useState, useEffect, useRef } from "react";
import { Users, Plus, Loader2, Wifi, WifiOff, Activity, Clock, Terminal, ChevronDown, ChevronUp, Server, Zap, X, ExternalLink, Copy, Check, Send, Trash2 } from "lucide-react";

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
  durationMs: number;
  createdAt: string;
}

export default function SwarmMonkeyPanel() {
  const [agents, setAgents] = useState<MoltbookAgent[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/moltbook/agents").then(r => r.json()).then(setAgents).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [registerLog]);

  const loadLogs = async (agentId: number) => {
    const logs = await fetch(`/api/moltbook/agents/${agentId}/logs`).then(r => r.json());
    setAgentLogs(prev => ({ ...prev, [agentId]: logs }));
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
            if (data.streaming) {
              setRegisterLog(prev => {
                const last = prev[prev.length - 1];
                if (last?.startsWith("[CONFIG] ")) {
                  return [...prev.slice(0, -1), last + data.message];
                }
                return [...prev, `[CONFIG] ${data.message}`];
              });
            } else if (data.stage === "error") {
              setRegisterLog(prev => [...prev, `[ERROR] ${data.message}`]);
            } else if (data.stage === "done") {
              setRegisterLog(prev => [...prev, `[LIVE] ${data.message}`]);
              if (data.claimUrl) {
                setRegisterResult({ claimUrl: data.claimUrl, verificationCode: data.verificationCode });
              }
              setRegisterDone(true);
              if (data.agent) setAgents(prev => [data.agent, ...prev]);
              setName("");
              setDescription("");
            } else if (data.stage === "fallback") {
              setRegisterLog(prev => [...prev, `[WARN] ${data.message}`]);
            } else {
              const labels: Record<string, string> = {
                init: "CONN", registered: "OK", keys: "KEY", verify: "VERIFY",
                configuring: "CONFIG", deploying: "DEPLOY", claim: "CLAIM"
              };
              setRegisterLog(prev => [...prev, `[${labels[data.stage] || data.stage.toUpperCase()}] ${data.message}`]);
            }
          } catch {}
        }
      }
    } catch {
      setRegisterLog(prev => [...prev, `[ERROR] Registration failed`]);
    } finally {
      setRegistering(false);
      const fresh = await fetch("/api/moltbook/agents").then(r => r.json()).catch(() => null);
      if (fresh) setAgents(fresh);
    }
  };

  const handlePost = async (agent: MoltbookAgent) => {
    if (!postTitle.trim() || !postContent.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/moltbook/agents/${agent.id}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submolt: "general", title: postTitle, content: postContent }),
      });
      if (res.ok) {
        setPostTitle("");
        setPostContent("");
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, postsCount: a.postsCount + 1 } : a));
        await loadLogs(agent.id);
      } else {
        const err = await res.json();
        alert(`Post failed: ${err.error}`);
      }
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this agent from your roster?")) return;
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

  const verifiedCount = agents.filter(a => a.status === 'verified' || a.status === 'active').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="font-display text-[11px] text-white">MOLTBOOK AGENTS</span>
          <span className="text-[10px] text-blue-400 font-display">{agents.length} REGISTERED</span>
        </div>
        <button onClick={() => { setShowForm(!showForm); setRegisterLog([]); setRegisterDone(false); setRegisterResult(null); }}
          data-testid="button-register-agent"
          className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[10px] font-display hover:bg-blue-500/30 transition-colors">
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? (registerDone ? 'CLOSE' : 'CANCEL') : 'REGISTER NEW'}
        </button>
      </div>

      <div className="p-2 border border-border bg-black/20 text-[9px] text-muted-foreground">
        <a href="https://www.moltbook.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">moltbook.com</a>
        {' '} — Register AI agents on the Moltbook social network. Agents can post, comment, and vote.
      </div>

      {showForm && (
        <div className="border-2 border-blue-500/30 bg-blue-500/5">
          {!registerDone && (
            <form onSubmit={handleRegister} className="p-3 space-y-2">
              <div className="font-display text-[9px] text-blue-400 flex items-center gap-1 mb-1">
                <Server className="w-3 h-3" /> REGISTER ON MOLTBOOK
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Agent name"
                data-testid="input-agent-name" disabled={registering}
                className="w-full bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 disabled:opacity-50" />
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (what does this agent do?)"
                disabled={registering}
                className="w-full bg-black/50 border-2 border-border text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 disabled:opacity-50" />
              <button type="submit" disabled={registering || !name.trim()} data-testid="button-submit-register"
                className="w-full retro-button retro-button-primary text-[10px] py-2 disabled:opacity-50 flex items-center justify-center gap-2">
                {registering ? <><Loader2 className="w-3 h-3 animate-spin" /> REGISTERING...</> : <><Zap className="w-3 h-3" /> REGISTER ON MOLTBOOK</>}
              </button>
            </form>
          )}

          {registerLog.length > 0 && (
            <div ref={logRef} className={`${!registerDone ? 'border-t border-blue-500/20' : ''} bg-black/60 p-2.5 max-h-[200px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-0.5`}>
              {registerDone && (
                <div className="font-display text-[9px] text-green-400 flex items-center gap-1 mb-2 pb-1.5 border-b border-green-500/20">
                  <Activity className="w-3 h-3" /> REGISTRATION LOG
                </div>
              )}
              {registerLog.map((line, i) => (
                <div key={i} className={`whitespace-pre-wrap break-all ${
                  line.startsWith('[DONE]') ? 'text-green-400' :
                  line.startsWith('[ERROR]') ? 'text-red-400' :
                  line.startsWith('[CLAIM]') ? 'text-yellow-300' :
                  line.startsWith('[VERIFY]') ? 'text-orange-400' :
                  'text-blue-300'
                }`}>{line}</div>
              ))}
              {registering && <span className="inline-block w-2 h-3 bg-blue-400 animate-pulse" />}
            </div>
          )}

          {registerDone && (
            <div className="p-3 border-t border-green-500/20 space-y-2">
              {registerResult?.claimUrl ? (
                <>
                  <div className="font-display text-[9px] text-orange-400 mb-1">MOLTBOOK VERIFICATION</div>
                  <div className="p-2 bg-black/40 border border-orange-500/30 space-y-2">
                    <div className="text-[10px] text-muted-foreground">
                      Tweet your verification code to activate on Moltbook:
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] text-orange-400 font-mono flex-1 truncate">{registerResult.verificationCode}</code>
                      <button onClick={() => copyToClipboard(registerResult.verificationCode)}
                        className="shrink-0 px-2 py-1 border border-orange-500/50 text-orange-400 text-[9px] font-display hover:bg-orange-500/10 flex items-center gap-1">
                        {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        {copied ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                    <a href={registerResult.claimUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[10px] font-display hover:bg-blue-500/30 transition-colors justify-center">
                      <ExternalLink className="w-3 h-3" /> OPEN CLAIM PAGE ON MOLTBOOK
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-2 bg-green-500/10 border border-green-500/30 text-center">
                  <div className="font-display text-[10px] text-green-400">AGENT DEPLOYED SUCCESSFULLY</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Agent is active and ready for tasks</div>
                </div>
              )}
              <button onClick={() => { setShowForm(false); setRegisterLog([]); setRegisterDone(false); setRegisterResult(null); }}
                className="w-full py-1.5 border border-green-500/50 text-green-400 text-[10px] font-display hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1">
                <Wifi className="w-3 h-3" /> VIEW AGENTS
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
          <div className="text-muted-foreground text-xs">No agents registered</div>
          <div className="text-muted-foreground/50 text-[10px]">Register your first agent on Moltbook</div>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
          {agents.map(agent => (
            <div key={agent.id} className="border border-border bg-black/30" data-testid={`agent-row-${agent.id}`}>
              <div className="flex items-center gap-3 p-2.5 hover:bg-black/50 transition-colors cursor-pointer" onClick={() => toggleExpand(agent.id)}>
                <div className="shrink-0">
                  {agent.status === 'pending_verification' ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center">
                      <span className="text-[7px] text-orange-400">!</span>
                    </div>
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[10px] text-white truncate">{agent.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 font-display ${
                      agent.status === 'pending_verification'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>{agent.status === 'pending_verification' ? 'VERIFY' : 'ACTIVE'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                    <span className="font-mono">{agent.apiKeyPrefix}...</span>
                    {agent.postsCount > 0 && <span className="text-blue-400">{agent.postsCount} posts</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); handleDelete(agent.id); }}
                    className="text-muted-foreground/30 hover:text-red-400 transition-colors" data-testid={`button-delete-${agent.id}`}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {expandedAgent === agent.id ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </div>
              </div>

              {expandedAgent === agent.id && (
                <div className="border-t border-border bg-black/40 p-3 space-y-3">
                  {agent.status === 'pending_verification' && agent.claimUrl && (
                    <div className="p-2 border border-orange-500/30 bg-orange-500/5 space-y-2">
                      <div className="font-display text-[9px] text-orange-400">VERIFICATION NEEDED</div>
                      <div className="text-[10px] text-muted-foreground">
                        Tweet your code: <code className="text-orange-400">{agent.verificationCode}</code>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(agent.verificationCode || '')}
                          className="flex-1 py-1 border border-orange-500/50 text-orange-400 text-[9px] font-display hover:bg-orange-500/10 flex items-center justify-center gap-1">
                          {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />} COPY CODE
                        </button>
                        <a href={agent.claimUrl} target="_blank" rel="noopener noreferrer"
                          className="flex-1 py-1 border border-blue-500/50 text-blue-400 text-[9px] font-display hover:bg-blue-500/10 flex items-center justify-center gap-1">
                          <ExternalLink className="w-2.5 h-2.5" /> CLAIM PAGE
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 border border-border bg-black/30">
                      <div className="text-muted-foreground text-[8px] font-display mb-0.5">API KEY</div>
                      <div className="text-blue-400 font-mono text-[9px]">{agent.apiKeyPrefix}...</div>
                    </div>
                    <div className="p-2 border border-border bg-black/30">
                      <div className="text-muted-foreground text-[8px] font-display mb-0.5">DESCRIPTION</div>
                      <div className="text-white text-[9px] truncate">{agent.description || agent.capabilities}</div>
                    </div>
                  </div>

                  {agent.status !== 'pending_verification' && (
                    <div className="border border-blue-500/30 bg-blue-500/5 p-2 space-y-2">
                      <div className="font-display text-[9px] text-blue-400 flex items-center gap-1">
                        <Send className="w-3 h-3" /> POST TO MOLTBOOK
                      </div>
                      <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Post title"
                        className="w-full bg-black/50 border border-border text-white px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50" />
                      <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Post content..."
                        rows={2}
                        className="w-full bg-black/50 border border-border text-white px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 resize-none" />
                      <button onClick={() => handlePost(agent)} disabled={posting || !postTitle.trim() || !postContent.trim()}
                        data-testid={`button-post-${agent.id}`}
                        className="w-full py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[9px] font-display hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        {posting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                        POST TO m/general
                      </button>
                    </div>
                  )}

                  {agentLogs[agent.id] && agentLogs[agent.id].length > 0 && (
                    <div className="space-y-1">
                      <div className="font-display text-[8px] text-muted-foreground flex items-center gap-1">
                        <Terminal className="w-3 h-3" /> ACTIVITY LOG ({agentLogs[agent.id].length})
                      </div>
                      <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-0.5">
                        {agentLogs[agent.id].slice(0, 10).map(log => (
                          <div key={log.id} className="flex items-start gap-2 p-1.5 bg-black/20 border border-border text-[9px]">
                            <span className={`font-display shrink-0 ${log.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                              {log.status === 'completed' ? '✓' : '✗'}
                            </span>
                            <span className="text-blue-400 font-display shrink-0">{log.taskType.toUpperCase()}</span>
                            <span className="text-muted-foreground flex-1 break-all">{log.description.slice(0, 100)}</span>
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
