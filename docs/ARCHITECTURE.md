# Architecture

## System Overview

ClawPunch is a full-stack TypeScript application built on a strict client-server separation with non-custodial Solana transaction handling.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  React 18     │  │  Phantom     │  │  Agent Panel Components  │  │
│  │  + Vite       │  │  Wallet      │  │  (8 specialized UIs)     │  │
│  │  + Tailwind   │  │  Adapter     │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                       │                  │
│         └─────────────────┼───────────────────────┘                  │
│                           │                                          │
│                    REST API (JSON)                                   │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                          Server                                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Express.js   │  │  Claude      │  │  External API Clients    │  │
│  │  Router       │  │  Sonnet 4.5  │  │                          │  │
│  │              │  │  (Anthropic) │  │  ├─ DeFi Llama           │  │
│  │  /api/agents │  │              │  │  ├─ CoinGecko            │  │
│  │  /api/vaults │  └──────┬───────┘  │  ├─ DexScreener          │  │
│  │  /api/scan   │         │          │  ├─ Solana RPC           │  │
│  │  /api/launch │         │          │  ├─ GitHub API           │  │
│  └──────┬───────┘         │          │  ├─ Moltbook Network     │  │
│         │                 │          │  └─ Pump Portal API      │  │
│         │                 │          └──────────────────────────┘  │
│         │                 │                                        │
│  ┌──────┴─────────────────┴──────────────────────────────────────┐ │
│  │                    Storage Layer (Drizzle ORM)                 │ │
│  │                    PostgreSQL Database                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Design Principles

### 1. Non-Custodial Transaction Handling

The server **never** has access to user private keys. Solana transactions are:

1. Constructed as unsigned `Transaction` objects on the server
2. Serialized to base64 and sent to the client
3. Passed to Phantom for user approval and signing
4. Submitted to Solana mainnet-beta by the wallet

### 2. Real Data Only

Every agent integrates with live external APIs. There is no mock data, no demo mode, no placeholder content. Data sources include:

| Agent | Primary Data Source | Fallback |
|:------|:-------------------|:---------|
| Ape Vault | DeFi Llama `/yields` | None |
| Banana Bot | Solana RPC `@solana/web3.js` | None |
| Punch Oracle | CoinGecko `/coins/markets` | None |
| Trend Puncher | CoinGecko + DexScreener | None |
| Rug Buster | Solana RPC (account info) | None |
| Repo Ape | GitHub REST API v3 | None |
| Swarm Monkey | Moltbook Network API | None |
| Banana Cannon | Pump Portal API | None |

### 3. Agent-First Architecture

Each AI agent is an isolated module with:

- A unique system prompt defining its personality and capabilities
- Dedicated API routes for specialized operations
- A custom frontend panel component
- Access to specific external data sources

### 4. Thin Routes, Fat Storage

API routes are kept minimal — they validate input with Zod, delegate to the storage layer, and return results. All business logic lives in either the AI agent prompts or the storage interface.

## Data Flow

### Agent Chat Flow

```
User Input → POST /api/agents/:id/chat
  → Validate with Zod
  → Fetch relevant context (vaults, prices, scan results)
  → Build Claude prompt with system prompt + context + user message
  → Stream Claude response
  → Persist conversation to PostgreSQL
  → Return response to client
```

### Transaction Flow (Banana Bot)

```
User: "Send 0.1 SOL to GkXn..."
  → Claude interprets intent
  → Server builds SystemProgram.transfer() Transaction
  → Serialize unsigned tx to base64
  → Send to client
  → Client → Phantom.signTransaction()
  → User approves in wallet
  → Phantom → Solana mainnet-beta
  → Return tx hash to UI
```

### Security Scan Flow (Rug Buster)

```
User: "Scan token EPjFW..."
  → Fetch account info from Solana RPC
  → Check mint authority status
  → Check freeze authority status
  → Analyze supply distribution
  → Calculate Safety Score (0-100)
  → Return structured results
```

## Database Schema

The PostgreSQL database stores:

- **Conversations** — Chat history per agent per session
- **Predictions** — Punch Oracle market predictions with outcomes
- **Vault Data** — Cached DeFi Llama vault snapshots
- **Security Scans** — Rug Buster scan results
- **Token Launches** — Banana Cannon launch records

All tables are defined in `shared/schema.ts` using Drizzle ORM with full TypeScript type inference.

## Technology Choices

| Decision | Choice | Rationale |
|:---------|:-------|:----------|
| AI Model | Claude Sonnet 4.5 | Best reasoning for DeFi analysis, fast enough for chat |
| Frontend | React + Vite | Fast HMR, modern tooling, ecosystem |
| Styling | TailwindCSS | Rapid UI development, consistent design system |
| Backend | Express | Simple, well-understood, good middleware ecosystem |
| Database | PostgreSQL + Drizzle | Type-safe queries, migrations, reliable persistence |
| Blockchain | @solana/web3.js | Official Solana SDK, full RPC support |
| Validation | Zod | Runtime type checking, schema inference |
