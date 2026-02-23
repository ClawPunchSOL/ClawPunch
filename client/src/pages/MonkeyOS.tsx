import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Banana, 
  Send, 
  LogOut,
  Sparkles,
  Zap,
  Users,
  CircleDollarSign,
  Cpu,
  ShieldAlert,
  FileCode,
  Loader2
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
  icon: React.ReactNode;
  description: string;
  placeholder: string;
  systemMessage: string;
}

const AGENTS: Record<AgentId, Agent> = {
  'banana-bot': {
    id: 'banana-bot',
    name: 'BANANA BOT',
    avatar: bananaBot,
    status: 'Ready',
    statusColor: 'text-green-500',
    icon: <CircleDollarSign className="w-3 h-3 text-green-500" />,
    description: 'x402 Micropayments & Transfers',
    placeholder: "Command... (e.g., 'Tip 50 USDC to @user for their meme')",
    systemMessage: 'SYSTEM INITIALIZED. X402 PROTOCOL ONLINE. READY TO SEND BANANAS.'
  },
  'swarm-monkey': {
    id: 'swarm-monkey',
    name: 'SWARM MONKEY',
    avatar: swarmMonkey,
    status: 'Active',
    statusColor: 'text-blue-500',
    icon: <Users className="w-3 h-3 text-blue-500" />,
    description: 'Moltbook Agent Manager',
    placeholder: "Command... (e.g., 'Register new agent AlphaApe on Moltbook')",
    systemMessage: 'MOLTBOOK CONNECTION ESTABLISHED. SWARM MANAGEMENT READY.'
  },
  'punch-oracle': {
    id: 'punch-oracle',
    name: 'PUNCH ORACLE',
    avatar: oracleMonkey,
    status: 'Syncing',
    statusColor: 'text-purple-500',
    icon: <Terminal className="w-3 h-3 text-purple-500" />,
    description: 'Prediction Markets Assistant',
    placeholder: "Command... (e.g., 'Stake 1000 PUNCH that SOL hits $300 by March')",
    systemMessage: 'ORACLES SYNCED. PREDICTION MARKETS LIVE. PUNCH YOUR PREDICTION.'
  },
  'trend-puncher': {
    id: 'trend-puncher',
    name: 'TREND PUNCHER',
    avatar: trendMonkey,
    status: 'Scanning',
    statusColor: 'text-yellow-500',
    icon: <Zap className="w-3 h-3 text-yellow-500" />,
    description: 'Attention Market Trading',
    placeholder: "Command... (e.g., 'Buy $500 of attention shares on #Punch')",
    systemMessage: 'ATTENTION MARKETS SCANNING. TREND ANALYSIS ACTIVE.'
  },
  'vault-swinger': {
    id: 'vault-swinger',
    name: 'VAULT SWINGER',
    avatar: vaultMonkey,
    status: 'Farming',
    statusColor: 'text-orange-500',
    icon: <Cpu className="w-3 h-3 text-orange-500" />,
    description: 'Yield & Treasury Manager',
    placeholder: "Command... (e.g., 'Stake all PUNCH in the high-yield vault')",
    systemMessage: 'DEFI VAULTS CONNECTED. TREASURY MANAGER STANDING BY.'
  },
  'rug-buster': {
    id: 'rug-buster',
    name: 'RUG BUSTER',
    avatar: swarmMonkey,
    status: 'Guarding',
    statusColor: 'text-red-500',
    icon: <ShieldAlert className="w-3 h-3 text-red-500" />,
    description: 'Solana Rug-Pull Detection',
    placeholder: "Command... (e.g., 'Scan contract Address... for rug risk')",
    systemMessage: 'SECURITY SCANNERS ONLINE. READY TO BUST RUGS VIA X402 PAYMENTS.'
  },
  'repo-ape': {
    id: 'repo-ape',
    name: 'REPO APE',
    avatar: oracleMonkey,
    status: 'Analyzing',
    statusColor: 'text-cyan-500',
    icon: <FileCode className="w-3 h-3 text-cyan-500" />,
    description: 'GitHub Scanner & LARP Scoring',
    placeholder: "Command... (e.g., 'Score github.com/user/repo for AI LARP')",
    systemMessage: 'REPO ANALYSIS PROTOCOL ENGAGED. AWAITING TARGET GITHUB URL.'
  }
};

interface ChatMessage {
  id: number;
  sender: 'user' | 'agent' | 'system';
  text: string;
  time: string;
}

export default function MonkeyOS() {
  const [, setLocation] = useLocation();
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('banana-bot');
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeAgent = AGENTS[activeAgentId];
  const currentMessages = messagesMap[activeAgentId];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const getOrCreateConversation = useCallback(async (agentId: AgentId): Promise<number> => {
    if (conversationIds[agentId]) {
      return conversationIds[agentId]!;
    }
    const res = await fetch(`/api/agents/${agentId}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${AGENTS[agentId].name} Session` }),
    });
    const conv = await res.json();
    setConversationIds(prev => ({ ...prev, [agentId]: conv.id }));
    return conv.id;
  }, [conversationIds]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const userText = input;
    const userMsg: ChatMessage = { 
      id: Date.now(), 
      sender: 'user', 
      text: userText, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    };

    setMessagesMap(prev => ({
      ...prev,
      [activeAgentId]: [...prev[activeAgentId], userMsg]
    }));
    setInput('');
    setIsStreaming(true);

    const streamingMsgId = Date.now() + 1;
    const streamingMsg: ChatMessage = {
      id: streamingMsgId,
      sender: 'agent',
      text: '',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setMessagesMap(prev => ({
      ...prev,
      [activeAgentId]: [...prev[activeAgentId], streamingMsg]
    }));

    try {
      const convId = await getOrCreateConversation(activeAgentId);
      
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userText }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

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
              setMessagesMap(prev => ({
                ...prev,
                [activeAgentId]: prev[activeAgentId].map(m => 
                  m.id === streamingMsgId ? { ...m, text: accumulated } : m
                )
              }));
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessagesMap(prev => ({
        ...prev,
        [activeAgentId]: prev[activeAgentId].map(m => 
          m.id === streamingMsgId 
            ? { ...m, text: m.text || 'ERROR: Connection lost. Retrying...' } 
            : m
        )
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col font-sans text-foreground overflow-hidden">
      <header className="h-12 border-b-4 border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="text-primary w-5 h-5" />
          <span className="font-display text-xs text-primary" data-testid="text-os-version">MONKEY OS v1.0.4</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-yellow-400">
            <Banana className="w-4 h-4 fill-current" />
            <span className="font-display text-xs" data-testid="text-banana-balance">1,420</span>
          </div>
          <button onClick={() => setLocation('/')} className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2" data-testid="button-exit">
            <LogOut className="w-4 h-4" />
            <span className="font-display text-[10px]">EXIT</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r-4 border-border bg-card/50 flex flex-col shrink-0">
          <div className="p-4 border-b-2 border-border">
            <h2 className="font-display text-[10px] text-muted-foreground">ACTIVE TROOP</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {(Object.values(AGENTS) as Agent[]).map((agent) => (
              <button 
                key={agent.id}
                onClick={() => setActiveAgentId(agent.id as AgentId)}
                data-testid={`button-agent-${agent.id}`}
                className={`w-full flex items-center gap-3 p-3 retro-container transition-all ${
                  activeAgentId === agent.id ? 'border-primary ring-2 ring-primary/20 bg-black/40' : 'border-border opacity-60 hover:opacity-100 bg-transparent'
                }`}
              >
                <img src={agent.avatar} alt={agent.name} className="w-10 h-10 pixel-art-rendering rounded bg-black" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-display text-[10px] text-white truncate">{agent.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                    {agent.icon} <span className={agent.statusColor}>{agent.status}</span>
                  </div>
                </div>
              </button>
            ))}
            
            <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-muted hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors mt-6" data-testid="button-mint-agent">
              <Sparkles className="w-4 h-4" />
              <span className="font-display text-[10px]">MINT NEW AGENT</span>
            </button>
          </div>

          <div className="p-4 border-t-2 border-border bg-card">
             <div className="font-display text-[10px] text-muted-foreground mb-3">SYSTEM STATUS</div>
             <div className="space-y-2 text-xs font-sans">
               <div className="flex justify-between border-b border-border/50 pb-1">
                 <span className="text-muted-foreground">Network:</span>
                 <span className="text-green-400 font-display text-[10px]" data-testid="text-network">SOLANA</span>
               </div>
               <div className="flex justify-between border-b border-border/50 pb-1">
                 <span className="text-muted-foreground">Attention Yield:</span>
                 <span className="text-green-400" data-testid="text-yield">+14.2%</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Swarm Ping:</span>
                 <span className="text-white" data-testid="text-ping">24ms</span>
               </div>
             </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-background/90 relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
          
          <div className="p-6 border-b-2 border-border flex items-center justify-between shrink-0 z-10 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <img src={activeAgent.avatar} className="w-12 h-12 pixel-art-rendering drop-shadow-[0_0_10px_rgba(255,200,0,0.3)]" />
              <div>
                <h1 className="font-display text-xl text-white mb-1 flex items-center gap-3" data-testid="text-agent-name">
                  {activeAgent.name}
                </h1>
                <p className="text-muted-foreground text-sm font-sans" data-testid="text-agent-desc">{activeAgent.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-black border-2 border-border rounded-none">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${activeAgent.statusColor.replace('text-', 'bg-')}`} />
                 <span className="font-display text-[10px] text-muted-foreground uppercase" data-testid="text-agent-status">{activeAgent.status}</span>
              </div>
              <button className="retro-button retro-button-secondary text-[10px] py-2 px-3 flex items-center gap-2" data-testid="button-power-up">
                <Zap className="w-3 h-3" />
                POWER UP
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar">
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
                    max-w-[80%] p-4 rounded-none border-2 shadow-[2px_2px_0px_#000]
                    ${msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : msg.sender === 'system'
                        ? 'bg-card border-border text-muted-foreground font-display text-[10px]'
                        : 'bg-[#1a1a1a] text-white border-secondary'
                    }
                  `}>
                    <p className={`whitespace-pre-wrap ${msg.sender === 'system' ? '' : 'text-sm md:text-base leading-relaxed font-sans'}`}>
                      {msg.text || (msg.sender === 'agent' && isStreaming ? '' : msg.text)}
                      {msg.sender === 'agent' && isStreaming && !msg.text && (
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] font-display text-muted-foreground mt-2 px-1">
                    {msg.sender !== 'system' && (msg.sender === 'user' ? 'YOU ' : `${activeAgent.name.replace(' ', '_')} `)} 
                    [{msg.time}]
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t-2 border-border bg-card shrink-0 z-10">
            <form onSubmit={handleSend} className="flex gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-display text-sm animate-pulse">
                  {">"}
                </div>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeAgent.placeholder}
                  disabled={isStreaming}
                  data-testid="input-chat"
                  className="w-full bg-background border-4 border-border text-white px-10 py-4 focus:outline-none focus:border-primary font-sans text-sm shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] placeholder:text-muted-foreground/50 transition-colors disabled:opacity-50"
                />
              </div>
              <button 
                type="submit" 
                disabled={!input.trim() || isStreaming}
                data-testid="button-send"
                className="retro-button retro-button-primary flex items-center justify-center w-16 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </main>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a; 
          border-left: 2px solid var(--color-border);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-border); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary); 
        }
      `}</style>
    </div>
  );
}
