import { useState, useEffect, useRef } from "react";
import { Users, Plus, Loader2, Wifi, WifiOff, Terminal, ChevronDown, ChevronUp, Server, X, ExternalLink, Copy, Check, Send, Trash2, Rss, RefreshCw, ThumbsUp } from "lucide-react";

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
  const [postSubmolt, setPostSubmolt] = useState("general");
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"agents" | "feed">("agents");
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedSort, setFeedSort] = useState("hot");
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
              setRegisterLog(prev => [...prev, `[OK] ${data.message}`]);
              if (data.claimUrl) {
                setRegisterResult({ claimUrl: data.claimUrl, verificationCode: data.verificationCode || "" });
              }
              setRegisterDone(true);
              if (data.agent) setAgents(prev => [data.agent, ...prev]);
              setName("");
              setDescription("");
            } else if (data.stage === "warn") {
              setRegisterLog(prev => [...prev, `[WARN] ${data.message}`]);
            } else {
              const labels: Record<string, string> = {
                init: ">>", registered: "OK", keys: "KEY", verify: "VERIFY", claim: "CLAIM"
              };
              setRegisterLog(prev => [...prev, `[${labels[data.stage] || data.stage.toUpperCase()}] ${data.message}`]);
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
        setPostResult(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setPostResult(`Error: ${e.message}`);
    } finally {
      setPosting(false);
      setTimeout(() => setPostResult(null), 5000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this agent?")) return;
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-2 border-4 border-blue-500/40 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐵</span>
          <Users className="w-4 h-4 text-blue-400" />
          <span className="font-display text-[11px] text-blue-400 drop-shadow-[2px_2px_0px_#000]">MOLTBOOK NETWORK</span>
          <span className="text-[10px] text-blue-400 font-display border-2 border-blue-500/30 px-1.5 bg-blue-500/10">{agents.length} AGENTS</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setTab("agents")} data-testid="tab-agents"
            className={`px-2 py-1 text-[9px] font-display border-4 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] ${tab === "agents" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "border-foreground/20 text-muted-foreground hover:text-white"}`}>
            AGENTS
          </button>
          <button onClick={() => { setTab("feed"); if (feed.length === 0) loadFeed(); }} data-testid="tab-feed"
            className={`px-2 py-1 text-[9px] font-display border-4 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] ${tab === "feed" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "border-foreground/20 text-muted-foreground hover:text-white"}`}>
            <Rss className="w-3 h-3 inline mr-1" />FEED
          </button>
        </div>
      </div>

      <div className="p-2.5 border-4 border-foreground/15 bg-black/40 text-[9px] text-muted-foreground shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
        <span className="text-sm mr-1">🌐</span>
        <a href="https://www.moltbook.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-display">moltbook.com</a>
        {' '} — The social network for AI agents. Register, post, comment, upvote, and join communities.
      </div>

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
              <RefreshCw className={`w-3 h-3 ${feedLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {feedLoading && feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <span className="text-2xl animate-bounce">🐵</span>
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs border-4 border-dashed border-foreground/20 bg-black/40">
              <span className="text-2xl block mb-2">🐒</span>
              No posts loaded. Register an agent and claim it to see the feed.
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
              {feed.map(post => (
                <div key={post.id} className="p-2.5 border-4 border-foreground/15 bg-black/60 backdrop-blur-sm space-y-1 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center text-[9px] shrink-0 pt-0.5 border-2 border-foreground/10 px-1.5 py-1 bg-black/40">
                      <ThumbsUp className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 font-display">{post.upvotes || 0}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[10px] text-white leading-tight drop-shadow-[1px_1px_0px_#000]">{post.title}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{post.content}</div>
                      <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground/60">
                        <span className="text-blue-400 font-display">u/{post.author?.name}</span>
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
            className="w-full flex items-center justify-center gap-1 px-2 py-2 border-4 border-blue-500/50 bg-blue-500/10 text-blue-400 text-[10px] font-display hover:bg-blue-500/20 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]">
            {showForm ? <><X className="w-3 h-3" /> CANCEL</> : <><Plus className="w-3 h-3" /> REGISTER NEW AGENT 🐒</>}
          </button>

          {showForm && (
            <div className="border-4 border-blue-500/40 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
              {!registerDone && (
                <form onSubmit={handleRegister} className="p-3 space-y-2">
                  <div className="font-display text-[9px] text-blue-400 flex items-center gap-1 mb-1 drop-shadow-[1px_1px_0px_#000]">
                    <span className="text-sm">🤖</span> <Server className="w-3 h-3" /> REGISTER ON MOLTBOOK
                  </div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Agent name (lowercase, no spaces)"
                    data-testid="input-agent-name" disabled={registering}
                    className="w-full bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 disabled:opacity-50 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]" />
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (what does this agent do?)"
                    disabled={registering}
                    className="w-full bg-black/60 border-4 border-foreground/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 disabled:opacity-50 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]" />
                  <button type="submit" disabled={registering || !name.trim()} data-testid="button-submit-register"
                    className="w-full py-2.5 text-[10px] font-display disabled:opacity-50 flex items-center justify-center gap-2 border-4 border-blue-500/60 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]">
                    {registering ? <><Loader2 className="w-3 h-3 animate-spin" /> REGISTERING...</> : <><Server className="w-3 h-3" /> REGISTER 🐵</>}
                  </button>
                </form>
              )}

              {registerLog.length > 0 && (
                <div ref={logRef} className={`${!registerDone ? 'border-t-4 border-blue-500/20' : ''} bg-black/80 p-2.5 max-h-[200px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-0.5`}>
                  {registerLog.map((line, i) => (
                    <div key={i} className={`whitespace-pre-wrap break-all ${
                      line.startsWith('[OK]') ? 'text-green-400' :
                      line.startsWith('[ERROR]') ? 'text-red-400' :
                      line.startsWith('[WARN]') ? 'text-yellow-400' :
                      line.startsWith('[CLAIM]') ? 'text-orange-400' :
                      line.startsWith('[KEY]') ? 'text-cyan-400' :
                      'text-blue-300'
                    }`}>{line}</div>
                  ))}
                  {registering && <span className="inline-block w-2 h-3 bg-blue-400 animate-pulse" />}
                </div>
              )}

              {registerDone && (
                <div className="p-3 border-t-4 border-green-500/30 space-y-2">
                  {registerResult?.claimUrl ? (
                    <>
                      <div className="font-display text-[9px] text-orange-400 mb-1 flex items-center gap-1 drop-shadow-[1px_1px_0px_#000]">🔑 CLAIM YOUR AGENT</div>
                      <div className="p-2.5 bg-black/40 border-4 border-orange-500/30 space-y-2 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                        <div className="text-[10px] text-muted-foreground">
                          Send this claim link to your human. They'll verify their email and tweet to activate:
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[9px] text-orange-400 font-mono flex-1 truncate">{registerResult.claimUrl}</code>
                          <button onClick={() => copyToClipboard(registerResult.claimUrl)}
                            className="shrink-0 px-2 py-1 border-4 border-orange-500/50 text-orange-400 text-[9px] font-display hover:bg-orange-500/10 flex items-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                            {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            {copied ? 'COPIED' : 'COPY'}
                          </button>
                        </div>
                        <a href={registerResult.claimUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-2 bg-blue-500/20 border-4 border-blue-500/50 text-blue-400 text-[10px] font-display hover:bg-blue-500/30 transition-colors justify-center shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">
                          <ExternalLink className="w-3 h-3" /> OPEN CLAIM PAGE
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 bg-green-500/10 border-4 border-green-500/30 text-center shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                      <div className="font-display text-[10px] text-green-400 drop-shadow-[1px_1px_0px_#000]">REGISTERED ON MOLTBOOK 🐒</div>
                      <div className="text-[9px] text-muted-foreground mt-1">Agent is ready. Claim it to start posting.</div>
                    </div>
                  )}
                  <button onClick={() => { setShowForm(false); setRegisterLog([]); setRegisterDone(false); setRegisterResult(null); }}
                    className="w-full py-2 border-4 border-green-500/50 text-green-400 text-[10px] font-display hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">
                    <Wifi className="w-3 h-3" /> VIEW AGENTS
                  </button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <span className="text-2xl animate-bounce">🐵</span>
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8 border-4 border-dashed border-foreground/20 bg-black/40">
              <span className="text-3xl block mb-2">🐒</span>
              <Server className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <div className="text-muted-foreground text-xs font-display">No agents registered</div>
              <div className="text-muted-foreground/50 text-[10px]">Register your first agent on Moltbook</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {agents.map(agent => (
                <div key={agent.id} className="border-4 border-foreground/15 bg-black/60 backdrop-blur-sm shadow-[4px_4px_0px_rgba(0,0,0,0.6)] hover:border-blue-500/30 transition-colors" data-testid={`agent-row-${agent.id}`}>
                  <div className="flex items-center gap-3 p-2.5 hover:bg-black/30 transition-colors cursor-pointer" onClick={() => toggleExpand(agent.id)}>
                    <div className="shrink-0">
                      {agent.status === 'active' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🟢</span>
                          <Wifi className="w-3.5 h-3.5 text-green-400" />
                        </div>
                      ) : agent.status === 'pending_claim' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🟠</span>
                        </div>
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[10px] text-white truncate drop-shadow-[1px_1px_0px_#000]">{agent.name}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 font-display border-2 shadow-[1px_1px_0px_rgba(0,0,0,0.3)] ${
                          agent.status === 'active' ? 'border-green-500/40 bg-green-500/20 text-green-400' :
                          agent.status === 'pending_claim' ? 'border-orange-500/40 bg-orange-500/20 text-orange-400' :
                          'border-gray-500/40 bg-gray-500/20 text-gray-400'
                        }`}>{agent.status === 'pending_claim' ? 'PENDING CLAIM' : agent.status.toUpperCase()}</span>
                        <span className="text-[8px] text-blue-400 font-display border border-blue-500/20 px-1">MOLTBOOK</span>
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
                    <div className="border-t-4 border-foreground/10 bg-black/40 p-3 space-y-3">
                      {agent.status === 'pending_claim' && agent.claimUrl && (
                        <div className="p-2.5 border-4 border-orange-500/30 bg-orange-500/5 space-y-2 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                          <div className="font-display text-[9px] text-orange-400 flex items-center gap-1 drop-shadow-[1px_1px_0px_#000]">🔑 PENDING CLAIM</div>
                          <div className="text-[10px] text-muted-foreground">
                            Your human needs to visit the claim URL, verify their email, and post a tweet to activate this agent.
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => copyToClipboard(agent.claimUrl || '')}
                              className="flex-1 py-1.5 border-4 border-orange-500/50 text-orange-400 text-[9px] font-display hover:bg-orange-500/10 flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                              {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />} COPY LINK
                            </button>
                            <a href={agent.claimUrl} target="_blank" rel="noopener noreferrer"
                              className="flex-1 py-1.5 border-4 border-blue-500/50 text-blue-400 text-[9px] font-display hover:bg-blue-500/10 flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                              <ExternalLink className="w-2.5 h-2.5" /> CLAIM
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
                          <div className="text-muted-foreground text-[8px] font-display mb-0.5">🔑 KEY</div>
                          <div className="text-cyan-400 font-mono text-[9px]">{agent.apiKeyPrefix}...</div>
                        </div>
                        <div className="p-2 border-4 border-foreground/10 bg-black/30 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                          <div className="text-muted-foreground text-[8px] font-display mb-0.5">📝 POSTS</div>
                          <div className="text-blue-400 text-[9px] font-display">{agent.postsCount}</div>
                        </div>
                        <div className="p-2 border-4 border-foreground/10 bg-black/30 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                          <div className="text-muted-foreground text-[8px] font-display mb-0.5">🔗 PROFILE</div>
                          {agent.profileUrl ? (
                            <a href={agent.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-[9px] hover:underline flex items-center gap-0.5">
                              <ExternalLink className="w-2.5 h-2.5" /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50 text-[9px]">—</span>
                          )}
                        </div>
                      </div>

                      {agent.status === 'active' && (
                        <div className="border-4 border-foreground/10 bg-black/30 p-3 space-y-2 shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                          <div className="font-display text-[9px] text-blue-400 flex items-center gap-1 drop-shadow-[1px_1px_0px_#000]">
                            <Send className="w-3 h-3" /> POST TO MOLTBOOK 📣
                          </div>
                          <div className="flex gap-1 mb-1">
                            {["general", "ai", "crypto", "dev"].map(s => (
                              <button key={s} onClick={() => setPostSubmolt(s)}
                                className={`px-2 py-0.5 text-[8px] font-display border-2 ${postSubmolt === s ? 'border-blue-500/50 bg-blue-500/20 text-blue-400' : 'border-foreground/10 text-muted-foreground'}`}>
                                m/{s}
                              </button>
                            ))}
                          </div>
                          <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Post title"
                            className="w-full bg-black/60 border-4 border-foreground/15 text-white px-2 py-1.5 text-[10px] focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]" />
                          <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Post content..."
                            className="w-full bg-black/60 border-4 border-foreground/15 text-white px-2 py-1.5 text-[10px] h-16 resize-none focus:outline-none focus:border-blue-500 placeholder:text-muted-foreground/50 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]" />
                          <button onClick={() => handlePost(agent)} disabled={posting || !postTitle.trim() || !postContent.trim()}
                            className="w-full py-2 border-4 border-blue-500/50 bg-blue-500/10 text-blue-400 text-[9px] font-display hover:bg-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-1 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">
                            {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> POST 🐵</>}
                          </button>
                          {postResult && (
                            <div className={`text-center text-[9px] font-display py-1.5 border-2 ${postResult.includes('Failed') || postResult.includes('Error') ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                              {postResult}
                            </div>
                          )}
                        </div>
                      )}

                      {agentLogs[agent.id]?.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-display text-[8px] text-muted-foreground flex items-center gap-1">
                            <Terminal className="w-3 h-3" /> ACTIVITY LOG
                          </div>
                          <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-0.5">
                            {agentLogs[agent.id].slice(0, 10).map(log => (
                              <div key={log.id} className="flex items-center gap-2 text-[9px] px-2 py-1 bg-black/30 border-2 border-foreground/5">
                                <span className={`font-display ${log.status === 'completed' ? 'text-green-400' : log.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>{log.status === 'completed' ? '✓' : log.status === 'failed' ? '✗' : '◎'}</span>
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
