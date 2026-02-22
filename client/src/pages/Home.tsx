import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, CircleDollarSign } from "lucide-react";

// Asset imports
import bgJungle from "@/assets/images/bg-jungle.png";
import monkeyHero from "@/assets/images/monkey-hero.png";
import bullyMonkey from "@/assets/images/bully-monkey.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Track vertical scroll progress of the target container
  const { scrollYProgress } = useScroll({
    target: targetRef,
    // Start tracking when top of container hits top of viewport
    // End tracking when bottom of container hits bottom of viewport
    offset: ["start start", "end end"] 
  });

  // Add smoothing to the raw scroll progress
  // This makes the parallax and movement feel buttery smooth instead of jagged
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  // Map scroll progress (0 to 1) to horizontal movement
  // We have 5 "screens" of content, so we need to move -400vw to see everything
  const x = useTransform(smoothProgress, [0, 1], ["0%", "-80%"]);

  // Background Parallax (moves slower than foreground, creating depth)
  // Needs to travel less distance than the foreground content
  const bgX = useTransform(smoothProgress, [0, 1], ["0%", "-40%"]);
  
  // -- ANIMATION TIMELINE --
  // 0.00 - 0.20: Intro Screen (stay put)
  // 0.20 - 0.35: Moving to Bully screen
  // 0.35 - 0.50: Jumping & Punching Bully
  // 0.50 - 0.65: Moving to Bananas screen
  // 0.65 - 0.80: Moving to Treehouse
  // 0.80 - 1.00: Arriving at Treehouse

  // Monkey horizontal position in viewport
  const monkeyX = useTransform(smoothProgress, 
    [0, 0.2, 0.35, 0.45, 0.6, 0.8, 1], 
    ["10vw", "10vw", "30vw", "40vw", "60vw", "70vw", "70vw"]
  );
  
  // Monkey jumping arc (using y position)
  const monkeyY = useTransform(smoothProgress, 
    [0.35, 0.40, 0.45, 0.6, 0.65, 0.7, 0.8, 0.85, 0.9], 
    ["0px", "-300px", "0px", "0px", "-150px", "0px", "0px", "-100px", "0px"]
  );
  
  // Monkey rotation (flips or spins)
  const monkeyRotate = useTransform(smoothProgress,
    [0.35, 0.4, 0.45, 0.6, 0.65, 0.7],
    [0, 180, 360, 360, 540, 720]
  );

  // Bully Monkey interaction
  // Appears, gets punched, fades out
  const bullyOpacity = useTransform(smoothProgress, [0.4, 0.45, 0.5], [1, 1, 0]);
  const bullyScale = useTransform(smoothProgress, [0.4, 0.45, 0.5], [1, 1.2, 0.5]);
  const bullyRotate = useTransform(smoothProgress, [0.4, 0.45, 0.5], [0, -20, -90]);
  
  // Pow impact effect
  const powOpacity = useTransform(smoothProgress, [0.42, 0.45, 0.48], [0, 1, 0]);
  const powScale = useTransform(smoothProgress, [0.42, 0.45, 0.48], [0.5, 2, 3]);

  // Treehouse fade in
  const treehouseOpacity = useTransform(smoothProgress, [0.75, 0.85], [0, 1]);
  const treehouseY = useTransform(smoothProgress, [0.75, 0.85], [50, 0]);

  // Optional: Force scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    // Massively increased height for a very long 20-30s scroll
    <div ref={targetRef} className="h-[2500vh] bg-[#111] font-sans text-foreground">
      
      {/* Sticky container that stays in view while scrolling */}
      <div className="sticky top-0 h-screen w-screen overflow-hidden flex items-center bg-[#0a0f0a]">
        
        {/* Fixed UI */}
        <div className="absolute top-6 left-6 z-50">
          <h1 className="text-xl md:text-2xl font-display text-primary drop-shadow-[2px_2px_0px_#000] pixel-art-rendering tracking-tighter">
            $PUNCHMONKEY
          </h1>
        </div>
        
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-center gap-2">
          <span className="font-display text-xs text-white drop-shadow-[2px_2px_0px_#000]">SCROLL DOWN</span>
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center pt-2 bg-black/50 backdrop-blur-sm">
            <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>

        {/* Parallax Background */}
        <motion.div 
          className="absolute inset-0 h-full w-[300vw] z-0 bg-repeat-x bg-cover bg-center pixel-art-rendering opacity-50"
          style={{ 
            backgroundImage: `url(${bgJungle})`,
            x: bgX 
          }}
        />
        
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />


        {/* The Monkey Hero (Stays in viewport but moves around based on scroll) */}
        <motion.div 
          className="absolute bottom-[20%] z-40 origin-center"
          style={{ 
            left: monkeyX,
            y: monkeyY,
            rotate: monkeyRotate
          }}
        >
          <img src={monkeyHero} alt="Punch Monkey" className="w-32 h-32 md:w-48 md:h-48 pixel-art-rendering drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" />
        </motion.div>

        {/* Horizontal Scrolling Scene Content (5 screens wide) */}
        <motion.div 
          className="relative z-20 flex h-full w-[500vw]"
          style={{ x }}
        >
          
          {/* Scene 1: Intro */}
          <div className="h-full w-[100vw] flex flex-col justify-center items-center px-10 md:px-20">
            <div className="max-w-3xl text-center pl-10 md:pl-0">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-display text-white mb-8 drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] leading-tight">
                PUNCH <br/>
                <span className="text-primary">BACK.</span>
              </h2>
              <p className="text-xl md:text-2xl font-sans text-muted-foreground bg-black/60 p-6 rounded-none border-4 border-primary/30 backdrop-blur-md shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] leading-relaxed">
                They bullied him in the zoo. Now he's breaking out of the cage. 
                Keep scrolling to join the viral redemption arc.
              </p>
            </div>
          </div>

          {/* Scene 2: Empty Space for pacing */}
          <div className="h-full w-[100vw] flex items-center justify-center">
            {/* Just jungle passing by */}
          </div>

          {/* Scene 3: The Bully */}
          <div className="h-full w-[100vw] flex items-center justify-center relative">
            <div className="absolute top-[25%] left-[10%] retro-container p-6 md:p-8 max-w-md -rotate-2 bg-black/80 z-30">
              <h3 className="text-2xl font-display text-destructive mb-3">OVERCOME THE BULLY</h3>
              <p className="font-sans text-lg text-muted-foreground">
                No more cages. No more disrespect. Time to show them who runs the jungle.
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
              <img src={bullyMonkey} className="w-48 h-48 md:w-64 md:h-64 pixel-art-rendering drop-shadow-[0_15px_30px_rgba(255,0,0,0.4)]" />
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

          {/* Scene 4: The Collection */}
          <div className="h-full w-[100vw] flex items-center justify-center relative">
            <div className="absolute top-[30%] right-[15%] retro-container p-6 md:p-8 max-w-md rotate-3 bg-black/80 z-30">
              <div className="flex items-center gap-4 text-primary font-display text-xl mb-4">
                <CircleDollarSign className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
                <span>STACK BANANAS</span>
              </div>
              <p className="font-sans text-lg text-muted-foreground">
                Turn attention into power. Build your swarm.
              </p>
            </div>

            {/* Floating Bananas scattered across the screen */}
            <div className="absolute bottom-[40%] left-[20%] text-6xl md:text-8xl drop-shadow-[0_0_20px_rgba(255,255,0,0.6)] animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>🍌</div>
            <div className="absolute bottom-[60%] left-[40%] text-6xl md:text-8xl drop-shadow-[0_0_20px_rgba(255,255,0,0.6)] animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>🍌</div>
            <div className="absolute bottom-[35%] left-[60%] text-6xl md:text-8xl drop-shadow-[0_0_20px_rgba(255,255,0,0.6)] animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.2s' }}>🍌</div>
            <div className="absolute bottom-[55%] left-[80%] text-6xl md:text-8xl drop-shadow-[0_0_20px_rgba(255,255,0,0.6)] animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '1.8s' }}>🍌</div>
          </div>

          {/* Scene 5: The Treehouse */}
          <div className="h-full w-[100vw] flex flex-col items-center justify-center relative px-4">
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
              
              <button 
                onClick={() => setLocation('/os')}
                className="retro-button retro-button-primary text-xl md:text-2xl px-12 py-8 w-full flex items-center justify-center gap-6 group hover:bg-white hover:text-black transition-colors"
              >
                <span>BOOT SYSTEM</span>
                <ArrowRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
              </button>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
