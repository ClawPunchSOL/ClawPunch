import { useRef } from "react";
import { useLocation } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CircleDollarSign } from "lucide-react";

// Asset imports
import bgJungle from "@/assets/images/bg-jungle.png";
import monkeyHero from "@/assets/images/monkey-hero.png";
import rugBear from "@/assets/images/rug-bear.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Track vertical scroll progress of the target container
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Map scroll progress (0 to 1) to horizontal movement (-0% to -66.66% or similar depending on width)
  // We have 4 "screens" of content, so the container is 400vw wide.
  // We need to move it by -300vw to see all 4 screens.
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  // Background Parallax (moves slower than foreground)
  const bgX = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  
  // Monkey Animations based on scroll
  const monkeyX = useTransform(scrollYProgress, 
    [0, 0.3, 0.4, 0.6, 0.8, 1], 
    ["10vw", "10vw", "40vw", "40vw", "70vw", "70vw"]
  );
  
  // Monkey jumping arc (using y position)
  const monkeyY = useTransform(scrollYProgress, 
    [0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 0.9], 
    ["0px", "-200px", "0px", "0px", "-250px", "0px", "0px"]
  );
  
  // Monkey rotation (flips or spins)
  const monkeyRotate = useTransform(scrollYProgress,
    [0.2, 0.4, 0.5, 0.6, 0.8],
    [0, 360, 360, 720, 720]
  );

  // Bear interaction
  const bearOpacity = useTransform(scrollYProgress, [0.3, 0.4, 0.45], [1, 1, 0]);
  const bearScale = useTransform(scrollYProgress, [0.3, 0.4, 0.45], [1, 1.5, 0]);
  const powOpacity = useTransform(scrollYProgress, [0.35, 0.4, 0.45], [0, 1, 0]);
  const powScale = useTransform(scrollYProgress, [0.35, 0.4, 0.45], [0.5, 1.5, 2]);

  return (
    // The scrolling container needs to be tall enough to allow for scrolling.
    // 2000vh means 20 screen heights of scrolling, taking about 20-30 seconds.
    <div ref={targetRef} className="h-[2000vh] bg-[#111] font-sans text-foreground">
      
      {/* Sticky container that stays in view while scrolling */}
      <div className="sticky top-0 h-screen w-screen overflow-hidden flex items-center">
        
        {/* Fixed UI */}
        <div className="absolute top-6 left-6 z-50">
          <h1 className="text-xl md:text-2xl font-display text-primary drop-shadow-[2px_2px_0px_#000] pixel-art-rendering tracking-tighter">
            $PUNCHMONKEY
          </h1>
        </div>
        
        <div className="absolute bottom-6 right-6 z-50 flex items-center gap-4 animate-pulse">
          <span className="font-display text-xs text-white">SCROLL DOWN TO PLAY</span>
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>

        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0 h-full w-[200vw] z-0 bg-repeat-x bg-cover bg-center pixel-art-rendering opacity-40"
          style={{ 
            backgroundImage: `url(${bgJungle})`,
            x: bgX 
          }}
        />

        {/* The Monkey Hero (Stays in viewport but moves around) */}
        <motion.div 
          className="absolute bottom-[20%] z-40 origin-center"
          style={{ 
            left: monkeyX,
            y: monkeyY,
            rotate: monkeyRotate
          }}
        >
          <img src={monkeyHero} alt="Punch Monkey" className="w-32 h-32 md:w-48 md:h-48 pixel-art-rendering drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
        </motion.div>

        {/* Scrolling Scene Content */}
        <motion.div 
          className="relative z-10 flex h-full w-[400vw]"
          style={{ x }}
        >
          {/* Scene 1: Intro */}
          <div className="h-full w-[100vw] flex flex-col justify-center items-center px-20">
            <div className="max-w-2xl text-center">
              <h2 className="text-4xl md:text-6xl font-display text-white mb-6 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] leading-tight">
                THE FIGHTER WHO <br/>
                <span className="text-primary">PUNCHES BACK</span>
              </h2>
              <p className="text-xl font-sans text-muted-foreground bg-black/50 p-4 rounded-lg backdrop-blur-sm border-2 border-primary/30">
                Rescued from the trenches. Ready to swing through the rugs. 
                Keep scrolling to join the viral baby monkey redemption arc.
              </p>
            </div>
          </div>

          {/* Scene 2: The Obstacle */}
          <div className="h-full w-[100vw] flex items-center justify-center relative">
            <div className="absolute top-[30%] left-[20%] retro-container p-6 max-w-sm -rotate-2 bg-black/80">
              <h3 className="text-xl font-display text-destructive mb-2">PUNCH THE BEAR MARKET</h3>
              <p className="font-sans text-muted-foreground mb-4">
                Too many rugs. Too many jeets. Punch your way to the moon.
              </p>
            </div>
            
            {/* The Bear Obstacle */}
            <motion.div 
              className="absolute bottom-[20%] left-[60%]"
              style={{ opacity: bearOpacity, scale: bearScale }}
            >
              <img src={rugBear} className="w-40 h-40 md:w-56 md:h-56 pixel-art-rendering opacity-90 drop-shadow-[0_10px_20px_rgba(255,0,0,0.3)]" />
            </motion.div>

            {/* Pow Effect */}
            <motion.div 
              className="absolute bottom-[30%] left-[60%] font-display text-yellow-400 text-6xl md:text-8xl font-bold z-50 pointer-events-none"
              style={{ 
                opacity: powOpacity, 
                scale: powScale,
                textShadow: '4px 4px 0px red, -2px -2px 0px black'
              }}
            >
              POW!
            </motion.div>
          </div>

          {/* Scene 3: The Collection */}
          <div className="h-full w-[100vw] flex items-center justify-center relative">
            <div className="absolute top-[25%] right-[30%] retro-container p-6 max-w-md rotate-2 bg-black/80 z-30">
              <div className="flex items-center gap-3 text-primary font-display text-lg mb-2">
                <CircleDollarSign className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
                <span>COLLECT ATTENTION</span>
              </div>
              <p className="font-sans text-muted-foreground">
                Earn bananas. Deploy agents. Master the attention economy.
              </p>
            </div>

            {/* Floating Bananas */}
            <div className="absolute bottom-[40%] left-[30%] text-6xl drop-shadow-[0_0_15px_rgba(255,255,0,0.5)] animate-bounce" style={{ animationDelay: '0s' }}>🍌</div>
            <div className="absolute bottom-[50%] left-[45%] text-6xl drop-shadow-[0_0_15px_rgba(255,255,0,0.5)] animate-bounce" style={{ animationDelay: '0.2s' }}>🍌</div>
            <div className="absolute bottom-[45%] left-[60%] text-6xl drop-shadow-[0_0_15px_rgba(255,255,0,0.5)] animate-bounce" style={{ animationDelay: '0.4s' }}>🍌</div>
          </div>

          {/* Scene 4: The Treehouse */}
          <div className="h-full w-[100vw] flex flex-col items-center justify-center relative">
            <div className="retro-container p-8 md:p-12 w-full max-w-2xl flex flex-col items-center gap-8 bg-black/80 backdrop-blur-md z-30">
              <h2 className="text-3xl md:text-5xl font-display text-primary drop-shadow-[4px_4px_0px_#000] text-center">
                RESCUE TREEHOUSE
              </h2>
              <p className="text-lg text-muted-foreground text-center">
                Welcome to the sanctuary. Enter Monkey OS and deploy your attention agents.
              </p>
              
              <button 
                onClick={() => setLocation('/os')}
                className="retro-button retro-button-primary text-lg md:text-xl px-8 py-6 w-full flex items-center justify-center gap-4 group"
              >
                <span>BOOT MONKEY OS</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
