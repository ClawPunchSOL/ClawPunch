import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, CircleDollarSign, Terminal, Zap, Users, Shield, Cpu, ShieldAlert, FileCode } from "lucide-react";

// Asset imports
import bgJungle from "@/assets/images/bg-jungle.png";
import monkeyHero from "@/assets/images/monkey-hero.png";
import bullyMonkey from "@/assets/images/bully-monkey.png";
import storyPlushie from "@/assets/images/story-plushie.png";
import bananaLab from "@/assets/images/banana-lab.png";
import monkeyRidingCrab from "@/assets/images/monkey-riding-crab.png";
import crabRiderAngry from "@/assets/images/crab-rider-angry.png";
import crabRiderHappy from "@/assets/images/crab-rider-happy.png";
import celebrationPortrait from "@/assets/images/celebration-portrait.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Track vertical scroll progress of the target container
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"] 
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  // Map scroll progress (0 to 1) to horizontal movement
  // 8 screens total = 800vw width. We need to translate by -87.5% to see the 8th screen.
  // (100 / 8) * 7 = 87.5
  const x = useTransform(smoothProgress, [0, 1], ["0%", "-87.5%"]);
  
  // Background Parallax
  const bgX = useTransform(smoothProgress, [0, 1], ["0%", "-40%"]);
  
  // Progress Bar (Punch Meter)
  const punchMeter = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  // -- HERO MONKEY ANIMATION TIMELINE --
  // Tracks across the entire 8-scene layout
  const monkeyX = useTransform(smoothProgress, 
    [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], 
    ["10vw", "10vw", "40vw", "60vw", "60vw", "60vw", "60vw", "60vw", "60vw"]
  );
  
  // Jumping arc for specific scenes (e.g. scene 3 fight)
  const monkeyY = useTransform(smoothProgress, 
    [0.2, 0.25, 0.3, 0.35], 
    ["0px", "-300px", "0px", "0px"]
  );
  
  const monkeyRotate = useTransform(smoothProgress,
    [0.2, 0.25, 0.3],
    [0, 360, 720]
  );

  // Bully Monkey interaction (Scene 3)
  // Scene 3 is roughly between 0.25 and 0.375
  const bullyOpacity = useTransform(smoothProgress, [0.28, 0.31, 0.35], [1, 1, 0]);
  const bullyScale = useTransform(smoothProgress, [0.28, 0.31, 0.35], [1, 1.2, 0.5]);
  const bullyRotate = useTransform(smoothProgress, [0.28, 0.31, 0.35], [0, -20, -90]);
  const powOpacity = useTransform(smoothProgress, [0.29, 0.31, 0.33], [0, 1, 0]);
  const powScale = useTransform(smoothProgress, [0.29, 0.31, 0.33], [0.5, 2, 3]);

  // Treehouse fade in (Scene 8 - 0.875 to 1)
  const treehouseOpacity = useTransform(smoothProgress, [0.85, 0.95], [0, 1]);
  const treehouseY = useTransform(smoothProgress, [0.85, 0.95], [50, 0]);

  // Optional: Force scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    // 4000vh = ~40 seconds of scrolling
    <div ref={targetRef} className="h-[4000vh] bg-[#111] font-sans text-foreground">
      
      {/* Sticky container that stays in view while scrolling */}
      <div className="sticky top-0 h-screen w-screen overflow-hidden flex items-center bg-[#0a0f0a]">
        
        {/* Fixed UI */}
        <div className="absolute top-6 left-6 z-50">
          <h1 className="text-xl md:text-2xl font-display text-primary drop-shadow-[2px_2px_0px_#000] pixel-art-rendering tracking-tighter">
            $ClawPunch
          </h1>
        </div>

        {/* Punch Meter (Progress Bar) */}
        <div className="absolute top-6 right-6 z-50 w-48 md:w-64">
          <div className="flex justify-between items-end mb-2">
            <span className="font-display text-[10px] text-primary">PUNCH METER</span>
            <span className="text-xl leading-none animate-bounce">👊</span>
          </div>
          <div className="h-4 w-full bg-black border-2 border-border p-0.5">
            <motion.div 
              className="h-full bg-primary"
              style={{ width: punchMeter }}
            />
          </div>
        </div>
        
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-center gap-2">
          <span className="font-display text-xs text-white drop-shadow-[2px_2px_0px_#000]">SCROLL DOWN</span>
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center pt-2 bg-black/50 backdrop-blur-sm">
            <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>

        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0 h-full w-[400vw] z-0 bg-repeat-x bg-[auto_100%] bg-center pixel-art-rendering opacity-40"
          style={{ 
            backgroundImage: `url(${bgJungle})`,
            x: bgX 
          }}
        />
        
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

        {/* The Monkey Hero (Stays in viewport but moves around based on scroll) */}
        <motion.div 
          className="absolute bottom-[15%] md:bottom-[20%] z-40 origin-center"
          style={{ 
            left: monkeyX,
            y: monkeyY,
            rotate: monkeyRotate
          }}
        >
          <motion.div
            animate={{ 
              y: [0, -25, 0],
              scaleY: [1, 0.9, 1.05, 1],
              scaleX: [1, 1.05, 0.95, 1],
              rotate: [-5, 5, -5]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.6,
              ease: "easeInOut"
            }}
          >
            <img src={monkeyHero} alt="Punchy" className="w-32 h-32 md:w-48 md:h-48 pixel-art-rendering drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" />
          </motion.div>
        </motion.div>

        {/* Horizontal Scrolling Scene Content (8 screens wide = 800vw) */}
        <motion.div 
          className="relative z-20 flex h-full w-[800vw]"
          style={{ x }}
        >
          
          {/* Floating Background Bananas */}
          <div className="absolute top-0 left-0 w-[800vw] h-full pointer-events-none z-0 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl md:text-6xl drop-shadow-[0_0_15px_rgba(255,255,0,0.4)]"
                style={{
                  left: `${(i / 40) * 100 + (Math.random() * 2)}%`,
                  bottom: `${10 + Math.random() * 70}%`,
                }}
                animate={{
                  y: [0, -30 - Math.random() * 30, 0],
                  rotate: [0, 10 + Math.random() * 20, -10 - Math.random() * 20, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3 + Math.random() * 3,
                  ease: "easeInOut",
                  delay: Math.random() * 2
                }}
              >
                🍌
              </motion.div>
            ))}
          </div>

          {/* SCENE 1: Hero Landing (0 - 0.125) */}
          <div className="h-full w-[100vw] flex flex-col justify-center items-center px-10 md:px-20 relative">
            <div className="max-w-5xl text-center pl-10 md:pl-0">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 mb-8 border-2 border-primary font-display text-sm animate-pulse">
                <div className="w-2 h-2 bg-primary rounded-full" /> UTILITY FIRST
              </div>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-display text-white mb-6 drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] leading-tight">
                THE AI AGENT OS <br/>
                BUILT ON <span className="text-primary">SOLANA.</span>
              </h2>
              <h3 className="text-2xl md:text-4xl font-display text-primary mb-10 drop-shadow-[4px_4px_0px_#000]">
                REAL TOOLS. REAL UTILITY.
              </h3>
              <p className="text-xl md:text-2xl font-sans text-muted-foreground bg-black/60 p-6 rounded-none border-4 border-border backdrop-blur-md shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] leading-relaxed inline-block">
                Powered by x402, Moltbook, and Clawd-style AI agents.<br/>Scroll to explore the Monkey OS ecosystem.
              </p>
              
              <div className="mt-12 flex gap-6 justify-center font-display text-xs md:text-sm text-muted-foreground">
                <div className="bg-card px-4 py-2 border-2 border-border flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> LIVE ON PUMP.FUN
                </div>
                <div className="bg-card px-4 py-2 border-2 border-border blur-[2px] select-none">
                  CA: TBA...
                </div>
              </div>
            </div>
          </div>

          {/* SCENE 2: The Story (0.125 - 0.25) */}
          <div className="h-full w-[100vw] flex items-center justify-center px-10 relative">
            <div className="flex flex-col md:flex-row items-center gap-12 max-w-6xl w-full">
              <div className="flex-1 retro-container p-8 md:p-12 bg-black/80 rotate-1">
                <h3 className="text-3xl md:text-4xl font-display text-primary mb-6 drop-shadow-[4px_4px_0px_#000]">THE ORIGIN</h3>
                <p className="text-lg md:text-xl font-sans text-muted-foreground leading-relaxed space-y-4">
                  <span>Inspired by "Punch" the baby macaque — abandoned, clinging to his plushie, rescued by a viral $100K donation.</span>
                  <br/><br/>
                  <span className="text-white font-bold">But Punch isn't just surviving; he's building.</span>
                  <br/><br/>
                  <span>Teaming up with Clawd the crab, Punch is punching back. Forget the memecoin meta. We're building a powerhouse of AI-driven trading utilities, swapping rugs for real tools, and monkeying our way to the top.</span>
                </p>
              </div>
              <div className="flex-1 flex justify-center -rotate-2">
                <img src={storyPlushie} alt="Sad plushie story" className="w-full max-w-md border-8 border-foreground shadow-[12px_12px_0px_0px_#000] pixel-art-rendering" />
              </div>
            </div>
          </div>

          {/* SCENE 3: How It Works / Bully Fight (0.25 - 0.375) */}
          <div className="h-full w-[100vw] flex items-center justify-center relative">
            
            {/* Angry Molt Crab */}
            <motion.div 
              className="absolute bottom-[5%] left-[15vw] origin-bottom z-10"
              animate={{ 
                x: [0, 40, 0],
                y: [0, -10, 0],
                rotate: [-4, 4, -4],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
            >
              <img src={crabRiderAngry} className="w-40 h-40 md:w-56 md:h-56 pixel-art-rendering drop-shadow-[0_15px_30px_rgba(255,0,0,0.4)]" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 border-2 border-destructive px-3 py-1 font-display text-[10px] text-destructive whitespace-nowrap">
                MAD MOLTER
              </div>
            </motion.div>

            <div className="absolute top-[25%] left-[10%] retro-container p-6 md:p-8 max-w-md -rotate-2 bg-black/80 z-30">
              <h3 className="text-2xl font-display text-destructive mb-3">PUNCH THE MARKET</h3>
              <p className="font-sans text-lg text-muted-foreground">
                Deploy AI agents that actually work for you. Punch through the noise, outsmart the rugs, and let x402 and Moltbook handle the heavy lifting while you harvest the bananas.
              </p>
            </div>
            
            {/* The Bully Monkey Obstacle */}
            <motion.div 
              className="absolute bottom-[20%] left-[50%] origin-bottom-right"
              style={{ 
                opacity: bullyOpacity, 
                scale: bullyScale,
                rotate: bullyRotate
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1], 
                  y: [0, -15, 0],
                  rotate: [-3, 3, -3]
                }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              >
                <img src={bullyMonkey} className="w-48 h-48 md:w-64 md:h-64 pixel-art-rendering drop-shadow-[0_15px_30px_rgba(255,0,0,0.4)]" />
              </motion.div>
            </motion.div>

            {/* Pow Effect */}
            <motion.div 
              className="absolute bottom-[30%] left-[50%] font-display text-yellow-400 text-7xl md:text-9xl font-bold z-50 pointer-events-none origin-center"
              style={{ 
                opacity: powOpacity, 
                scale: powScale,
                textShadow: '6px 6px 0px red, -3px -3px 0px black'
              }}
            >
              BAM!
            </motion.div>
          </div>

          {/* SCENE 4: Monkey OS Features (0.375 - 0.5) */}
          <div className="h-full w-[100vw] flex items-center justify-center relative px-10">
            <div className="max-w-6xl w-full">
              <h3 className="text-4xl md:text-5xl font-display text-white mb-12 text-center drop-shadow-[4px_4px_0px_#000]">
                MEET THE <span className="text-primary">TROOP</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: <CircleDollarSign />, name: 'Banana Bot', desc: 'Fast cross-chain USDC micropayments with x402 protocol.' },
                  { icon: <Users />, name: 'Swarm Monkey', desc: 'Register, manage, and upgrade agents on Moltbook.' },
                  { icon: <Terminal />, name: 'Punch Oracle', desc: 'On-chain prediction markets assistant. Stake and punch your prediction.' },
                  { icon: <Zap />, name: 'Trend Puncher', desc: 'Attention market trading assistant. Punch the trend and earn.' },
                  { icon: <Cpu />, name: 'Vault Swinger', desc: 'Yield farming + agent treasury manager. Swing vines to farm APY boosts.' },
                  { icon: <ShieldAlert />, name: 'Rug Buster', desc: 'Solana-native rug-pull detection. Risk assessment via on-chain contract analysis.' },
                  { icon: <FileCode />, name: 'Repo Ape', desc: 'GitHub scanner for AI/LARP scoring. Evaluation through code and commit proofs.' }
                ].map((agent, i) => (
                  <div key={i} className="retro-container p-6 bg-black/60 backdrop-blur-sm hover:-translate-y-2 transition-transform">
                    <div className="text-primary mb-4 w-10 h-10">{agent.icon}</div>
                    <h4 className="font-display text-lg text-white mb-2">{agent.name}</h4>
                    <p className="text-muted-foreground font-sans">{agent.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SCENE 5: Banana Lab Spotlight (0.5 - 0.625) */}
          <div className="h-full w-[100vw] flex items-center justify-center px-10 relative">
            
            {/* The Molt Crab - positioned off to the right so you pass it after the lab */}
            <motion.div 
              className="absolute bottom-[10%] right-[-25vw] origin-bottom z-10"
              animate={{ 
                x: [0, -30, 0],
                y: [0, -8, 0],
                rotate: [-3, 3, -3],
                scaleY: [1, 0.95, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <img src={monkeyRidingCrab} className="w-48 h-48 md:w-64 md:h-64 pixel-art-rendering drop-shadow-[0_15px_30px_rgba(255,50,0,0.5)]" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 border-2 border-primary px-3 py-1 font-display text-[10px] text-primary whitespace-nowrap">
                SWARM COMMANDER
              </div>
            </motion.div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-12 max-w-6xl w-full z-20">
              <div className="flex-1 retro-container p-8 md:p-12 bg-black/80 -rotate-1">
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 mb-6 border-2 border-primary font-display text-xs animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full" /> LIVE UTILITY
                </div>
                <h3 className="text-3xl md:text-5xl font-display text-white mb-6 drop-shadow-[4px_4px_0px_#000]">BANANA LAB</h3>
                <p className="text-lg font-sans text-muted-foreground leading-relaxed space-y-4">
                  <span className="text-primary font-bold">Spawn & control Moltbook agents via chat.</span>
                  <br/><br/>
                  Register your Banana Agent, claim it on Moltbook, and activate auto-posting. Your agents post memes, build swarm presence, and farm attention yield.
                  <br/><br/>
                  You hold the keys. You keep the bananas.
                </p>
              </div>
              <div className="flex-1 flex justify-center rotate-2">
                <img src={bananaLab} alt="Banana Lab" className="w-full max-w-md pixel-art-rendering drop-shadow-[0_0_30px_rgba(255,200,0,0.3)]" />
              </div>
            </div>
          </div>

          {/* SCENE 6: Roadmap (0.625 - 0.75) */}
          <div className="h-full w-[100vw] flex items-center justify-center relative px-10">
            <div className="max-w-4xl w-full retro-container p-8 md:p-12 bg-black/80">
              <h3 className="text-4xl md:text-5xl font-display text-primary mb-12 text-center drop-shadow-[4px_4px_0px_#000]">JUNGLE PATH</h3>
              
              <div className="space-y-8 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-border" />
                
                {[
                  { q: 'Q1 2026', title: 'The Breakout', desc: 'Token Launch + Banana Lab live. The viral story begins.' },
                  { q: 'Q2 2026', title: 'The Assembly', desc: 'Full assistant suite unlocks + x402 hub integration.' },
                  { q: 'Q3 2026', title: 'The Harvest', desc: 'Attention earnings active. Views and likes = token drops.' },
                  { q: 'Q4 2026', title: 'The Conquest', desc: 'Cross-chain agents & fully decentralized marketplace.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 relative">
                    <div className="w-10 h-10 shrink-0 bg-card border-4 border-primary flex items-center justify-center font-display text-[10px] text-white z-10">
                      {i+1}
                    </div>
                    <div>
                      <div className="font-display text-primary text-sm mb-1">{item.q}</div>
                      <div className="font-display text-xl text-white mb-2">{item.title}</div>
                      <div className="font-sans text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SCENE 7: Tokenomics & Community (0.75 - 0.875) */}
          <div className="h-full w-[100vw] flex items-center justify-center relative px-10">

            <div className="flex flex-col md:flex-row gap-8 max-w-6xl w-full z-20">
              <div className="flex-1 retro-container p-8 md:p-12 bg-black/80">
                <h3 className="text-3xl font-display text-primary mb-8 drop-shadow-[4px_4px_0px_#000]">TOKENOMICS</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b-2 border-border pb-2">
                    <span className="font-sans text-xl text-muted-foreground">Supply</span>
                    <span className="font-display text-2xl text-white">1,000,000,000</span>
                  </div>
                  <div className="flex justify-between items-end border-b-2 border-border pb-2">
                    <span className="font-sans text-xl text-muted-foreground">Taxes</span>
                    <span className="font-display text-2xl text-white">0%</span>
                  </div>
                  <div className="flex justify-between items-end border-b-2 border-border pb-2">
                    <span className="font-sans text-xl text-muted-foreground">Launch</span>
                    <span className="font-display text-2xl text-white">FAIR PUMP.FUN</span>
                  </div>
                  <div className="pt-4 flex items-center gap-3 text-sm font-sans text-muted-foreground">
                    <Shield className="text-primary w-5 h-5" /> Liquidity locked. No dev allocations.
                  </div>
                </div>
              </div>

              <div className="flex-1 flex justify-center rotate-2">
                <div className="relative">
                  <img src={celebrationPortrait} alt="Victory Celebration" className="w-full max-w-md border-8 border-foreground shadow-[12px_12px_0px_0px_#000] pixel-art-rendering" />
                  <div className="absolute -bottom-4 -right-4 bg-primary text-black font-display px-4 py-2 text-sm border-2 border-black rotate-[-5deg]">
                    WE MADE IT!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SCENE 8: The Treehouse / Footer (0.875 - 1.0) */}
          <div className="h-full w-[100vw] flex flex-col items-center justify-center relative px-4">
            
            {/* Happy Molt Crab */}
            <motion.div 
              className="absolute bottom-[10%] left-[15vw] origin-bottom z-10"
              animate={{ 
                x: [0, 30, 0],
                y: [0, -15, 0],
                rotate: [-5, 5, -5],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.2,
                ease: "easeInOut"
              }}
            >
              <img src={crabRiderHappy} className="w-48 h-48 md:w-64 md:h-64 pixel-art-rendering drop-shadow-[0_15px_30px_rgba(0,255,0,0.4)]" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 border-2 border-green-500 px-3 py-1 font-display text-[10px] text-green-500 whitespace-nowrap">
                BAG HOLDER
              </div>
            </motion.div>

            <motion.div 
              className="retro-container p-10 md:p-16 w-full max-w-3xl flex flex-col items-center gap-10 bg-black/90 backdrop-blur-md z-30"
              style={{
                opacity: treehouseOpacity,
                y: treehouseY
              }}
            >
              <h2 className="text-4xl md:text-6xl font-display text-primary drop-shadow-[6px_6px_0px_#000] text-center leading-tight">
                MONKEY OS
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground text-center max-w-xl leading-relaxed">
                The breakout is complete. Welcome to the sanctuary. Deploy your agents and take over the timeline.
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                <button 
                  onClick={() => setLocation('/app')}
                  className="retro-button retro-button-primary text-xl md:text-2xl px-12 py-8 flex items-center justify-center gap-6 group hover:bg-white hover:text-black transition-colors flex-1"
                >
                  <span>BOOT SYSTEM</span>
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
                </button>
                <button 
                  onClick={() => setLocation('/sanctuary')}
                  className="retro-button bg-[#10b981] text-black text-xl md:text-2xl px-12 py-8 flex items-center justify-center gap-6 group hover:bg-white transition-colors flex-1 border-2 border-black"
                >
                  <span>ENTER SANCTUARY</span>
                  <span className="text-3xl group-hover:scale-125 transition-transform">🌴</span>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full justify-center mt-4">
                <a href="#" className="retro-button bg-[#1DA1F2] text-white py-4 px-6 flex justify-center text-lg hover:bg-white hover:text-[#1DA1F2] flex-1">
                  TWITTER
                </a>
                <a href="#" className="retro-button bg-[#0088cc] text-white py-4 px-6 flex justify-center text-lg hover:bg-white hover:text-[#0088cc] flex-1">
                  TELEGRAM
                </a>
                <a href="#" className="retro-button bg-card text-white py-4 px-6 flex justify-center text-lg hover:bg-white hover:text-black flex-1 border-2 border-border">
                  GITBOOK
                </a>
              </div>

              <div className="mt-8 text-center text-muted-foreground/50 font-sans text-sm">
                Disclaimer: $PUNCH is a utility token powering the Monkey OS ecosystem.
                <br/>Cryptocurrency investments carry risk. Do your own research before deploying bananas.
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
