import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ZoomIn, ZoomOut, Move, Info, X, Map, Upload, Wallet, ImageIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import sanctuaryMap from "@/assets/images/sanctuary-map.png";
import { useToast } from "@/hooks/use-toast";
import { useWalletState } from "@/components/WalletButton";
import { connectWallet, sendUsdcTransfer, shortAddress, isPhantomInstalled } from "@/lib/solanaWallet";
import type { SanctuaryPixel } from "@shared/schema";

const GRID_SIZE = 100;
const TOTAL_PLOTS = GRID_SIZE * GRID_SIZE;
const BASE_MAP_SIZE = 10000;
const PRICE_PER_PIXEL_USDC = 1;
const POOL_WALLET = "CzKwqN9CvnkKaNyhP2hLaXS1MdZWob3ejQv5HFPhx7iS";

const toRow = (i: number) => Math.floor(i / GRID_SIZE);
const toCol = (i: number) => i % GRID_SIZE;
const toIndex = (row: number, col: number) => row * GRID_SIZE + col;

export default function Sanctuary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const wallet = useWalletState();

  const { data: pixels = [], isLoading: isLoadingPixels } = useQuery<SanctuaryPixel[]>({
    queryKey: ["/api/sanctuary/pixels"],
    queryFn: async () => {
      const res = await fetch("/api/sanctuary/pixels", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pixels");
      return res.json();
    },
  });

  const purchasedPlots: Record<number, { color: string; name: string; imageUrl?: string | null; groupId?: string | null }> = {};
  for (const pixel of pixels) {
    purchasedPlots[pixel.plotIndex] = { color: pixel.color, name: pixel.ownerName, imageUrl: pixel.imageUrl, groupId: pixel.groupId };
  }

  const imageGroups = useMemo(() => {
    const groups: Record<string, { imageUrl: string; indices: number[] }> = {};
    for (const pixel of pixels) {
      if (!pixel.imageUrl) continue;
      const key = pixel.groupId || `solo_${pixel.plotIndex}`;
      if (!groups[key]) groups[key] = { imageUrl: pixel.imageUrl, indices: [] };
      groups[key].indices.push(pixel.plotIndex);
    }
    return Object.values(groups).map(g => {
      const rows = g.indices.map(toRow);
      const cols = g.indices.map(toCol);
      const minRow = Math.min(...rows), maxRow = Math.max(...rows);
      const minCol = Math.min(...cols), maxCol = Math.max(...cols);
      const cellPct = 100 / GRID_SIZE;
      return {
        imageUrl: g.imageUrl,
        top: `${minRow * cellPct}%`,
        left: `${minCol * cellPct}%`,
        width: `${(maxCol - minCol + 1) * cellPct}%`,
        height: `${(maxRow - minRow + 1) * cellPct}%`,
      };
    });
  }, [pixels]);

  const totalDonated = pixels.length;

  const [selectedPlots, setSelectedPlots] = useState<Set<number>>(new Set());
  const [ownerName, setOwnerName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#a855f7");
  const [scale, setScale] = useState(0.1);
  const [mobilePanel, setMobilePanel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<"idle" | "paying" | "claiming">("idle");

  const getDragSelection = useCallback((): Set<number> => {
    if (dragStart === null || dragEnd === null) return new Set();
    const r1 = toRow(dragStart), c1 = toCol(dragStart);
    const r2 = toRow(dragEnd), c2 = toCol(dragEnd);
    const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
    const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
    const selection = new Set<number>();
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        selection.add(toIndex(r, c));
      }
    }
    return selection;
  }, [dragStart, dragEnd]);

  const activeSelection = isDragging ? getDragSelection() : selectedPlots;
  const availableInSelection = Array.from(activeSelection).filter(i => !purchasedPlots[i]);
  const claimedInSelection = Array.from(activeSelection).filter(i => purchasedPlots[i]);
  const totalCostUsdc = availableInSelection.length * PRICE_PER_PIXEL_USDC;

  const claimMutation = useMutation({
    mutationFn: async (data: { plotIndices: number[]; ownerName: string; color: string; imageUrl: string | null; walletAddress: string; txSignature: string }) => {
      const res = await apiRequest("POST", "/api/sanctuary/pixels/batch", data);
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sanctuary/pixels"] });
      toast({
        title: `${result.total} Pixel${result.total > 1 ? 's' : ''} Acquired!`,
        description: `Your USDC donation has been confirmed on-chain. The land is yours!`,
      });
      setOwnerName("");
      setSelectedPlots(new Set());
      setUploadedImage(null);
      setUploadedFileName(null);
      setMobilePanel(false);
      setPaymentStep("idle");
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
      setPaymentStep("idle");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast({ title: "Image too large", description: "Max file size is 500KB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handlePayAndClaim = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast({ title: "Connect Wallet", description: "Please connect your Phantom wallet first", variant: "destructive" });
      return;
    }
    if (availableInSelection.length === 0 || !ownerName.trim()) return;

    setPaymentStep("paying");
    try {
      const txSignature = await sendUsdcTransfer(POOL_WALLET, totalCostUsdc);
      setPaymentStep("claiming");
      claimMutation.mutate({
        plotIndices: availableInSelection,
        ownerName: ownerName.trim(),
        color: selectedColor,
        imageUrl: uploadedImage,
        walletAddress: wallet.publicKey,
        txSignature,
      });
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message || "Transaction was rejected or failed",
        variant: "destructive",
      });
      setPaymentStep("idle");
    }
  };

  const handleMouseDown = (index: number) => {
    setIsDragging(true);
    setDragStart(index);
    setDragEnd(index);
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging) {
      setDragEnd(index);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      const selection = getDragSelection();
      setSelectedPlots(selection);
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      if (selection.size > 0) {
        setMobilePanel(true);
      }
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragStart, dragEnd]);

  const sidebarContent = (
    <>
      <div className="p-6 border-b-2 border-border/50">
        <h2 className="font-display text-xl text-white mb-2">CLAIM YOUR LAND</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Click a pixel or drag to select a patch. Pay with USDC to claim your territory in the Sanctuary.
        </p>
      </div>

      <div className="p-4 border-b-2 border-border/50">
        {wallet.connected ? (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/40 p-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="font-display text-[9px] text-muted-foreground">CONNECTED</div>
              <div className="font-mono text-[11px] text-green-400 truncate">{shortAddress(wallet.publicKey)}</div>
            </div>
            {wallet.balance !== null && (
              <div className="font-mono text-[10px] text-white/70">{wallet.balance.toFixed(3)} SOL</div>
            )}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={wallet.connecting}
            data-testid="button-sanctuary-connect-wallet"
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500/20 border-2 border-purple-500/50 text-purple-400 font-display text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            {wallet.connecting ? "CONNECTING..." : isPhantomInstalled() ? "CONNECT PHANTOM WALLET" : "GET PHANTOM WALLET"}
          </button>
        )}
      </div>
      
      <div className="flex-1 p-6 flex flex-col overflow-y-auto">
        {activeSelection.size > 0 ? (
          <div className="space-y-5">
            <div className="retro-container p-4 bg-black/50">
              <div className="font-display text-xs text-muted-foreground mb-1">SELECTED</div>
              <div className="font-display text-2xl text-white" data-testid="text-selected-plot">
                {activeSelection.size} PIXEL{activeSelection.size > 1 ? 'S' : ''}
              </div>
              {activeSelection.size > 1 && (
                <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                  {(() => {
                    const indices = Array.from(activeSelection);
                    const rows = indices.map(toRow);
                    const cols = indices.map(toCol);
                    return `(${Math.min(...cols)},${Math.min(...rows)}) → (${Math.max(...cols)},${Math.max(...rows)})`;
                  })()}
                </div>
              )}
            </div>

            {claimedInSelection.length > 0 && (
              <div className="bg-yellow-500/10 border-2 border-yellow-500/50 p-3 text-yellow-400 font-display text-[10px]">
                {claimedInSelection.length} PIXEL{claimedInSelection.length > 1 ? 'S' : ''} ALREADY CLAIMED — WILL BE SKIPPED
              </div>
            )}
            
            {availableInSelection.length > 0 ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-display text-muted-foreground">YOUR NAME / TAG</label>
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

                <div className="space-y-2">
                  <label className="text-xs font-display text-muted-foreground">UPLOAD IMAGE (OPTIONAL)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploadedImage ? (
                    <div className="relative border-2 border-primary bg-black/50 p-2">
                      <img src={uploadedImage} alt="Preview" className="w-full h-24 object-cover pixel-art-rendering" />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground truncate flex-1">{uploadedFileName}</span>
                        <button
                          onClick={() => { setUploadedImage(null); setUploadedFileName(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-upload-image"
                      className="w-full flex items-center justify-center gap-2 py-3 bg-black border-2 border-dashed border-border text-muted-foreground font-display text-xs hover:border-primary hover:text-primary transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      CHOOSE IMAGE (MAX 500KB)
                    </button>
                  )}
                </div>
                
                <div className="border-2 border-border bg-black/30 p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{availableInSelection.length} pixel{availableInSelection.length > 1 ? 's' : ''} × ${PRICE_PER_PIXEL_USDC} USDC</span>
                    <span className="text-white font-mono">${totalCostUsdc} USDC</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-border pt-2">
                    <span className="font-display text-xs text-muted-foreground">TOTAL</span>
                    <span className="font-display text-2xl text-green-500" data-testid="text-total-price">
                      ${totalCostUsdc} USDC
                    </span>
                  </div>
                </div>
                
                {!wallet.connected ? (
                  <button
                    onClick={connectWallet}
                    data-testid="button-connect-to-pay"
                    className="retro-button bg-purple-500 text-white py-4 w-full text-lg hover:bg-purple-400"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Wallet className="w-5 h-5" /> CONNECT WALLET TO PAY
                    </span>
                  </button>
                ) : (
                  <button 
                    onClick={handlePayAndClaim}
                    data-testid="button-claim-pixel"
                    disabled={paymentStep !== "idle" || claimMutation.isPending || !ownerName.trim()}
                    className="retro-button bg-green-500 text-black py-4 w-full text-lg hover:bg-white hover:text-black disabled:opacity-50"
                  >
                    {paymentStep === "paying" ? "CONFIRM IN WALLET..." : 
                     paymentStep === "claiming" ? "CLAIMING PIXELS..." :
                     claimMutation.isPending ? "PROCESSING..." : 
                     `PAY ${totalCostUsdc} USDC & MINT ${availableInSelection.length} PIXEL${availableInSelection.length > 1 ? 'S' : ''}`}
                  </button>
                )}
                
                <div className="text-[10px] text-muted-foreground text-center space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" /> 100% goes to Punch Foundation
                  </div>
                  <div className="font-mono opacity-60">
                    Pool: {shortAddress(POOL_WALLET)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-destructive/10 border-2 border-destructive p-4 text-destructive font-display text-sm" data-testid="text-plot-claimed">
                ALL SELECTED PLOTS ALREADY CLAIMED
              </div>
            )}

            <button
              onClick={() => { setSelectedPlots(new Set()); setMobilePanel(false); }}
              className="retro-button border-2 border-border text-muted-foreground py-2 w-full text-xs hover:text-white"
            >
              CLEAR SELECTION
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <Move className="w-12 h-12 mb-4" />
            <p className="font-display text-sm">CLICK OR DRAG<br/>ON THE MAP TO SELECT</p>
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
            className="w-full h-full overflow-auto custom-scrollbar touch-pan-x touch-pan-y select-none"
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
                  onMouseLeave={() => { if (isDragging) handleMouseUp(); }}
                >
                  {imageGroups.map((g, idx) => (
                    <img
                      key={`group-${idx}`}
                      src={g.imageUrl}
                      alt=""
                      className="absolute object-cover pixel-art-rendering pointer-events-none"
                      style={{ top: g.top, left: g.left, width: g.width, height: g.height, zIndex: 5 }}
                      draggable={false}
                    />
                  ))}
                  {Array.from({ length: TOTAL_PLOTS }).map((_, i) => {
                    const isPurchased = purchasedPlots[i];
                    const isInSelection = activeSelection.has(i);
                    
                    return (
                      <div 
                        key={i}
                        data-testid={`grid-cell-${i}`}
                        onMouseDown={(e) => { e.preventDefault(); handleMouseDown(i); }}
                        onMouseEnter={() => handleMouseEnter(i)}
                        onMouseUp={() => handleMouseUp()}
                        className={`
                          border border-white/5 cursor-crosshair transition-colors min-w-[4px] min-h-[4px] relative overflow-hidden
                          ${isInSelection && !isPurchased ? 'bg-primary/40 border-primary z-10 shadow-[0_0_8px_rgba(255,200,0,0.6)]' : ''}
                          ${isInSelection && isPurchased ? 'border-red-500/60 z-10' : ''}
                          ${!isInSelection ? 'hover:bg-white/20 hover:border-white/50' : ''}
                        `}
                        style={{
                          backgroundColor: isPurchased 
                            ? (isInSelection ? `${isPurchased.color}40` : `${isPurchased.color}80`) 
                            : undefined,
                          borderColor: isPurchased && !isInSelection ? isPurchased.color : undefined,
                        }}
                      >
                      </div>
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
