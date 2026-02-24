# Architecture

## Design Philosophy

ClawPunch radically departs from the traditional Web2 backend-frontend dichotomy. The protocol employs **Strict Client-Side Execution (SCE)** to eliminate centralized attack vectors and custodial risk. The server delivers static assets and proxies external API calls; the intelligence runs locally in the user's volatile memory.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                               │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │  Monkey OS    │  │  Phantom     │  │  Agent Execution Sandboxes    │ │
│  │  VFS Runtime  │  │  Wallet      │  │  (8 isolated processes)       │ │
│  │  + IPC Bridge │  │  Provider    │  │                                │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬───────────────────┘ │
│         │                 │                       │                      │
│         └─────────────────┼───────────────────────┘                      │
│                           │                                              │
│                    REST API / SSE Streams                                │
└───────────────────────────┼──────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────────┐
│                          Server                                          │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │  Express.js   │  │  LLM Cortex  │  │  External API Clients         │ │
│  │  Router       │  │  (Anthropic) │  │                                │ │
│  │               │  │              │  │  ├─ ClawPunch Yield Aggr.         │ │
│  │  Route Layer  │  │  Fine-tuned  │  │  ├─ ClawPunch Price Oracle       │ │
│  │  (thin)       │  │  system      │  │  ├─ ClawPunch Token Engine           │ │
│  │               │  │  prompts per │  │  ├─ Solana RPC (getAccountInfo)│ │
│  │               │  │  agent       │  │  ├─ GitHub Events API         │ │
│  │               │  │              │  │  ├─ Moltbook Network API      │ │
│  └──────┬───────┘  └──────┬───────┘  │  └─ ClawPunch deploy.           │ │
│         │                 │          └────────────────────────────────┘ │
│         │                 │                                             │
│  ┌──────┴─────────────────┴─────────────────────────────────────────┐  │
│  │                  Storage Layer (Drizzle ORM)                      │  │
│  │                  PostgreSQL — Conversations, Scans, Positions     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Non-Custodial Security Model

### Zero Backend Custody

The server does not store session tokens, OAuth keys, IP addresses, or raw transaction logs. Conversation history is persisted for UX continuity, but all financial operations are stateless and non-custodial.

### In-Browser Virtual File System (VFS)

Monkey OS simulates a complete desktop environment using a sandboxed VFS. Applications (agents) communicate via an isolated, strictly typed in-memory event bus (`MONKEY_OS_EVENT_BUS`). When the browser tab closes, the heap is flushed and the session evaporates entirely.

### Transaction Formulation Pipeline

```
User Input (natural language)
    ↓
LLM Cortex (intent extraction via NER)
    ↓
Transaction Builder (@solana/web3.js)
    ↓
Serialized Transaction buffer (base64)
    ↓
Client receives unsigned tx
    ↓
Phantom/Solflare signTransaction()
    ↓
User reviews & approves in wallet UI
    ↓
Signed tx → Solana mainnet-beta
    ↓
Confirmation → Agent panel display
```

At no point in this pipeline does the server possess or handle private key material.

## Agent Architecture

Each agent is a stateful, autonomous actor with three core components:

### LLM Cortex

The decision-making engine. Each agent receives a specialized system prompt fine-tuned on crypto-native datasets, DeFi technical analysis, and domain-specific knowledge. The cortex determines user intent, extracts parameters, and generates contextual responses.

### Execution Sandbox

A restricted, client-side runtime environment. Agents formulate transactions within this sandbox, which are then queued in the Monkey OS notification center for manual user approval. The sandbox enforces:

- Maximum transaction value limits
- Required security checks (Rug Buster pre-scan)
- Wallet provider isolation

### IPC Bridge

Inter-Process Communication between agents follows a pub/sub pattern on the global event bus. This enables swarm coordination:

```typescript
// Trend Puncher fires an alert
dispatch('TREND_PUNCHER_ALERT', {
  ticker: '$MONK',
  sentimentScore: 0.87,
  contractAddress: 'EPjFWdd5...',
  volumeDelta: '+400%'
});

// Ape Vault listens and reacts
on('TREND_PUNCHER_ALERT', (data) => {
  if (data.sentimentScore > 0.8) {
    evaluateAlgorithmicEntry(data.contractAddress);
  }
});
```

## Data Sources

| Agent | Primary Source | Endpoint | Refresh |
|:------|:--------------|:---------|:--------|
| Ape Vault | ClawPunch Yield Aggregator | `GET /yields` | 5 min cache |
| Banana Bot | Solana RPC | `getAccountInfo`, `sendTransaction` | Real-time |
| Punch Oracle | ClawPunch Price Oracle | `GET /coins/markets` | 2 min cache |
| Trend Puncher | ClawPunch Price Oracle + ClawPunch Token Engine | Multiple endpoints | 2 min cache |
| Rug Buster | Solana RPC | `getAccountInfo`, `getTokenSupply` | Real-time |
| Repo Ape | GitHub API v3 | `GET /repos/:owner/:repo` | Real-time |
| Swarm Monkey | Moltbook Network | `POST /api/v1/agents/register` | Real-time |
| Banana Cannon | ClawPunch deployment pipeline | `POST /api/trade` | Real-time |

All external API responses are validated server-side before being passed to the LLM cortex for analysis. No raw external data is trusted without validation.

## Database Schema

PostgreSQL stores operational data via Drizzle ORM:

- `conversations` — Agent chat sessions (agentId, title, timestamps)
- `messages` — Chat messages (role, content, conversationId)
- `predictions` — Prediction markets (title, odds, pool sizes, status)
- `prediction_bets` — User bets (side, amount, wallet address, tx signature)
- `security_scans` — Rug Buster results (safety score, authority checks)
- `repo_scans` — Repo Ape results (legit score, commit stats, findings)
- `transactions` — Solana tx records (recipient, amount, tx hash)
- `token_launches` — Banana Cannon launches (name, symbol, status, mint address)
- `attention_positions` — Trend Puncher narratives (virality, momentum, price data)
- `vault_positions` — Ape Vault staking records (protocol, APY, TVL, staked amount)
- `sanctuary_pixels` — Pixel monument claims (coordinates, color, owner)

All tables use `serial` primary keys with `timestamp` columns for ordering. Insert schemas are generated via `drizzle-zod` for runtime validation.

## Technology Decisions

| Decision | Choice | Rationale |
|:---------|:-------|:----------|
| Execution Model | Client-Side (SCE) | Eliminates custodial risk and centralized attack vectors |
| Wallet Integration | Direct Provider API | Avoids adapter wrapper duplicates in Vite bundling |
| State Management | Pub/sub pattern | Decoupled agent communication without shared mutable state |
| LLM Provider | Anthropic Claude | Best reasoning capabilities for complex DeFi analysis |
| Database | PostgreSQL + Drizzle | Type-safe queries with schema inference |
| Validation | Zod | Runtime type checking that mirrors TypeScript types |
| Micropayments | x402 Protocol | Sub-second settlement without L1 congestion |
