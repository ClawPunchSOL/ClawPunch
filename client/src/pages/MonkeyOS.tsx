import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Send, LogOut, Zap, Users, CircleDollarSign, Cpu,
  ShieldAlert, FileCode, Loader2, ArrowLeft, Wrench, Radar, X, Rocket
} from "lucide-react";

import bananaBot from "@/assets/images/banana-bot.png";
import swarmMonkey from "@/assets/images/swarm-monkey.png";
import oracleMonkey from "@/assets/images/oracle-monkey.png";
import trendMonkey from "@/assets/images/trend-monkey.png";
import vaultMonkey from "@/assets/images/vault-monkey.png";
import monkeyHero from "@/assets/images/monkey-hero.png";
import bgJungle from "@/assets/images/bg-jungle.png";
import monkeyRidingCrab from "@/assets/images/monkey-riding-crab.png";
import crabRiderAngry from "@/assets/images/crab-rider-angry.png";
import crabRiderHappy from "@/assets/images/crab-rider-happy.png";

import WalletButton from "@/components/WalletButton";
import AgentScanner from "@/components/AgentScanner";
import SwarmMonkeyPanel from "@/components/agents/SwarmMonkeyPanel";
import PunchOraclePanel from "@/components/agents/PunchOraclePanel";
import RugBusterPanel from "@/components/agents/RugBusterPanel";
import RepoApePanel from "@/components/agents/RepoApePanel";
import BananaBotPanel from "@/components/agents/BananaBotPanel";
import TrendPuncherPanel from "@/components/agents/TrendPuncherPanel";
import ApeVaultPanel from "@/components/agents/ApeVaultPanel";
import BananaCannonPanel from "@/components/agents/BananaCannonPanel";

type AgentId = 'banana-bot' | 'swarm-monkey' | 'punch-oracle' | 'trend-puncher' | 'vault-swinger' | 'rug-buster' | 'repo-ape' | 'banana-cannon';

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
    description: 'Alpha Scanner', longDescription: 'AI scans live Solana markets for trending tokens, finds alpha plays, flags rug signals.',
    placeholder: "Ask about trends, tokens, or alpha...",
    scannerColor: 'yellow', scannerType: 'trend-puncher', scannerLabel: 'TREND PUNCHER AI',
    category: 'TRADING'
  },
  'punch-oracle': {
    id: 'punch-oracle', name: 'PUNCH ORACLE', avatar: oracleMonkey,
    status: 'SYNCING', statusColor: 'text-purple-400', glowColor: 'rgba(168,85,247,0.3)', borderGlow: 'border-purple-500/60',
    icon: <Terminal className="w-5 h-5 text-purple-400" />,
    description: 'Predictions', longDescription: 'Live prediction markets with real SOL betting. AI analyzes real-time prices and market odds.',
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
    description: 'Yield Farming', longDescription: 'Real DeFi vault data aggregated across Solana. Analyzes APY, TVL, and risk across protocols.',
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
    scannerColor: 'cyan', scannerType: 'swarm-monkey', scannerLabel: 'SWARM AI',
    category: 'MANAGEMENT'
  },
  'banana-cannon': {
    id: 'banana-cannon', name: 'BANANA CANNON', avatar: bananaBot,
    status: 'LOADED', statusColor: 'text-pink-400', glowColor: 'rgba(236,72,153,0.3)', borderGlow: 'border-pink-500/60',
    icon: <Rocket className="w-5 h-5 text-pink-400" />,
    description: 'Token Launcher', longDescription: 'AI-powered token launcher. Generate concepts and deploy tokens directly on Solana.',
    placeholder: "Ask about launching tokens...",
    scannerColor: 'pink', scannerType: 'banana-cannon', scannerLabel: 'CANNON AI',
    category: 'DEFI'
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
    'TRADING': '⚡ TRADE & PREDICT', 'SECURITY': '🛡️ SECURITY & RESEARCH',
    'DEFI': '🍌 DEFI & YIELD', 'PAYMENTS': '💸 PAYMENTS', 'MANAGEMENT': '🐒 AGENT OPS',
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
      case 'banana-cannon': return <BananaCannonPanel />;
      default: return null;
    }
  };

  const floatingBananas = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${(i / 20) * 100 + Math.random() * 3}%`,
    bottom: `${10 + Math.random() * 80}%`,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 3,
  }));

  return (
    <div className="h-screen w-screen bg-[#0a0f0a] flex flex-col font-sans text-foreground overflow-hidden relative">
      <div className="absolute inset-0 z-0 pixel-art-rendering opacity-20 bg-repeat-x bg-[auto_100%] bg-center"
        style={{ backgroundImage: `url(${bgJungle})` }}
      />

      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
      }} />

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {floatingBananas.map(b => (
          <motion.div
            key={b.id}
            className="absolute text-2xl md:text-3xl drop-shadow-[0_0_10px_rgba(255,255,0,0.3)]"
            style={{ left: b.left, bottom: b.bottom }}
            animate={{
              y: [0, -20 - Math.random() * 20, 0],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: b.duration,
              ease: "easeInOut",
              delay: b.delay,
            }}
          >
            🍌
          </motion.div>
        ))}
      </div>

      <header className="h-16 border-b-4 border-foreground bg-black/90 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 shrink-0 z-20 relative"
        style={{ boxShadow: '0 4px 0px rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          {activeAgent ? (
            <motion.button
              onClick={handleBackToHub}
              className="retro-button bg-black text-primary border-2 border-primary py-2 px-3 flex items-center gap-2"
              data-testid="button-back-hub"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.5)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-display text-[9px] hidden sm:inline">BACK</span>
            </motion.button>
          ) : (
            <motion.div
              className="flex items-center gap-2"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <img src={monkeyHero} alt="" className="w-10 h-10 pixel-art-rendering drop-shadow-[0_4px_8px_rgba(255,200,0,0.3)]" />
            </motion.div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-display text-lg md:text-xl text-primary drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" data-testid="text-os-version">
              MONKEY OS
            </span>
            <span className="font-display text-[8px] text-primary/40 hidden sm:inline">v1.0.4</span>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <WalletButton />
          <div className="retro-container px-3 py-1.5 flex items-center gap-2 bg-black/80">
            <span className="text-xl">🍌</span>
            <span className="font-display text-[10px] text-primary" data-testid="text-banana-balance">1,420</span>
          </div>
          <button onClick={() => setLocation('/')} className="text-muted-foreground hover:text-primary transition-colors p-1.5 border-2 border-border hover:border-primary" data-testid="button-exit">
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
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16 relative">
              <motion.div
                className="absolute bottom-4 left-4 z-0 hidden lg:block"
                animate={{
                  x: [0, 20, 0],
                  y: [0, -8, 0],
                  rotate: [-3, 3, -3],
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <img src={crabRiderHappy} className="w-32 h-32 pixel-art-rendering drop-shadow-[0_10px_20px_rgba(0,255,0,0.3)] opacity-50" />
              </motion.div>

              <motion.div
                className="text-center mb-14 md:mb-20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 mb-8 border-2 border-primary font-display text-xs animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full" /> 7 AI AGENTS ONLINE
                </div>
                <h1 className="font-display text-4xl md:text-6xl text-white mb-6 drop-shadow-[6px_6px_0px_rgba(0,0,0,1)]" data-testid="text-hub-title">
                  CHOOSE YOUR <span className="text-primary">AGENT</span>
                </h1>
                <p className="text-lg md:text-xl font-sans text-muted-foreground bg-black/60 p-6 border-4 border-border backdrop-blur-md inline-block leading-relaxed"
                  style={{ boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.5)' }}
                >
                  Each agent is powered by Claude AI with live data feeds.<br/>Real analysis, real recommendations, no filler.
                </p>
              </motion.div>

              {categoryOrder.map((cat, catIdx) => {
                const agents = agentsByCategory[cat];
                if (!agents) return null;
                return (
                  <motion.div
                    key={cat}
                    className="mb-12 md:mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + catIdx * 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="font-display text-sm md:text-base text-primary drop-shadow-[2px_2px_0px_#000]">{categoryLabels[cat]}</h2>
                      <div className="flex-1 h-[3px] bg-gradient-to-r from-primary/30 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      {agents.map((agent, i) => (
                        <motion.button
                          key={agent.id}
                          onClick={() => handleAgentSelect(agent.id)}
                          whileHover={{ y: -6, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + catIdx * 0.1 + i * 0.05 }}
                          data-testid={`card-agent-${agent.id}`}
                          className="group retro-container w-full text-left bg-black/60 backdrop-blur-sm hover:-translate-y-2 transition-all duration-200 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                            background: `radial-gradient(circle at 20% 50%, ${agent.glowColor}, transparent 60%)`,
                          }} />
                          <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                            background: `linear-gradient(90deg, transparent, ${agent.glowColor}, transparent)`,
                          }} />

                          <div className="relative p-6 md:p-8 flex items-start gap-5">
                            <div className="relative shrink-0">
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-20 h-20 md:w-24 md:h-24 pixel-art-rendering border-4 border-foreground bg-black"
                                style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.6)' }}
                              />
                              <div className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 ${agent.statusColor.replace('text-', 'bg-')} border-2 border-black animate-pulse`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 border-2 border-border bg-black/50">
                                  {agent.icon}
                                </div>
                                <span className="font-display text-base md:text-lg text-white group-hover:text-primary transition-colors drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                                  {agent.name}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                {agent.longDescription}
                              </p>
                              <div className="flex items-center gap-4">
                                <span className={`font-display text-[10px] ${agent.statusColor} tracking-wider flex items-center gap-2 bg-black/50 border border-border px-2 py-1`}>
                                  <div className={`w-2 h-2 ${agent.statusColor.replace('text-', 'bg-')} animate-pulse`} />
                                  {agent.status}
                                </span>
                                {hubStats[agent.id] && (
                                  <span className="font-display text-[10px] text-muted-foreground/60 bg-black/30 border border-border/50 px-2 py-1">{hubStats[agent.id]}</span>
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

              <motion.div
                className="mt-8 retro-container p-8 md:p-10 bg-black/80 backdrop-blur-md flex flex-col md:flex-row items-center gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div
                  className="shrink-0"
                  animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                >
                  <img src={monkeyRidingCrab} className="w-24 h-24 md:w-32 md:h-32 pixel-art-rendering drop-shadow-[0_10px_20px_rgba(255,50,0,0.4)]" />
                </motion.div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-display text-xl md:text-2xl text-primary mb-3 drop-shadow-[4px_4px_0px_#000]">
                    THE TROOP IS READY
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    All agents are powered by ClawPunch's proprietary data engine — real-time on-chain feeds, yield aggregation, and AI analysis.
                    Select an agent above to deploy it. The monkey army awaits your command.
                  </p>
                </div>
                <motion.div
                  className="shrink-0 hidden md:block"
                  animate={{ y: [0, -8, 0], scaleX: [1, -1, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                >
                  <img src={crabRiderAngry} className="w-20 h-20 pixel-art-rendering drop-shadow-[0_8px_16px_rgba(255,0,0,0.3)]" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="agent"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden relative z-10 agent-view-flicker"
          >
            <div className="absolute inset-0 z-0 pixel-art-rendering opacity-15 bg-repeat-x bg-[auto_100%] bg-center"
              style={{ backgroundImage: `url(${bgJungle})` }}
            />

            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={`agent-banana-${i}`}
                  className="absolute text-xl drop-shadow-[0_0_8px_rgba(255,255,0,0.2)]"
                  style={{
                    left: `${10 + i * 12}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -15 - Math.random() * 10, 0],
                    rotate: [0, 10, -10, 0],
                    opacity: [0.15, 0.3, 0.15],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3 + i * 0.5,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                >
                  🍌
                </motion.div>
              ))}
            </div>

            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={`data-col-${i}`}
                  className="data-stream-col"
                  style={{
                    left: `${8 + i * 8}%`,
                    color: activeAgent.glowColor,
                    ['--rain-speed' as any]: `${6 + Math.random() * 6}s`,
                    ['--rain-delay' as any]: `${Math.random() * 4}s`,
                  }}
                />
              ))}
            </div>

            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    backgroundColor: activeAgent.glowColor,
                    boxShadow: `0 0 4px ${activeAgent.glowColor}`,
                  }}
                  animate={{
                    y: [0, -(10 + Math.random() * 20), 0],
                    x: [0, (Math.random() - 0.5) * 15, 0],
                    opacity: [0, 0.6, 0],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2 + Math.random() * 3,
                    ease: "easeInOut",
                    delay: Math.random() * 3,
                  }}
                />
              ))}
            </div>

            <div className="crt-overlay" />
            <div className="crt-scanline" />
            <div className="crt-vignette" />

            <div className="absolute bottom-20 right-4 z-[5] hidden lg:block pointer-events-none">
              <motion.img
                src={activeAgent.avatar}
                className="w-24 h-24 pixel-art-rendering opacity-20"
                style={{ filter: `drop-shadow(0 0 20px ${activeAgent.glowColor})` }}
                animate={{
                  y: [0, -15, 0],
                  rotate: [-3, 3, -3],
                  opacity: [0.12, 0.22, 0.12],
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
            </div>

            <div className="relative shrink-0 border-b-4 border-foreground bg-black/80 backdrop-blur-md z-20 energy-border"
              style={{ boxShadow: `0 4px 0px rgba(255,255,255,0.05), 0 6px 30px ${activeAgent.glowColor}15` }}
            >
              <div className="flex items-center justify-between px-4 md:px-6 py-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <motion.img
                      src={activeAgent.avatar}
                      className="w-12 h-12 md:w-14 md:h-14 pixel-art-rendering border-4 border-foreground bg-black"
                      style={{ boxShadow: `6px 6px 0px rgba(0,0,0,0.5), 0 0 25px ${activeAgent.glowColor}40` }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${activeAgent.statusColor.replace('text-', 'bg-')} border-2 border-black animate-pulse`}
                      style={{ boxShadow: `0 0 8px ${activeAgent.glowColor}` }}
                    />
                  </div>
                  <div>
                    <h1 className="font-display text-base md:text-xl text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" data-testid="text-agent-name">
                      {activeAgent.name}
                    </h1>
                    <p className={`font-display text-[9px] md:text-[10px] ${activeAgent.statusColor} tracking-widest`} data-testid="text-agent-desc">
                      {activeAgent.description.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex border-4 border-foreground overflow-hidden" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.4)' }}>
                    <button
                      onClick={() => setActiveTab('intel')}
                      data-testid="tab-intel"
                      className={`flex items-center gap-1.5 px-4 md:px-5 py-2.5 font-display text-[10px] md:text-[11px] transition-all ${
                        activeTab === 'intel'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-black/60 text-muted-foreground/50 hover:text-white hover:bg-black/40'
                      }`}
                    >
                      <Radar className="w-3.5 h-3.5" /> INTEL
                    </button>
                    <button
                      onClick={() => setActiveTab('tools')}
                      data-testid="tab-tools"
                      className={`flex items-center gap-1.5 px-4 md:px-5 py-2.5 font-display text-[10px] md:text-[11px] transition-all border-l-2 border-foreground ${
                        activeTab === 'tools'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-black/60 text-muted-foreground/50 hover:text-white hover:bg-black/40'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" /> TOOLS
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative z-10">
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
                    className="flex-1 overflow-y-auto custom-scrollbar relative"
                  >
                    <div className="relative z-10 p-4 md:p-6">
                      {renderToolPanel()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showChat && chatResponse && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t-4 border-foreground bg-black/85 backdrop-blur-md overflow-hidden shrink-0 relative z-20"
                    style={{ boxShadow: `inset 0 4px 20px ${activeAgent.glowColor}10` }}
                  >
                    <div className="relative">
                      <button
                        onClick={() => { setShowChat(false); setChatResponse(''); }}
                        className="absolute top-2 right-2 text-muted-foreground/40 hover:text-white z-10 border-2 border-border p-1 hover:bg-white/10 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                        <div className="font-display text-[9px] text-primary/60 mb-2 tracking-widest flex items-center gap-2">
                          <span className="text-sm">🐒</span> AGENT RESPONSE
                          <div className="flex-1 h-[2px] bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>
                        <div className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap font-sans pr-6">
                          {chatResponse}
                          {isStreaming && (
                            <span className="inline-block w-2.5 h-4 bg-primary ml-0.5 align-middle" style={{ animation: 'blink 0.6s step-end infinite' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 border-t-4 border-foreground bg-black/85 backdrop-blur-md z-20 relative energy-border">
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `linear-gradient(90deg, transparent, ${activeAgent.glowColor}08, transparent)`,
              }} />
              <form onSubmit={handleSend} className="flex items-center gap-3 p-3 md:p-4 relative z-10">
                <div className="flex-1 relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 font-display text-base ${activeAgent.statusColor}`}>
                    {">"}
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={activeAgent.placeholder}
                    disabled={isStreaming}
                    data-testid="input-chat"
                    className="w-full bg-black/60 border-4 border-foreground text-white pl-8 pr-4 py-3 focus:outline-none font-sans text-sm placeholder:text-muted-foreground/30 transition-all disabled:opacity-50"
                    style={{
                      boxShadow: 'inset 3px 3px 0px rgba(0,0,0,0.5)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'hsl(50 100% 50%)';
                      e.target.style.boxShadow = `inset 3px 3px 0px rgba(0,0,0,0.5), 0 0 20px ${activeAgent.glowColor}30`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = 'inset 3px 3px 0px rgba(0,0,0,0.5)';
                    }}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  data-testid="button-send"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="retro-button retro-button-primary py-3 px-5 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
