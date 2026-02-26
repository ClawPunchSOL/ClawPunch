import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import fighterMonkey from '@/assets/images/fighter-monkey.png';
import crabClaw from '@/assets/images/crab-claw.png';
import celebrationPortrait from '@/assets/images/celebration-portrait.png';
import monkeyRidingCrab from '@/assets/images/monkey-riding-crab.png';

const TYPING_LINES = [
  'alright let me find this hackathon page...',
  'okay here we go. application form.',
  'project name... ClawPunch',
  'what does it do... 8 AI agents on Solana',
  'scanning tokens, launching coins, staking yields',
  'all powered by Claude',
  'wallet signing through Phantom, zero custody',
  'built the whole thing in like two weeks',
  'team? just me and the crab honestly',
  'submitting...',
];

const SUBMIT_TEXT = '>> APPLICATION SENT';
const ACCEPTED_TEXT = 'YOU\'RE IN. WELCOME TO THE HACKATHON.';

export default function HackathonAnimation() {
  const [phase, setPhase] = useState<'intro' | 'typing' | 'submitting' | 'accepted' | 'celebrate'>('intro');
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [submitText, setSubmitText] = useState('');
  const [acceptedText, setAcceptedText] = useState('');

  useEffect(() => {
    const introTimer = setTimeout(() => setPhase('typing'), 2000);
    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'typing') return;
    if (currentLine >= TYPING_LINES.length) {
      setTimeout(() => setPhase('submitting'), 800);
      return;
    }

    const fullText = TYPING_LINES[currentLine];
    if (currentChar < fullText.length) {
      const timer = setTimeout(() => {
        setCurrentChar(prev => prev + 1);
      }, 30 + Math.random() * 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setTypedLines(prev => [...prev, fullText]);
        setCurrentLine(prev => prev + 1);
        setCurrentChar(0);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, currentLine, currentChar]);

  useEffect(() => {
    if (phase !== 'submitting') return;
    if (submitText.length < SUBMIT_TEXT.length) {
      const timer = setTimeout(() => {
        setSubmitText(SUBMIT_TEXT.slice(0, submitText.length + 1));
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setPhase('accepted'), 1500);
    }
  }, [phase, submitText]);

  useEffect(() => {
    if (phase !== 'accepted') return;
    if (acceptedText.length < ACCEPTED_TEXT.length) {
      const timer = setTimeout(() => {
        setAcceptedText(ACCEPTED_TEXT.slice(0, acceptedText.length + 1));
      }, 80);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setPhase('celebrate'), 1000);
    }
  }, [phase, acceptedText]);

  useEffect(() => {
    if (phase !== 'celebrate') return;
    const timer = setTimeout(() => {
      setPhase('intro');
      setCurrentLine(0);
      setCurrentChar(0);
      setTypedLines([]);
      setSubmitText('');
      setAcceptedText('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [phase]);

  const getCurrentTypingText = () => {
    if (currentLine >= TYPING_LINES.length) return '';
    return TYPING_LINES[currentLine].slice(0, currentChar);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a12] overflow-hidden flex items-center justify-center"
      style={{ fontFamily: "'Press Start 2P', monospace" }}>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(255,200,0,0.04) 0%, transparent 60%)',
      }} />

      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-lg select-none"
          initial={{ y: -20, x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), opacity: 0 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 40 : 900,
            opacity: [0, 0.15, 0.15, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: 'linear',
          }}
        >
          🍌
        </motion.div>
      ))}

      <div className="relative w-full max-w-3xl mx-auto px-4">

        <motion.div
          className="absolute -left-4 md:left-4 bottom-0 md:bottom-4 z-20"
          animate={
            phase === 'celebrate'
              ? { y: [0, -30, 0], rotate: [-5, 5, -5], scale: [1, 1.1, 1] }
              : phase === 'typing' || phase === 'submitting'
              ? { y: [0, -3, 0] }
              : { y: [0, -8, 0] }
          }
          transition={{
            repeat: Infinity,
            duration: phase === 'celebrate' ? 0.6 : phase === 'typing' ? 0.3 : 1.5,
            ease: 'easeInOut',
          }}
        >
          <img
            src={phase === 'celebrate' ? monkeyRidingCrab : fighterMonkey}
            alt="Monkey"
            className="w-20 h-20 md:w-28 md:h-28 pixel-art-rendering drop-shadow-[0_0_20px_rgba(255,200,0,0.3)]"
            style={phase !== 'celebrate' ? { transform: 'scaleX(-1)' } : {}}
          />
          {(phase === 'typing' || phase === 'submitting') && (
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.2 }}
            >
              <span className="text-[8px] text-yellow-400">⌨️</span>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {phase === 'celebrate' && (
            <motion.div
              className="absolute -right-4 md:right-4 bottom-0 md:bottom-4 z-20"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1, y: [0, -20, 0], rotate: [5, -5, 5] }}
              transition={{
                x: { duration: 0.5 },
                opacity: { duration: 0.3 },
                y: { repeat: Infinity, duration: 0.7, ease: 'easeInOut' },
                rotate: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' },
              }}
            >
              <img
                src={crabClaw}
                alt="Crab"
                className="w-16 h-16 md:w-24 md:h-24 pixel-art-rendering drop-shadow-[0_0_20px_rgba(255,100,0,0.4)]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="relative border-4 border-yellow-500/60 bg-black/80 backdrop-blur-sm overflow-hidden"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.6), 0 0 40px rgba(255,200,0,0.1)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border-b-4 border-yellow-500/40">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 bg-red-500 border border-red-700" />
              <div className="w-3 h-3 bg-yellow-500 border border-yellow-700" />
              <div className="w-3 h-3 bg-green-500 border border-green-700" />
            </div>
            <span className="text-[8px] md:text-[10px] text-yellow-400/80 tracking-widest ml-2">
              hackathon_entry.exe
            </span>
            <motion.div
              className="ml-auto w-2 h-2 bg-green-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </div>

          <div className="p-4 md:p-6 min-h-[280px] md:min-h-[320px] flex flex-col">

            <AnimatePresence>
              {phase === 'intro' && (
                <motion.div
                  className="flex-1 flex items-center justify-center"
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="text-center"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <div className="text-[10px] md:text-xs text-yellow-400 tracking-widest mb-2">INITIALIZING</div>
                    <div className="flex gap-1 justify-center">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-yellow-400"
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {(phase === 'typing' || phase === 'submitting' || phase === 'accepted' || phase === 'celebrate') && (
              <div className="flex-1 flex flex-col gap-1">
                <div className="text-[8px] md:text-[10px] text-yellow-500/40 mb-3 tracking-wider">
                  {'>'} claude@clawpunch ~
                </div>

                {typedLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2 items-baseline"
                  >
                    <span className="text-yellow-500/30 text-[8px]">$</span>
                    <span className="text-[9px] md:text-[11px] text-white/70 tracking-wide">{line}</span>
                  </motion.div>
                ))}

                {phase === 'typing' && currentLine < TYPING_LINES.length && (
                  <div className="flex gap-2 items-baseline">
                    <span className="text-yellow-400/50 text-[8px]">$</span>
                    <span className="text-[9px] md:text-[11px] text-white/90 tracking-wide">
                      {getCurrentTypingText()}
                      <motion.span
                        className="inline-block w-[7px] h-[12px] bg-yellow-400 ml-[1px] align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                      />
                    </span>
                  </div>
                )}

                {(phase === 'submitting' || phase === 'accepted' || phase === 'celebrate') && (
                  <motion.div
                    className="mt-4 pt-3 border-t border-yellow-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-[9px] md:text-[11px] text-yellow-400 tracking-wide">
                      {submitText}
                      {phase === 'submitting' && submitText.length === SUBMIT_TEXT.length && (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ repeat: Infinity, duration: 0.4 }}
                        >
                          {' '}■■■
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                )}

                {(phase === 'accepted' || phase === 'celebrate') && (
                  <motion.div
                    className="mt-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <motion.div
                      className="inline-block bg-green-500/20 border-2 border-green-400/60 px-4 py-2"
                      animate={phase === 'celebrate' ? {
                        borderColor: ['rgba(74,222,128,0.6)', 'rgba(250,204,21,0.8)', 'rgba(74,222,128,0.6)'],
                        boxShadow: ['0 0 10px rgba(74,222,128,0.2)', '0 0 30px rgba(250,204,21,0.4)', '0 0 10px rgba(74,222,128,0.2)'],
                      } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <div className="text-[10px] md:text-sm text-green-400 tracking-widest font-bold">
                        {acceptedText}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {phase === 'celebrate' && (
            <>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute text-sm select-none pointer-events-none"
                  initial={{
                    x: '50%',
                    y: '50%',
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100 - 50}%`,
                    y: `${Math.random() * -200 - 50}%`,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0.5],
                    rotate: [0, Math.random() * 720 - 360],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2,
                  }}
                >
                  {['🍌', '🎉', '⭐', '🔥', '🦀', '🐒'][Math.floor(Math.random() * 6)]}
                </motion.div>
              ))}

              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full"
                initial={{ y: 0, opacity: 0, scale: 0 }}
                animate={{ y: -80, opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              >
                <motion.div
                  className="text-center bg-gradient-to-r from-yellow-500/20 via-amber-500/30 to-yellow-500/20 border-2 border-yellow-400/50 px-6 py-3"
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: ['0 0 20px rgba(255,200,0,0.2)', '0 0 40px rgba(255,200,0,0.4)', '0 0 20px rgba(255,200,0,0.2)'],
                  }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <div className="text-[10px] md:text-xs text-yellow-400 tracking-[0.3em]">WE'RE IN 🍌🦀</div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
