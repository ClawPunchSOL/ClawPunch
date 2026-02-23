import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Banana, 
  Send, 
  LogOut,
  Zap,
  Users,
  CircleDollarSign,
  Cpu,
  ShieldAlert,
  FileCode,
  Loader2,
  Menu,
  X,
  ArrowLeft,
  MessageSquare
} from "lucide-react";

import bananaBot from "@/assets/images/banana-bot.png";
import swarmMonkey from "@/assets/images/swarm-monkey.png";
import oracleMonkey from "@/assets/images/oracle-monkey.png";
import trendMonkey from "@/assets/images/trend-monkey.png";
import vaultMonkey from "@/assets/images/vault-monkey.png";

type AgentId = 'banana-bot' | 'swarm-monkey' | 'punch-oracle' | 'trend-puncher' | 'vault-swinger' | 'rug-buster' | 'repo-ape';

interface Agent {
  id: AgentId;
  name: string;
  avatar: string;
  status: string;
  statusColor: string;
  bgGlow: string;
  icon: React.ReactNode;
  description: string;
  longDescription: string;
  placeholder: string;
  systemMessage: string;
  quickPrompts: string[];
  category: string;
}

const AGENTS: Record<AgentId, Agent> = {
  'banana-bot': {
    id: 'banana-bot',
    name: 'BANANA BOT',
    avatar: bananaBot,
    status: 'Ready',
    statusColor: 'text-green-500',
    bgGlow: 'shadow-[0_0_30px_rgba(34,197,94,0.15)]',
    icon: <CircleDollarSign className="w-4 h-4 text-green-500" />,
    description: 'x402 Micropayments',
    longDescription: 'Send tips, process payments, and stream fractional USDC through x402 protocol state channels.',
    placeholder: "e.g., 'Tip 50 USDC to @user'",
    systemMessage: 'SYSTEM INITIALIZED. X402 PROTOCOL ONLINE. READY TO SEND BANANAS.',
    quickPrompts: ['Send 10 USDC to @degen', 'Check my payment channels', 'Stream 0.001 SOL/sec to vault'],
    category: 'PAYMENTS'
  },
  'swarm-monkey': {
    id: 'swarm-monkey',
    name: 'SWARM MONKEY',
    avatar: swarmMonkey,
    status: 'Active',
    statusColor: 'text-blue-500',
    bgGlow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    icon: <Users className="w-4 h-4 text-blue-500" />,
    description: 'Agent Manager',
    longDescription: 'Register new agents, coordinate multi-agent operations, and monitor swarm health on the Moltbook Network.',
    placeholder: "e.g., 'Register agent AlphaApe'",
    systemMessage: 'MOLTBOOK CONNECTION ESTABLISHED. SWARM MANAGEMENT READY.',
    quickPrompts: ['Register new agent AlphaApe', 'Show swarm status', 'Deploy 3 agents to monitor SOL'],
    category: 'MANAGEMENT'
  },
  'punch-oracle': {
    id: 'punch-oracle',
    name: 'PUNCH ORACLE',
    avatar: oracleMonkey,
    status: 'Syncing',
    statusColor: 'text-purple-500',
    bgGlow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    icon: <Terminal className="w-4 h-4 text-purple-500" />,
    description: 'Predictions',
    longDescription: 'Stake $PUNCH on predictions, create markets for any crypto event, and analyze odds in real-time.',
    placeholder: "e.g., 'Stake 1000 PUNCH on SOL > $300'",
    systemMessage: 'ORACLES SYNCED. PREDICTION MARKETS LIVE. PUNCH YOUR PREDICTION.',
    quickPrompts: ['Will SOL hit $300 by March?', 'Create market: ETH flippening', 'Show my open predictions'],
    category: 'TRADING'
  },
  'trend-puncher': {
    id: 'trend-puncher',
    name: 'TREND PUNCHER',
    avatar: trendMonkey,
    status: 'Scanning',
    statusColor: 'text-yellow-500',
    bgGlow: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]',
    icon: <Zap className="w-4 h-4 text-yellow-500" />,
    description: 'Trend Trading',
    longDescription: 'Trade on attention markets - buy and sell narrative shares based on social virality and trend momentum.',
    placeholder: "e.g., 'Buy attention shares on #Punch'",
    systemMessage: 'ATTENTION MARKETS SCANNING. TREND ANALYSIS ACTIVE.',
    quickPrompts: ['What narratives are trending?', 'Buy 1000 shares on #AI', 'Show my attention portfolio'],
    category: 'TRADING'
  },
  'vault-swinger': {
    id: 'vault-swinger',
    name: 'APE VAULT',
    avatar: vaultMonkey,
    status: 'Farming',
    statusColor: 'text-orange-500',
    bgGlow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]',
    icon: <Cpu className="w-4 h-4 text-orange-500" />,
    description: 'Yield Farming',
    longDescription: 'Manage DeFi vaults, optimize yield farming strategies, and handle liquidity across Raydium, Orca, and Meteora.',
    placeholder: "e.g., 'Stake all PUNCH in best vault'",
    systemMessage: 'DEFI VAULTS CONNECTED. TREASURY MANAGER STANDING BY.',
    quickPrompts: ['Show best yield vaults', 'Stake 1000 PUNCH', 'What is my APY?'],
    category: 'DEFI'
  },
  'rug-buster': {
    id: 'rug-buster',
    name: 'RUG BUSTER',
    avatar: swarmMonkey,
    status: 'Guarding',
    statusColor: 'text-red-500',
    bgGlow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
    icon: <ShieldAlert className="w-4 h-4 text-red-500" />,
    description: 'Security Scanner',
    longDescription: 'Scan any Solana token for rug-pull risks. Checks mint authority, freeze authority, LP locks, and holder distribution.',
    placeholder: "e.g., 'Scan EPjFWdd5... for rug risk'",
    systemMessage: 'SECURITY SCANNERS ONLINE. READY TO BUST RUGS VIA X402 PAYMENTS.',
    quickPrompts: ['Is this token safe? EPjFWdd5...', 'Check top holders of $BONK', 'Scan latest pump.fun launch'],
    category: 'SECURITY'
  },
  'repo-ape': {
    id: 'repo-ape',
    name: 'REPO APE',
    avatar: oracleMonkey,
    status: 'Analyzing',
    statusColor: 'text-cyan-500',
    bgGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    icon: <FileCode className="w-4 h-4 text-cyan-500" />,
    description: 'Code Auditor',
    longDescription: 'Scan GitHub repos to detect AI LARP projects. Analyzes commit history, code quality, and actual implementation vs claims.',
    placeholder: "e.g., 'Score github.com/user/repo'",
    systemMessage: 'REPO ANALYSIS PROTOCOL ENGAGED. AWAITING TARGET GITHUB URL.',
    quickPrompts: ['Analyze github.com/solana-labs/solana', 'Find trending crypto repos', 'Is this repo legit?'],
    category: 'SECURITY'
  }
};

interface ChatMessage {
  id: number;
  sender: 'user' | 'agent' | 'system';
  text: string;
  time: string;
  isStreaming?: boolean;
}

export default function MonkeyOS() {
  const [, setLocation] = useLocation();
  const [activeAgentId, setActiveAgentId] = useState<AgentId | null>(null);
  const [conversationIds, setConversationIds] = useState<Record<string, number | null>>({});
  const [messagesMap, setMessagesMap] = useState<Record<AgentId, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    for (const agentId of Object.keys(AGENTS)) {
      initial[agentId] = [{ id: 1, sender: 'system', text: AGENTS[agentId as AgentId].systemMessage, time: '09:00' }];
    }
    return initial as Record<AgentId, ChatMessage[]>;
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamingMsgIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeAgent = activeAgentId ? AGENTS[activeAgentId] : null;
  const currentMessages = activeAgentId ? messagesMap[activeAgentId] : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const getOrCreateConversation = useCallback(async (agentId: AgentId): Promise<number> => {
    if (conversationIds[agentId]) return conversationIds[agentId]!;
    const res = await fetch(`/api/agents/${agentId}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${AGENTS[agentId].name} Session` }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const conv = await res.json();
    setConversationIds(prev => ({ ...prev, [agentId]: conv.id }));
    return conv.id;
  }, [conversationIds]);

  const handleAgentSelect = (agentId: AgentId) => {
    setActiveAgentId(agentId);
    setSidebarOpen(false);
  };

  const handleBackToHub = () => {
    abortControllerRef.current?.abort();
    setActiveAgentId(null);
    setIsStreaming(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || !activeAgentId) return;
    
    const targetAgentId = activeAgentId;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text, time: now };

    setMessagesMap(prev => ({
      ...prev,
      [targetAgentId]: [...prev[targetAgentId], userMsg]
    }));
    setInput('');
    setIsStreaming(true);

    const streamingMsgId = Date.now() + 1;
    streamingMsgIdRef.current = streamingMsgId;

    setMessagesMap(prev => ({
      ...prev,
      [targetAgentId]: [...prev[targetAgentId], { id: streamingMsgId, sender: 'agent', text: '', time: now, isStreaming: true }]
    }));

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const convId = await getOrCreateConversation(targetAgentId);
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
        signal: abortController.signal,
      });
      if (!res.ok) throw new Error('Failed to send message');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              accumulated += data.content;
              const t = accumulated;
              setMessagesMap(prev => ({ ...prev, [targetAgentId]: prev[targetAgentId].map(m => m.id === streamingMsgId ? { ...m, text: t } : m) }));
            }
            if (data.error) throw new Error(data.error);
          } catch (e) { if (e instanceof SyntaxError) continue; throw e; }
        }
      }
      setMessagesMap(prev => ({ ...prev, [targetAgentId]: prev[targetAgentId].map(m => m.id === streamingMsgId ? { ...m, isStreaming: false } : m) }));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Chat error:', err);
      setMessagesMap(prev => ({ ...prev, [targetAgentId]: prev[targetAgentId].map(m => m.id === streamingMsgId ? { ...m, text: m.text || 'ERROR: Connection lost. Try again.', isStreaming: false } : m) }));
    } finally {
      setIsStreaming(false);
      streamingMsgIdRef.current = null;
      abortControllerRef.current = null;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const agentsByCategory = Object.values(AGENTS).reduce((acc, agent) => {
    if (!acc[agent.category]) acc[agent.category] = [];
    acc[agent.category].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  const categoryOrder = ['TRADING', 'SECURITY', 'DEFI', 'PAYMENTS', 'MANAGEMENT'];
  const categoryLabels: Record<string, string> = {
    'TRADING': 'Trade & Predict',
    'SECURITY': 'Security & Research',
    'DEFI': 'DeFi & Yield',
    'PAYMENTS': 'Payments',
    'MANAGEMENT': 'Agent Management',
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col font-sans text-foreground overflow-hidden">
      <header className="h-12 border-b-4 border-border bg-card flex items-center justify-between px-3 md:px-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          {activeAgent ? (
            <button onClick={handleBackToHub} className="text-primary p-1 flex items-center gap-1" data-testid="button-back-hub">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-display text-[10px] hidden sm:inline">AGENTS</span>
            </button>
          ) : (
            <>
              <Terminal className="text-primary w-5 h-5" />
            </>
          )}
          <span className="font-display text-xs text-primary" data-testid="text-os-version">MONKEY OS v1.0.4</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 text-yellow-400">
            <Banana className="w-4 h-4 fill-current" />
            <span className="font-display text-xs" data-testid="text-banana-balance">1,420</span>
          </div>
          <button onClick={() => setLocation('/')} className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2" data-testid="button-exit">
            <LogOut className="w-4 h-4" />
            <span className="font-display text-[10px] hidden sm:inline">EXIT</span>
          </button>
        </div>
      </header>

      {!activeAgent ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <div className="text-center mb-10 md:mb-14">
              <h1 className="font-display text-2xl md:text-4xl text-white mb-3" data-testid="text-hub-title">
                CHOOSE YOUR AGENT
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed">
                Each agent is a specialized AI tool. Pick the one that fits what you need right now.
              </p>
            </div>

            {categoryOrder.map(cat => {
              const agents = agentsByCategory[cat];
              if (!agents) return null;
              return (
                <div key={cat} className="mb-8 md:mb-10">
                  <h2 className="font-display text-[11px] text-muted-foreground mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-border" />
                    {categoryLabels[cat]}
                    <span className="flex-1 h-px bg-border" />
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {agents.map(agent => (
                      <motion.button
                        key={agent.id}
                        onClick={() => handleAgentSelect(agent.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        data-testid={`card-agent-${agent.id}`}
                        className={`w-full text-left p-4 md:p-5 retro-container border-border hover:border-primary/60 bg-card/30 hover:bg-card/60 transition-all group ${agent.bgGlow}`}
                      >
                        <div className="flex items-start gap-4">
                          <img src={agent.avatar} alt={agent.name} className="w-12 h-12 md:w-14 md:h-14 pixel-art-rendering rounded bg-black shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {agent.icon}
                              <span className="font-display text-xs text-white group-hover:text-primary transition-colors">{agent.name}</span>
                              <span className={`text-[10px] font-display ${agent.statusColor} ml-auto`}>{agent.status}</span>
                            </div>
                            <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-3">{agent.longDescription}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {agent.quickPrompts.slice(0, 2).map((p, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-black/50 border border-border text-muted-foreground truncate max-w-[200px]">
                                  "{p}"
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          <aside className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 fixed md:relative z-40 w-64 h-[calc(100vh-48px)]
            border-r-4 border-border bg-card/95 md:bg-card/50 
            flex flex-col shrink-0 transition-transform duration-200 ease-out
            backdrop-blur-lg md:backdrop-blur-none
          `}>
            <div className="p-3 border-b-2 border-border flex items-center justify-between">
              <h2 className="font-display text-[10px] text-muted-foreground">AGENTS</h2>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {(Object.values(AGENTS) as Agent[]).map((agent) => (
                <button 
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  data-testid={`button-agent-${agent.id}`}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-none border-2 transition-all ${
                    activeAgentId === agent.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-transparent hover:border-border hover:bg-card/50'
                  }`}
                >
                  <img src={agent.avatar} alt={agent.name} className="w-8 h-8 pixel-art-rendering rounded bg-black shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-display text-[10px] text-white truncate">{agent.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{agent.description}</div>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${agent.statusColor.replace('text-', 'bg-')}`} />
                </button>
              ))}
            </div>

            <div className="p-3 border-t-2 border-border bg-card">
              <div className="space-y-1.5 text-[10px] font-sans">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-green-400 font-display" data-testid="text-network">SOLANA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ping</span>
                  <span className="text-white" data-testid="text-ping">24ms</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-background/90 relative w-full">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            
            <div className="p-3 md:p-4 border-b-2 border-border flex items-center justify-between shrink-0 z-10 bg-black/40 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden text-muted-foreground" data-testid="button-menu">
                  <Menu className="w-5 h-5" />
                </button>
                <img src={activeAgent.avatar} className="w-8 h-8 md:w-10 md:h-10 pixel-art-rendering drop-shadow-[0_0_10px_rgba(255,200,0,0.3)] shrink-0" />
                <div className="min-w-0">
                  <h1 className="font-display text-sm md:text-lg text-white truncate" data-testid="text-agent-name">{activeAgent.name}</h1>
                  <p className="text-muted-foreground text-[10px] md:text-xs font-sans truncate" data-testid="text-agent-desc">{activeAgent.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-2 h-2 rounded-full animate-pulse ${activeAgent.statusColor.replace('text-', 'bg-')}`} />
                <span className="font-display text-[10px] text-muted-foreground uppercase hidden sm:inline" data-testid="text-agent-status">{activeAgent.status}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-5 z-10 custom-scrollbar">
              <AnimatePresence initial={false} mode="popLayout">
                {currentMessages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    data-testid={`chat-message-${msg.sender}-${msg.id}`}
                  >
                    <div className={`
                      max-w-[90%] md:max-w-[75%] p-3 md:p-4 rounded-none border-2 shadow-[2px_2px_0px_#000]
                      ${msg.sender === 'user' 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : msg.sender === 'system'
                          ? 'bg-card border-border text-muted-foreground font-display text-[10px]'
                          : 'bg-[#1a1a1a] text-white border-secondary'
                      }
                    `}>
                      <p className={`whitespace-pre-wrap break-words ${msg.sender === 'system' ? '' : 'text-sm md:text-base leading-relaxed font-sans'}`}>
                        {msg.text}
                        {msg.sender === 'agent' && msg.isStreaming && msg.text && (
                          <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-blink align-middle" />
                        )}
                        {msg.sender === 'agent' && msg.isStreaming && !msg.text && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 bg-primary rounded-none animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block w-1.5 h-1.5 bg-primary rounded-none animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block w-1.5 h-1.5 bg-primary rounded-none animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] font-display text-muted-foreground mt-1.5 px-1">
                      {msg.sender !== 'system' && (msg.sender === 'user' ? 'YOU ' : `${activeAgent.name.replace(' ', '_')} `)} 
                      [{msg.time}]
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {currentMessages.length <= 1 && !isStreaming && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center justify-center py-8 md:py-12 z-10"
                >
                  <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-4" />
                  <p className="font-display text-xs text-muted-foreground/50 mb-6">TRY ASKING</p>
                  <div className="flex flex-col gap-2 w-full max-w-md">
                    {activeAgent.quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickPrompt(prompt)}
                        data-testid={`button-quick-prompt-${i}`}
                        className="text-left px-4 py-3 border-2 border-border hover:border-primary/50 bg-card/30 hover:bg-card/60 text-sm text-muted-foreground hover:text-white transition-all font-sans"
                      >
                        <span className="text-primary mr-2 font-display">{">"}</span>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="p-2 md:p-4 border-t-2 border-border bg-card shrink-0 z-10">
              <form onSubmit={handleSend} className="flex gap-2 md:gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-display text-sm animate-pulse">{">"}</div>
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeAgent.placeholder}
                    disabled={isStreaming}
                    data-testid="input-chat"
                    className="w-full bg-background border-4 border-border text-white pl-8 pr-3 py-3 md:py-3.5 focus:outline-none focus:border-primary font-sans text-sm shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] placeholder:text-muted-foreground/50 transition-colors disabled:opacity-50"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!input.trim() || isStreaming}
                  data-testid="button-send"
                  className="retro-button retro-button-primary flex items-center justify-center w-12 md:w-14 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </main>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; border-left: 2px solid var(--color-border); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 0.8s step-end infinite; }
      `}</style>
    </div>
  );
}
