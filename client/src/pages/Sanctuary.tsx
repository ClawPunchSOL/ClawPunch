import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ZoomIn, ZoomOut, Move, Info } from "lucide-react";
import sanctuaryMap from "@/assets/images/sanctuary-map.png";
import { useToast } from "@/hooks/use-toast";

// 50x50 grid = 2500 plots (visually representing the 1,000,000 pixels to maintain browser performance)
const GRID_SIZE = 50;
const TOTAL_PLOTS = GRID_SIZE * GRID_SIZE;

export default function Sanctuary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mock some pre-purchased plots
  const [purchasedPlots, setPurchasedPlots] = useState<Record<number, {color: string, name: string}>>({
    1250: { color: '#ef4444', name: 'Justin Sun' },
    1251: { color: '#ef4444', name: 'Justin Sun' },
    1200: { color: '#3b82f6', name: 'Whale #1' },
    845: { color: '#10b981', name: 'Early Adopter' },
    2100: { color: '#f59e0b', name: 'Banana Fan' },
  });
  
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));

  const handleBuy = () => {
    if (selectedPlot === null) return;
    setIsBuying(true);
    
    // Simulate transaction
    setTimeout(() => {
      setPurchasedPlots(prev => ({
        ...prev,
        [selectedPlot]: { color: '#a855f7', name: 'You' }
      }));
      setIsBuying(false);
      toast({
        title: "Plot Acquired! 🍌",
        description: "Your donation to Punch has been processed. The plot is yours!",
      });
    }, 1500);
  };

  return (
    <div className="h-screen w-screen bg-[#0a0f0a] flex flex-col font-sans text-foreground overflow-hidden">
      
      {/* Header */}
      <header className="h-20 border-b-4 border-border bg-black/90 px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setLocation('/')}
            className="retro-button px-4 py-2 flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> BACK
          </button>
          <h1 className="text-xl md:text-2xl font-display text-primary drop-shadow-[2px_2px_0px_#000]">
            1,000,000 BANANA SANCTUARY
          </h1>
        </div>
        
        <div className="hidden md:flex items-center gap-4 bg-card px-4 py-2 border-2 border-border">
          <div className="font-display text-xs text-muted-foreground">DONATED TO PUNCH:</div>
          <div className="font-display text-lg text-green-500">$105,420</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar / Info Panel */}
        <div className="w-80 bg-black border-r-4 border-border flex flex-col z-40 shrink-0">
          <div className="p-6 border-b-2 border-border/50">
            <h2 className="font-display text-xl text-white mb-2">CLAIM YOUR LAND</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Buy a plot in the jungle. Every dollar goes to the Punch Foundation. 
              Claim your pixels, upload your image, and leave your mark on the ecosystem.
            </p>
          </div>
          
          <div className="flex-1 p-6 flex flex-col">
            {selectedPlot !== null ? (
              <div className="space-y-6">
                <div className="retro-container p-4 bg-black/50">
                  <div className="font-display text-xs text-muted-foreground mb-1">SELECTED PLOT</div>
                  <div className="font-display text-2xl text-white">#{selectedPlot}</div>
                </div>
                
                {purchasedPlots[selectedPlot] ? (
                  <div className="space-y-4">
                    <div className="bg-destructive/10 border-2 border-destructive p-4 text-destructive font-display text-sm">
                      PLOT ALREADY CLAIMED
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">OWNER:</div>
                      <div className="text-white font-bold">{purchasedPlots[selectedPlot].name}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b-2 border-border pb-2">
                      <span className="font-sans text-muted-foreground">Price</span>
                      <span className="font-display text-xl text-green-500">100 USDC</span>
                    </div>
                    
                    <button 
                      onClick={handleBuy}
                      disabled={isBuying}
                      className="retro-button bg-green-500 text-black py-4 w-full text-lg hover:bg-white hover:text-black disabled:opacity-50"
                    >
                      {isBuying ? 'PROCESSING...' : 'MINT PLOT'}
                    </button>
                    
                    <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                      <Info className="w-4 h-4" /> 100% goes to Punch
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Move className="w-12 h-12 mb-4" />
                <p className="font-display text-sm">SELECT A PLOT<br/>ON THE MAP TO BEGIN</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-[#111] overflow-hidden">
          
          {/* Controls */}
          <div className="absolute bottom-6 right-6 z-50 flex gap-2">
            <button onClick={handleZoomOut} className="retro-button p-3 bg-black">
              <ZoomOut className="w-5 h-5" />
            </button>
            <button onClick={handleZoomIn} className="retro-button p-3 bg-black">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Area */}
          <div 
            ref={containerRef}
            className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing custom-scrollbar"
          >
            <div 
              className="origin-top-left transition-transform duration-200 ease-out"
              style={{ 
                transform: `scale(${scale})`,
                width: '3000px', // Base size of the map
                height: '3000px'
              }}
            >
              {/* Background Map Image */}
              <div 
                className="absolute inset-0 pixel-art-rendering opacity-60"
                style={{
                  backgroundImage: `url(${sanctuaryMap})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              
              {/* Plot Grid */}
              <div 
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                }}
              >
                {Array.from({ length: TOTAL_PLOTS }).map((_, i) => {
                  const isPurchased = purchasedPlots[i];
                  const isSelected = selectedPlot === i;
                  
                  return (
                    <div 
                      key={i}
                      onClick={() => setSelectedPlot(i)}
                      className={`
                        border border-white/5 cursor-pointer transition-colors
                        ${isSelected ? 'bg-primary/40 border-primary z-10 scale-110 shadow-[0_0_15px_rgba(255,200,0,0.8)]' : 'hover:bg-white/20 hover:border-white/50'}
                      `}
                      style={{
                        backgroundColor: isPurchased ? `${isPurchased.color}80` : undefined, // 80 is 50% opacity in hex
                        borderColor: isPurchased ? isPurchased.color : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
