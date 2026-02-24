import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Send, LogOut, Zap, Users, CircleDollarSign, Cpu,
  ShieldAlert, FileCode, Loader2, Wrench, Radar, X, Rocket,
  Minus, Maximize2, Home
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
import fighterMonkey from "@/assets/images/fighter-monkey.png";
import rugBear from "@/assets/images/rug-bear.png";

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
  gradient: string;
  accentHex: string;
}

const AGENTS: Record<AgentId, Agent> = {
  'trend-puncher': {
    id: 'trend-puncher', name: 'TREND PUNCHER', avatar: trendMonkey,
    status: 'SCANNING', statusColor: 'text-yellow-400', glowColor: 'rgba(234,179,8,0.3)', borderGlow: 'border-yellow-500/60',
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    description: 'Alpha Scanner', longDescription: 'AI scans live Solana markets for trending tokens, finds alpha plays, flags rug signals.',
    placeholder: "Ask about trends, tokens, or alpha...",
    scannerColor: 'yellow', scannerType: 'trend-puncher', scannerLabel: 'TREND PUNCHER AI',
    category: 'TRADING', gradient: 'from-yellow-900/80 via-amber-950/60 to-black/80', accentHex: '#eab308'
  },
  'punch-oracle': {
    id: 'punch-oracle', name: 'PUNCH ORACLE', avatar: oracleMonkey,
    status: 'SYNCING', statusColor: 'text-purple-400', glowColor: 'rgba(168,85,247,0.3)', borderGlow: 'border-purple-500/60',
    icon: <Terminal className="w-5 h-5 text-purple-400" />,
    description: 'Predictions', longDescription: 'Live prediction markets with real SOL betting. AI analyzes real-time prices and market odds.',
    placeholder: "Ask about predictions or market odds...",
    scannerColor: 'purple', scannerType: 'punch-oracle', scannerLabel: 'ORACLE AI',
    category: 'TRADING', gradient: 'from-purple-900/80 via-violet-950/60 to-black/80', accentHex: '#a855f7'
  },
  'rug-buster': {
    id: 'rug-buster', name: 'RUG BUSTER', avatar: rugBear,
    status: 'GUARDING', statusColor: 'text-red-400', glowColor: 'rgba(239,68,68,0.3)', borderGlow: 'border-red-500/60',
    icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
    description: 'Security Scanner', longDescription: 'On-chain Solana token analysis. Checks mint auth, freeze auth, LP locks, holder distribution.',
    placeholder: "Paste a contract address to scan...",
    scannerColor: 'red', scannerType: 'rug-buster', scannerLabel: 'RUG BUSTER AI',
    category: 'SECURITY', gradient: 'from-red-900/80 via-rose-950/60 to-black/80', accentHex: '#ef4444'
  },
  'repo-ape': {
    id: 'repo-ape', name: 'REPO APE', avatar: fighterMonkey,
    status: 'ANALYZING', statusColor: 'text-cyan-400', glowColor: 'rgba(6,182,212,0.3)', borderGlow: 'border-cyan-500/60',
    icon: <FileCode className="w-5 h-5 text-cyan-400" />,
    description: 'Code Auditor', longDescription: 'AI-powered GitHub repo analysis. Detect LARP projects, analyze code quality, score legitimacy.',
    placeholder: "Paste a GitHub URL to analyze...",
    scannerColor: 'cyan', scannerType: 'repo-ape', scannerLabel: 'REPO APE AI',
    category: 'SECURITY', gradient: 'from-cyan-900/80 via-teal-950/60 to-black/80', accentHex: '#06b6d4'
  },
  'vault-swinger': {
    id: 'vault-swinger', name: 'APE VAULT', avatar: vaultMonkey,
    status: 'FARMING', statusColor: 'text-orange-400', glowColor: 'rgba(249,115,22,0.3)', borderGlow: 'border-orange-500/60',
    icon: <Cpu className="w-5 h-5 text-orange-400" />,
    description: 'Yield Farming', longDescription: 'Real DeFi vault data aggregated across Solana. Analyzes APY, TVL, and risk across protocols.',
    placeholder: "Ask about yields or farming strategy...",
    scannerColor: 'orange', scannerType: 'ape-vault', scannerLabel: 'VAULT STRATEGIST AI',
    category: 'DEFI', gradient: 'from-orange-900/80 via-amber-950/60 to-black/80', accentHex: '#f97316'
  },
  'banana-bot': {
    id: 'banana-bot', name: 'BANANA BOT', avatar: bananaBot,
    status: 'READY', statusColor: 'text-green-400', glowColor: 'rgba(34,197,94,0.3)', borderGlow: 'border-green-500/60',
    icon: <CircleDollarSign className="w-5 h-5 text-green-400" />,
    description: 'SOL Transfers', longDescription: 'Send real SOL transfers via Phantom wallet. On-chain transactions with Solscan verification.',
    placeholder: "Ask about transactions or transfers...",
    scannerColor: 'green', scannerType: 'banana-bot', scannerLabel: 'BANANA BOT AI',
    category: 'PAYMENTS', gradient: 'from-green-900/80 via-emerald-950/60 to-black/80', accentHex: '#22c55e'
  },
  'swarm-monkey': {
    id: 'swarm-monkey', name: 'SWARM MONKEY', avatar: swarmMonkey,
    status: 'ACTIVE', statusColor: 'text-blue-400', glowColor: 'rgba(59,130,246,0.3)', borderGlow: 'border-blue-500/60',
    icon: <Users className="w-5 h-5 text-blue-400" />,
    description: 'Agent Manager', longDescription: 'Register AI agents on the Moltbook Network. Coordinate swarm operations and monitor agent health.',
    placeholder: "Ask about Moltbook or agent swarms...",
    scannerColor: 'cyan', scannerType: 'swarm-monkey', scannerLabel: 'SWARM AI',
    category: 'MANAGEMENT', gradient: 'from-blue-900/80 via-indigo-950/60 to-black/80', accentHex: '#3b82f6'
  },
  'banana-cannon': {
    id: 'banana-cannon', name: 'BANANA CANNON', avatar: bananaBot,
    status: 'LOADED', statusColor: 'text-pink-400', glowColor: 'rgba(236,72,153,0.3)', borderGlow: 'border-pink-500/60',
    icon: <Rocket className="w-5 h-5 text-pink-400" />,
    description: 'Token Launcher', longDescription: 'AI-powered token launcher. Generate concepts and deploy tokens directly on Solana.',
    placeholder: "Ask about launching tokens...",
    scannerColor: 'pink', scannerType: 'banana-cannon', scannerLabel: 'CANNON AI',
    category: 'DEFI', gradient: 'from-pink-900/80 via-fuchsia-950/60 to-black/80', accentHex: '#ec4899'
  },
};

const DESKTOP_LAYOUT: { id: AgentId; row: number; col: number }[] = [
  { id: 'trend-puncher', row: 0, col: 0 },
  { id: 'punch-oracle', row: 0, col: 1 },
  { id: 'rug-buster', row: 0, col: 2 },
  { id: 'repo-ape', row: 0, col: 3 },
  { id: 'vault-swinger', row: 1, col: 0 },
  { id: 'banana-bot', row: 1, col: 1 },
  { id: 'swarm-monkey', row: 1, col: 2 },
  { id: 'banana-cannon', row: 1, col: 3 },
];

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeAgent = activeAgentId ? AGENTS[activeAgentId] : null;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
            'banana-cannon': 'LOADED',
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

  const floatingBananas = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${(i / 15) * 100 + Math.random() * 3}%`,
    bottom: `${15 + Math.random() * 70}%`,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 4,
    size: 16 + Math.random() * 14,
  })), []);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="h-screen w-screen flex flex-col font-sans text-foreground overflow-hidden relative" style={{ background: 'linear-gradient(180deg, #0d0526 0%, #0a1628 25%, #071a0e 50%, #0a0f0a 75%, #050805 100%)' }}>
      <div className="absolute inset-0 z-0 pixel-art-rendering opacity-[0.12] bg-repeat-x bg-[auto_100%] bg-bottom"
        style={{ backgroundImage: `url(${bgJungle})` }}
      />

      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(34,197,94,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(168,85,247,0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.03) 0%, transparent 40%)'
      }} />

      <div className="absolute top-0 left-0 right-0 h-px z-[1]" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.3), rgba(234,179,8,0.2), rgba(168,85,247,0.3), transparent)' }} />

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {floatingBananas.map(b => (
          <motion.div
            key={b.id}
            className="absolute drop-shadow-[0_0_8px_rgba(255,255,0,0.2)]"
            style={{ left: b.left, bottom: b.bottom, fontSize: b.size }}
            animate={{ y: [0, -20, 0], rotate: [0, 15, -15, 0], opacity: [0.15, 0.3, 0.15] }}
            transition={{ repeat: Infinity, duration: b.duration, ease: "easeInOut", delay: b.delay }}
          >
            🍌
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 40}%`,
              width: Math.random() > 0.7 ? 2 : 1,
              height: Math.random() > 0.7 ? 2 : 1,
            }}
            animate={{ opacity: [0.1, 0.6, 0.1] }}
            transition={{ repeat: Infinity, duration: 2 + Math.random() * 3, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!activeAgent ? (
          <motion.div
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col overflow-hidden relative z-10"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-6">
                <motion.div
                  className="text-center mb-8 md:mb-12 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <motion.img
                      src={monkeyHero}
                      className="w-14 h-14 md:w-20 md:h-20 pixel-art-rendering drop-shadow-[0_0_20px_rgba(255,200,0,0.4)]"
                      animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                    <div>
                      <h1 className="font-display text-2xl md:text-4xl text-primary drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" data-testid="text-hub-title">
                        MONKEY OS
                      </h1>
                      <div className="flex items-center gap-2 justify-center mt-1">
                        <span className="font-display text-[8px] text-primary/50">v1.0.4</span>
                        <div className="w-1.5 h-1.5 bg-green-400 animate-pulse" />
                        <span className="font-display text-[8px] text-green-400">ONLINE</span>
                      </div>
                    </div>
                    <motion.img
                      src={crabRiderHappy}
                      className="w-12 h-12 md:w-16 md:h-16 pixel-art-rendering drop-shadow-[0_0_15px_rgba(0,255,100,0.3)]"
                      animate={{ y: [0, -5, 0], scaleX: [-1, -1, -1] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.3 }}
                    />
                  </div>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 border-2 border-primary/40 font-display text-[9px]">
                    <div className="w-2 h-2 bg-primary animate-pulse" /> 8 AI AGENTS READY TO DEPLOY
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  {DESKTOP_LAYOUT.map(({ id }, i) => {
                    const agent = AGENTS[id];
                    return (
                      <motion.button
                        key={id}
                        onClick={() => handleAgentSelect(id)}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 200 }}
                        whileHover={{ y: -6, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        data-testid={`card-agent-${id}`}
                        className="group relative cursor-pointer"
                      >
                        <div className="relative border-2 border-white/10 bg-black/40 backdrop-blur-sm p-4 md:p-5 transition-all duration-300 overflow-hidden group-hover:border-white/30"
                          style={{
                            boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
                          }}
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ background: `radial-gradient(circle at 50% 30%, ${agent.glowColor}, transparent 70%)` }}
                          />
                          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: `linear-gradient(90deg, transparent, ${agent.accentHex}, transparent)` }}
                          />

                          <div className="relative flex flex-col items-center text-center gap-3">
                            <div className="relative">
                              <motion.img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-16 h-16 md:w-20 md:h-20 pixel-art-rendering drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                                style={{ filter: `drop-shadow(0 0 8px ${agent.glowColor})` }}
                              />
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${agent.statusColor.replace('text-', 'bg-')} border-2 border-black animate-pulse`}
                                style={{ boxShadow: `0 0 6px ${agent.accentHex}` }}
                              />
                            </div>
                            <div>
                              <div className="font-display text-[9px] md:text-[10px] text-white group-hover:text-primary transition-colors drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-1">
                                {agent.name}
                              </div>
                              <div className={`font-display text-[7px] md:text-[8px] ${agent.statusColor} tracking-wider opacity-70`}>
                                {agent.description.toUpperCase()}
                              </div>
                            </div>
                            {hubStats[id] && (
                              <div className="font-display text-[7px] text-muted-foreground/50 bg-black/40 border border-white/5 px-2 py-0.5">
                                {hubStats[id]}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div
                  className="relative border-2 border-white/10 bg-black/40 backdrop-blur-sm p-5 md:p-6 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(circle at 20% 50%, rgba(255,200,0,0.04) 0%, transparent 50%)'
                  }} />
                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative">
                    <motion.img
                      src={monkeyRidingCrab}
                      className="w-20 h-20 md:w-24 md:h-24 pixel-art-rendering shrink-0 drop-shadow-[0_0_15px_rgba(255,100,0,0.3)]"
                      animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    />
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="font-display text-sm md:text-base text-primary mb-2 drop-shadow-[3px_3px_0px_#000]">
                        THE TROOP IS DEPLOYED
                      </h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        All 8 agents powered by Claude AI with live Solana data feeds.
                        Real analysis, real on-chain transactions, no filler.
                      </p>
                    </div>
                    <motion.img
                      src={crabRiderAngry}
                      className="w-14 h-14 md:w-18 md:h-18 pixel-art-rendering shrink-0 hidden md:block drop-shadow-[0_0_12px_rgba(255,0,0,0.3)]"
                      animate={{ y: [0, -6, 0], scaleX: [1, -1, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="agent-window"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex-1 flex flex-col overflow-hidden relative z-10 m-0 md:m-3 md:mb-0"
          >
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`data-col-${i}`}
                  className="data-stream-col"
                  style={{
                    left: `${8 + i * 12}%`,
                    color: activeAgent.accentHex,
                    ['--rain-speed' as any]: `${6 + Math.random() * 6}s`,
                    ['--rain-delay' as any]: `${Math.random() * 4}s`,
                  }}
                />
              ))}
            </div>

            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    backgroundColor: activeAgent.accentHex,
                    boxShadow: `0 0 4px ${activeAgent.accentHex}`,
                  }}
                  animate={{
                    y: [0, -(10 + Math.random() * 20), 0],
                    x: [0, (Math.random() - 0.5) * 15, 0],
                    opacity: [0, 0.4, 0],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{ repeat: Infinity, duration: 2 + Math.random() * 3, ease: "easeInOut", delay: Math.random() * 3 }}
                />
              ))}
            </div>

            <div className="relative flex flex-col flex-1 overflow-hidden border-0 md:border-2 border-white/15" style={{
              boxShadow: `0 0 40px ${activeAgent.glowColor}, 0 0 80px rgba(0,0,0,0.5)`,
            }}>
              <div className="absolute inset-0 bg-gradient-to-b opacity-40 pointer-events-none z-0"
                style={{ background: `linear-gradient(180deg, ${activeAgent.accentHex}15 0%, transparent 30%)` }}
              />

              <div className="shrink-0 relative z-20 flex items-center h-10 md:h-11 px-1 md:px-2 border-b-2 border-white/10"
                style={{ background: `linear-gradient(180deg, ${activeAgent.accentHex}25 0%, rgba(0,0,0,0.85) 100%)` }}
              >
                <div className="flex items-center gap-1.5 pl-2">
                  <button
                    onClick={handleBackToHub}
                    className="w-3.5 h-3.5 bg-red-500 hover:bg-red-400 transition-colors border border-red-700"
                    title="Close"
                    data-testid="button-close-window"
                  />
                  <div className="w-3.5 h-3.5 bg-yellow-500 border border-yellow-700" />
                  <div className="w-3.5 h-3.5 bg-green-500 border border-green-700" />
                </div>

                <div className="flex-1 flex items-center justify-center gap-2">
                  <img src={activeAgent.avatar} className="w-5 h-5 pixel-art-rendering" />
                  <span className="font-display text-[8px] md:text-[9px] text-white/80 tracking-wider">
                    {activeAgent.name}
                  </span>
                  <span className={`font-display text-[7px] ${activeAgent.statusColor} tracking-wider hidden sm:inline`}>
                    [{activeAgent.status}]
                  </span>
                </div>

                <div className="flex items-center gap-1 pr-2">
                  <div className="flex border border-white/20 overflow-hidden">
                    <button
                      onClick={() => setActiveTab('intel')}
                      data-testid="tab-intel"
                      className={`flex items-center gap-1 px-2.5 md:px-3 py-1 font-display text-[7px] md:text-[8px] transition-all ${
                        activeTab === 'intel'
                          ? 'text-black'
                          : 'bg-black/40 text-white/40 hover:text-white/70'
                      }`}
                      style={activeTab === 'intel' ? { background: activeAgent.accentHex } : {}}
                    >
                      <Radar className="w-3 h-3" /> INTEL
                    </button>
                    <button
                      onClick={() => setActiveTab('tools')}
                      data-testid="tab-tools"
                      className={`flex items-center gap-1 px-2.5 md:px-3 py-1 font-display text-[7px] md:text-[8px] transition-all border-l border-white/20 ${
                        activeTab === 'tools'
                          ? 'text-black'
                          : 'bg-black/40 text-white/40 hover:text-white/70'
                      }`}
                      style={activeTab === 'tools' ? { background: activeAgent.accentHex } : {}}
                    >
                      <Wrench className="w-3 h-3" /> TOOLS
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 relative z-10 bg-black/70 backdrop-blur-sm">
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
                      <div className="relative z-10 p-3 md:p-5">
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
                      className="border-t border-white/10 bg-black/90 backdrop-blur-md overflow-hidden shrink-0 relative z-20"
                    >
                      <div className="relative">
                        <button
                          onClick={() => { setShowChat(false); setChatResponse(''); }}
                          className="absolute top-2 right-2 text-white/30 hover:text-white z-10 p-1 hover:bg-white/10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="p-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                          <div className="font-display text-[8px] mb-2 tracking-widest flex items-center gap-2" style={{ color: activeAgent.accentHex + '99' }}>
                            <span className="text-sm">🐒</span> AGENT RESPONSE
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${activeAgent.accentHex}40, transparent)` }} />
                          </div>
                          <div className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap font-sans pr-6">
                            {chatResponse}
                            {isStreaming && (
                              <span className="inline-block w-2 h-3.5 ml-0.5 align-middle" style={{ background: activeAgent.accentHex, animation: 'blink 0.6s step-end infinite' }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-black/85 backdrop-blur-md z-20 relative">
                <form onSubmit={handleSend} className="flex items-center gap-2 p-2 md:p-3 relative z-10">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-sm" style={{ color: activeAgent.accentHex }}>
                      {">"}
                    </div>
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder={activeAgent.placeholder}
                      disabled={isStreaming}
                      data-testid="input-chat"
                      className="w-full bg-black/60 border border-white/15 text-white pl-8 pr-4 py-2.5 focus:outline-none font-sans text-sm placeholder:text-white/20 transition-all disabled:opacity-50"
                      onFocus={(e) => {
                        e.target.style.borderColor = activeAgent.accentHex + '80';
                        e.target.style.boxShadow = `0 0 15px ${activeAgent.glowColor}`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    data-testid="button-send"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="py-2.5 px-4 font-display text-[9px] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 border border-white/20 transition-all hover:border-white/40"
                    style={{ background: isStreaming ? 'transparent' : activeAgent.accentHex + '30', color: activeAgent.accentHex }}
                  >
                    {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </motion.button>
                </form>
              </div>
            </div>

            <div className="absolute bottom-24 right-3 z-[5] hidden lg:block pointer-events-none">
              <motion.img
                src={activeAgent.avatar}
                className="w-20 h-20 pixel-art-rendering opacity-15"
                style={{ filter: `drop-shadow(0 0 20px ${activeAgent.accentHex})` }}
                animate={{ y: [0, -12, 0], rotate: [-2, 2, -2], opacity: [0.08, 0.18, 0.08] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-11 md:h-12 shrink-0 relative z-30 border-t border-white/10 flex items-center px-2 md:px-3 gap-1 md:gap-2"
        style={{ background: 'linear-gradient(180deg, rgba(10,15,10,0.95) 0%, rgba(5,8,5,0.98) 100%)', backdropFilter: 'blur(10px)' }}
      >
        <motion.button
          onClick={() => activeAgentId ? handleBackToHub() : setLocation('/')}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-colors"
          data-testid="button-start"
        >
          <img src={monkeyHero} className="w-5 h-5 md:w-6 md:h-6 pixel-art-rendering" />
          <span className="font-display text-[7px] md:text-[8px] text-primary hidden sm:inline">START</span>
        </motion.button>

        <div className="h-6 w-px bg-white/10 mx-1" />

        {activeAgent && (
          <button
            onClick={handleBackToHub}
            className="flex items-center gap-1 px-2 py-1 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            data-testid="button-home-taskbar"
          >
            <Home className="w-3 h-3 text-white/50" />
            <span className="font-display text-[7px] text-white/50">HUB</span>
          </button>
        )}

        <div className="flex items-center gap-0.5 overflow-x-auto flex-1 px-1">
          {Object.values(AGENTS).map(agent => (
            <motion.button
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`shrink-0 p-1 md:p-1.5 transition-all relative ${
                activeAgentId === agent.id
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
              data-testid={`taskbar-agent-${agent.id}`}
              title={agent.name}
            >
              <img src={agent.avatar} className="w-5 h-5 md:w-6 md:h-6 pixel-art-rendering" />
              {activeAgentId === agent.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px]" style={{ background: agent.accentHex }} />
              )}
            </motion.button>
          ))}
        </div>

        <div className="h-6 w-px bg-white/10 mx-1" />

        <div className="hidden md:block">
          <WalletButton />
        </div>

        <div className="flex items-center gap-2 px-2 md:px-3 py-1 border border-white/10 bg-black/40">
          <span className="text-sm">🍌</span>
          <span className="font-display text-[8px] text-primary" data-testid="text-banana-balance">1,420</span>
        </div>

        <div className="flex items-center px-2 py-1 border border-white/10 bg-black/40 hidden sm:flex">
          <span className="font-display text-[8px] text-white/50">{timeString}</span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
