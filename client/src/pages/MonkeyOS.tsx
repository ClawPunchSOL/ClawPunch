import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Banana, Send, LogOut, Zap, Users, CircleDollarSign, Cpu,
  ShieldAlert, FileCode, Loader2, ArrowLeft, Wrench, Radar, X
} from "lucide-react";

import bananaBot from "@/assets/images/banana-bot.png";
import swarmMonkey from "@/assets/images/swarm-monkey.png";
import oracleMonkey from "@/assets/images/oracle-monkey.png";
import trendMonkey from "@/assets/images/trend-monkey.png";
import vaultMonkey from "@/assets/images/vault-monkey.png";
import monkeyHero from "@/assets/images/monkey-hero.png";

import WalletButton from "@/components/WalletButton";
import AgentScanner from "@/components/AgentScanner";
import SwarmMonkeyPanel from "@/components/agents/SwarmMonkeyPanel";
import PunchOraclePanel from "@/components/agents/PunchOraclePanel";
import RugBusterPanel from "@/components/agents/RugBusterPanel";
import RepoApePanel from "@/components/agents/RepoApePanel";
import BananaBotPanel from "@/components/agents/BananaBotPanel";
import TrendPuncherPanel from "@/components/agents/TrendPuncherPanel";
import ApeVaultPanel from "@/components/agents/ApeVaultPanel";

type AgentId = 'banana-bot' | 'swarm-monkey' | 'punch-oracle' | 'trend-puncher' | 'vault-swinger' | 'rug-buster' | 'repo-ape';

interface Agent {
  id: AgentId;
  name: string;
  avatar: string;
  status: string;
  statusColor: string;
  glowColor: string;
  borderGlow: string;
  icon: React.ReactNode;
  description: string;
  longDescription: string;
  placeholder: string;
  scannerColor: string;
  scannerType: string;
  scannerLabel: string;
  category: string;
}

const AGENTS: Record<AgentId, Agent> = {
  'trend-puncher': {
    id: 'trend-puncher', name: 'TREND PUNCHER', avatar: trendMonkey,
    status: 'SCANNING', statusColor: 'text-yellow-400', glowColor: 'rgba(234,179,8,0.3)', borderGlow: 'border-yellow-500/60',
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    description: 'Alpha Scanner', longDescription: 'AI scans DexScreener + CoinGecko for trending Solana tokens, finds alpha plays, flags rug signals.',
    placeholder: "Ask about trends, tokens, or alpha...",
    scannerColor: 'yellow', scannerType: 'trend-puncher', scannerLabel: 'TREND PUNCHER AI',
    category: 'TRADING'
  },
  'punch-oracle': {
    id: 'punch-oracle', name: 'PUNCH ORACLE', avatar: oracleMonkey,
    status: 'SYNCING', statusColor: 'text-purple-400', glowColor: 'rgba(168,85,247,0.3)', borderGlow: 'border-purple-500/60',
    icon: <Terminal className="w-5 h-5 text-purple-400" />,
    description: 'Predictions', longDescription: 'Live prediction markets with real SOL betting. AI analyzes CoinGecko prices + Polymarket odds.',
    placeholder: "Ask about predictions or market odds...",
    scannerColor: 'purple', scannerType: 'punch-oracle', scannerLabel: 'ORACLE AI',
    category: 'TRADING'
  },
  'rug-buster': {
    id: 'rug-buster', name: 'RUG BUSTER', avatar: swarmMonkey,
    status: 'GUARDING', statusColor: 'text-red-400', glowColor: 'rgba(239,68,68,0.3)', borderGlow: 'border-red-500/60',
    icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
    description: 'Security Scanner', longDescription: 'On-chain Solana token analysis. Checks mint auth, freeze auth, LP locks, holder distribution.',
    placeholder: "Paste a contract address to scan...",
    scannerColor: 'red', scannerType: 'rug-buster', scannerLabel: 'RUG BUSTER AI',
    category: 'SECURITY'
  },
  'repo-ape': {
    id: 'repo-ape', name: 'REPO APE', avatar: oracleMonkey,
    status: 'ANALYZING', statusColor: 'text-cyan-400', glowColor: 'rgba(6,182,212,0.3)', borderGlow: 'border-cyan-500/60',
    icon: <FileCode className="w-5 h-5 text-cyan-400" />,
    description: 'Code Auditor', longDescription: 'AI-powered GitHub repo analysis. Detect LARP projects, analyze code quality, score legitimacy.',
    placeholder: "Paste a GitHub URL to analyze...",
    scannerColor: 'cyan', scannerType: 'repo-ape', scannerLabel: 'REPO APE AI',
    category: 'SECURITY'
  },
  'vault-swinger': {
    id: 'vault-swinger', name: 'APE VAULT', avatar: vaultMonkey,
    status: 'FARMING', statusColor: 'text-orange-400', glowColor: 'rgba(249,115,22,0.3)', borderGlow: 'border-orange-500/60',
    icon: <Cpu className="w-5 h-5 text-orange-400" />,
    description: 'Yield Farming', longDescription: 'Real DeFi vault data from DeFi Llama. Analyzes APY, TVL, and risk across Solana protocols.',
    placeholder: "Ask about yields or farming strategy...",
    scannerColor: 'orange', scannerType: 'ape-vault', scannerLabel: 'VAULT STRATEGIST AI',
    category: 'DEFI'
  },
  'banana-bot': {
    id: 'banana-bot', name: 'BANANA BOT', avatar: bananaBot,
    status: 'READY', statusColor: 'text-green-400', glowColor: 'rgba(34,197,94,0.3)', borderGlow: 'border-green-500/60',
    icon: <CircleDollarSign className="w-5 h-5 text-green-400" />,
    description: 'SOL Transfers', longDescription: 'Send real SOL transfers via Phantom wallet. On-chain transactions with Solscan verification.',
    placeholder: "Ask about transactions or transfers...",
    scannerColor: 'green', scannerType: 'banana-bot', scannerLabel: 'BANANA BOT AI',
    category: 'PAYMENTS'
  },
  'swarm-monkey': {
    id: 'swarm-monkey', name: 'SWARM MONKEY', avatar: swarmMonkey,
    status: 'ACTIVE', statusColor: 'text-blue-400', glowColor: 'rgba(59,130,246,0.3)', borderGlow: 'border-blue-500/60',
    icon: <Users className="w-5 h-5 text-blue-400" />,
    description: 'Agent Manager', longDescription: 'Register AI agents on the Moltbook Network. Coordinate swarm operations and monitor agent health.',
    placeholder: "Ask about Moltbook or agent swarms...",
    scannerColor: 'cyan', scannerType: 'banana-bot', scannerLabel: 'SWARM AI',
    category: 'MANAGEMENT'
  },
};

interface ChatMessage {
  id: number;
  sender: 'user' | 'agent';
  text: string;
}

export default function MonkeyOS() {
  const [, setLocation] = useLocation();
  const [activeAgentId, setActiveAgentId] = useState<AgentId | null>(null);
  const [conversationIds, setConversationIds] = useState<Record<string, number | null>>({});
  const [activeTab, setActiveTab] = useState<'intel' | 'tools'>('intel');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatResponse, setChatResponse] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [hubStats, setHubStats] = useState<Record<string, string>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeAgent = activeAgentId ? AGENTS[activeAgentId] : null;

  useEffect(() => {
    if (!activeAgentId) {
      const fetchStats = async () => {
        try {
          const [agents, preds, scans, repos, txs, vaults] = await Promise.all([
            fetch("/api/moltbook/agents").then(r => r.json()).catch(() => []),
            fetch("/api/predictions").then(r => r.json()).catch(() => []),
            fetch("/api/security/scans").then(r => r.json()).catch(() => []),
            fetch("/api/repos/scans").then(r => r.json()).catch(() => []),
            fetch("/api/transactions").then(r => r.json()).catch(() => []),
            fetch("/api/vaults").then(r => r.json()).catch(() => ({ vaults: [] })),
          ]);
          setHubStats({
            'swarm-monkey': `${agents.length} agents`,
            'punch-oracle': `${preds.length} markets`,
            'rug-buster': `${scans.length} scans`,
            'repo-ape': `${repos.length} repos`,
            'banana-bot': `${txs.length} txs`,
            'trend-puncher': 'LIVE',
            'vault-swinger': `${(vaults.vaults || vaults).length} pools`,
          });
        } catch {}
      };
      fetchStats();
    }
  }, [activeAgentId]);

  useEffect(() => { return () => { abortControllerRef.current?.abort(); }; }, []);

  const getOrCreateConversation = useCallback(async (agentId: AgentId): Promise<number> => {
    if (conversationIds[agentId]) return conversationIds[agentId]!;
    const res = await fetch(`/api/agents/${agentId}/conversations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${AGENTS[agentId].name} Session` }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const conv = await res.json();
    setConversationIds(prev => ({ ...prev, [agentId]: conv.id }));
    return conv.id;
  }, [conversationIds]);

  const handleAgentSelect = (agentId: AgentId) => {
    setActiveAgentId(agentId);
    setActiveTab('intel');
    setChatResponse('');
    setShowChat(false);
  };

  const handleBackToHub = () => {
    abortControllerRef.current?.abort();
    setActiveAgentId(null);
    setIsStreaming(false);
    setChatResponse('');
    setShowChat(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || !activeAgentId) return;
    const targetAgentId = activeAgentId;
    setInput('');
    setIsStreaming(true);
    setChatResponse('');
    setShowChat(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const convId = await getOrCreateConversation(targetAgentId);
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }), signal: abortController.signal,
      });
      if (!res.ok) throw new Error('Failed');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let buffer = '', accumulated = '';

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
              setChatResponse(accumulated);
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setChatResponse('Connection error. Try again.');
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = async (e: React.FormEvent) => { e.preventDefault(); await sendMessage(input); };

  const agentList = Object.values(AGENTS);
  const categoryOrder = ['TRADING', 'SECURITY', 'DEFI', 'PAYMENTS', 'MANAGEMENT'];
  const categoryLabels: Record<string, string> = {
    'TRADING': 'TRADE & PREDICT', 'SECURITY': 'SECURITY & RESEARCH',
    'DEFI': 'DEFI & YIELD', 'PAYMENTS': 'PAYMENTS', 'MANAGEMENT': 'AGENT OPS',
  };
  const agentsByCategory = agentList.reduce((acc, agent) => {
    if (!acc[agent.category]) acc[agent.category] = [];
    acc[agent.category].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  const renderToolPanel = () => {
    if (!activeAgentId) return null;
    switch (activeAgentId) {
      case 'swarm-monkey': return <SwarmMonkeyPanel />;
      case 'punch-oracle': return <PunchOraclePanel onSendChat={sendMessage} />;
      case 'rug-buster': return <RugBusterPanel />;
      case 'repo-ape': return <RepoApePanel />;
      case 'banana-bot': return <BananaBotPanel onSendChat={sendMessage} />;
      case 'trend-puncher': return <TrendPuncherPanel onSendChat={sendMessage} />;
      case 'vault-swinger': return <ApeVaultPanel onSendChat={sendMessage} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#080808] flex flex-col font-sans text-foreground overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
      }} />

      <header className="h-14 border-b-4 border-primary/30 bg-black/90 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 shrink-0 z-20 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="flex items-center gap-3">
          {activeAgent ? (
            <motion.button
              onClick={handleBackToHub}
              className="text-primary p-1.5 flex items-center gap-2 border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all"
              data-testid="button-back-hub"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-display text-[9px] hidden sm:inline">BACK</span>
            </motion.button>
          ) : (
            <div className="flex items-center gap-2">
              <img src={monkeyHero} alt="" className="w-8 h-8 pixel-art-rendering" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-display text-sm text-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" data-testid="text-os-version">
              MONKEY OS
            </span>
            <span className="font-display text-[8px] text-primary/40 hidden sm:inline">v1.0.4</span>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <WalletButton />
          <div className="flex items-center gap-1.5 bg-primary/10 border-2 border-primary/30 px-3 py-1">
            <Banana className="w-3.5 h-3.5 text-primary fill-current" />
            <span className="font-display text-[10px] text-primary" data-testid="text-banana-balance">1,420</span>
          </div>
          <button onClick={() => setLocation('/')} className="text-muted-foreground hover:text-primary transition-colors p-1.5" data-testid="button-exit">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!activeAgent ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto custom-scrollbar relative z-10"
          >
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16">
              <motion.div
                className="text-center mb-12 md:mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 mb-6 border-2 border-primary/40 font-display text-[10px]">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  7 AI AGENTS ONLINE
                </div>
                <h1 className="font-display text-3xl md:text-5xl text-white mb-4 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" data-testid="text-hub-title">
                  CHOOSE YOUR <span className="text-primary">AGENT</span>
                </h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                  Each agent is powered by Claude AI with live data feeds. Real analysis, real recommendations, no filler.
                </p>
              </motion.div>

              {categoryOrder.map((cat, catIdx) => {
                const agents = agentsByCategory[cat];
                if (!agents) return null;
                return (
                  <motion.div
                    key={cat}
                    className="mb-10 md:mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + catIdx * 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-3 h-3 bg-primary/20 border border-primary/40" />
                      <h2 className="font-display text-[11px] text-primary/70 tracking-widest">{categoryLabels[cat]}</h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      {agents.map((agent, i) => (
                        <motion.button
                          key={agent.id}
                          onClick={() => handleAgentSelect(agent.id)}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + catIdx * 0.1 + i * 0.05 }}
                          data-testid={`card-agent-${agent.id}`}
                          className={`group relative w-full text-left overflow-hidden border-4 border-border hover:${agent.borderGlow} bg-black/60 hover:bg-black/40 transition-all duration-300`}
                          style={{
                            boxShadow: `6px 6px 0px 0px rgba(0,0,0,0.6)`,
                          }}
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                            background: `radial-gradient(circle at 30% 50%, ${agent.glowColor}, transparent 70%)`,
                          }} />
                          <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                            background: `linear-gradient(90deg, transparent, ${agent.glowColor}, transparent)`,
                          }} />

                          <div className="relative p-5 md:p-6 flex items-start gap-4">
                            <div className="relative shrink-0">
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-16 h-16 md:w-20 md:h-20 pixel-art-rendering border-4 border-border group-hover:border-white/20 transition-colors bg-black"
                                style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.5)' }}
                              />
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${agent.statusColor.replace('text-', 'bg-')} border-2 border-black animate-pulse`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {agent.icon}
                                <span className="font-display text-sm text-white group-hover:text-primary transition-colors drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                  {agent.name}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-3">
                                {agent.longDescription}
                              </p>
                              <div className="flex items-center gap-3">
                                <span className={`font-display text-[9px] ${agent.statusColor} tracking-wider flex items-center gap-1.5`}>
                                  <div className={`w-1.5 h-1.5 ${agent.statusColor.replace('text-', 'bg-')} animate-pulse`} />
                                  {agent.status}
                                </span>
                                {hubStats[agent.id] && (
                                  <span className="font-display text-[9px] text-muted-foreground/50">{hubStats[agent.id]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="agent"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden relative z-10"
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            }} />

            <div className="relative shrink-0 border-b-4 border-border/60 bg-black/80 backdrop-blur-md z-10">
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{
                background: `linear-gradient(90deg, transparent, ${activeAgent.glowColor}, transparent)`,
              }} />
              <div className="flex items-center justify-between px-4 md:px-6 py-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="relative">
                    <img
                      src={activeAgent.avatar}
                      className="w-10 h-10 md:w-12 md:h-12 pixel-art-rendering border-3 border-border bg-black"
                      style={{ boxShadow: `0 0 20px ${activeAgent.glowColor}40, 3px 3px 0px rgba(0,0,0,0.5)` }}
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${activeAgent.statusColor.replace('text-', 'bg-')} border-2 border-black animate-pulse`} />
                  </div>
                  <div>
                    <h1 className="font-display text-sm md:text-base text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" data-testid="text-agent-name">
                      {activeAgent.name}
                    </h1>
                    <p className={`font-display text-[8px] md:text-[9px] ${activeAgent.statusColor} tracking-widest`} data-testid="text-agent-desc">
                      {activeAgent.description.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex border-2 border-border/60 overflow-hidden" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>
                    <button
                      onClick={() => setActiveTab('intel')}
                      data-testid="tab-intel"
                      className={`flex items-center gap-1.5 px-3 md:px-4 py-2 font-display text-[9px] md:text-[10px] transition-all ${
                        activeTab === 'intel'
                          ? `bg-primary/20 ${activeAgent.statusColor} border-r-2 border-border/40`
                          : 'bg-black/40 text-muted-foreground/50 hover:text-muted-foreground border-r-2 border-border/40'
                      }`}
                    >
                      <Radar className="w-3 h-3" /> INTEL
                    </button>
                    <button
                      onClick={() => setActiveTab('tools')}
                      data-testid="tab-tools"
                      className={`flex items-center gap-1.5 px-3 md:px-4 py-2 font-display text-[9px] md:text-[10px] transition-all ${
                        activeTab === 'tools'
                          ? `bg-primary/20 ${activeAgent.statusColor}`
                          : 'bg-black/40 text-muted-foreground/50 hover:text-muted-foreground'
                      }`}
                    >
                      <Wrench className="w-3 h-3" /> TOOLS
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative">
              <AnimatePresence mode="wait">
                {activeTab === 'intel' ? (
                  <motion.div
                    key="intel"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <AgentScanner
                      agentType={activeAgent.scannerType}
                      accentColor={activeAgent.scannerColor}
                      label={activeAgent.scannerLabel}
                      autoScan={true}
                      fullHeight={true}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="tools"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5"
                  >
                    {renderToolPanel()}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showChat && chatResponse && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t-2 border-border/40 bg-black/80 backdrop-blur-md overflow-hidden shrink-0"
                  >
                    <div className="relative">
                      <button
                        onClick={() => { setShowChat(false); setChatResponse(''); }}
                        className="absolute top-2 right-2 text-muted-foreground/40 hover:text-white z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                        <div className="text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap font-sans pr-6">
                          {chatResponse}
                          {isStreaming && (
                            <span className="inline-block w-2 h-3.5 bg-primary ml-0.5 align-middle" style={{ animation: 'blink 0.6s step-end infinite' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 border-t-4 border-border/60 bg-black/90 backdrop-blur-md z-10 relative">
              <div className="absolute top-0 left-0 right-0 h-px" style={{
                background: `linear-gradient(90deg, transparent, ${activeAgent.glowColor}60, transparent)`,
              }} />
              <form onSubmit={handleSend} className="flex items-center gap-2 p-2.5 md:p-3">
                <div className="flex-1 relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 font-display text-sm ${activeAgent.statusColor}`}>
                    {">"}
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={activeAgent.placeholder}
                    disabled={isStreaming}
                    data-testid="input-chat"
                    className="w-full bg-black/60 border-4 border-border/60 text-white pl-8 pr-4 py-2.5 md:py-3 focus:outline-none font-sans text-sm placeholder:text-muted-foreground/30 transition-all disabled:opacity-50"
                    style={{
                      boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.5)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = activeAgent.glowColor;
                      e.target.style.boxShadow = `inset 2px 2px 0px rgba(0,0,0,0.5), 0 0 15px ${activeAgent.glowColor}30`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = 'inset 2px 2px 0px rgba(0,0,0,0.5)';
                    }}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  data-testid="button-send"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 md:py-3 bg-primary text-primary-foreground font-display text-[10px] border-4 border-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                  style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.5)' }}
                >
                  {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
