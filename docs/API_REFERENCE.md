# API Reference

Base URL: `http://localhost:5000`

All endpoints accept and return JSON. No authentication is required for local development.

---

## Agent Chat

### `POST /api/agents/:agentId/chat`

Send a message to any of the 8 AI agents.

**Path Parameters:**

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `agentId` | string | One of: `banana-bot`, `swarm-monkey`, `punch-oracle`, `trend-puncher`, `vault-swinger`, `rug-buster`, `repo-ape`, `banana-cannon` |

**Request Body:**

```json
{
  "message": "string",
  "conversationHistory": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ]
}
```

**Response:**

```json
{
  "response": "string",
  "agentId": "string"
}
```

---

## DeFi Vaults (Ape Vault)

### `GET /api/vaults`

Fetch top DeFi vaults from DeFi Llama with real-time APY and TVL data.

**Query Parameters:**

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `protocol` | string (optional) | Filter by protocol name |
| `chain` | string (optional) | Filter by chain (default: Solana) |

**Response:**

```json
[
  {
    "pool": "string",
    "project": "string",
    "chain": "Solana",
    "tvlUsd": 1234567.89,
    "apy": 12.34,
    "apyBase": 8.5,
    "apyReward": 3.84
  }
]
```

---

## Predictions (Punch Oracle)

### `GET /api/predictions`

Fetch all prediction markets.

**Response:**

```json
[
  {
    "id": 1,
    "title": "string",
    "description": "string",
    "outcome": "string",
    "probability": 0.75,
    "stake": 100,
    "status": "active",
    "createdAt": "2026-02-24T00:00:00.000Z"
  }
]
```

### `POST /api/predictions`

Create a new prediction market.

**Request Body:**

```json
{
  "title": "Will SOL reach $200 by March?",
  "description": "Prediction on SOL price movement",
  "outcome": "YES",
  "probability": 0.65,
  "stake": 50
}
```

---

## Security Scan (Rug Buster)

### `POST /api/security/scan`

Scan a Solana token address for rug-pull indicators.

**Request Body:**

```json
{
  "address": "So11111111111111111111111111111111111111112"
}
```

**Response:**

```json
{
  "address": "string",
  "safetyScore": 85,
  "mintAuthority": "REVOKED",
  "freezeAuthority": "REVOKED",
  "supply": "string",
  "decimals": 9,
  "scanTimestamp": "2026-02-24T00:00:00.000Z"
}
```

---

## Token Launch (Banana Cannon)

### `POST /api/token-launch/concept`

Generate an AI-powered token concept.

**Request Body:**

```json
{
  "theme": "AI-powered DeFi optimizer"
}
```

**Response:**

```json
{
  "name": "string",
  "symbol": "string",
  "description": "string",
  "devBuyAmount": 0.5
}
```

### `POST /api/token-launch/launch`

Launch a token on pump.fun via Pump Portal API.

**Request Body:**

```json
{
  "name": "string",
  "symbol": "string",
  "description": "string",
  "devBuyAmount": 0.5
}
```

---

## Conversations

### `GET /api/conversations/:agentId`

Retrieve conversation history for a specific agent.

**Response:**

```json
[
  {
    "id": 1,
    "agentId": "banana-bot",
    "role": "user",
    "content": "string",
    "createdAt": "2026-02-24T00:00:00.000Z"
  }
]
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error description string"
}
```

| Status Code | Description |
|:------------|:------------|
| 400 | Bad Request — Invalid input or missing required fields |
| 404 | Not Found — Agent or resource not found |
| 500 | Internal Server Error — Server-side failure |
