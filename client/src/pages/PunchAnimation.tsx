import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import fighterMonkey from '@/assets/images/fighter-monkey.png';
import crabClaw from '@/assets/images/crab-claw.png';
import monkeyRidingCrab from '@/assets/images/monkey-riding-crab.png';

const STORY_LINES = [
  { text: 'initializing our_story.exe...', delay: 800 },
  { text: '', delay: 400 },
  { text: 'it started with a question.', delay: 700 },
  { text: 'what if AI agents could actually do stuff on-chain?', delay: 800 },
  { text: 'not dashboards. not charts. real operations.', delay: 800 },
  { text: 'scan a token. sign a transaction. launch a coin.', delay: 800 },
  { text: 'all from one place.', delay: 600 },
  { text: '', delay: 400 },
  { text: 'so we built ClawPunch.', delay: 700 },
  { text: 'a crypto utility platform on Solana.', delay: 700 },
  { text: '8 AI agents. each one does something different.', delay: 800 },
  { text: 'each one powered by Claude.', delay: 600 },
  { text: '', delay: 400 },
  { text: 'Banana Bot handles wallet ops. real SOL transfers.', delay: 800 },
  { text: 'Swarm Monkey connects to the Moltbook network.', delay: 800 },
  { text: 'Punch Oracle runs prediction markets with real bets.', delay: 800 },
  { text: 'Trend Puncher scans live markets for alpha.', delay: 800 },
  { text: 'Ape Vault finds the best DeFi yields on Solana.', delay: 800 },
  { text: 'Rug Buster audits contracts before you ape in.', delay: 800 },
  { text: 'Repo Ape checks if the GitHub is legit.', delay: 800 },
  { text: 'Banana Cannon launches tokens straight to pump.fun.', delay: 800 },
  { text: '', delay: 400 },
  { text: 'the tech? React, Express, Drizzle, PostgreSQL.', delay: 700 },
  { text: 'Phantom wallet for signing. zero custody. your keys.', delay: 800 },
  { text: 'x402 protocol for micropayments.', delay: 700 },
  { text: 'Claude Sonnet for every agent brain.', delay: 700 },
  { text: '', delay: 400 },
  { text: 'then we built the Sanctuary.', delay: 700 },
  { text: '1 million pixels. each one a donation.', delay: 800 },
  { text: 'USDC payments verified on-chain.', delay: 700 },
  { text: 'every pixel claimed goes toward conservation.', delay: 800 },
  { text: 'this is how we fund the mission.', delay: 700 },
  { text: '', delay: 400 },
  { text: 'all of this exists for one reason.', delay: 800 },
  { text: 'to show what happens when AI meets crypto', delay: 700 },
  { text: 'and someone actually ships it.', delay: 700 },
  { text: '', delay: 500 },
  { text: 'no roadmap slides. no whitepaper fluff.', delay: 700 },
  { text: 'just code, commits, and agents that work.', delay: 800 },
  { text: '', delay: 400 },
  { text: 'this is punch.', delay: 800 },
  { text: '', delay: 500 },
  { text: 'now let me show you what they can do...', delay: 1200 },
];

const AGENTS = [
  {
    id: 'swarm_monkey',
    name: 'swarm_monkey.exe',
    color: '#22c55e',
    lines: [
      'connecting to moltbook network...',
      'handshake complete',
      'registering agent identity',
      'scanning submolts for activity',
      'found 12 active communities',
      'posting status update...',
      'upvoting high-signal content',
      'syncing agent roster',
      'swarm intelligence: ONLINE',
    ],
  },
  {
    id: 'banana_bot',
    name: 'banana_bot.exe',
    color: '#eab308',
    lines: [
      'initializing wallet bridge...',
      'reading Solana RPC...',
      'TPS: 3,847 | slot: 298,441,002',
      'building transfer instruction',
      'recipient verified on-chain',
      'awaiting Phantom signature...',
      'tx signed. broadcasting...',
      'confirmed in 400ms',
      'wallet ops: ONLINE',
    ],
  },
  {
    id: 'punch_oracle',
    name: 'punch_oracle.exe',
    color: '#a855f7',
    lines: [
      'loading prediction markets...',
      'fetching live price feeds',
      'SOL: $178.42 | BTC: $97,201',
      'generating new market...',
      '"SOL above $200 by Friday?"',
      'odds calculated: 62% YES',
      'pool open for bets',
      'monitoring resolution triggers',
      'oracle markets: ONLINE',
    ],
  },
  {
    id: 'trend_puncher',
    name: 'trend_puncher.exe',
    color: '#f97316',
    lines: [
      'scanning CoinGecko feeds...',
      'analyzing 24h movers',
      'TOP PICK: narrative shift detected',
      'AI agent tokens +340% this week',
      'RED FLAG: low liquidity on 3 tokens',
      'ALPHA CALL: accumulation pattern',
      'market pulse: bullish divergence',
      'updating attention signals',
      'trend scanner: ONLINE',
    ],
  },
  {
    id: 'ape_vault',
    name: 'ape_vault.exe',
    color: '#06b6d4',
    lines: [
      'querying DeFi Llama...',
      'found 847 Solana pools',
      'filtering by TVL > $1M',
      'BEST YIELD: Raydium SOL-USDC 18.2%',
      'SAFE PLAY: Marinade mSOL 7.1%',
      'DEGEN: Orca whirlpool 42.8%',
      'calculating optimal allocation',
      'risk assessment: moderate',
      'vault strategist: ONLINE',
    ],
  },
  {
    id: 'rug_buster',
    name: 'rug_buster.exe',
    color: '#ef4444',
    lines: [
      'loading contract for analysis...',
      'checking mint authority...',
      'mint authority: REVOKED ✓',
      'freeze authority: NONE ✓',
      'top 10 holders: 23% concentration',
      'WARNING: deployer holds 8%',
      'liquidity lock: 6 months',
      'safety score: 72/100',
      'security scanner: ONLINE',
    ],
  },
  {
    id: 'repo_ape',
    name: 'repo_ape.exe',
    color: '#64748b',
    lines: [
      'cloning repository...',
      'analyzing commit history',
      '847 commits across 14 months',
      '12 contributors found',
      'last commit: 3 hours ago',
      'checking for copy-paste code...',
      'dependency audit: clean',
      'legit score: 88/100',
      'repo scanner: ONLINE',
    ],
  },
  {
    id: 'banana_cannon',
    name: 'banana_cannon.exe',
    color: '#f59e0b',
    lines: [
      'scanning breaking news feeds...',
      'Claude generating token concepts...',
      'concept 1: narrative match 94%',
      'uploading metadata to IPFS...',
      'building launch transaction',
      'mint keypair generated client-side',
      'awaiting Phantom signature...',
      'LAUNCHED on pump.fun',
      'token launcher: ONLINE',
    ],
  },
];

const PUNCH_LINES = [
  'punch.exe initializing...',
  'merging all agent feeds...',
  'SWARM: 12 agents synced',
  'WALLET: 3 pending transfers',
  'ORACLE: 8 active markets',
  'TRENDS: alpha signal detected',
  'VAULT: rebalancing portfolio',
  'SECURITY: scanning new contract',
  'REPO: analyzing 3 repositories',
  'CANNON: 2 launches queued',
  'cross-referencing all data streams...',
  'AI correlation matrix: ACTIVE',
  'processing 847 data points per second',
  'neural pathway optimization: 99.7%',
  'all systems nominal',
  'unified intelligence: OPERATIONAL',
  'ClawPunch network: FULLY ONLINE',
  '',
  'we are punch.',
];

type Phase = 'story' | 'split2' | 'split3' | 'split4' | 'split5' | 'split6' | 'split7' | 'split8' | 'merge' | 'punch' | 'overload' | 'reset';

const SPLIT_PHASES: Phase[] = ['split2', 'split3', 'split4', 'split5', 'split6', 'split7', 'split8'];

function getAgentCount(phase: Phase): number {
  const map: Record<string, number> = { split2: 2, split3: 3, split4: 4, split5: 5, split6: 6, split7: 7, split8: 8 };
  return map[phase] || 0;
}

function MiniTerminal({ agent, index, total, isActive }: {
  agent: typeof AGENTS[0];
  index: number;
  total: number;
  isActive: boolean;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const lineIndex = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    setLines([]);
    lineIndex.current = 0;
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (lineIndex.current >= agent.lines.length) {
      lineIndex.current = 0;
    }
    const timer = setInterval(() => {
      setLines(prev => {
        const next = [...prev, agent.lines[lineIndex.current % agent.lines.length]];
        lineIndex.current++;
        return next.length > 6 ? next.slice(-6) : next;
      });
    }, 600 + Math.random() * 800);
    return () => clearInterval(timer);
  }, [isActive, agent.lines]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const cols = total <= 2 ? 1 : total <= 4 ? 2 : total <= 6 ? 3 : 4;
  const widthPercent = 100 / cols;
  const row = Math.floor(index / cols);
  const col = index % cols;

  return (
    <motion.div
      className="absolute p-1"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        left: `${col * widthPercent}%`,
        top: `${row * 50}%`,
        width: `${widthPercent}%`,
        height: '50%',
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="h-full border-2 bg-black/90 overflow-hidden flex flex-col"
        style={{ borderColor: agent.color + '60' }}>
        <div className="flex items-center gap-1.5 px-2 py-1 border-b"
          style={{ borderColor: agent.color + '30', background: agent.color + '15' }}>
          <div className="w-1.5 h-1.5 animate-pulse" style={{ background: agent.color }} />
          <span className="text-[6px] md:text-[8px] tracking-widest" style={{ color: agent.color + 'cc' }}>
            {agent.name}
          </span>
        </div>
        <div ref={scrollRef} className="flex-1 p-1.5 overflow-hidden">
          {lines.map((line, i) => (
            <div key={i} className="text-[5px] md:text-[7px] leading-relaxed opacity-80" style={{ color: agent.color + 'bb' }}>
              <span className="opacity-40">{'>'} </span>{line}
            </div>
          ))}
          <motion.span
            className="inline-block w-[4px] h-[6px] md:w-[5px] md:h-[8px]"
            style={{ background: agent.color }}
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function PunchAnimation() {
  const [phase, setPhase] = useState<Phase>('story');
  const [storyLines, setStoryLines] = useState<string[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyChar, setStoryChar] = useState(0);
  const [punchLines, setPunchLines] = useState<string[]>([]);
  const [punchIndex, setPunchIndex] = useState(0);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const storyScrollRef = useRef<HTMLDivElement>(null);
  const punchScrollRef = useRef<HTMLDivElement>(null);

  const resetAll = useCallback(() => {
    setPhase('story');
    setStoryLines([]);
    setStoryIndex(0);
    setStoryChar(0);
    setPunchLines([]);
    setPunchIndex(0);
    setGlitchIntensity(0);
  }, []);

  useEffect(() => {
    if (phase !== 'story') return;
    if (storyIndex >= STORY_LINES.length) {
      setTimeout(() => setPhase('split2'), 1000);
      return;
    }
    const { text, delay } = STORY_LINES[storyIndex];
    if (text === '') {
      const timer = setTimeout(() => {
        setStoryLines(prev => [...prev, '']);
        setStoryIndex(prev => prev + 1);
        setStoryChar(0);
      }, delay);
      return () => clearTimeout(timer);
    }
    if (storyChar < text.length) {
      const timer = setTimeout(() => setStoryChar(prev => prev + 1), 25 + Math.random() * 35);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setStoryLines(prev => [...prev, text]);
        setStoryIndex(prev => prev + 1);
        setStoryChar(0);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [phase, storyIndex, storyChar]);

  useEffect(() => {
    if (phase !== 'story') return;
    storyScrollRef.current?.scrollTo({ top: storyScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [storyLines, storyChar, phase]);

  useEffect(() => {
    if (!SPLIT_PHASES.includes(phase)) return;
    const currentIdx = SPLIT_PHASES.indexOf(phase);
    if (currentIdx < SPLIT_PHASES.length - 1) {
      const timer = setTimeout(() => setPhase(SPLIT_PHASES[currentIdx + 1]), 3500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setPhase('merge'), 5000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'merge') return;
    const timer = setTimeout(() => setPhase('punch'), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'punch') return;
    if (punchIndex >= PUNCH_LINES.length) {
      setTimeout(() => setPhase('overload'), 1500);
      return;
    }
    const timer = setTimeout(() => {
      setPunchLines(prev => [...prev, PUNCH_LINES[punchIndex]]);
      setPunchIndex(prev => prev + 1);
    }, 150 + Math.random() * 200);
    return () => clearTimeout(timer);
  }, [phase, punchIndex]);

  useEffect(() => {
    if (phase !== 'punch') return;
    punchScrollRef.current?.scrollTo({ top: punchScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [punchLines, phase]);

  useEffect(() => {
    if (phase !== 'overload') return;
    let intensity = 0;
    const timer = setInterval(() => {
      intensity += 0.15;
      setGlitchIntensity(Math.min(intensity, 1));
      if (intensity >= 1) {
        clearInterval(timer);
        setTimeout(() => setPhase('reset'), 2000);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'reset') return;
    const timer = setTimeout(resetAll, 5000);
    return () => clearTimeout(timer);
  }, [phase, resetAll]);

  const activeAgents = SPLIT_PHASES.includes(phase) ? AGENTS.slice(0, getAgentCount(phase)) : [];

  const getCurrentStoryText = () => {
    if (storyIndex >= STORY_LINES.length) return '';
    const { text } = STORY_LINES[storyIndex];
    if (text === '') return '';
    return text.slice(0, storyChar);
  };

  return (
    <div className="fixed inset-0 bg-[#050510] overflow-hidden"
      style={{
        fontFamily: "'Press Start 2P', monospace",
        filter: phase === 'overload' ? `hue-rotate(${glitchIntensity * 180}deg) saturate(${1 + glitchIntensity * 3})` : 'none',
      }}>

      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {phase === 'overload' && (
        <>
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            animate={{
              background: [
                'rgba(255,0,0,0)',
                `rgba(255,0,0,${glitchIntensity * 0.15})`,
                'rgba(255,0,0,0)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 0.15 }}
          />
          {[...Array(Math.floor(glitchIntensity * 8))].map((_, i) => (
            <motion.div
              key={`glitch-${i}`}
              className="absolute left-0 right-0 pointer-events-none z-40"
              style={{
                top: `${Math.random() * 100}%`,
                height: `${2 + Math.random() * 6}px`,
                background: `rgba(${Math.random() > 0.5 ? '255,0,0' : '0,255,100'},${0.1 + glitchIntensity * 0.3})`,
                transform: `translateX(${(Math.random() - 0.5) * glitchIntensity * 40}px)`,
              }}
              animate={{
                opacity: [0, 1, 0],
                x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20],
              }}
              transition={{ repeat: Infinity, duration: 0.1 + Math.random() * 0.2 }}
            />
          ))}
        </>
      )}

      <AnimatePresence mode="wait">
        {phase === 'story' && (
          <motion.div
            key="story"
            className="absolute inset-0 flex items-center justify-center p-4"
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative w-full max-w-2xl">
              <motion.div
                className="absolute -left-2 md:left-6 bottom-2 md:bottom-6 z-20"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.4, ease: 'easeInOut' }}
              >
                <img
                  src={fighterMonkey}
                  alt="Monkey"
                  className="w-14 h-14 md:w-20 md:h-20 pixel-art-rendering drop-shadow-[0_0_15px_rgba(255,200,0,0.3)]"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </motion.div>

              <motion.div
                className="absolute -right-2 md:right-6 bottom-2 md:bottom-6 z-20"
                animate={{ y: [0, -3, 0], rotate: [2, -2, 2] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              >
                <img
                  src={crabClaw}
                  alt="Crab"
                  className="w-10 h-10 md:w-16 md:h-16 pixel-art-rendering drop-shadow-[0_0_12px_rgba(255,100,0,0.3)]"
                />
              </motion.div>

              <div className="border-4 border-yellow-500/40 bg-black/90 overflow-hidden"
                style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.6), 0 0 60px rgba(255,200,0,0.05)' }}>
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/15 border-b-4 border-yellow-500/30">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-red-500 border border-red-700" />
                    <div className="w-2.5 h-2.5 bg-yellow-500 border border-yellow-700" />
                    <div className="w-2.5 h-2.5 bg-green-500 border border-green-700" />
                  </div>
                  <span className="text-[7px] md:text-[9px] text-yellow-400/70 tracking-widest ml-2">our_story.exe</span>
                  <motion.div
                    className="ml-auto w-2 h-2 bg-green-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                </div>
                <div ref={storyScrollRef} className="p-4 md:p-6 h-[350px] md:h-[420px] overflow-y-auto custom-scrollbar">
                  <div className="text-[7px] md:text-[9px] text-yellow-500/30 mb-3 tracking-wider">
                    {'>'} claude@clawpunch ~
                  </div>
                  {storyLines.map((line, i) => (
                    <div key={i} className="mb-0.5">
                      {line === '' ? (
                        <div className="h-3" />
                      ) : (
                        <div className="flex gap-2 items-baseline">
                          <span className="text-yellow-500/20 text-[7px]">$</span>
                          <span className="text-[7px] md:text-[9px] text-white/65 tracking-wide leading-relaxed">{line}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {storyIndex < STORY_LINES.length && STORY_LINES[storyIndex].text !== '' && (
                    <div className="flex gap-2 items-baseline">
                      <span className="text-yellow-400/30 text-[7px]">$</span>
                      <span className="text-[7px] md:text-[9px] text-white/85 tracking-wide">
                        {getCurrentStoryText()}
                        <motion.span
                          className="inline-block w-[5px] h-[9px] bg-yellow-400 ml-[1px] align-middle"
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.4 }}
                        />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {SPLIT_PHASES.includes(phase) && (
          <motion.div
            key="agents"
            className="absolute inset-0 p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative w-full h-full">
              {activeAgents.map((agent, i) => (
                <MiniTerminal
                  key={agent.id}
                  agent={agent}
                  index={i}
                  total={activeAgents.length}
                  isActive={true}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'merge' && (
          <motion.div
            key="merge"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.id}
                className="absolute w-24 h-16 border bg-black/80 flex items-center justify-center"
                style={{ borderColor: agent.color + '60' }}
                initial={{
                  x: ((i % 4) - 1.5) * 200,
                  y: (Math.floor(i / 4) - 0.5) * 200,
                  opacity: 1,
                  scale: 0.8,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              >
                <span className="text-[5px]" style={{ color: agent.color }}>{agent.name}</span>
              </motion.div>
            ))}
            <motion.div
              className="absolute text-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6, type: 'spring' }}
            >
              <div className="text-xl md:text-3xl text-yellow-400 tracking-[0.4em] drop-shadow-[0_0_30px_rgba(255,200,0,0.5)]"
                style={{ fontFamily: "'Press Start 2P', monospace" }}>
                PUNCH
              </div>
            </motion.div>
          </motion.div>
        )}

        {(phase === 'punch' || phase === 'overload') && (
          <motion.div
            key="punch"
            className="absolute inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="relative w-full max-w-2xl">
              <motion.div
                className="absolute -left-4 md:left-4 bottom-2 z-20"
                animate={{
                  y: [0, -15, 0],
                  rotate: [-3, 3, -3],
                  scale: [1, 1.05, 1],
                }}
                transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
              >
                <img
                  src={monkeyRidingCrab}
                  alt="Punch"
                  className="w-16 h-16 md:w-24 md:h-24 pixel-art-rendering"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(255,200,0,0.5))' }}
                />
              </motion.div>

              <motion.div
                className="border-4 bg-black/95 overflow-hidden"
                style={{
                  boxShadow: phase === 'overload'
                    ? `0 0 ${40 + glitchIntensity * 60}px rgba(255,50,0,${0.3 + glitchIntensity * 0.4})`
                    : '8px 8px 0px rgba(0,0,0,0.6), 0 0 40px rgba(255,200,0,0.1)',
                  borderColor: phase === 'overload'
                    ? `rgba(255,${Math.floor(50 + (1 - glitchIntensity) * 150)},0,0.8)`
                    : 'rgba(234,179,8,0.5)',
                }}
                animate={phase === 'overload' ? {
                  x: [0, -glitchIntensity * 4, glitchIntensity * 3, -glitchIntensity * 2, 0],
                  y: [0, glitchIntensity * 2, -glitchIntensity * 3, glitchIntensity * 1, 0],
                } : {}}
                transition={{ repeat: Infinity, duration: 0.1 }}
              >
                <div className="flex items-center gap-2 px-4 py-2 border-b-4"
                  style={{
                    borderColor: phase === 'overload' ? `rgba(255,50,0,0.4)` : 'rgba(234,179,8,0.3)',
                    background: phase === 'overload' ? `rgba(255,50,0,0.15)` : 'rgba(234,179,8,0.15)',
                  }}>
                  <div className="flex gap-1.5">
                    <motion.div className="w-2.5 h-2.5 bg-red-500 border border-red-700"
                      animate={phase === 'overload' ? { opacity: [1, 0, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.2 }}
                    />
                    <div className="w-2.5 h-2.5 bg-yellow-500 border border-yellow-700" />
                    <div className="w-2.5 h-2.5 bg-green-500 border border-green-700" />
                  </div>
                  <span className="text-[7px] md:text-[9px] tracking-widest ml-2"
                    style={{ color: phase === 'overload' ? `rgba(255,${Math.floor(100 * (1 - glitchIntensity))},0,0.9)` : 'rgba(234,179,8,0.7)' }}>
                    punch.exe
                  </span>
                  <motion.div
                    className="ml-auto w-2 h-2"
                    style={{ background: phase === 'overload' ? '#ef4444' : '#22c55e' }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: phase === 'overload' ? 0.15 : 0.8 }}
                  />
                </div>

                <div ref={punchScrollRef} className="p-4 md:p-6 h-[300px] md:h-[360px] overflow-y-auto custom-scrollbar">
                  {punchLines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.1 }}
                      className="mb-0.5"
                    >
                      {line === '' ? (
                        <div className="h-2" />
                      ) : (
                        <div className="flex gap-2 items-baseline">
                          <span className="text-yellow-500/30 text-[7px]">$</span>
                          <span className={`text-[7px] md:text-[9px] tracking-wide ${
                            line.includes('ONLINE') || line.includes('OPERATIONAL') || line.includes('FULLY ONLINE')
                              ? 'text-green-400'
                              : line.includes('SWARM') ? 'text-green-400/80'
                              : line.includes('WALLET') ? 'text-yellow-400/80'
                              : line.includes('ORACLE') ? 'text-purple-400/80'
                              : line.includes('TRENDS') || line.includes('ALPHA') ? 'text-orange-400/80'
                              : line.includes('VAULT') ? 'text-cyan-400/80'
                              : line.includes('SECURITY') ? 'text-red-400/80'
                              : line.includes('REPO') ? 'text-slate-400/80'
                              : line.includes('CANNON') ? 'text-amber-400/80'
                              : line.includes('punch') ? 'text-yellow-300'
                              : 'text-white/70'
                          }`}>
                            {line}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <motion.span
                    className="inline-block w-[5px] h-[9px] bg-yellow-400"
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: phase === 'overload' ? 0.1 : 0.4 }}
                  />
                </div>
              </motion.div>

              {phase === 'overload' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: glitchIntensity > 0.7 ? 1 : 0 }}
                >
                  <motion.div
                    className="text-center"
                    animate={{
                      scale: [1, 1.1, 0.95, 1.05, 1],
                      opacity: [0.8, 1, 0.6, 1, 0.8],
                    }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                  >
                    <div className="text-red-500 text-[10px] md:text-sm tracking-[0.3em] bg-black/80 px-6 py-3 border-2 border-red-500/60"
                      style={{ textShadow: '0 0 20px rgba(255,0,0,0.8)' }}>
                      SYSTEM OVERLOAD
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'reset' && (
          <motion.div
            key="reset"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="text-center"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <img
                src={monkeyRidingCrab}
                alt="Punch"
                className="w-20 h-20 md:w-28 md:h-28 pixel-art-rendering mx-auto mb-4"
                style={{ filter: 'drop-shadow(0 0 20px rgba(255,200,0,0.3))' }}
              />
              <div className="text-[8px] md:text-[10px] text-yellow-500/40 tracking-[0.3em]">
                rebooting...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234,179,8,0.2); }
      `}</style>
    </div>
  );
}
