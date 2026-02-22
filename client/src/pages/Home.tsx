import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CircleDollarSign } from "lucide-react";

// Asset imports
import bgJungle from "@/assets/images/bg-jungle.png";
import monkeyHero from "@/assets/images/monkey-hero.png";
import rugBear from "@/assets/images/rug-bear.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom horizontal scroll using vertical wheel events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollBy({
          left: e.deltaY * 2,
          behavior: 'auto' // smooth can be jumpy with many small wheel events, auto is more direct
        });
      }
    };
    
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#111] overflow-hidden relative font-sans text-foreground">
      {/* Fixed UI Elements */}
      <div className="fixed top-6 left-6 z-50">
        <h1 className="text-xl md:text-2xl font-display text-primary drop-shadow-[2px_2px_0px_#000] pixel-art-rendering tracking-tighter">
          $PUNCHMONKEY
        </h1>
      </div>
      
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 animate-pulse">
        <span className="font-display text-xs text-white">SCROLL TO PUNCH</span>
        <ArrowRight className="text-primary w-6 h-6" />
      </div>

      {/* Horizontal Scrolling Container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Level 1: Introduction */}
        <section className="h-full w-screen flex-shrink-0 snap-start relative flex items-center justify-center">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pixel-art-rendering opacity-40"
            style={{ backgroundImage: `url(${bgJungle})` }}
          />
          
          <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-4xl px-8">
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-center"
            >
              <h2 className="text-4xl md:text-6xl font-display text-white mb-6 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] leading-tight">
                THE FIGHTER WHO <br/>
                <span className="text-primary">PUNCHES BACK</span>
              </h2>
              <p className="text-xl md:text-2xl font-sans text-muted-foreground max-w-2xl mx-auto">
                Rescued from the trenches. Ready to swing through the rugs. 
                Join the viral baby monkey redemption arc.
              </p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <img src={monkeyHero} alt="Punch Monkey" className="w-64 h-64 pixel-art-rendering drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
            </motion.div>
          </div>
        </section>

        {/* Level 2: The Obstacle */}
        <section className="h-full w-screen flex-shrink-0 snap-center relative flex items-center justify-center">
           <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pixel-art-rendering opacity-30"
            style={{ backgroundImage: `url(${bgJungle})`, backgroundPosition: '30% center' }}
          />
          
          <div className="relative z-10 flex items-center justify-between w-full max-w-5xl px-8">
            <div className="flex-1">
              <div className="retro-container p-8 max-w-lg -rotate-2">
                <h3 className="text-2xl font-display text-destructive mb-4">PUNCH THE BEAR MARKET</h3>
                <p className="font-sans text-lg text-foreground mb-6">
                  Too many rugs. Too many jeets. It's time to punch your way to the moon.
                </p>
                <div className="flex items-center gap-2 text-primary font-display text-sm">
                  <CircleDollarSign className="w-5 h-5" />
                  <span>COLLECT BANANAS. EARN ATTENTION.</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative flex justify-center items-center h-96">
               <motion.img 
                src={monkeyHero} 
                className="w-48 h-48 absolute z-20 pixel-art-rendering right-1/2 translate-x-1/2"
                animate={{ x: [0, 100, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <motion.img 
                src={rugBear} 
                className="w-56 h-56 absolute z-10 pixel-art-rendering left-1/2 -translate-x-1/4 opacity-80"
                animate={{ x: [0, 20, 0], opacity: [0.8, 0.4, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              />
              <div className="absolute top-1/2 left-1/2 font-display text-yellow-400 text-4xl font-bold z-30 animate-ping" style={{textShadow: '2px 2px 0 red'}}>
                POW!
              </div>
            </div>
          </div>
        </section>

        {/* Level 3: The Treehouse */}
        <section className="h-full w-screen flex-shrink-0 snap-end relative flex items-center justify-center">
           <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pixel-art-rendering opacity-20"
            style={{ backgroundImage: `url(${bgJungle})`, backgroundPosition: '60% center' }}
          />
          
          <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-3xl px-8 text-center">
            <h2 className="text-4xl font-display text-primary mb-2 drop-shadow-[4px_4px_0px_#000]">RESCUE TREEHOUSE</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Welcome to the sanctuary. Connect your wallet to access Monkey OS and deploy your attention agents.
            </p>
            
            <div className="retro-container p-12 w-full flex flex-col items-center gap-8 bg-black/50 backdrop-blur-sm">
              <img src={monkeyHero} alt="Hero" className="w-32 h-32 pixel-art-rendering mb-4 drop-shadow-[0_0_20px_rgba(255,200,0,0.5)]" />
              
              <button 
                onClick={() => setLocation('/os')}
                className="retro-button retro-button-primary text-xl px-8 py-6 w-full max-w-md flex items-center justify-center gap-4 group"
              >
                <span>BOOT MONKEY OS</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
              
              <div className="text-sm font-display text-muted-foreground mt-4 flex items-center gap-4">
                <span>CONTRACT:</span>
                <span className="text-primary blur-[2px] select-none">TBA... PUNCHING SOON</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
