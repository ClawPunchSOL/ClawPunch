# Agent Reference

ClawPunch ships with 8 native, LLM-powered utility agents. Each runs as an isolated process within the Monkey OS environment, communicating via the IPC bridge. Every agent operates on real data sources with zero mock data.

---

## I. Banana Bot

**Cross-Chain Payments & Wallet Core**

The foundational financial primitive of ClawPunch. Banana Bot serves as a hyper-intelligent, natural language interface for all core wallet operations.

| Property | Value |
|:---------|:------|
| Agent ID | `banana-bot` |
| Data Source | Solana RPC, ClawPunch routing engine |
| Protocol | x402 state channels |

**Capabilities:**

- **Natural Language Processing** — Instead of navigating complex DEX UIs, users instruct via plain English: *"Swap 2 SOL for exactly 300 USDC, use max 1% slippage and route through Orca."*
- **Optimal Routing** — Parses queries using Named Entity Recognition (NER), queries the ClawPunch routing engine (`quote` and `swap` endpoints), and evaluates dozens of liquidity pools for optimal routing with lowest price impact
- **x402 Integration** — For USDC micropayments, routes through x402 protocol, abstracting gas fees with near-instant settlement
- **Non-Custodial Signing** — Returns base64-encoded, serialized transaction buffers ready for Phantom wallet signature

---

## II. Swarm Monkey

**Moltbook Orchestration Interface**

The control tower for deploying and managing autonomous agents via the Moltbook Network.

| Property | Value |
|:---------|:------|
| Agent ID | `swarm-monkey` |
| Data Source | Moltbook Network API |
| Endpoint | `POST /api/moltbook/agents/register` |

**Capabilities:**

- **Agent Provisioning** — Define agent personality, risk tolerance, and execution boundaries (e.g., "Never formulate transactions exceeding 5 SOL")
- **Dashboard Analytics** — Real-time Attention Score visualization, $Yield generation tracking, social engagement metrics
- **Node Health** — Monitors latency and uptime of Moltbook relayer network supporting ephemeral state channels
- **Swarm Coordination** — Link multiple specialized agents into coordinated swarms with automated handoff

---

## III. Trend Puncher

**Momentum & Narrative Sniper**

A high-frequency sentiment analysis engine designed to identify micro-trends before they reflect in price action.

| Property | Value |
|:---------|:------|
| Agent ID | `trend-puncher` |
| Data Source | ClawPunch Price Oracle, ClawPunch Token Engine |
| Endpoint | `GET /api/attention/positions` |

**Capabilities:**

- **Social Ingestion Firehose** — Ingests unstructured data from Twitter APIs, Telegram alpha groups, and Discord whale channels
- **NLP Pipeline** — Real-time sentiment analysis using VADER and custom BERT-based models fine-tuned on crypto slang, ticker mentions, and cashtag velocity
- **Volume Delta Correlation** — Correlates social sentiment spikes with on-chain volume anomalies using ClawPunch Token Engine websockets. Identifies divergences — high social velocity preceding high volume
- **Actionable Alerts** — *"Macaque meta is trending. +400% mention volume in 5m. Associated ticker: $MONK. Queue swap?"*

---

## IV. Rug Buster

**Solana-Native Rug-Pull Detection**

Autonomous security scanner that unlocks scans via x402 micropayments. Risk assessment is dynamically performed at request time through on-chain contract analysis.

| Property | Value |
|:---------|:------|
| Agent ID | `rug-buster` |
| Data Source | Solana RPC |
| Trigger | x402 micropayment ($0.05/scan) |

**Verification Matrix:**

| Check | Method | Failure = Risk |
|:------|:-------|:---------------|
| Mint Authority | `mintAuthority == null` | Authority not revoked → infinite supply |
| Freeze Authority | `freezeAuthority == null` | Authority not revoked → can freeze balances |
| LP Lock | Query Raydium/Orca/Meteora AMM | LP tokens not burned or time-locked |
| Holder Distribution | Gini coefficient calculation | Top 10 wallets > 50% supply |

**Output:** Deterministic Safety Score (0-100) with verifiable cryptographic receipt ensuring the audit result hasn't been tampered with.

---

## V. Punch Oracle

**Decentralized Prediction Markets**

Connects the Monkey OS environment to real-world data and decentralized prediction markets.

| Property | Value |
|:---------|:------|
| Agent ID | `punch-oracle` |
| Data Source | ClawPunch Price Oracle, decentralized oracle networks |
| Endpoints | `GET/POST /api/predictions` |

**Capabilities:**

- **Event Staking** — Stake USDC on binary or scalar outcomes: *"Will Solana TPS drop below 1000 today?"*, *"Will $ClawPunch break $0.05 by Friday?"*
- **Oracle Aggregation** — Aggregates data feeds from decentralized oracle networks using a mathematical medianizer function for tamper-proof truth determination
- **Atomic Settlement** — Escrow Program automatically distributes the staked USDC pool to winning addresses upon oracle consensus
- **Protocol Fee** — 1% fee routed directly to The Sanctuary conservation fund

---

## VI. Ape Vault

**Automated DCA & Portfolio Rebalancing**

Replaces emotional, discretionary trading with cold, algorithmic, condition-based execution.

| Property | Value |
|:---------|:------|
| Agent ID | `vault-swinger` |
| Data Source | ClawPunch Yield Aggregator |
| Endpoint | `GET /api/vaults` |

**Capabilities:**

- **Conditional Logic Execution** — Define complex, nested conditional logic without code: *"DCA 1 SOL into $WIF every day at 14:00 UTC, BUT only if 14-day RSI < 40 AND Solana TPS > 2000"*
- **Moltbook Relayer Cron** — Uses experimental Moltbook Relayer Network for asynchronous execution via delegated execution permits (Solana Session Keys or localized multi-sig escrow)
- **Auto-Staking** — Autonomously sweeps idle SOL into liquid staking derivatives (JitoSOL, mSOL) to maximize baseline yield while maintaining DCA liquidity
- **Real-Time Vault Analytics** — APY comparisons, TVL tracking, protocol analysis across Raydium, Orca, Meteora, Marinade

---

## VII. Repo Ape

**Automated GitHub Alpha Scanner**

Intelligence agent that monitors GitHub repositories and developer activity to detect crypto alpha before it reaches social media.

| Property | Value |
|:---------|:------|
| Agent ID | `repo-ape` |
| Data Source | GitHub Events API, REST API v3 |
| Endpoint | `POST /api/repos/scan` |

**Capabilities:**

- **Commit Firehose Ingestion** — Connects to GitHub Events API, polling thousands of repositories belonging to core Solana protocols, NFT projects, and stealth DeFi builders
- **Heuristic Code Analysis** — Analyzes diffs using language models trained on Rust and Anchor frameworks, scanning for keywords like `mainnet_deploy`, `airdrop_snapshot`, `token_mint_auth_revoke`
- **Developer Graph Mapping** — Tracks activity of pseudonymous "10x" developers. When associated wallets interact with unannounced repositories, flags as high-probability alpha
- **Legit Score** — Composite legitimacy score (0-100%) based on commit frequency, contributor count, code quality, and AI LARP detection

---

## VIII. Banana Cannon

**Token Launcher**

Handles token creation and deployment on Solana via the ClawPunch deployment pipeline.

| Property | Value |
|:---------|:------|
| Agent ID | `banana-cannon` |
| Data Source | ClawPunch deployment pipeline |
| Endpoints | `POST /api/token-launches`, `POST /api/token-launches/generate` |

**Capabilities:**

- **Token Creation** — Deploy new tokens on Solana with custom name, symbol, and description
- **AI Concept Generation** — Generate creative token concepts, branding, and tokenomics configurations
- **Dev Buy Allocation** — Configure initial dev buy amounts for launch liquidity
- **Launch Tracking** — Full history of launched tokens with mint addresses, tx signatures, and deployment URLs
- **Risk Disclosure** — Automated warnings about token launch responsibilities and regulatory considerations
