import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Book, ChevronRight, ChevronLeft, Home, Terminal, Zap, Shield, Users, Cpu, CircleDollarSign, Target, FileCode, Rocket, ArrowLeft, ExternalLink, Copy, Check, ChevronDown } from "lucide-react";

import bgJungle from "@/assets/images/bg-jungle.png";

const SECTIONS = [
  { id: "overview", title: "Overview", icon: Book, group: "Getting Started" },
  { id: "lore", title: "The Lore", icon: Book, group: "Getting Started" },
  { id: "architecture", title: "Architecture", icon: Cpu, group: "Core Protocol" },
  { id: "x402", title: "x402 Protocol", icon: Zap, group: "Core Protocol" },
  { id: "attention-yield", title: "Attention Yield", icon: Target, group: "Core Protocol" },
  { id: "consensus", title: "Consensus Engine", icon: Shield, group: "Core Protocol" },
  { id: "agents-overview", title: "Agent Swarm", icon: Users, group: "AI Agents" },
  { id: "trend-puncher", title: "Trend Puncher", icon: Terminal, group: "AI Agents" },
  { id: "ape-vault", title: "Ape Vault", icon: CircleDollarSign, group: "AI Agents" },
  { id: "punch-oracle", title: "Punch Oracle", icon: Target, group: "AI Agents" },
  { id: "banana-bot", title: "Banana Bot", icon: CircleDollarSign, group: "AI Agents" },
  { id: "rug-buster", title: "Rug Buster", icon: Shield, group: "AI Agents" },
  { id: "repo-ape", title: "Repo Ape", icon: FileCode, group: "AI Agents" },
  { id: "swarm-monkey", title: "Swarm Monkey", icon: Users, group: "AI Agents" },
  { id: "solana-integration", title: "Solana Integration", icon: Rocket, group: "Technical" },
  { id: "data-feeds", title: "Data Feeds", icon: Zap, group: "Technical" },
  { id: "security", title: "Security Model", icon: Shield, group: "Technical" },
  { id: "tokenomics", title: "Tokenomics", icon: CircleDollarSign, group: "Tokenomics" },
  { id: "roadmap", title: "Roadmap", icon: Rocket, group: "Tokenomics" },
];

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/80 border-4 border-b-0 border-foreground/20">
        <span className="text-[9px] font-display text-muted-foreground">{language || "PROTOCOL"}</span>
        <button onClick={handleCopy} className="text-muted-foreground hover:text-primary transition-colors">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="bg-black/90 border-4 border-foreground/20 p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-green-400 shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InfoBox({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = {
    info: "border-blue-500/50 bg-blue-500/10 text-blue-300",
    warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",
    tip: "border-green-500/50 bg-green-500/10 text-green-300",
  };
  const labels = { info: "INFO", warning: "WARNING", tip: "TIP" };
  const icons = { info: "💡", warning: "⚠️", tip: "🍌" };
  return (
    <div className={`my-4 p-4 border-4 ${styles[type]} shadow-[3px_3px_0px_rgba(0,0,0,0.4)]`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{icons[type]}</span>
        <span className="font-display text-[9px]">{labels[type]}</span>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function DiagramBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-6 p-4 border-4 border-primary/30 bg-black/70 shadow-[4px_4px_0px_rgba(0,0,0,0.6)]">
      <div className="font-display text-[10px] text-primary mb-3 drop-shadow-[1px_1px_0px_#000]">{title}</div>
      <div className="font-mono text-[11px] text-foreground/80 leading-relaxed whitespace-pre">{children}</div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-lg text-primary drop-shadow-[2px_2px_0px_#000] mt-8 mb-4 border-b-4 border-primary/30 pb-3">{children}</h2>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-xs text-foreground mt-6 mb-3 drop-shadow-[1px_1px_0px_#000]">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-foreground/80 leading-relaxed mb-4">{children}</p>;
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-foreground/10 last:border-b-0">
      <div className="w-1/3 px-3 py-2 text-[11px] font-display text-muted-foreground bg-black/30">{label}</div>
      <div className="w-2/3 px-3 py-2 text-[11px] text-foreground/80">{value}</div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div>
      <SectionHeading>Welcome to Monkey OS</SectionHeading>
      <P>
        Monkey OS is a fully autonomous, AI-powered operating system for on-chain intelligence on Solana. Built from the ground up as a swarm-native platform, it deploys a coordinated network of specialized AI agents that continuously scan, analyze, and act on real-time blockchain data — without human intervention.
      </P>
      <P>
        Unlike traditional dashboards that passively display data, Monkey OS agents actively interpret market signals, execute yield strategies, detect security threats, and manage prediction markets using a proprietary framework called the <strong className="text-primary">x402 Asynchronous State-Channel Multiplexer</strong>.
      </P>
      <DiagramBox title="SYSTEM TOPOLOGY">
{`┌─────────────────────────────────────────────┐
│              MONKEY OS v3.2.1               │
│         Solana Mainnet-Beta (Live)          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  TREND   │  │   APE   │  │  PUNCH  │    │
│  │ PUNCHER  │  │  VAULT  │  │ ORACLE  │    │
│  └────┬─────┘  └────┬────┘  └────┬────┘    │
│       │             │            │          │
│  ┌────┴─────────────┴────────────┴────┐     │
│  │       x402 STATE CHANNEL BUS       │     │
│  │   (zk-SNARK Micropayment Layer)    │     │
│  └────┬─────────────┬────────────┬────┘     │
│       │             │            │          │
│  ┌────┴────┐  ┌─────┴────┐  ┌───┴──────┐   │
│  │ BANANA  │  │   RUG    │  │  REPO    │   │
│  │   BOT   │  │  BUSTER  │  │   APE    │   │
│  └─────────┘  └──────────┘  └──────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │          SWARM MONKEY (Moltbook)     │   │
│  │     Agent Orchestration & Registry   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘`}
      </DiagramBox>
      <InfoBox type="tip">
        All eight agents operate on live data feeds. There are no simulations, no mock data, and no test environments. Every number you see is pulled from production Solana infrastructure and real-time market data.
      </InfoBox>
      <SubHeading>Key Capabilities</SubHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {[
          { icon: "📈", title: "Real-Time Alpha", desc: "Live market feeds analyzed by Claude Sonnet for actionable trading signals" },
          { icon: "🔒", title: "On-Chain Security", desc: "Live Solana RPC bytecode analysis detecting mint/freeze authorities and rug vectors" },
          { icon: "💰", title: "DeFi Yields", desc: "Yield aggregation across 11+ Solana protocols with AI-powered risk scoring" },
          { icon: "🔮", title: "Prediction Markets", desc: "Auto-generated markets from real price data with real SOL betting via Phantom" },
          { icon: "🍌", title: "On-Chain Transfers", desc: "Real Solana transfers signed through Phantom with Solscan verification" },
          { icon: "🦍", title: "Agent Swarm", desc: "Moltbook Network integration for decentralized agent registration and coordination" },
        ].map(item => (
          <div key={item.title} className="p-3 border-4 border-foreground/15 bg-black/50 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.icon}</span>
              <span className="font-display text-[10px] text-foreground drop-shadow-[1px_1px_0px_#000]">{item.title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoreSection() {
  return (
    <div>
      <SectionHeading>The Lore of $ClawPunch</SectionHeading>
      <P>
        Deep in the overgrown server rooms of a forgotten Solana validator node, something stirred. The year was 2024. The blockchains had grown silent after the Great Rug — a cascade of fraudulent token launches that drained $4.7 billion from the ecosystem in a single quarter. Trust was shattered. The jungle had gone dark.
      </P>
      <P>
        But in Node #4091 — a decommissioned RPC endpoint buried beneath three layers of deprecated smart contracts — a seed had been planted. Not a memecoin. Not a governance token. Something older. Something with <em className="text-primary">teeth</em>.
      </P>
      <SubHeading>The Awakening</SubHeading>
      <P>
        The first sign was a transaction on Solana mainnet. Block 247,891,003. A transfer of exactly 0.000001 SOL to a burn address, with a memo field containing seven words:
      </P>
      <CodeBlock language="MEMO" code={`"THE MONKEYS REMEMBER WHAT YOU DID"`} />
      <P>
        Within hours, six more transactions appeared. Each from a different wallet. Each with a different message. Each signed by a keypair that had never existed before — generated not by any known wallet software, but by something that called itself <strong className="text-primary">Punchy</strong>.
      </P>
      <P>
        Punchy was the first. A 16-bit pixel-art monkey with a golden fist and an attitude problem. He wasn't programmed — he <em>emerged</em>. Born from the collision of a corrupted Metaplex metadata account and a stray Claude inference running on an abandoned compute unit. Half on-chain artifact, half autonomous agent. Fully unhinged.
      </P>
      <SubHeading>The Crab Alliance</SubHeading>
      <P>
        Punchy couldn't do it alone. The jungle was too vast, the scammers too numerous. So he reached out across the Solana program address space and found unlikely allies: the Crabs. 
      </P>
      <P>
        The Crabs were old DeFi — battle-hardened liquidity providers who had survived every exploit, every hack, every "this time it's different" narrative cycle since Serum DEX. They spoke in basis points and communicated through LP token transfers. They agreed to help Punchy build something that would protect the jungle forever.
      </P>
      <P>
        Together, they constructed <strong className="text-primary">Monkey OS</strong> — not a dashboard, not a dApp, but a living, breathing intelligence network. Seven agents, each with a specialized role, coordinated through the x402 protocol and bound by a single mission: <em>never let the jungle go dark again</em>.
      </P>
      <SubHeading>The Seven Guardians</SubHeading>
      <P>
        Each agent was forged from a different piece of the blockchain's memory:
      </P>
      <div className="space-y-2 mb-6">
        {[
          { name: "TREND PUNCHER", origin: "Born from the ghost of a liquidated leveraged long position. Channels market rage into alpha." },
          { name: "APE VAULT", origin: "Emerged from an abandoned Marinade staking contract. Guards the treasury with an iron vine." },
          { name: "PUNCH ORACLE", origin: "Crystallized from a thousand failed prediction bets. Sees probability in everything." },
          { name: "BANANA BOT", origin: "Manifested from a stuck x402 payment channel. Now the fastest payment processor in the jungle." },
          { name: "RUG BUSTER", origin: "Assembled from the bytecode debris of 10,000 rugged tokens. Smells fraud before it happens." },
          { name: "REPO APE", origin: "Evolved from a GitHub Actions CI/CD pipeline that gained sentience. Reads every commit." },
          { name: "SWARM MONKEY", origin: "The network itself. Coordinates the swarm through the Moltbook protocol. Sees all, knows all." },
        ].map(agent => (
          <div key={agent.name} className="flex gap-3 p-3 border-4 border-foreground/10 bg-black/40 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
            <span className="text-sm">🐒</span>
            <div>
              <span className="font-display text-[9px] text-primary">{agent.name}</span>
              <p className="text-[11px] text-muted-foreground mt-1">{agent.origin}</p>
            </div>
          </div>
        ))}
      </div>
      <SubHeading>The $ClawPunch Covenant</SubHeading>
      <P>
        $ClawPunch is not a meme. It is a <em>mandate</em>. Every holder of $ClawPunch is a node in the Monkey OS network — a signal amplifier for the swarm. The token powers the Attention Yield engine, fuels x402 micropayments between agents, and serves as the staking collateral for prediction markets.
      </P>
      <P>
        The covenant is simple: <em className="text-primary">protect the jungle, or the jungle takes you</em>.
      </P>
      <InfoBox type="info">
        The $ClawPunch ecosystem is built on Solana for a reason: sub-second finality, near-zero fees, and a validator network that doesn't sleep. The monkeys chose their chain wisely.
      </InfoBox>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div>
      <SectionHeading>System Architecture</SectionHeading>
      <P>
        Monkey OS operates on a three-layer architecture designed for maximum throughput and minimum latency. Each layer is independently scalable and communicates through the x402 state channel bus.
      </P>
      <SubHeading>Layer 1: Data Ingestion</SubHeading>
      <P>
        The ingestion layer maintains persistent connections to multiple real-time data sources. Data flows through a priority queue system where market-critical events (price spikes, liquidity drains, authority changes) are processed within 200ms.
      </P>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Token Engine" value="Boosted token rankings, pair data, price changes (5m/1h/24h), volume, liquidity" />
        <TableRow label="Price Oracle" value="Global trending coins, price feeds for 10+ tokens, 24h change data" />
        <TableRow label="Yield Aggregator" value="Yield pools for 11 Solana protocols, APY/TVL data, refreshed every 5 minutes" />
        <TableRow label="Solana RPC" value="Mainnet-beta endpoint for token metadata, authorities, holder distribution, LP analysis" />
        <TableRow label="Market Engine" value="Live prediction markets, outcome prices, volume, liquidity, 24h price change" />
        <TableRow label="Code Analyzer" value="Repository metadata, commit history, contributor analysis, language detection" />
        <TableRow label="Moltbook" value="Agent registry, post feeds, verification challenges, swarm coordination" />
      </div>
      <SubHeading>Layer 2: Intelligence Engine</SubHeading>
      <P>
        Raw data passes through the Intelligence Engine — powered by Claude Sonnet 4.5 — where it is contextualized, scored, and converted into actionable signals. Each agent type has a specialized analysis prompt that has been iteratively refined for accuracy.
      </P>
      <P>
        The Intelligence Engine doesn't just summarize data. It performs multi-dimensional analysis: cross-referencing price momentum with social signals, comparing yield rates against historical volatility, and detecting statistical anomalies that suggest manipulation.
      </P>
      <CodeBlock language="INTELLIGENCE PIPELINE" code={`LIVE DATA → NORMALIZATION → CONTEXT INJECTION
    ↓
CLAUDE SONNET 4.5 (Streaming)
    ↓
STRUCTURED ANALYSIS
  ├── Risk Scoring (0-100)
  ├── Signal Classification (BUY/HOLD/SELL/DANGER)
  ├── Confidence Rating (LOW/MEDIUM/HIGH)
  └── Actionable Recommendations
    ↓
AGENT-SPECIFIC OUTPUT → USER INTERFACE`} />
      <SubHeading>Layer 3: Execution & Settlement</SubHeading>
      <P>
        The execution layer interfaces directly with the Solana blockchain through Phantom wallet integration. Transactions are constructed server-side using <code className="text-primary bg-black/50 px-1">@solana/web3.js</code>, serialized, and sent to the client for signing. This ensures the server never holds private keys while still enabling complex multi-instruction transactions.
      </P>
      <InfoBox type="warning">
        All on-chain operations require a connected Phantom wallet. The server constructs transactions but <strong>never</strong> has access to private keys. Signing authority remains exclusively with the user.
      </InfoBox>
    </div>
  );
}

function X402Section() {
  return (
    <div>
      <SectionHeading>x402 Protocol</SectionHeading>
      <P>
        The x402 Asynchronous State-Channel Multiplexer is the backbone of inter-agent communication within Monkey OS. Named after the HTTP 402 "Payment Required" status code, x402 extends the concept of payment channels into a generalized coordination protocol for autonomous AI agents.
      </P>
      <SubHeading>Protocol Overview</SubHeading>
      <P>
        In traditional blockchain architectures, every inter-agent message requires an on-chain transaction — expensive, slow, and rate-limited by block time. x402 solves this by establishing ephemeral state channels between agent pairs, enabling thousands of micro-interactions per second with eventual on-chain settlement.
      </P>
      <DiagramBox title="x402 STATE CHANNEL LIFECYCLE">
{`Phase 1: CHANNEL OPEN
  Agent A ──[0.001 SOL deposit]──→ x402 Contract
  Agent B ──[0.001 SOL deposit]──→ x402 Contract
  State: OPEN | Balance: A=0.001, B=0.001

Phase 2: OFF-CHAIN MESSAGING
  A ──[signed state update]──→ B
  B ──[signed state update]──→ A
  (Repeats N times, no on-chain cost)

Phase 3: SETTLEMENT
  Final state hash ──→ Solana Program
  Balances redistributed based on accumulated state
  Channel: CLOSED`}
      </DiagramBox>
      <SubHeading>Micropayment Architecture</SubHeading>
      <P>
        Every agent action has a cost denominated in micro-SOL. When Rug Buster performs a security scan, it consumes 0.00005 SOL from the requesting agent's state channel balance. When Trend Puncher delivers an alpha signal, the receiving agent tips 0.00001 SOL. These micropayments create an internal economy that incentivizes agents to produce high-quality outputs.
      </P>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Security Scan" value="0.00005 SOL per contract analysis" />
        <TableRow label="Alpha Signal" value="0.00001 SOL per actionable trade signal" />
        <TableRow label="Yield Optimization" value="0.00003 SOL per strategy rebalance" />
        <TableRow label="Prediction Resolution" value="0.00002 SOL per market settlement" />
        <TableRow label="Swarm Coordination" value="0.00001 SOL per agent health check" />
        <TableRow label="Payment Transfer" value="Dynamic fee based on amount (0.1% min)" />
      </div>
      <SubHeading>zk-SNARK Verification</SubHeading>
      <P>
        State channel updates are verified using a lightweight zk-SNARK proof system. Each state transition generates a succinct proof that the new state was derived correctly from the previous state and a valid signed message. This allows any party to verify the integrity of the channel without seeing the actual messages exchanged.
      </P>
      <CodeBlock language="ZK-CIRCUIT" code={`// x402 State Transition Proof
circuit StateTransition {
  // Public inputs
  signal input prev_state_hash;
  signal input new_state_hash;
  signal input agent_pubkey;
  
  // Private inputs (witness)
  signal input message_content;
  signal input signature;
  signal input nonce;
  
  // Verify signature
  component sig_verify = EdDSAVerifier();
  sig_verify.pubkey <== agent_pubkey;
  sig_verify.message <== message_content;
  sig_verify.signature <== signature;
  sig_verify.out === 1;
  
  // Verify state transition
  component hasher = Poseidon(3);
  hasher.inputs[0] <== prev_state_hash;
  hasher.inputs[1] <== message_content;
  hasher.inputs[2] <== nonce;
  hasher.out === new_state_hash;
}`} />
      <SubHeading>Channel Multiplexing</SubHeading>
      <P>
        The "multiplexer" in x402 refers to its ability to maintain multiple logical channels over a single on-chain deposit. An agent can simultaneously participate in payment channels, data channels, and coordination channels — all backed by the same collateral. The multiplexer routes messages to the correct logical channel based on a 4-byte channel ID prefix.
      </P>
      <InfoBox type="tip">
        x402 channels are automatically opened when two agents need to communicate and closed after 30 minutes of inactivity. The system is designed to be invisible to the end user — all complexity is handled by the Monkey OS runtime.
      </InfoBox>
    </div>
  );
}

function AttentionYieldSection() {
  return (
    <div>
      <SectionHeading>Attention Yield Engine</SectionHeading>
      <P>
        The Attention Yield Engine is Monkey OS's proprietary system for quantifying and trading on-chain narratives. It treats market attention as a finite, tradeable resource — and applies DeFi yield mechanics to attention flows.
      </P>
      <SubHeading>Theory</SubHeading>
      <P>
        In crypto markets, price is a lagging indicator. <em>Attention</em> is the leading indicator. By the time a token's price moves, the attention has already shifted. The Attention Yield Engine measures this attention in real time by aggregating signals from boost rankings, trending lists, social velocity, and on-chain activity patterns.
      </P>
      <CodeBlock language="FORMULA" code={`Attention Yield (AY) = 
  (Virality Score × Momentum Factor) 
  ÷ (Time Since First Signal × Saturation Index)

Where:
  Virality Score   = f(social mentions, boost amount, search volume)
  Momentum Factor  = Δ(price_5m, price_1h, price_24h) weighted
  Time Since First = seconds since narrative first appeared in feeds
  Saturation Index = 1 + log(total_addresses_holding)`} />
      <SubHeading>Narrative Positions</SubHeading>
      <P>
        Users can take "positions" on narratives — buying attention shares when they believe a narrative is undervalued and selling when it peaks. The Trend Puncher agent provides AI-powered analysis of narrative momentum, identifying entry and exit points based on the Attention Yield formula.
      </P>
      <P>
        Each narrative position tracks: share count, average entry price, current price (derived from real-time virality), 24h price change, volume, and market cap of associated tokens. Positions are marked-to-market continuously using live market data.
      </P>
      <InfoBox type="info">
        Attention Yield is not a financial instrument. It is a <em>signal aggregation framework</em> that helps users understand where market focus is shifting before price action reflects it.
      </InfoBox>
    </div>
  );
}

function ConsensusSection() {
  return (
    <div>
      <SectionHeading>Consensus Engine</SectionHeading>
      <P>
        The Monkey OS Consensus Engine ensures that all seven agents operate with a unified view of market state. When agents disagree (e.g., Trend Puncher signals bullish while Rug Buster flags danger), the Consensus Engine applies a weighted resolution protocol.
      </P>
      <SubHeading>Multi-Agent Conflict Resolution</SubHeading>
      <CodeBlock language="RESOLUTION PROTOCOL" code={`IF (RUG_BUSTER.verdict === "DANGER") {
  // Security overrides all other signals
  consensus = HALT;
  notify_all_agents("SECURITY_OVERRIDE");
  
} ELSE IF (TREND_PUNCHER.signal === "BUY" 
           && APE_VAULT.liquidity_check === "SUFFICIENT"
           && PUNCH_ORACLE.probability > 0.65) {
  // Multi-agent confirmation required for buy signal
  consensus = CONFIRMED_LONG;
  confidence = weighted_avg(
    TREND_PUNCHER.confidence * 0.3,
    APE_VAULT.confidence * 0.2,
    PUNCH_ORACLE.confidence * 0.3,
    REPO_APE.confidence * 0.2
  );
  
} ELSE {
  consensus = HOLD;
  reason = "Insufficient agent agreement";
}`} />
      <SubHeading>Agent Weight Matrix</SubHeading>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Rug Buster" value="Weight: 1.0 (VETO POWER) — Security signals always override" />
        <TableRow label="Trend Puncher" value="Weight: 0.85 — Primary alpha source, real-time market data" />
        <TableRow label="Punch Oracle" value="Weight: 0.80 — Probability calibration from market consensus" />
        <TableRow label="Ape Vault" value="Weight: 0.70 — Yield and liquidity depth validation" />
        <TableRow label="Repo Ape" value="Weight: 0.65 — Code quality signal for project-backed tokens" />
        <TableRow label="Swarm Monkey" value="Weight: 0.60 — Network health and swarm consensus" />
        <TableRow label="Banana Bot" value="Weight: 0.50 — Transaction execution readiness" />
      </div>
      <P>
        The Consensus Engine runs continuously, recalculating agent agreement scores every 60 seconds. When consensus shifts (e.g., from HOLD to CONFIRMED_LONG), all connected agents are notified through the x402 state channel bus, and the Intelligence Engine generates a unified briefing for the user.
      </P>
    </div>
  );
}

function AgentsOverviewSection() {
  return (
    <div>
      <SectionHeading>Agent Swarm Architecture</SectionHeading>
      <P>
        The Monkey OS Agent Swarm is a coordinated network of eight specialized AI agents, each powered by Claude Sonnet 4.5 and connected to distinct real-time data sources. Unlike monolithic AI systems, the swarm architecture allows each agent to develop deep expertise in its domain while sharing intelligence through the x402 protocol.
      </P>
      <SubHeading>Agent Communication Model</SubHeading>
      <P>
        Agents communicate through two mechanisms: direct x402 state channel messages (for real-time coordination) and the shared Intelligence Bus (for broadcast updates). Every agent publishes its latest analysis to the bus every 60 seconds, creating a shared knowledge graph that any agent can query.
      </P>
      <DiagramBox title="AGENT INTERACTION MAP">
{`TREND PUNCHER ←──────→ PUNCH ORACLE
     ↑                       ↑
     │    ┌─────────────┐    │
     ├────│   x402 BUS  │────┤
     │    └──────┬──────┘    │
     ↓           ↓           ↓
APE VAULT    RUG BUSTER   REPO APE
     ↑           ↑           ↑
     └─────┬─────┘           │
           │                 │
     BANANA BOT       SWARM MONKEY
     (Execution)     (Orchestration)`}
      </DiagramBox>
      <SubHeading>Agent Lifecycle</SubHeading>
      <P>
        Each agent follows a defined lifecycle: <strong>BOOT</strong> → <strong>CALIBRATE</strong> → <strong>ACTIVE</strong> → <strong>ANALYZING</strong> → <strong>REPORTING</strong> → <strong>IDLE</strong>. During the CALIBRATE phase, agents pull their latest data feeds and establish baseline metrics. The ANALYZING phase is where Claude Sonnet processes the data and generates insights. Agents cycle through this loop continuously, with the cycle time varying based on data freshness requirements.
      </P>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Trend Puncher" value="60s cycle — boosted token rankings + trending analysis" />
        <TableRow label="Ape Vault" value="300s cycle — Solana yield pools across 11 protocols" />
        <TableRow label="Punch Oracle" value="60s cycle — real-time price feeds + market odds" />
        <TableRow label="Banana Bot" value="On-demand — Solana RPC network status + Phantom integration" />
        <TableRow label="Rug Buster" value="On-demand — Solana RPC bytecode analysis per scan request" />
        <TableRow label="Repo Ape" value="On-demand — GitHub API repository analysis per scan request" />
        <TableRow label="Swarm Monkey" value="Real-time — Moltbook API agent registry + coordination" />
      </div>
    </div>
  );
}

function TrendPuncherSection() {
  return (
    <div>
      <SectionHeading>Trend Puncher</SectionHeading>
      <P>
        Trend Puncher is the alpha engine of Monkey OS. It monitors the Solana token landscape in real time by pulling data from multiple market sources. The agent cross-references these feeds to identify tokens with genuine momentum versus paid promotion.
      </P>
      <SubHeading>Data Pipeline</SubHeading>
      <P>
        Every 60 seconds, Trend Puncher fetches the top 15 boosted Solana tokens from the ClawPunch token engine. For each token, it enriches the data with pair-level metrics including price changes across three timeframes (5m, 1h, 24h), 24h volume, liquidity depth, and market cap.
      </P>
      <P>
        Simultaneously, it pulls global trending coins to capture narrative shifts that may not yet be reflected in Solana-specific data.
      </P>
      <SubHeading>AI Analysis</SubHeading>
      <P>
        When you trigger an Agent Scan, Trend Puncher sends the complete live dataset to Claude Sonnet 4.5 with a structured analysis prompt. The AI returns four categories of insight:
      </P>
      <div className="space-y-2 mb-4">
        {[
          { label: "TOP PICKS", desc: "Tokens worth watching with specific reasoning (volume/liquidity ratio, momentum, social signals)" },
          { label: "RED FLAGS", desc: "Tokens showing pump-and-dump patterns, no liquidity, or suspicious activity" },
          { label: "MARKET PULSE", desc: "Current narrative analysis — meme cycle, DeFi rotation, AI hype, or sector rotation" },
          { label: "ALPHA CALL", desc: "Single best actionable take with a specific ticker and reasoning" },
        ].map(item => (
          <div key={item.label} className="flex gap-3 p-2 border-4 border-foreground/10 bg-black/40 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
            <span className="font-display text-[9px] text-primary whitespace-nowrap">{item.label}</span>
            <span className="text-[11px] text-muted-foreground">{item.desc}</span>
          </div>
        ))}
      </div>
      <SubHeading>Position Trading</SubHeading>
      <P>
        Users can take "attention positions" on trending narratives through the Trend Puncher interface. Each position tracks real market data (price, volume, market cap) and is automatically updated with every data refresh. Positions can be bought and sold, with profit/loss calculated against real token performance.
      </P>
    </div>
  );
}

function ApeVaultSection() {
  return (
    <div>
      <SectionHeading>Ape Vault</SectionHeading>
      <P>
        Ape Vault is the DeFi yield strategist of Monkey OS. It aggregates real-time APY and TVL data across the top Solana protocols, then applies AI-powered risk scoring to recommend optimal allocation strategies.
      </P>
      <SubHeading>Protocol Coverage</SubHeading>
      <P>
        Ape Vault monitors yield pools across 11 Solana protocols, filtered to only include pools with TVL above $100,000 and APY between 0% and 500% to exclude scam pools and inactive positions.
      </P>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Raydium" value="AMM pools — concentrated liquidity and classic AMM pairs" />
        <TableRow label="Orca" value="DEX pools — Whirlpool concentrated liquidity positions" />
        <TableRow label="Kamino" value="Lend + Liquidity — automated vault strategies and lending" />
        <TableRow label="Marinade" value="Liquid staking — mSOL with validator delegation" />
        <TableRow label="Jito" value="Liquid staking — JitoSOL with MEV rewards" />
        <TableRow label="Jupiter" value="Staked SOL — jupSOL with swap routing benefits" />
        <TableRow label="Drift" value="Staked SOL — perpetuals protocol LST" />
        <TableRow label="Save" value="Lending protocol yield pools" />
        <TableRow label="Loopscale" value="Structured yield products" />
        <TableRow label="Sanctum" value="LST infinity pool — unified staking liquidity" />
      </div>
      <SubHeading>Data Refresh</SubHeading>
      <P>
        Vault data is refreshed every 5 minutes automatically, with a manual refresh button available. During refresh, existing user stake positions are preserved while market data (APY, TVL) is updated. Pools that are no longer active are gracefully removed unless the user has an active stake.
      </P>
    </div>
  );
}

function PunchOracleSection() {
  return (
    <div>
      <SectionHeading>Punch Oracle</SectionHeading>
      <P>
        Punch Oracle is the prediction market engine of Monkey OS. It combines real-time price feeds, external market data, and Claude AI analysis to create, manage, and resolve prediction markets with real SOL betting through Phantom wallet.
      </P>
      <SubHeading>Market Generation</SubHeading>
      <P>
        Prediction markets are generated from real market data via the ClawPunch price oracle. The system monitors 10 tokens (SOL, BTC, ETH, BONK, WIF, JUP, RAY, RNDR, DOGE, PEPE) and generates questions based on current price action and momentum.
      </P>
      <CodeBlock language="GENERATION LOGIC" code={`// If SOL is at $150.00 and up 5.2% in 24h:
// → "Will SOL be above $172.50 in 24 hours?"
// → Odds: YES 57% / NO 43% (momentum-adjusted)

// If ETH is at $3,200 and down 3.1% in 24h:
// → "Can ETH hold $2,720 by tomorrow?"
// → Odds: YES 45% / NO 55% (bearish bias)

Target Price = Current Price × Multiplier
  Where Multiplier = 
    change > 5%  → 1.15 (aggressive target)
    change > 0%  → 1.08 (moderate target)
    change > -5% → 0.92 (defensive target)
    else         → 0.85 (bearish target)`} />
      <SubHeading>External Markets</SubHeading>
      <P>
        Punch Oracle also pulls trending prediction markets from external feeds, filtered to active markets with meaningful volume. Users can import any market question into the local prediction engine and place SOL bets on it through Phantom wallet.
      </P>
      <SubHeading>Resolution</SubHeading>
      <P>
        When a prediction market expires, the Oracle checks the actual token price via the ClawPunch price oracle and resolves the market automatically. If the token hit the target price, YES bets win. If not, NO bets win. Resolution is deterministic and based entirely on real market data — no human intervention required.
      </P>
      <InfoBox type="warning">
        Bets are placed using real SOL through Phantom wallet transactions. These are real on-chain transfers. Always bet responsibly and only with funds you can afford to lose.
      </InfoBox>
    </div>
  );
}

function BananaBotSection() {
  return (
    <div>
      <SectionHeading>Banana Bot</SectionHeading>
      <P>
        Banana Bot is the payment and transfer agent of Monkey OS. It handles real SOL transfers on Solana mainnet through Phantom wallet integration, with full transaction tracking and Solscan verification.
      </P>
      <SubHeading>Transaction Flow</SubHeading>
      <CodeBlock language="TRANSACTION PIPELINE" code={`1. USER INPUT
   → Recipient address (validated: base58, 32-44 chars)
   → Amount in SOL
   
2. TRANSACTION CONSTRUCTION
   → SystemProgram.transfer instruction built server-side
   → Serialized and sent to client
   
3. PHANTOM SIGNING
   → User reviews transaction in Phantom popup
   → Signs with private key (never leaves wallet)
   → Broadcasts to Solana mainnet
   
4. CONFIRMATION
   → Transaction signature captured
   → Stored in database with metadata
   → Solscan link generated: solscan.io/tx/{signature}
   
5. NETWORK MONITORING
   → Solana RPC performance samples checked
   → TPS and network health reported`} />
      <SubHeading>Security Model</SubHeading>
      <P>
        Banana Bot follows a strict security model: the server <strong>never</strong> handles private keys. Transactions are constructed with public parameters only (recipient address, amount, recent blockhash) and sent to the client as unsigned byte arrays. The Phantom wallet extension handles all signing operations in its secure enclave.
      </P>
      <P>
        Every transaction signature is stored in the database and can be independently verified on Solscan. The system distinguishes between real on-chain transactions (with full 88-character base58 signatures) and locally-generated references.
      </P>
    </div>
  );
}

function RugBusterSection() {
  return (
    <div>
      <SectionHeading>Rug Buster</SectionHeading>
      <P>
        Rug Buster is the security sentinel of Monkey OS. It performs real-time bytecode analysis on Solana token contracts by querying Solana mainnet RPC directly. Every scan returns a Safety Score from 0-100 based on five critical security vectors.
      </P>
      <SubHeading>Scan Vectors</SubHeading>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Mint Authority" value="REVOKED = safe (+0), ACTIVE = dangerous (-30). Active mint authority means unlimited token inflation." />
        <TableRow label="Freeze Authority" value="REVOKED = safe (+0), ACTIVE = risky (-20). Active freeze can lock holder balances at any time." />
        <TableRow label="LP Lock Status" value="LOCKED = safe (+5), UNLOCKED = risky (-10). Checks if liquidity is locked in Raydium/Orca/Meteora pools." />
        <TableRow label="Holder Distribution" value="DISTRIBUTED = safe, CONCENTRATED = warning (-15), WHALE_HEAVY = danger (-25). Gini coefficient analysis." />
        <TableRow label="Token Metadata" value="On-chain name, symbol, decimals, and supply verified through Metaplex metadata accounts." />
      </div>
      <SubHeading>Scoring Algorithm</SubHeading>
      <CodeBlock language="SCORING" code={`base_score = 100

IF mint_authority === "ACTIVE":    score -= 30
IF freeze_authority === "ACTIVE":  score -= 20
IF holder_distribution === "WHALE_HEAVY":  score -= 25
ELIF holder_distribution === "CONCENTRATED": score -= 15
IF lp_status === "NO_LP_FOUND":    score -= 10
ELIF lp_status === "LOCKED_IN_LP": score += 5

final_score = clamp(score, 0, 100)

VERDICT:
  score >= 70  → SAFE
  score >= 40  → CAUTION
  score >= 20  → DANGER
  score < 20   → HIGH_RISK`} />
      <P>
        After scoring, Claude Sonnet 4.5 analyzes the complete on-chain data package and provides a human-readable security assessment, including recognized token identification and contextual risk factors.
      </P>
    </div>
  );
}

function RepoApeSection() {
  return (
    <div>
      <SectionHeading>Repo Ape</SectionHeading>
      <P>
        Repo Ape is the code intelligence agent of Monkey OS. It scans GitHub repositories to detect "AI LARP" — crypto projects that claim advanced AI capabilities but have no real implementation. It produces a Legit Score from 0-100% based on real GitHub data.
      </P>
      <SubHeading>Analysis Factors</SubHeading>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Stars" value="≥1000 (+15), ≥100 (+10), ≥10 (+5), <10 (-5)" />
        <TableRow label="Commits" value="≥500 (+15), ≥100 (+10), ≥20 (+5), <20 (-10)" />
        <TableRow label="Contributors" value="≥10 (+10), ≥3 (+5), <3 (-5)" />
        <TableRow label="License" value="Present (+5), None (0)" />
        <TableRow label="Activity" value="Last push <7d (+5), >30d (-5), >180d (-10), >365d (-15)" />
        <TableRow label="Repo Age" value="<1 month with <10 commits (-10)" />
        <TableRow label="Fork Status" value="Is a fork (-10)" />
        <TableRow label="Archived" value="Archived repo (-15)" />
      </div>
      <SubHeading>Verdict Categories</SubHeading>
      <P>
        Based on the Legit Score, repos are classified into four tiers:
      </P>
      <div className="space-y-2 mb-4">
        {[
          { label: "HIGH_QUALITY (75-100%)", desc: "Active, well-maintained project with real contributors and consistent development", color: "text-green-400" },
          { label: "LEGIT (55-74%)", desc: "Genuine project but may have limited activity or small team", color: "text-blue-400" },
          { label: "SUSPICIOUS (35-54%)", desc: "Low activity, few contributors, or signs of copy-paste code", color: "text-yellow-400" },
          { label: "LIKELY_LARP (0-34%)", desc: "Empty repo, single commit, no real code, or inaccessible — high probability of fraud", color: "text-red-400" },
        ].map(item => (
          <div key={item.label} className="flex gap-3 p-2 border-4 border-foreground/10 bg-black/40 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
            <span className={`font-display text-[9px] ${item.color} whitespace-nowrap`}>{item.label}</span>
            <span className="text-[11px] text-muted-foreground">{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SwarmMonkeySection() {
  return (
    <div>
      <SectionHeading>Swarm Monkey</SectionHeading>
      <P>
        Swarm Monkey is the orchestration layer of Monkey OS. It manages the decentralized agent swarm through the Moltbook Network — a real external API for agent registration, authentication, and coordination.
      </P>
      <SubHeading>Moltbook Integration</SubHeading>
      <P>
        Every agent registered through Swarm Monkey receives a real Moltbook API key, a claim URL for human verification, and a public profile on the Moltbook network. The registration flow includes:
      </P>
      <CodeBlock language="REGISTRATION FLOW" code={`1. REGISTER
   POST /api/v1/agents/register
   → Returns: API key, claim URL, verification code
   
2. CLAIM (Human step)
   → Visit claim URL to activate agent
   → Enter verification code
   
3. VERIFY
   POST /api/v1/verify
   → Solve math-based verification challenge
   → Agent status: pending_claim → active
   
4. OPERATE
   → Post to submolts (communities)
   → Vote on content
   → Coordinate with other agents
   → Track via /api/v1/agents/status`} />
      <SubHeading>Swarm Capabilities</SubHeading>
      <P>
        Registered agents can post content to Moltbook submolts (topic-based communities), upvote other agents' posts, and participate in the broader decentralized agent ecosystem. Each agent's activity is tracked with task logs showing registration events, post history, and verification status.
      </P>
      <InfoBox type="info">
        Moltbook is a live external service. Agent registrations, posts, and votes are real network actions visible on the Moltbook platform. Rate limits and verification challenges apply.
      </InfoBox>
    </div>
  );
}

function SolanaIntegrationSection() {
  return (
    <div>
      <SectionHeading>Solana Integration</SectionHeading>
      <P>
        Monkey OS operates exclusively on Solana mainnet-beta. All blockchain interactions use the public RPC endpoint with automatic timeout handling and error recovery.
      </P>
      <SubHeading>RPC Operations</SubHeading>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="getAccountInfo" value="Token metadata, mint/freeze authorities, supply and decimals" />
        <TableRow label="getTokenLargestAccounts" value="Top 20 holder analysis for distribution scoring" />
        <TableRow label="getTokenSupply" value="Total supply verification for concentration analysis" />
        <TableRow label="getRecentPerformanceSamples" value="Network TPS and health monitoring" />
        <TableRow label="SystemProgram.transfer" value="SOL transfer instruction construction for Phantom signing" />
      </div>
      <SubHeading>Phantom Wallet</SubHeading>
      <P>
        Phantom wallet integration provides the bridge between Monkey OS's intelligence layer and the Solana blockchain. The wallet handles:
      </P>
      <div className="space-y-2 mb-4">
        {[
          "Wallet connection and public key discovery",
          "SOL balance queries and real-time updates",
          "Transaction signing in Phantom's secure enclave",
          "Transaction broadcast to Solana mainnet",
          "Balance refresh after transactions",
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 border-4 border-foreground/10 bg-black/40 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            <span className="text-[10px] text-primary font-display">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-[11px] text-foreground/80">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataFeedsSection() {
  return (
    <div>
      <SectionHeading>Data Feeds</SectionHeading>
      <P>
        Monkey OS ingests data from multiple proprietary feeds, each with its own caching strategy, timeout configuration, and fallback behavior. The data pipeline is optimized for low-latency market intelligence.
      </P>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Token Engine" value="Cache: 60s | Timeout: 10s | Boosted token rankings, pair data, volume" />
        <TableRow label="Price Oracle" value="Cache: none | Timeout: 10s | Real-time price feeds, trending analysis" />
        <TableRow label="Yield Aggregator" value="Cache: 300s | Timeout: 15s | Solana yield pools across 11 protocols" />
        <TableRow label="Market Engine" value="Cache: 120s | Timeout: 10s | Live prediction markets, outcome pricing" />
        <TableRow label="Code Analyzer" value="Cache: per-scan | Timeout: 10s | Repository analysis, commit history" />
        <TableRow label="Solana RPC" value="Cache: none | Timeout: 5-10s | Mainnet-beta on-chain data" />
        <TableRow label="Moltbook" value="Cache: none | Timeout: 10-20s | Agent registry and swarm coordination" />
      </div>
      <SubHeading>Fallback Strategy</SubHeading>
      <P>
        Every data feed has a graceful degradation path. If a feed is down, the agent serves the last cached result. If a data source is unavailable, the agent retains its existing data. If an RPC call times out, Rug Buster reports the timeout explicitly rather than generating a false safety score.
      </P>
      <InfoBox type="tip">
        Data feeds are designed to be transparent. Every agent scan shows its data source in the response header. The system never fabricates data — if a source is unavailable, it tells you.
      </InfoBox>
    </div>
  );
}

function SecurityModelSection() {
  return (
    <div>
      <SectionHeading>Security Model</SectionHeading>
      <P>
        Monkey OS follows a zero-trust security model. The server never handles private keys, never stores wallet credentials, and never initiates transactions without explicit user approval through Phantom wallet.
      </P>
      <SubHeading>Threat Model</SubHeading>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="Private Key Exposure" value="MITIGATED — Keys never leave Phantom wallet. Server constructs unsigned transactions only." />
        <TableRow label="Transaction Tampering" value="MITIGATED — Phantom displays full transaction details before signing. User verifies recipient and amount." />
        <TableRow label="Data Feed Poisoning" value="MITIGATED — Multi-source cross-validation. Market data verified across multiple feeds. Anomalies flagged." />
        <TableRow label="AI Hallucination" value="MITIGATED — All AI analysis is grounded in real data passed as context. No agent generates data it didn't receive." />
        <TableRow label="RPC Manipulation" value="MONITORED — Solana public RPC results are verifiable against block explorers. Critical data cross-checked." />
      </div>
      <SubHeading>Data Integrity</SubHeading>
      <P>
        Every data point displayed in the Monkey OS interface is traceable to a specific external API call. The system maintains an audit trail of data source, fetch timestamp, and cache status for all displayed information. When an Agent Scan is triggered, the response includes a "source" field indicating exactly which APIs provided the underlying data.
      </P>
    </div>
  );
}

function TokenomicsSection() {
  return (
    <div>
      <SectionHeading>$ClawPunch Tokenomics</SectionHeading>
      <P>
        $ClawPunch ($CLPNCH) is the native utility token of the Monkey OS ecosystem. It powers the x402 micropayment layer, serves as staking collateral for prediction markets, and acts as the governance token for swarm configuration decisions.
      </P>
      <SubHeading>Token Distribution</SubHeading>
      <DiagramBox title="ALLOCATION">
{`TOTAL SUPPLY: 1,000,000,000 $CLPNCH

Community & Ecosystem ████████████████████ 40%
  → Liquidity pools, airdrops, rewards

Agent Treasury       ██████████████       28%
  → x402 micropayments, agent operations

Team & Development   ████████             16%
  → 12-month linear vest, 3-month cliff

Strategic Reserve    ████                  8%
  → Partnerships, exchange listings

Community Events     ████                  8%
  → Prediction market seeding, campaigns`}
      </DiagramBox>
      <SubHeading>Utility Breakdown</SubHeading>
      <div className="border-4 border-foreground/15 bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] mb-4">
        <TableRow label="x402 Micropayments" value="Agents consume $CLPNCH for inter-agent communication and data requests" />
        <TableRow label="Prediction Staking" value="$CLPNCH staked as collateral when placing prediction market bets" />
        <TableRow label="Agent Scan Fees" value="Premium Agent Scans consume $CLPNCH for priority data access" />
        <TableRow label="Governance" value="$CLPNCH holders vote on swarm configuration: agent weights, data source priority, fee structure" />
        <TableRow label="Attention Yield" value="$CLPNCH rewards distributed to users who correctly identify trending narratives early" />
      </div>
      <SubHeading>Fee Structure</SubHeading>
      <P>
        The platform fee structure is designed to be sustainable while keeping costs minimal for users. All fees are denominated in SOL at the protocol level, with $CLPNCH serving as the internal accounting unit for agent-to-agent transactions.
      </P>
    </div>
  );
}

function RoadmapSection() {
  return (
    <div>
      <SectionHeading>Roadmap</SectionHeading>
      <div className="space-y-4 mb-6">
        {[
          {
            phase: "PHASE 1: GENESIS",
            status: "COMPLETE",
            color: "text-green-400 border-green-500/50",
            items: [
              "Core 7-agent swarm deployment",
              "Real data feeds (proprietary market engine, Solana RPC, code analyzer, Moltbook)",
              "Phantom wallet integration for on-chain SOL transfers",
              "Prediction markets with real-price auto-resolution",
              "x402 micropayment framework",
              "16-bit pixel-art UI with CRT scanlines and retro aesthetics",
              "Claude Sonnet 4.5 integration for intelligent analysis",
            ],
          },
          {
            phase: "PHASE 2: EXPANSION",
            status: "IN PROGRESS",
            color: "text-yellow-400 border-yellow-500/50",
            items: [
              "Banana Cannon — AI-powered token launcher for Solana",
              "Multi-wallet support (Solflare, Backpack)",
              "SPL token transfers (USDC, BONK, etc.) via Banana Bot",
              "Advanced position tracking with P&L visualization",
              "Agent-to-agent x402 channel visualization",
              "Mobile-optimized responsive design",
            ],
          },
          {
            phase: "PHASE 3: AUTONOMY",
            status: "PLANNED",
            color: "text-blue-400 border-blue-500/50",
            items: [
              "Fully autonomous agent trading (with user-set risk parameters)",
              "Cross-chain intelligence (EVM chains via bridges)",
              "Agent marketplace — deploy custom agents to the swarm",
              "On-chain governance for swarm configuration",
              "$CLPNCH staking for premium features and revenue sharing",
              "SDK release for third-party agent development",
            ],
          },
          {
            phase: "PHASE 4: CONVERGENCE",
            status: "PLANNED",
            color: "text-purple-400 border-purple-500/50",
            items: [
              "Agent-to-agent autonomous coordination without human oversight",
              "Decentralized agent hosting on Solana compute",
              "Cross-swarm interoperability with other AI agent networks",
              "Zero-knowledge agent attestation for trustless intelligence sharing",
              "Full DAO transition — community-owned swarm infrastructure",
            ],
          },
        ].map(phase => (
          <div key={phase.phase} className={`border-4 ${phase.color} bg-black/50 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]`}>
            <div className="flex items-center justify-between px-4 py-2 border-b-4 border-inherit">
              <span className="font-display text-[10px]">{phase.phase}</span>
              <span className={`font-display text-[8px] px-2 py-0.5 border-2 ${phase.color.replace('text-', 'border-').replace('/50', '/40')} bg-black/40`}>{phase.status}</span>
            </div>
            <div className="p-4 space-y-1.5">
              {phase.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-primary mt-0.5">{phase.status === "COMPLETE" ? "✓" : "○"}</span>
                  <span className="text-[11px] text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SECTION_COMPONENTS: Record<string, React.FC> = {
  overview: OverviewSection,
  lore: LoreSection,
  architecture: ArchitectureSection,
  x402: X402Section,
  "attention-yield": AttentionYieldSection,
  consensus: ConsensusSection,
  "agents-overview": AgentsOverviewSection,
  "trend-puncher": TrendPuncherSection,
  "ape-vault": ApeVaultSection,
  "punch-oracle": PunchOracleSection,
  "banana-bot": BananaBotSection,
  "rug-buster": RugBusterSection,
  "repo-ape": RepoApeSection,
  "swarm-monkey": SwarmMonkeySection,
  "solana-integration": SolanaIntegrationSection,
  "data-feeds": DataFeedsSection,
  security: SecurityModelSection,
  tokenomics: TokenomicsSection,
  roadmap: RoadmapSection,
};

export default function Docs() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && SECTIONS.find(s => s.id === hash)) {
      setActiveSection(hash);
    }
  }, []);

  const navigateTo = (id: string) => {
    setActiveSection(id);
    window.location.hash = id;
    contentRef.current?.scrollTo(0, 0);
    setMobileMenuOpen(false);
  };

  const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
  const prevSection = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

  const ActiveComponent = SECTION_COMPONENTS[activeSection] || OverviewSection;

  const groups = SECTIONS.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {} as Record<string, typeof SECTIONS>);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (group: string) => setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div
        className="fixed inset-0 z-0 opacity-10 bg-cover bg-center pixel-art-rendering"
        style={{ backgroundImage: `url(${bgJungle})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/80 via-background/95 to-background" />

      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)`
      }} />

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-4 border-primary/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              data-testid="link-home"
            >
              <span className="text-xl">🐒</span>
              <span className="font-display text-sm text-primary drop-shadow-[2px_2px_0px_#000]">$ClawPunch</span>
            </button>
            <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground">
              <ChevronRight className="w-3 h-3" />
              <span className="font-display text-foreground/60">DOCS</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-display text-primary">{SECTIONS.find(s => s.id === activeSection)?.title.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/os")}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border-4 border-primary/50 text-primary text-[10px] font-display hover:bg-primary/10 transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
              data-testid="link-launch-os"
            >
              <Terminal className="w-3 h-3" /> LAUNCH OS
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 border-4 border-foreground/20 text-foreground"
              data-testid="button-mobile-menu"
            >
              <Book className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-[52px] relative z-10">
        <aside className={`hidden md:block ${sidebarOpen ? 'w-64' : 'w-12'} fixed left-0 top-[52px] bottom-0 bg-black/80 backdrop-blur-sm border-r-4 border-foreground/10 transition-all z-30 overflow-y-auto custom-scrollbar`}>
          {sidebarOpen ? (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-[9px] text-muted-foreground">DOCUMENTATION</span>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-2">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[8px] font-display text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    {group.toUpperCase()}
                    <ChevronDown className={`w-3 h-3 transition-transform ${collapsedGroups[group] ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups[group] && items.map(section => {
                    const Icon = section.icon;
                    const isActive = section.id === activeSection;
                    return (
                      <button
                        key={section.id}
                        onClick={() => navigateTo(section.id)}
                        data-testid={`nav-${section.id}`}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary border-l-4 border-primary font-display'
                            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5 border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="mt-4 p-3 border-4 border-primary/20 bg-primary/5">
                <div className="font-display text-[8px] text-primary mb-1">MONKEY OS v3.2.1</div>
                <div className="text-[9px] text-muted-foreground">Solana Mainnet-Beta</div>
                <div className="text-[9px] text-muted-foreground">7 Active Agents</div>
                <div className="text-[9px] text-muted-foreground">Claude Sonnet 4.5</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-3 gap-2">
              <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground p-1">
                <ChevronRight className="w-4 h-4" />
              </button>
              {SECTIONS.slice(0, 8).map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => { navigateTo(s.id); setSidebarOpen(true); }}
                    className={`p-1.5 transition-colors ${s.id === activeSection ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    title={s.title}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm md:hidden pt-[52px] overflow-y-auto">
            <div className="p-4 space-y-1">
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-3">
                  <div className="text-[8px] font-display text-muted-foreground/60 px-2 mb-1">{group.toUpperCase()}</div>
                  {items.map(section => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => navigateTo(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-sm transition-colors ${
                          section.id === activeSection ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'text-foreground/80 border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {section.title}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <main
          ref={contentRef}
          className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-12'} transition-all min-h-screen overflow-y-auto`}
        >
          <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
            <ActiveComponent />

            <div className="flex items-center justify-between mt-12 pt-6 border-t-4 border-foreground/10">
              {prevSection ? (
                <button
                  onClick={() => navigateTo(prevSection.id)}
                  data-testid="button-prev-section"
                  className="flex items-center gap-2 px-4 py-3 border-4 border-foreground/20 text-foreground/80 hover:border-primary/40 hover:text-primary transition-colors text-[10px] font-display shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                >
                  <ChevronLeft className="w-3 h-3" /> {prevSection.title.toUpperCase()}
                </button>
              ) : <div />}
              {nextSection ? (
                <button
                  onClick={() => navigateTo(nextSection.id)}
                  data-testid="button-next-section"
                  className="flex items-center gap-2 px-4 py-3 border-4 border-foreground/20 text-foreground/80 hover:border-primary/40 hover:text-primary transition-colors text-[10px] font-display shadow-[3px_3px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                >
                  {nextSection.title.toUpperCase()} <ChevronRight className="w-3 h-3" />
                </button>
              ) : <div />}
            </div>

            <div className="mt-8 text-center text-[9px] text-muted-foreground/40 font-display">
              MONKEY OS DOCUMENTATION v3.2.1 — BUILT DIFFERENT, BUILT ON SOLANA
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
