# Security Policy

## Non-Custodial Architecture

ClawPunch is built on a **strict non-custodial model**. The server never has access to user private keys.

### Transaction Flow

1. The AI agent determines the user's intent from natural language
2. The server constructs an unsigned Solana transaction using `@solana/web3.js`
3. The unsigned transaction is serialized and sent to the client browser
4. The client passes the transaction to the user's Phantom wallet for approval
5. The user reviews and signs the transaction in their wallet extension
6. The signed transaction is submitted to Solana mainnet-beta

At no point does the server possess or handle private key material.

### Data Handling

- **No private keys stored** — All signing happens client-side via Phantom
- **No session tokens** — Stateless API design
- **No raw transaction logs** — Only conversation history is persisted
- **Input validation** — All API inputs validated with Zod schemas before processing

## Supported Versions

| Version | Supported |
|:--------|:----------|
| Latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in ClawPunch, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email security concerns to the maintainers via GitHub private messaging
3. Include a detailed description and steps to reproduce
4. Allow reasonable time for a fix before public disclosure

We take all security reports seriously and will respond within 48 hours.

## Security Best Practices for Users

- **Always verify transactions** in your Phantom wallet before signing
- **Never share your private keys** — ClawPunch will never ask for them
- **Use a dedicated wallet** for testing new DeFi operations
- **Review token approvals** regularly on Solana explorer
- **Keep your wallet extension updated** to the latest version
