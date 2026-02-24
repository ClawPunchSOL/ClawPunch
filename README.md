<p align="center">
  <img src="docs/assets/clawpunch-banner.svg" alt="ClawPunch" width="800"/>
</p>

<h1 align="center">ClawPunch</h1>

<p align="center">
  <strong>Solana-Native AI Agent Swarm for Autonomous DeFi Operations</strong>
</p>

<p align="center">
  <a href="https://github.com/ClawPunchSOL/ClawPunch/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ClawPunchSOL/ClawPunch?style=flat-square" alt="License"/></a>
  <a href="https://github.com/ClawPunchSOL/ClawPunch"><img src="https://img.shields.io/badge/solana-mainnet--beta-blue?style=flat-square&logo=solana" alt="Solana"/></a>
  <a href="https://github.com/ClawPunchSOL/ClawPunch"><img src="https://img.shields.io/badge/agents-8_active-crimson?style=flat-square" alt="Agents"/></a>
  <a href="https://github.com/ClawPunchSOL/ClawPunch"><img src="https://img.shields.io/badge/AI-Claude_Sonnet_4.5-orange?style=flat-square&logo=anthropic" alt="AI Model"/></a>
  <a href="https://github.com/ClawPunchSOL/ClawPunch"><img src="https://img.shields.io/badge/data-100%25_real-green?style=flat-square" alt="Real Data"/></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="docs/ARCHITECTURE.md">Architecture</a> &middot;
  <a href="docs/API_REFERENCE.md">API Reference</a> &middot;
  <a href="docs/AGENTS.md">Agent Guide</a> &middot;
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

## Overview

ClawPunch is a Solana-native crypto utility platform powered by **8 autonomous AI agents**, each built on Claude Sonnet 4.5. Every agent is purpose-built for a specific sector of the Solana DeFi ecosystem — from yield optimization and rug-pull detection to prediction markets and token launching.

Zero demo data. Zero placeholders. Every agent pulls from **real on-chain data sources** and executes **real Solana transactions** via Phantom wallet signing.

```
┌──────────────────────────────────────────────────────────────────┐
│                        ClawPunch Protocol                        │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  AI Cortex   │  │  Agent      │  │  Solana      │             │
│  │  Claude 4.5  │  │  Swarm (8)  │  │  RPC Layer   │             │
│  │  Sonnet      │  │             │  │              │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │            Monkey OS Runtime Engine            │              │
│  │     Routing · Validation · Execution           │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │             Data Integration Layer             │              │
│  │   DeFi Llama · CoinGecko · DexScreener ·      │              │
│  │   Solana RPC · GitHub API · Pump Portal        │              │
│  └───────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

## Agent Swarm

ClawPunch deploys **8 specialized AI agents**, each with distinct capabilities and real data sources:

| Agent | Role | Data Source | Capabilities |
|:------|:-----|:------------|:-------------|
| **Ape Vault** | Yield & Treasury Manager | DeFi Llama API | Vault analytics, APY optimization, TVL tracking across protocols |
| **Banana Bot** | Payment & Transfer Agent | Solana RPC + Phantom | Real transaction signing, SOL/SPL transfers, payment channels |
| **Punch Oracle** | Prediction Markets | CoinGecko API | Market predictions, odds calculation, stake management |
| **Trend Puncher** | Attention Market Trader | CoinGecko + DexScreener | Narrative trading, virality scoring, trend detection |
| **Rug Buster** | Security Scanner | Solana RPC | Bytecode analysis, mint/freeze authority checks, Safety Scores |
| **Repo Ape** | GitHub Alpha Scanner | GitHub API | Repository analysis, AI LARP detection, Legit Scores |
| **Swarm Monkey** | Agent Swarm Manager | Moltbook Network | Agent registration, swarm coordination, health monitoring |
| **Banana Cannon** | Token Launcher | Pump Portal API | Token creation on pump.fun, tokenomics config, launch management |

## Why ClawPunch?

| Feature | Description |
|:--------|:------------|
| **Real Data Only** | Zero mock data — every metric comes from live APIs and on-chain state |
| **Non-Custodial** | Transactions are built server-side but signed client-side via Phantom. Your keys never leave your wallet |
| **Claude Sonnet 4.5** | Each agent runs on Anthropic's latest model for precise, context-aware DeFi analysis |
| **Multi-Source Intel** | Agents cross-reference DeFi Llama, CoinGecko, DexScreener, Solana RPC, and GitHub |
| **Solana Native** | Built from the ground up for Solana — sub-second finality, minimal fees |
| **Open Architecture** | Modular agent design makes it easy to extend with custom agents and data sources |

## Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** database
- **Phantom Wallet** browser extension
- **Anthropic API Key** for Claude Sonnet 4.5

### Installation

```bash
# Clone the repository
git clone https://github.com/ClawPunchSOL/ClawPunch.git
cd ClawPunch

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...        # PostgreSQL connection string
ANTHROPIC_API_KEY=sk-ant-...         # Anthropic API key for Claude

# Optional — enables enhanced features
COINGECKO_API_KEY=CG-...             # CoinGecko Pro API (rate limits without)
GITHUB_TOKEN=ghp_...                 # GitHub API for Repo Ape agent
```

## Architecture

ClawPunch follows a strict **client-server separation** with non-custodial transaction handling:

```
Browser (Client)                         Server
┌────────────────────┐          ┌────────────────────────┐
│                    │          │                        │
│  Monkey OS UI      │◄────────►│  Express API           │
│  React + Vite      │   REST   │  /api/agents/*         │
│                    │          │  /api/vaults            │
│  Phantom Wallet    │          │  /api/predictions       │
│  (tx signing)      │          │  /api/token-launch      │
│                    │          │                        │
│  Agent Panels      │          │  Claude Sonnet 4.5     │
│  (8 interfaces)    │          │  (AI reasoning)        │
│                    │          │                        │
└────────────────────┘          │  External APIs:        │
                                │  ├─ DeFi Llama         │
                                │  ├─ CoinGecko          │
                                │  ├─ DexScreener        │
                                │  ├─ Solana RPC         │
                                │  ├─ GitHub API         │
                                │  ├─ Moltbook Network   │
                                │  └─ Pump Portal        │
                                │                        │
                                │  PostgreSQL            │
                                │  (Drizzle ORM)         │
                                └────────────────────────┘
```

[Full Architecture Documentation &rarr;](docs/ARCHITECTURE.md)

## Transaction Flow

All Solana transactions follow a **non-custodial signing flow**:

1. User requests an action via the agent chat interface
2. Server builds a raw `Transaction` or `VersionedTransaction` using `@solana/web3.js`
3. Unsigned transaction is serialized and sent to the client
4. Client passes the transaction to Phantom for user approval
5. Signed transaction is submitted to Solana mainnet-beta
6. Confirmation is returned and displayed in the agent panel

**Your private keys never touch the server.**

## Project Structure

```
ClawPunch/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Landing page
│   │   │   ├── MonkeyOS.tsx          # Main OS interface (8 agents)
│   │   │   ├── Sanctuary.tsx         # Pixel monument
│   │   │   └── Docs.tsx              # Documentation viewer
│   │   ├── components/
│   │   │   └── agents/
│   │   │       ├── ApeVaultPanel.tsx       # DeFi vault analytics
│   │   │       ├── BananaBotPanel.tsx      # Payment & transfers
│   │   │       ├── BananaCannonPanel.tsx   # Token launcher
│   │   │       ├── PunchOraclePanel.tsx    # Prediction markets
│   │   │       ├── RepoApePanel.tsx        # GitHub scanner
│   │   │       ├── RugBusterPanel.tsx      # Security scanner
│   │   │       ├── SwarmMonkeyPanel.tsx    # Swarm manager
│   │   │       └── TrendPuncherPanel.tsx   # Trend trader
│   │   └── App.tsx                   # Router & layout
│   └── index.html
├── server/
│   ├── agents.ts                     # Agent configurations & prompts
│   ├── routes.ts                     # API route handlers
│   ├── storage.ts                    # Database operations (Drizzle)
│   └── index.ts                      # Express server entry
├── shared/
│   └── schema.ts                     # Drizzle ORM schema & types
├── docs/
│   ├── ARCHITECTURE.md               # System architecture deep-dive
│   ├── API_REFERENCE.md              # REST API documentation
│   ├── AGENTS.md                     # Agent capabilities guide
│   └── assets/                       # Documentation assets
├── .env.example                      # Environment variable template
├── drizzle.config.ts                 # Database configuration
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## API Reference

### Agent Chat

```bash
# Send a message to any agent
curl -X POST http://localhost:5000/api/agents/banana-bot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Send 0.1 SOL to GkXn6...", "conversationHistory": []}'
```

### DeFi Vaults (Ape Vault)

```bash
# Get top DeFi vaults from DeFi Llama
curl http://localhost:5000/api/vaults

# Search vaults by protocol
curl http://localhost:5000/api/vaults?protocol=raydium
```

### Security Scan (Rug Buster)

```bash
# Scan a Solana token address
curl -X POST http://localhost:5000/api/security/scan \
  -H "Content-Type: application/json" \
  -d '{"address": "So11111111111111111111111111111111111111112"}'
```

### Token Launch (Banana Cannon)

```bash
# Generate token concept
curl -X POST http://localhost:5000/api/token-launch/concept \
  -H "Content-Type: application/json" \
  -d '{"theme": "AI-powered DeFi optimizer"}'
```

[Full API Reference &rarr;](docs/API_REFERENCE.md)

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 18, Vite, TailwindCSS, Framer Motion |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL, Drizzle ORM |
| **AI** | Anthropic Claude Sonnet 4.5 |
| **Blockchain** | Solana Web3.js, Phantom Wallet Adapter |
| **Data** | DeFi Llama, CoinGecko, DexScreener, GitHub API, Pump Portal |

## Security

Security is core to ClawPunch. See our [Security Policy](SECURITY.md) for details.

- **Non-Custodial** &mdash; Private keys never leave the user's Phantom wallet
- **Client-Side Signing** &mdash; All transactions require explicit wallet approval
- **No Key Storage** &mdash; Server never has access to private key material
- **Input Validation** &mdash; All API inputs validated with Zod schemas
- **Rate Limiting** &mdash; Per-endpoint rate limits prevent abuse

## Contributing

We welcome contributions. Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

```bash
git clone https://github.com/ClawPunchSOL/ClawPunch.git
cd ClawPunch
npm install
npm run dev
```

## Community

- [GitHub Issues](https://github.com/ClawPunchSOL/ClawPunch/issues)
- [GitHub Discussions](https://github.com/ClawPunchSOL/ClawPunch/discussions)

## License

ClawPunch is released under the [MIT License](LICENSE).

---

<p align="center">
  Built by <a href="https://github.com/ClawPunchSOL">ClawPunchSOL</a> &mdash; Powered by Punch & Clawd
</p>
