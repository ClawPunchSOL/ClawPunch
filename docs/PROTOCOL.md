# x402 Protocol Specification

## Abstract

The x402 Protocol is an asynchronous state-channel multiplexer designed for sub-second settlement of fractional USDC transfers with deterministic finality on Solana. It bypasses standard RPC congestion through ephemeral state channels, off-chain processing, and zk-SNARK proof rollups.

## 1. Multi-Tier Routing Heuristic (MTRH)

When a user or autonomous agent initiates a fractional transfer, the x402 routing engine evaluates three real-time parameters:

1. **Mempool Density** — Current transaction queue depth across the Solana cluster
2. **Compute Unit Pricing** — Dynamic gas oracle readings from each validator node
3. **RPC Node Latency** — Round-trip time measurements to available endpoints

The optimal routing path is calculated using:

```
ΔP = Σᵢ₌₁ⁿ (Gᵢ × λᵢ) + O(zk)
```

| Variable | Description | Unit |
|:---------|:------------|:-----|
| `Gᵢ` | Dynamic gas oracle reading for node `i` | lamports/CU |
| `λᵢ` | Latency coefficient of target node cluster | milliseconds |
| `O(zk)` | Constant overhead of off-chain payload formulation and localized zk proof generation | microseconds |

By computing `ΔP` in real-time, x402 routes sub-cent transactions with near-instant settlement, abstracting the priority fee auction mechanics from the end user.

## 2. Ephemeral State Channels

Rather than requiring global consensus for every micro-transaction (cost-prohibitive at scale), x402 opens ephemeral state channels between the client-side execution environment and the Moltbook relayer network.

### Channel Lifecycle

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  1. Pre-commit  │────►│  2. Execution   │────►│  3. Rollup      │
│                 │     │                 │     │                 │
│  Wallet signs   │     │  Off-chain TPS  │     │  zk-SNARK       │
│  pre-commitment │     │  exceeding      │     │  bundles 1000s  │
│  hash           │     │  100,000+       │     │  of states      │
└────────────────┘     └────────────────┘     └────────┬───────┘
                                                        │
                                               ┌────────▼───────┐
                                               │  4. Finality    │
                                               │                 │
                                               │  Proof submitted│
                                               │  to Solana L1   │
                                               │  for absolute   │
                                               │  determinism    │
                                               └────────────────┘
```

### Pre-commitment Phase

The user's wallet cryptographically signs a pre-commitment hash that establishes:

- Maximum transfer amount (denominated in USDC lamports)
- Channel expiry timestamp
- Counterparty address (Moltbook relayer public key)
- Nonce for replay protection

### Execution Phase

With the channel open, the x402 engine processes micropayments off-chain at theoretical throughput exceeding 100,000 TPS. Each state transition is signed by both parties and stored in the client-side execution sandbox.

### Rollup Phase

A localized zk-SNARK bundles thousands of fractional micropayment states into a single verifiable cryptographic proof. The proof encodes:

- Aggregate transfer amounts
- State transition validity
- Channel balance consistency

### Finality Phase

The compressed proof is submitted to the Solana mainnet for absolute deterministic finality. A single on-chain transaction settles the entire channel history, amortizing gas costs across potentially thousands of micro-transfers.

## 3. Byzantine Fault Tolerance

The protocol achieves near-instant finality while maintaining strict BFT guarantees. Before generating the final zk-SNARK, the system requires supermajority consensus (2f+1) from the decentralized Moltbook validator swarm.

This ensures:

- No single point of failure
- No rogue relayer node can compromise the micropayment stream
- Channel state is consistent even under network partitions
- Fraudulent state transitions are immediately detectable and rejectable

## 4. Integration with ClawPunch Agents

Each agent in the ClawPunch swarm uses x402 for different payment patterns:

| Agent | x402 Usage |
|:------|:-----------|
| **Banana Bot** | Direct USDC/SOL transfers and payment channel management |
| **Rug Buster** | Micropayment triggers ($0.05/scan) for security audit unlocking |
| **Punch Oracle** | Stake settlement and prediction market payouts |
| **Ape Vault** | Yield distribution and auto-staking fund transfers |
| **Banana Cannon** | Token launch fee routing and dev buy allocation |

## 5. Security Considerations

- **Key Isolation** — Private keys remain in the user's wallet extension at all times
- **Channel Bounds** — Maximum transfer amounts are cryptographically enforced at channel open
- **Replay Protection** — Sequential nonces prevent state reuse attacks
- **Timeout Recovery** — Expired channels automatically settle to the last valid state on-chain
- **Proof Verification** — zk-SNARK proofs are publicly verifiable by any Solana node
