import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import fighterMonkey from "@/assets/images/fighter-monkey.png";
import crabClaw from "@/assets/images/crab-claw.png";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  scanData?: RepoScan | null;
}

interface RepoScan {
  id: number;
  repoUrl: string;
  repoName: string;
  legitScore: number;
  commitCount: number;
  contributorCount: number;
  findings: string;
  recommendation: string;
  scannedAt: string;
}

const BOOT_LINES = [
  "initializing repo_ape.exe...",
  "",
  "loading GitHub analysis engine",
  "commit pattern recognizer: ONLINE",
  "larp detection module: ONLINE",
  "AI legitimacy scorer: ONLINE",
  "",
  "systems ready. talk to me or paste a repo.",
];

function isGitHubUrl(text: string): string | null {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+/i);
  return match ? match[0] : null;
}

export default function RepoApePanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const [bootIndex, setBoot] = useState(0);
  const [bootChar, setBootChar] = useState(0);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [displayedContent, setDisplayedContent] = useState("");
  const [typing, setTyping] = useState(false);
  const fullContentRef = useRef("");
  const displayIndexRef = useRef(0);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, bootIndex, displayedContent]);

  useEffect(() => {
    if (bootDone) return;
    if (bootIndex >= BOOT_LINES.length) {
      setBootDone(true);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    const line = BOOT_LINES[bootIndex];
    if (line === "") {
      const t = setTimeout(() => { setBoot(i => i + 1); setBootChar(0); }, 300);
      return () => clearTimeout(t);
    }
    if (bootChar < line.length) {
      const t = setTimeout(() => setBootChar(c => c + 1), 20 + Math.random() * 25);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setBoot(i => i + 1); setBootChar(0); }, 400);
      return () => clearTimeout(t);
    }
  }, [bootDone, bootIndex, bootChar]);

  const getOrCreateConversation = async (): Promise<number> => {
    if (conversationId) return conversationId;
    const res = await fetch("/api/agents/repo-ape/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Repo Ape Terminal" }),
    });
    const data = await res.json();
    setConversationId(data.id);
    return data.id;
  };

  const triggerScan = async (repoUrl: string): Promise<RepoScan | null> => {
    setScanning(true);
    try {
      const res = await fetch("/api/repos/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const reader = res.body?.getReader();
      if (!reader) return null;
      const decoder = new TextDecoder();
      let buffer = "";
      let scanResult: RepoScan | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.scan) scanResult = data.scan;
          } catch {}
        }
      }
      return scanResult;
    } catch {
      return null;
    } finally {
      setScanning(false);
    }
  };

  const startTypewriter = (scanData: RepoScan | null) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setTyping(true);
    setDisplayedContent("");
    displayIndexRef.current = 0;

    typingTimerRef.current = setInterval(() => {
      const full = fullContentRef.current;
      if (displayIndexRef.current < full.length) {
        const charsPerTick = Math.min(3, full.length - displayIndexRef.current);
        displayIndexRef.current += charsPerTick;
        const shown = full.slice(0, displayIndexRef.current);
        setDisplayedContent(shown);
      } else if (!fullContentRef.current.endsWith("__STREAMING__")) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
        setTyping(false);
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { role: "assistant", content: fullContentRef.current, scanData };
          }
          return updated;
        });
      }
    }, 18);
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    let scanData: RepoScan | null = null;
    const ghUrl = isGitHubUrl(text);
    let contentToSend = text;

    if (ghUrl) {
      scanData = await triggerScan(ghUrl);
      if (scanData) {
        contentToSend = `I'm pasting this GitHub repo for analysis: ${ghUrl}\n\nHere's the scan data:\n- Repo: ${scanData.repoName}\n- Legit Score: ${scanData.legitScore}/100\n- Commits: ${scanData.commitCount}\n- Contributors: ${scanData.contributorCount}\n- Findings: ${scanData.findings}\n- Recommendation: ${scanData.recommendation}\n\nGive me your full analysis and verdict.`;
      }
    }

    try {
      const convId = await getOrCreateConversation();
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSend }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";

      fullContentRef.current = "__STREAMING__";
      setMessages(prev => [...prev, { role: "assistant", content: "", scanData }]);
      startTypewriter(scanData);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              const current = fullContentRef.current.replace("__STREAMING__", "");
              fullContentRef.current = current + data.content + "__STREAMING__";
            }
          } catch {}
        }
      }

      fullContentRef.current = fullContentRef.current.replace("__STREAMING__", "");
    } catch (err: any) {
      fullContentRef.current = `error: ${err.message || "connection failed"}`;
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setTyping(false);
      setMessages(prev => [...prev, { role: "assistant", content: fullContentRef.current }]);
    } finally {
      setStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const scoreColor = (s: number) => s >= 70 ? "#22c55e" : s >= 40 ? "#eab308" : "#ef4444";

  const currentBootText = !bootDone && bootIndex < BOOT_LINES.length
    ? BOOT_LINES[bootIndex].slice(0, bootChar) : "";

  return (
    <div className="absolute inset-0 bg-[#050510] overflow-hidden"
      style={{ fontFamily: "'Press Start 2P', monospace" }}>

      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center p-4"
        initial={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative w-full max-w-2xl flex flex-col" style={{ maxHeight: "calc(100vh - 120px)" }}>
          <div className="border-4 border-yellow-500/40 bg-black/90 overflow-hidden flex flex-col flex-1 min-h-0"
            style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.6), 0 0 60px rgba(255,200,0,0.05)" }}>

            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/15 border-b-4 border-yellow-500/30 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-500 border border-red-700" />
                <div className="w-2.5 h-2.5 bg-yellow-500 border border-yellow-700" />
                <div className="w-2.5 h-2.5 bg-green-500 border border-green-700" />
              </div>
              <span className="text-[7px] md:text-[9px] text-yellow-400/70 tracking-widest ml-2">repo_ape.exe</span>
              <div className="flex-1" />
              {scanning && (
                <span className="text-[7px] text-yellow-400/50 tracking-wider animate-pulse">SCANNING REPO...</span>
              )}
              <motion.div
                className="w-2 h-2 bg-green-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            </div>

            <div ref={scrollRef} className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar min-h-0">
              <div className="text-[7px] md:text-[9px] text-yellow-500/30 mb-3 tracking-wider">
                {">"} repo_ape@clawpunch ~
              </div>

              {BOOT_LINES.slice(0, bootIndex).map((line, i) => (
                <div key={`boot-${i}`} className="mb-0.5">
                  {line === "" ? <div className="h-2" /> : (
                    <div className="flex gap-2 items-baseline">
                      <span className="text-yellow-500/20 text-[7px]">$</span>
                      <span className={`text-[7px] md:text-[9px] tracking-wide ${
                        line.includes("ONLINE") ? "text-green-400/80" :
                        line.includes("ready") ? "text-yellow-300/90" :
                        "text-white/50"
                      }`}>{line}</span>
                    </div>
                  )}
                </div>
              ))}

              {!bootDone && currentBootText && (
                <div className="flex gap-2 items-baseline">
                  <span className="text-yellow-400/30 text-[7px]">$</span>
                  <span className="text-[7px] md:text-[9px] text-white/85 tracking-wide">
                    {currentBootText}
                    <motion.span
                      className="inline-block w-[5px] h-[9px] bg-yellow-400 ml-[1px] align-middle"
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.4 }}
                    />
                  </span>
                </div>
              )}

              {bootDone && messages.map((msg, i) => (
                <div key={i} className="mb-2">
                  {msg.role === "user" ? (
                    <div className="flex gap-2 items-baseline mt-3">
                      <span className="text-yellow-500/40 text-[7px]">{">"}</span>
                      <span className="text-[8px] md:text-[10px] text-yellow-200/90 font-mono">{msg.content}</span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      {msg.scanData && (
                        <div className="mb-2 border-2 border-yellow-500/20 bg-yellow-950/10 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="text-[8px] text-yellow-400/70 tracking-wider">SCAN RESULT</div>
                              <div className="text-[9px] text-white/80 font-mono mt-0.5">{msg.scanData.repoName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold" style={{ color: scoreColor(msg.scanData.legitScore) }}>
                                {msg.scanData.legitScore}
                              </div>
                              <div className="text-[6px] tracking-wider" style={{ color: scoreColor(msg.scanData.legitScore) }}>
                                /100
                              </div>
                            </div>
                          </div>
                          <div className="w-full h-1 bg-black/60 overflow-hidden">
                            <motion.div
                              className="h-full"
                              style={{ background: scoreColor(msg.scanData.legitScore) }}
                              initial={{ width: 0 }}
                              animate={{ width: `${msg.scanData.legitScore}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex gap-3 mt-2 text-[7px]">
                            <span className="text-white/30">commits <span className="text-white/60">{msg.scanData.commitCount.toLocaleString()}</span></span>
                            <span className="text-white/30">contributors <span className="text-white/60">{msg.scanData.contributorCount}</span></span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <span className="text-yellow-500/20 text-[7px] mt-0.5 shrink-0">$</span>
                        <div className="text-[7px] md:text-[9px] text-white/65 tracking-wide leading-relaxed whitespace-pre-wrap font-mono">
                          {(typing || streaming) && i === messages.length - 1 ? displayedContent : msg.content}
                          {(typing || streaming) && i === messages.length - 1 && (
                            <motion.span
                              className="inline-block w-[5px] h-[9px] bg-yellow-400 ml-[1px] align-middle"
                              animate={{ opacity: [1, 0] }}
                              transition={{ repeat: Infinity, duration: 0.4 }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {scanning && (
                <div className="flex items-center gap-2 mt-2 pl-4">
                  <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                  <span className="text-[8px] text-yellow-400/60 animate-pulse">cloning and analyzing repo...</span>
                </div>
              )}
            </div>

            {bootDone && (
              <form onSubmit={handleSubmit} className="flex items-center gap-0 border-t-4 border-yellow-500/30 bg-black/80 shrink-0">
                <span className="text-yellow-500/60 text-[10px] font-mono pl-4 pr-1">{">"}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={scanning ? "scanning..." : "talk or paste a github url..."}
                  disabled={streaming || scanning}
                  data-testid="input-repo-chat"
                  className="flex-1 bg-transparent text-[11px] text-yellow-100 py-2.5 focus:outline-none placeholder:text-yellow-800/30 disabled:opacity-40 font-mono"
                />
                <button type="submit" disabled={streaming || scanning || !input.trim()} data-testid="button-repo-send"
                  className="px-4 py-2.5 text-[8px] disabled:opacity-20 font-display tracking-[0.2em] text-yellow-400 hover:bg-yellow-500/10 transition-colors border-l-4 border-yellow-500/30"
                >
                  {streaming ? "..." : "SEND"}
                </button>
              </form>
            )}
          </div>

          <div className="relative mt-2 flex justify-between px-2 md:px-8">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
            >
              <img
                src={fighterMonkey}
                alt=""
                className="w-14 h-14 md:w-20 md:h-20 pixel-art-rendering drop-shadow-[0_0_15px_rgba(255,200,0,0.3)]"
                style={{ transform: "scaleX(-1)", imageRendering: "pixelated" }}
              />
            </motion.div>

            <motion.div
              animate={{ y: [0, -3, 0], rotate: [2, -2, 2] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            >
              <img
                src={crabClaw}
                alt=""
                className="w-10 h-10 md:w-16 md:h-16 pixel-art-rendering drop-shadow-[0_0_12px_rgba(255,100,0,0.3)]"
                style={{ imageRendering: "pixelated" }}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
