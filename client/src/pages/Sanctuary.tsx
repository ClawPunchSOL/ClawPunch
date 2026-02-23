import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ZoomIn, ZoomOut, Move, Info, X, Map } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import sanctuaryMap from "@/assets/images/sanctuary-map.png";
import { useToast } from "@/hooks/use-toast";
import type { SanctuaryPixel } from "@shared/schema";

const GRID_SIZE = 100;
const TOTAL_PLOTS = GRID_SIZE * GRID_SIZE;
const BASE_MAP_SIZE = 10000;

export default function Sanctuary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: pixels = [], isLoading: isLoadingPixels } = useQuery<SanctuaryPixel[]>({
    queryKey: ["/api/sanctuary/pixels"],
    queryFn: async () => {
      const res = await fetch("/api/sanctuary/pixels", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pixels");
      return res.json();
    },
  });

  const purchasedPlots: Record<number, { color: string; name: string }> = {};
  for (const pixel of pixels) {
    purchasedPlots[pixel.plotIndex] = { color: pixel.color, name: pixel.ownerName };
  }

  const totalDonated = pixels.length;

  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#a855f7");
  const [scale, setScale] = useState(0.1);
  const [mobilePanel, setMobilePanel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const claimMutation = useMutation({
    mutationFn: async (data: { plotIndex: number; ownerName: string; color: string }) => {
      const res = await apiRequest("POST", "/api/sanctuary/pixels", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sanctuary/pixels"] });
      toast({
        title: "Pixels Acquired! 🍌",
        description: `Your donation of $1 to Punch has been processed. The pixel is yours!`,
      });
      setOwnerName("");
      setSelectedPlot(null);
      setMobilePanel(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      container.scrollTop = (BASE_MAP_SIZE * scale - container.clientHeight) / 2;
      container.scrollLeft = (BASE_MAP_SIZE * scale - container.clientWidth) / 2;
    }
  }, []);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.05));

  const handleBuy = () => {
    if (selectedPlot === null || !ownerName.trim()) return;
    claimMutation.mutate({ plotIndex: selectedPlot, ownerName: ownerName.trim(), color: selectedColor });
  };

  const sidebarContent = (
    <>
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
              <div className="font-display text-2xl text-white" data-testid="text-selected-plot">#{selectedPlot}</div>
            </div>
            
            {purchasedPlots[selectedPlot] ? (
              <div className="space-y-4">
                <div className="bg-destructive/10 border-2 border-destructive p-4 text-destructive font-display text-sm" data-testid="text-plot-claimed">
                  PLOT ALREADY CLAIMED
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">OWNER:</div>
                  <div className="text-white font-bold" data-testid="text-plot-owner">{purchasedPlots[selectedPlot].name}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-display text-muted-foreground">YOUR NAME</label>
                  <input 
                    type="text"
                    data-testid="input-owner-name"
                    placeholder="Enter your name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-black border-2 border-border p-3 text-white font-display text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-display text-muted-foreground">PIXEL COLOR</label>
                  <input 
                    type="color"
                    data-testid="input-pixel-color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full h-10 bg-black border-2 border-border cursor-pointer"
                  />
                </div>
                
                <div className="flex justify-between items-end border-b-2 border-border pb-2 mt-4">
                  <span className="font-sans text-muted-foreground">Total Price</span>
                  <span className="font-display text-2xl text-green-500" data-testid="text-total-price">$1</span>
                </div>
                
                <button 
                  onClick={handleBuy}
                  data-testid="button-claim-pixel"
                  disabled={claimMutation.isPending || !ownerName.trim()}
                  className="retro-button bg-green-500 text-black py-4 w-full text-lg hover:bg-white hover:text-black disabled:opacity-50"
                >
                  {claimMutation.isPending ? 'PROCESSING...' : 'MINT PIXELS'}
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
    </>
  );

  return (
    <div className="h-screen w-screen bg-[#0a0f0a] flex flex-col font-sans text-foreground overflow-hidden">
      
      <header className="h-20 border-b-4 border-border bg-black/90 px-4 md:px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => setLocation('/')}
            data-testid="button-back"
            className="retro-button px-3 md:px-4 py-2 flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">BACK</span>
          </button>
          <h1 className="text-base sm:text-xl md:text-2xl font-display text-primary drop-shadow-[2px_2px_0px_#000]">
            1,000,000 BANANA SANCTUARY
          </h1>
        </div>
        
        <div className="hidden md:flex items-center gap-4 bg-card px-4 py-2 border-2 border-border">
          <div className="font-display text-xs text-muted-foreground">DONATED TO PUNCH:</div>
          <div className="font-display text-lg text-green-500" data-testid="text-total-donated">
            {isLoadingPixels ? "..." : `$${totalDonated.toLocaleString()}`}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        <div className="hidden md:flex w-80 bg-black border-r-4 border-border flex-col z-40 shrink-0">
          {sidebarContent}
        </div>

        <div className="flex-1 relative bg-[#111] overflow-hidden">
          <div className="absolute bottom-6 right-6 z-50 flex gap-2">
            <button onClick={handleZoomOut} data-testid="button-zoom-out" className="retro-button p-3 bg-black shadow-lg shadow-black/50">
              <ZoomOut className="w-5 h-5" />
            </button>
            <button onClick={handleZoomIn} data-testid="button-zoom-in" className="retro-button p-3 bg-black shadow-lg shadow-black/50">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {isLoadingPixels && (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/60">
              <div className="font-display text-primary text-xl animate-pulse">LOADING SANCTUARY...</div>
            </div>
          )}

          <div 
            ref={containerRef}
            className="w-full h-full overflow-auto custom-scrollbar touch-pan-x touch-pan-y"
          >
            <div 
              className="relative transition-all duration-200 ease-out"
              style={{ 
                width: `${BASE_MAP_SIZE * scale}px`,
                height: `${BASE_MAP_SIZE * scale}px`,
              }}
            >
              <div
                className="absolute top-0 left-0 origin-top-left transition-transform duration-200 ease-out"
                style={{
                  width: `${BASE_MAP_SIZE}px`,
                  height: `${BASE_MAP_SIZE}px`,
                  transform: `scale(${scale})`
                }}
              >
                <div 
                  className="absolute inset-0 pixel-art-rendering opacity-60"
                  style={{
                    backgroundImage: `url(${sanctuaryMap})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              
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
                        data-testid={`grid-cell-${i}`}
                        onClick={() => {
                          setSelectedPlot(i);
                          setMobilePanel(true);
                        }}
                        className={`
                          border border-white/5 cursor-pointer transition-colors min-w-[4px] min-h-[4px]
                          ${isSelected ? 'bg-primary/40 border-primary z-10 scale-110 shadow-[0_0_15px_rgba(255,200,0,0.8)]' : 'hover:bg-white/20 hover:border-white/50'}
                        `}
                        style={{
                          backgroundColor: isPurchased ? `${isPurchased.color}80` : undefined,
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

      <button
        data-testid="button-open-panel"
        onClick={() => setMobilePanel(true)}
        className="md:hidden fixed bottom-6 left-6 z-50 retro-button bg-primary text-black p-4 shadow-lg shadow-black/50"
      >
        <Map className="w-6 h-6" />
      </button>

      {mobilePanel && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setMobilePanel(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-black border-t-4 border-border flex flex-col"
            style={{ maxHeight: '70vh', transition: 'transform 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border/50">
              <span className="font-display text-sm text-muted-foreground">
                DONATED: <span className="text-green-500" data-testid="text-total-donated-mobile">${totalDonated.toLocaleString()}</span>
              </span>
              <button
                data-testid="button-close-panel"
                onClick={() => setMobilePanel(false)}
                className="retro-button p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 flex flex-col">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
