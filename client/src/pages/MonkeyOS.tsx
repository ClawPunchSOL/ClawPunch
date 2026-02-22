import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Settings, 
  Activity, 
  Banana, 
  Send, 
  LogOut,
  Sparkles,
  Zap,
  Users,
  CircleDollarSign,
  Cpu
} from "lucide-react";

import bananaBot from "@/assets/images/banana-bot.png";
import swarmMonkey from "@/assets/images/swarm-monkey.png";
import oracleMonkey from "@/assets/images/oracle-monkey.png";
import trendMonkey from "@/assets/images/trend-monkey.png";
import vaultMonkey from "@/assets/images/vault-monkey.png";

type AgentId = 'banana-bot' | 'swarm-monkey' | 'punch-oracle' | 'trend-puncher' | 'vault-swinger';

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
  mockResponse: string;
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
    systemMessage: 'SYSTEM INITIALIZED. X402 PROTOCOL ONLINE. READY TO SEND BANANAS.',
    mockResponse: 'Transaction confirmed. 50 USDC sent via x402 protocol. Transaction hash: 5xK...9qB 🍌💸'
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
    systemMessage: 'MOLTBOOK CONNECTION ESTABLISHED. SWARM MANAGEMENT READY.',
    mockResponse: 'Agent AlphaApe registered successfully. API keys generated and claimed. Swarm size increased by 1. 🐒🤖'
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
    systemMessage: 'ORACLES SYNCED. PREDICTION MARKETS LIVE. PUNCH YOUR PREDICTION.',
    mockResponse: 'Prediction punched! 1000 $PUNCHY staked on [SOL > $300 by Mar 1]. Current odds: 45%. 🔮👊'
  },
  'trend-puncher': {
    id: 'trend-puncher',
    name: 'TREND PUNCHER',
    avatar: trendMonkey,
    status: 'Scanning',
    statusColor: 'text-yellow-500',
    icon: <Zap className="w-3 h-3 text-yellow-500" />,
    description: 'Attention Market Trading',
    placeholder: "Command... (e.g., 'Buy $500 of attention shares on #Punchy')",
    systemMessage: 'ATTENTION MARKETS SCANNING. TREND ANALYSIS ACTIVE.',
    mockResponse: 'Position acquired! Bought 5,200 attention shares on #Punchy narrative. Monitoring virality via Zora oracles. 📈🔥'
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
    systemMessage: 'DEFI VAULTS CONNECTED. TREASURY MANAGER STANDING BY.',
    mockResponse: 'Swinging vines to the vault... 100% of $PUNCH balance staked. Current APY boosted to 420%. Agent treasuries funded. 💰🌴'
  }
};

export default function MonkeyOS() {
  const [, setLocation] = useLocation();
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('banana-bot');
  const [messagesMap, setMessagesMap] = useState<Record<AgentId, {id: number, sender: string, text: string, time: string}[]>>({
    'banana-bot': [{ id: 1, sender: 'system', text: AGENTS['banana-bot'].systemMessage, time: '09:00' }],
    'swarm-monkey': [{ id: 1, sender: 'system', text: AGENTS['swarm-monkey'].systemMessage, time: '09:00' }],
    'punch-oracle': [{ id: 1, sender: 'system', text: AGENTS['punch-oracle'].systemMessage, time: '09:00' }],
    'trend-puncher': [{ id: 1, sender: 'system', text: AGENTS['trend-puncher'].systemMessage, time: '09:00' }],
    'vault-swinger': [{ id: 1, sender: 'system', text: AGENTS['vault-swinger'].systemMessage, time: '09:00' }]
  });
  const [input, setInput] = useState('');

  const activeAgent = AGENTS[activeAgentId];
  const messages = messagesMap[activeAgentId];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = { 
      id: Date.now(), 
      sender: 'user', 
      text: input, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    };

    setMessagesMap(prev => ({
      ...prev,
      [activeAgentId]: [...prev[activeAgentId], userMsg]
    }));
    
    setInput('');
    
    // Mock agent response
    setTimeout(() => {
      const agentMsg = { 
        id: Date.now() + 1, 
        sender: 'agent', 
        text: activeAgent.mockResponse, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      };
      
      setMessagesMap(prev => ({
        ...prev,
        [activeAgentId]: [...prev[activeAgentId], agentMsg]
      }));
    }, 1500);
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col font-sans text-foreground overflow-hidden">
      {/* OS Top Bar */}
      <header className="h-12 border-b-4 border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="text-primary w-5 h-5" />
          <span className="font-display text-xs text-primary">MONKEY OS v1.0.4</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-yellow-400">
            <Banana className="w-4 h-4 fill-current" />
            <span className="font-display text-xs">1,420</span>
          </div>
          <button onClick={() => setLocation('/')} className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span className="font-display text-[10px]">EXIT</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r-4 border-border bg-card/50 flex flex-col shrink-0">
          <div className="p-4 border-b-2 border-border">
            <h2 className="font-display text-[10px] text-muted-foreground">ACTIVE TROOP</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {(Object.values(AGENTS) as Agent[]).map((agent) => (
              <button 
                key={agent.id}
                onClick={() => setActiveAgentId(agent.id as AgentId)}
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
            
            <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-muted hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors mt-6">
              <Sparkles className="w-4 h-4" />
              <span className="font-display text-[10px]">MINT NEW AGENT</span>
            </button>
          </div>

          <div className="p-4 border-t-2 border-border bg-card">
             <div className="font-display text-[10px] text-muted-foreground mb-3">SYSTEM STATUS</div>
             <div className="space-y-2 text-xs font-sans">
               <div className="flex justify-between border-b border-border/50 pb-1">
                 <span className="text-muted-foreground">Network:</span>
                 <span className="text-green-400 font-display text-[10px]">SOLANA</span>
               </div>
               <div className="flex justify-between border-b border-border/50 pb-1">
                 <span className="text-muted-foreground">Attention Yield:</span>
                 <span className="text-green-400">+14.2%</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Swarm Ping:</span>
                 <span className="text-white">24ms</span>
               </div>
             </div>
          </div>
        </aside>

        {/* Main Content - Dynamic Chat Area */}
        <main className="flex-1 flex flex-col bg-background/90 relative">
          {/* Noise overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
          
          {/* Header */}
          <div className="p-6 border-b-2 border-border flex items-center justify-between shrink-0 z-10 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <img src={activeAgent.avatar} className="w-12 h-12 pixel-art-rendering drop-shadow-[0_0_10px_rgba(255,200,0,0.3)]" />
              <div>
                <h1 className="font-display text-xl text-white mb-1 flex items-center gap-3">
                  {activeAgent.name}
                </h1>
                <p className="text-muted-foreground text-sm font-sans">{activeAgent.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-black border-2 border-border rounded-none">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${activeAgent.statusColor.replace('text-', 'bg-')}`} />
                 <span className="font-display text-[10px] text-muted-foreground uppercase">{activeAgent.status}</span>
              </div>
              <button className="retro-button retro-button-secondary text-[10px] py-2 px-3 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                POWER UP
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar">
            <AnimatePresence initial={false} mode="popLayout">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
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
                      {msg.text}
                    </p>
                  </div>
                  <span className="text-[10px] font-display text-muted-foreground mt-2 px-1">
                    {msg.sender !== 'system' && (msg.sender === 'user' ? 'YOU ' : `${activeAgent.name.replace(' ', '_')} `)} 
                    [{msg.time}]
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
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
                  className="w-full bg-background border-4 border-border text-white px-10 py-4 focus:outline-none focus:border-primary font-sans text-sm shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] placeholder:text-muted-foreground/50 transition-colors"
                />
              </div>
              <button 
                type="submit" 
                disabled={!input.trim()}
                className="retro-button retro-button-primary flex items-center justify-center w-16 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
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
