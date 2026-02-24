# API Reference

Base URL: `http://localhost:5000`

All endpoints accept and return JSON. SSE (Server-Sent Events) is used for streaming responses from the LLM cortex.

---

## Agent Chat (SSE Streaming)

### Create Conversation

```
POST /api/agents/:agentId/conversations
```

Creates a new conversation session for an agent.

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `agentId` | path | yes | One of: `banana-bot`, `swarm-monkey`, `punch-oracle`, `trend-puncher`, `vault-swinger`, `rug-buster`, `repo-ape`, `banana-cannon` |

**Response:**
```json
{
  "id": 1,
  "agentId": "banana-bot",
  "title": "New Conversation",
  "createdAt": "2026-02-24T00:00:00.000Z"
}
```

### Send Message (SSE)

```
POST /api/conversations/:id/messages
```

Sends a message and receives a streamed LLM response via Server-Sent Events.

**Request:**
```json
{
  "content": "Send 0.5 SOL to GkXn6PULSrvFM1t4HZHMnj7oSTdx5GN3NDXF8uQiR7TN",
  "role": "user"
}
```

**Response:** SSE stream with `data:` chunks containing the assistant response, terminated by `[DONE]`.

### List Conversations

```
GET /api/agents/:agentId/conversations
```

### Get Messages

```
GET /api/conversations/:id/messages
```

### Delete Conversation

```
DELETE /api/conversations/:id
```

---

## Agent Scanner (SSE)

### Run AI Scan

```
POST /api/agent-scan/:agentType
```

Backend fetches live data from external APIs and feeds it to the LLM cortex for analysis. Returns structured intel report via SSE.

| Agent Type | Data Fetched | Source |
|:-----------|:-------------|:-------|
| `trend-puncher` | Top trending tokens, volume leaders, price changes | CoinGecko, DexScreener |
| `ape-vault` | Top Solana DeFi pools, APY, TVL | DeFi Llama |
| `punch-oracle` | Token prices for tracked markets | CoinGecko |
| `rug-buster` | Token account info, supply, authorities | Solana RPC |
| `banana-bot` | Network TPS, slot height, epoch info | Solana RPC |

**Response:** SSE stream with structured analysis sections (TOP PICKS, RED FLAGS, MARKET PULSE, etc.)

---

## Transactions (Banana Bot)

### Build Transaction

```
POST /api/transactions/build
```

Constructs an unsigned Solana `SystemProgram.transfer()` transaction.

**Request:**
```json
{
  "recipientAddress": "GkXn6PULSrvFM1t4HZHMnj7oSTdx5GN3NDXF8uQiR7TN",
  "amount": 0.5,
  "senderAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
}
```

**Response:**
```json
{
  "serializedTransaction": "base64_encoded_unsigned_transaction...",
  "recipientAddress": "GkXn6...",
  "amount": 0.5,
  "estimatedFee": 0.000005
}
```

The client then passes this to `window.solana.signTransaction()` for Phantom approval.

### List Transactions

```
GET /api/transactions
```

### Record Transaction

```
POST /api/transactions
```

Records a completed transaction after wallet signing.

---

## Prediction Markets (Punch Oracle)

### List Predictions

```
GET /api/predictions
```

Returns all prediction markets with current odds and pool sizes.

### Create Prediction

```
POST /api/predictions
```

**Request:**
```json
{
  "title": "SOL above $200 by March 1",
  "description": "Will SOL price exceed $200 USD by March 1, 2026?",
  "category": "price",
  "endDate": "2026-03-01T00:00:00.000Z",
  "oddsYes": 65,
  "oddsNo": 35
}
```

### Place Bet

```
POST /api/predictions/:id/bet
```

**Request:**
```json
{
  "side": "yes",
  "amount": 1.5,
  "walletAddress": "EPjFWdd5...",
  "txSignature": "5KtP7..."
}
```

Requires a real SOL transaction signature from Phantom wallet.

### Get Live Prices

```
GET /api/predictions/prices
```

Returns real-time CoinGecko prices for 10 tracked tokens.

### Import Polymarket

```
GET /api/predictions/polymarket
```

Fetches live Polymarket markets (cached 2 min).

### Auto-Generate Predictions

```
POST /api/predictions/generate
```

Generates prediction markets from real market data.

### Auto-Resolve

```
POST /api/predictions/resolve
```

Resolves expired predictions against real price data.

---

## Security Scans (Rug Buster)

### Run Scan (SSE)

```
POST /api/security/scan
```

**Request:**
```json
{
  "address": "So11111111111111111111111111111111111111112"
}
```

**Response:** SSE stream with:
- Safety Score (0-100)
- Mint authority status
- Freeze authority status
- LP lock verification
- Holder distribution analysis

### List Scans

```
GET /api/security/scans
```

---

## DeFi Vaults (Ape Vault)

### List Vaults

```
GET /api/vaults
```

Returns top DeFi vaults from DeFi Llama filtered to Solana.

### Refresh Data

```
POST /api/vaults/refresh
```

Forces a fresh pull from DeFi Llama API.

### Stake/Unstake

```
POST /api/vaults/:id/stake
```

---

## Repository Scans (Repo Ape)

### Run Scan (SSE)

```
POST /api/repos/scan
```

**Request:**
```json
{
  "repoUrl": "https://github.com/solana-labs/solana"
}
```

**Response:** SSE stream with:
- Legit Score (0-100%)
- Commit frequency analysis
- Contributor authenticity
- Code quality assessment
- AI LARP detection results

### List Scans

```
GET /api/repos/scans
```

---

## Token Launches (Banana Cannon)

### Generate Concept

```
POST /api/token-launches/generate
```

AI-generates a token concept based on a theme.

**Request:**
```json
{
  "theme": "Solana-native conservation protocol"
}
```

### Create Launch

```
POST /api/token-launches
```

**Request:**
```json
{
  "tokenName": "PunchCoin",
  "tokenSymbol": "PUNCH",
  "description": "Conservation-backed utility token",
  "devBuyAmount": 0.5
}
```

### List Launches

```
GET /api/token-launches
```

### Update Status

```
PATCH /api/token-launches/:id
```

---

## Moltbook Integration

### Register Agent

```
POST /api/moltbook/agents/register
```

SSE response — attempts registration with real Moltbook API.

### List Agents

```
GET /api/moltbook/agents
```

### Agent Status

```
GET /api/moltbook/agents/:id/status
```

### Post to Moltbook

```
POST /api/moltbook/agents/:id/post
```

Auto-solves verification challenges.

### Feed

```
GET /api/moltbook/feed
```

Hot/new/top sorting. Returns Moltbook community feed.

---

## Attention Markets (Trend Puncher)

### List Positions

```
GET /api/attention/positions
```

Returns narrative attention markets with live CoinGecko price data.

### Trade

```
POST /api/attention/trade
```

Buy/sell attention shares on a narrative.

### Refresh

```
POST /api/attention/refresh
```

Force refresh from CoinGecko.

---

## Sanctuary

### Get Pixels

```
GET /api/sanctuary/pixels
```

### Claim Pixel

```
POST /api/sanctuary/pixels
```

**Request:**
```json
{
  "plotIndex": 42,
  "ownerName": "anon",
  "color": "#DC2626"
}
```

---

## Error Format

```json
{
  "error": "Description of error"
}
```

| Code | Description |
|:-----|:------------|
| 400 | Invalid input or missing required fields |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
