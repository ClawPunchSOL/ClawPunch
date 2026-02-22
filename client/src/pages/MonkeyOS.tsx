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
  Zap
} from "lucide-react";

import bananaBot from "@/assets/images/banana-bot.png";
import fighterMonkey from "@/assets/images/fighter-monkey.png";

export default function MonkeyOS() {
  const [, setLocation] = useLocation();
  const [activeAgent, setActiveAgent] = useState('banana-bot');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'system', text: 'SYSTEM INITIALIZED. WELCOME TO BANANA LAB.', time: '09:00' },
    { id: 2, sender: 'agent', text: 'OOH OOH AH AH! Ready to post some high-engagement chaos?', time: '09:01' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: input, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    setInput('');
    
    // Mock agent response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'agent', 
        text: `Deploying Moltbook swarm... Target acquired. Generated meme about $PUNCH gains. Expected attention yield: HIGH. 🍌👊`, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      }]);
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
        <aside className="w-64 border-r-4 border-border bg-card/50 flex flex-col p-4 shrink-0">
          <h2 className="font-display text-xs text-muted-foreground mb-6 mt-2">ACTIVE AGENTS</h2>
          
          <div className="space-y-3 flex-1">
            <button 
              onClick={() => setActiveAgent('banana-bot')}
              className={`w-full flex items-center gap-3 p-3 retro-container transition-all ${
                activeAgent === 'banana-bot' ? 'border-primary ring-2 ring-primary/20' : 'border-border opacity-70 hover:opacity-100'
              }`}
            >
              <img src={bananaBot} alt="Banana Bot" className="w-10 h-10 pixel-art-rendering rounded bg-black" />
              <div className="text-left flex-1">
                <div className="font-display text-[10px] text-white">BANANA BOT</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Activity className="w-3 h-3 text-green-500" /> Posting
                </div>
              </div>
            </button>

            <button 
              onClick={() => setActiveAgent('fighter')}
              className={`w-full flex items-center gap-3 p-3 retro-container transition-all ${
                activeAgent === 'fighter' ? 'border-primary ring-2 ring-primary/20' : 'border-border opacity-70 hover:opacity-100'
              }`}
            >
              <img src={fighterMonkey} alt="Fighter" className="w-10 h-10 pixel-art-rendering rounded bg-black" />
              <div className="text-left flex-1">
                <div className="font-display text-[10px] text-white">FIGHTER</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Activity className="w-3 h-3 text-yellow-500" /> Trading
                </div>
              </div>
            </button>
            
            <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-muted hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors mt-4">
              <Sparkles className="w-4 h-4" />
              <span className="font-display text-[10px]">MINT NEW AGENT</span>
            </button>
          </div>

          <div className="mt-auto border-t-2 border-border pt-4">
             <div className="font-display text-[10px] text-muted-foreground mb-3">SYSTEM STATUS</div>
             <div className="space-y-2 text-xs">
               <div className="flex justify-between">
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

        {/* Main Content - Banana Lab */}
        <main className="flex-1 flex flex-col bg-background/90 relative">
          {/* Noise overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
          
          {/* Header */}
          <div className="p-6 border-b-2 border-border flex items-center justify-between shrink-0 z-10">
            <div>
              <h1 className="font-display text-xl text-white mb-1 flex items-center gap-3">
                <Terminal className="text-primary" /> BANANA LAB
              </h1>
              <p className="text-muted-foreground text-sm">Deploy Moltbook agents for auto-posting & attention farming.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="retro-button retro-button-secondary text-[10px] py-2 px-3 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                POWER UP
              </button>
              <button className="retro-button border-border text-[10px] py-2 px-3 hover:bg-card">
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
            <AnimatePresence initial={false}>
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
                        : 'bg-secondary text-white border-secondary'
                    }
                  `}>
                    <p className={`whitespace-pre-wrap ${msg.sender === 'system' ? '' : 'text-sm md:text-base leading-relaxed'}`}>
                      {msg.text}
                    </p>
                  </div>
                  <span className="text-[10px] font-display text-muted-foreground mt-2 px-1">
                    {msg.sender !== 'system' && (msg.sender === 'user' ? 'YOU ' : 'BANANA_BOT ')} 
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
                  placeholder="Command your monkey agent... (e.g., 'Generate a post about $PUNCH gains')"
                  className="w-full bg-background border-4 border-border text-white px-10 py-4 focus:outline-none focus:border-primary font-sans text-sm shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] placeholder:text-muted-foreground"
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
    </div>
  );
}
