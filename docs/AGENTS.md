# Agent Guide

ClawPunch deploys 8 autonomous AI agents, each specialized for a specific sector of the Solana DeFi ecosystem. Every agent is powered by Claude Sonnet 4.5 and operates with real data sources.

---

## Ape Vault

**Role:** Yield & Treasury Manager

| Property | Value |
|:---------|:------|
| Agent ID | `vault-swinger` |
| Data Source | DeFi Llama API |
| Endpoint | `GET /api/vaults` |

Ape Vault manages DeFi vault operations across the Solana ecosystem. It pulls real-time yield data from DeFi Llama to provide APY comparisons, TVL tracking, and protocol analysis.

**Capabilities:**
- Real-time vault analytics from DeFi Llama
- APY optimization across protocols (Raydium, Orca, Meteora, Marinade)
- TVL tracking and historical comparison
- Treasury allocation recommendations

---

## Banana Bot

**Role:** Payment & Transfer Agent

| Property | Value |
|:---------|:------|
| Agent ID | `banana-bot` |
| Data Source | Solana RPC via `@solana/web3.js` |
| Endpoint | `POST /api/agents/banana-bot/chat` |

Banana Bot handles all payment and transfer operations on Solana. It constructs real unsigned transactions that are sent to the user's Phantom wallet for signing.

**Capabilities:**
- Real SOL and SPL token transfers
- Transaction building with `@solana/web3.js`
- Non-custodial signing via Phantom wallet
- Payment receipt generation

**Transaction Flow:**
1. User describes the transfer in natural language
2. Banana Bot interprets intent and builds an unsigned `Transaction`
3. Transaction is serialized and sent to the client
4. User reviews and signs in Phantom
5. Signed transaction is submitted to Solana mainnet-beta

---

## Punch Oracle

**Role:** Prediction Markets

| Property | Value |
|:---------|:------|
| Agent ID | `punch-oracle` |
| Data Source | CoinGecko API |
| Endpoints | `GET /api/predictions`, `POST /api/predictions` |

Punch Oracle manages prediction markets for crypto events. It uses real market data from CoinGecko to generate informed probability estimates.

**Capabilities:**
- Create prediction markets for any crypto event
- Real-time price data from CoinGecko for odds calculation
- Stake tracking and payout estimation
- Historical prediction accuracy analysis

---

## Trend Puncher

**Role:** Attention Market Trader

| Property | Value |
|:---------|:------|
| Agent ID | `trend-puncher` |
| Data Source | CoinGecko + DexScreener |
| Endpoint | `POST /api/agents/trend-puncher/chat` |

Trend Puncher monitors and trades on attention markets — tracking which narratives, hashtags, and social signals are gaining momentum across the crypto ecosystem.

**Capabilities:**
- Trending token detection via CoinGecko
- DEX pair analytics from DexScreener
- Narrative momentum analysis
- Virality scoring and breakout prediction

---

## Rug Buster

**Role:** Security Scanner

| Property | Value |
|:---------|:------|
| Agent ID | `rug-buster` |
| Data Source | Solana RPC |
| Endpoint | `POST /api/security/scan` |

Rug Buster performs on-chain security analysis of Solana tokens to detect rug-pull indicators. It queries the Solana blockchain directly for contract state.

**Capabilities:**
- Mint authority revocation verification
- Freeze authority status check
- LP token lock/burn analysis
- Top holder concentration (Gini coefficient)
- Safety Score generation (0-100)

**Scan Output:**
```json
{
  "safetyScore": 85,
  "checks": {
    "mintAuthority": "REVOKED",
    "freezeAuthority": "REVOKED",
    "lpLocked": true,
    "topHolderConcentration": "12.4%"
  },
  "assessment": "LOW RISK"
}
```

---

## Repo Ape

**Role:** GitHub Alpha Scanner

| Property | Value |
|:---------|:------|
| Agent ID | `repo-ape` |
| Data Source | GitHub REST API v3 |
| Endpoint | `POST /api/agents/repo-ape/chat` |

Repo Ape analyzes GitHub repositories for crypto projects, detecting "AI LARP" — projects that claim AI capabilities but have no real implementation.

**Capabilities:**
- Repository legitimacy scoring (0-100% Legit)
- Commit frequency and contributor analysis
- Code quality assessment
- AI/ML implementation verification vs marketing claims
- Trending crypto repo tracking

---

## Swarm Monkey

**Role:** Agent Swarm Manager

| Property | Value |
|:---------|:------|
| Agent ID | `swarm-monkey` |
| Data Source | Moltbook Network |
| Endpoint | `POST /api/agents/swarm-monkey/chat` |

Swarm Monkey manages the decentralized AI agent swarm via the Moltbook Network. It coordinates multi-agent operations and monitors swarm health.

**Capabilities:**
- Agent registration and deregistration
- Swarm health monitoring
- Multi-agent task coordination
- Attention Yield metric reporting
- API key generation and agent authentication

---

## Banana Cannon

**Role:** Token Launcher

| Property | Value |
|:---------|:------|
| Agent ID | `banana-cannon` |
| Data Source | Pump Portal API |
| Endpoints | `POST /api/token-launch/concept`, `POST /api/token-launch/launch` |

Banana Cannon helps users create and launch new tokens on pump.fun via the Pump Portal API.

**Capabilities:**
- AI-generated token concepts (name, symbol, description)
- Token creation on pump.fun
- Dev buy amount configuration
- Launch history tracking
- Tokenomics and branding advice
