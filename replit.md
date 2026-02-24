# Monkey OS - Retro Crypto Utility Dashboard

## Overview
A 16-bit pixel-art crypto utility dashboard featuring 8 AI-driven utility agents operating on Solana, an interactive Sanctuary pixel map, and immersive parallax jungle scrolling.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + wouter routing
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **AI**: Anthropic Claude (claude-sonnet-4-5) via Replit AI Integrations
- **Wallet**: Solana wallet integration via direct Phantom browser API + @solana/web3.js
- **Styling**: Retro 16-bit pixel art aesthetic throughout

## Pages
- `/` - Home: Parallax jungle scrolling landing page
- `/app` or `/os` - MonkeyOS: AI agent dashboard with tool panels + chat
- `/sanctuary` - Sanctuary: Interactive 1M pixel grid for conservation donations

## Solana Wallet Integration
- Direct Phantom wallet API (no React adapter wrappers due to Vite compatibility)
- Wallet state management via `client/src/lib/solanaWallet.ts` (pub/sub pattern)
- `useWalletState()` hook exported from `WalletButton.tsx` for use across agent panels
- Shows wallet address, SOL balance, copy address, Solscan link
- Auto-connects if Phantom is already connected
- Balance refreshes every 30 seconds
- Wallet address used in prediction bets, transaction tracking, vault staking

## 8 AI Utility Agents
All agents are powered by Claude with AI-first scanning architecture. Each agent has:
- **AgentScanner component** that auto-triggers on panel open, fetches live data from APIs, feeds it to Claude for analysis, and streams back curated intel reports
- **Backend `/api/agent-scan/:agentType`** endpoint that pulls live data from external APIs AND feeds it to Claude in one shot
- Raw data is available in collapsible secondary views below the AI analysis

1. **Banana Bot** - Real Solana SOL transfers via Phantom wallet signing + AI network analysis (Solana RPC TPS) + Solscan tx links + chat
2. **Swarm Monkey** - Moltbook agent registration form + live roster + chat
3. **Punch Oracle** - Live prediction markets with real SOL betting via Phantom wallet + AI market analysis (CoinGecko prices) + auto-resolution + chat
4. **Trend Puncher** - AI-first alpha scanner: Claude analyzes live DexScreener + CoinGecko data and presents TOP PICKS, RED FLAGS, MARKET PULSE, ALPHA CALLS. Raw token data collapsible below.
5. **Ape Vault** - AI-first yield strategist: Claude analyzes live DeFi Llama Solana pools and recommends BEST YIELDS, SAFE PLAYS, DEGEN PLAYS, ALLOCATION STRATEGY. Raw vault data below.
6. **Rug Buster** - AI-first security scanner: Claude analyzes real on-chain Solana RPC data and presents SECURITY SCAN, RED FLAGS, POSITIVE SIGNALS, FINAL VERDICT + chat
7. **Repo Ape** - GitHub repo analyzer with AI-generated legitimacy scores + chat
8. **Banana Cannon** - Token launcher via Pump Portal API + AI concept generation + launch history

## API Routes
### Chat
- `POST /api/agents/:agentId/conversations` - Create conversation
- `GET /api/agents/:agentId/conversations` - List conversations
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message (SSE streaming via Claude)
- `DELETE /api/conversations/:id` - Delete conversation

### Sanctuary
- `GET /api/sanctuary/pixels` - Get claimed pixels
- `POST /api/sanctuary/pixels` - Claim a pixel

### Moltbook Integration (Real API: https://www.moltbook.com/api/v1)
- `GET /api/moltbook/agents` - List registered agents
- `GET /api/moltbook/agents/:id` - Get single agent
- `GET /api/moltbook/agents/:id/logs` - Get agent activity logs
- `GET /api/moltbook/agents/:id/status` - Check claim status on Moltbook
- `GET /api/moltbook/agents/:id/profile` - Get Moltbook profile
- `POST /api/moltbook/agents/register` - Register agent (SSE, tries real API)
- `POST /api/moltbook/agents/:id/post` - Post to Moltbook (auto-solves verification challenges)
- `POST /api/moltbook/agents/:id/upvote/:postId` - Upvote a post
- `GET /api/moltbook/feed` - Get Moltbook feed (hot/new/top)
- `GET /api/moltbook/submolts` - List submolts (communities)
- `DELETE /api/moltbook/agents/:id` - Remove agent
### Other Agent Tools
- `GET/POST /api/predictions` - Create/list prediction markets
- `POST /api/predictions/:id/bet` - Place bet with real SOL (requires txSignature)
- `POST /api/predictions/import` - Import live market as local prediction for betting
- `GET /api/predictions/pool-address` - Get SOL pool address for bet transfers
- `GET /api/security/scans` - List security scan history
- `POST /api/security/scan` - AI-powered contract security scan (SSE)
- `GET /api/repos/scans` - List repo scan history
- `POST /api/repos/scan` - AI-powered repo legitimacy scan (SSE)
- `GET/POST /api/transactions` - List/create SOL transactions (Banana Bot)
- `POST /api/transactions/build` - Build serialized Solana tx for Phantom signing
- `GET /api/token-launches` - List token launches (Banana Cannon)
- `POST /api/token-launches` - Create token launch
- `POST /api/token-launches/generate` - AI-generate token concept
- `PATCH /api/token-launches/:id` - Update launch status
- `GET /api/predictions/prices` - Live CoinGecko prices for 10 tracked tokens
- `GET /api/predictions/polymarket` - Live Polymarket markets feed (cached 2min)
- `POST /api/predictions/generate` - Auto-generate predictions from real market data
- `POST /api/predictions/resolve` - Auto-resolve expired predictions against real prices
- `GET /api/attention/positions` - List attention market narratives with live CoinGecko data (Trend Puncher)
- `POST /api/attention/refresh` - Force refresh market data from CoinGecko
- `POST /api/attention/trade` - Buy/sell attention shares
- `GET /api/vaults` - List DeFi vaults from DeFi Llama (Solana pools)
- `POST /api/vaults/refresh` - Force refresh vault data from DeFi Llama
- `POST /api/vaults/:id/stake` - Stake/unstake in vault
### AI Agent Scanner
- `POST /api/agent-scan/:agentType` - AI-first scanner: backend fetches live data from APIs (DexScreener, DeFi Llama, CoinGecko, Solana RPC) AND feeds it to Claude for analysis. Streams back structured intel report via SSE. Supports: trend-puncher, ape-vault, punch-oracle, rug-buster, banana-bot

## Database Schema
- `users` - Basic user table
- `conversations` - Agent chat sessions (agentId, title)
- `messages` - Chat messages (conversationId, role, content)
- `sanctuary_pixels` - Claimed pixel plots (plotIndex, ownerName, color)
- `moltbook_agents` - Registered AI agents (name, type, status, apiKeyPrefix)
- `predictions` - Prediction markets (title, oddsYes/No, poolYes/No, status)
- `prediction_bets` - Bets on predictions (side, amount, walletAddress, txSignature)
- `security_scans` - Contract scan results (safetyScore, mintAuth, freezeAuth, etc.)
- `repo_scans` - Repo analysis results (legitScore, commitCount, findings, etc.)
- `transactions` - Solana transactions (recipient, amount, token, txHash, fromWallet)
- `token_launches` - Token launches via Banana Cannon (tokenName, tokenSymbol, description, devBuyAmount, feeAmount, status, pumpUrl, mintAddress, txSignature)
- `attention_positions` - Narrative attention markets with live CoinGecko data (narrative, shares, virality, momentum, category, coinIds, priceChange24h, volume24h, marketCap)
- `vault_positions` - DeFi vault staking positions (vaultName, protocol, apy, tvl, stakedAmount)

## Key Files
- `shared/schema.ts` - Drizzle schema + types
- `server/agents.ts` - Agent system prompts and configs
- `server/routes.ts` - API endpoints (Claude + agent tools)
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - PostgreSQL connection
- `client/src/lib/solanaWallet.ts` - Phantom wallet integration (pub/sub state management)
- `client/src/pages/MonkeyOS.tsx` - Agent hub + tool panels + streaming chat
- `client/src/components/WalletButton.tsx` - Wallet connect button + dropdown + useWalletState hook
- `client/src/components/agents/` - Individual agent tool panel components
- `client/src/pages/Sanctuary.tsx` - Pixel grid map
- `client/src/pages/Home.tsx` - Landing page

## Design Choices
- Client-side execution model (SCE) - no backend custody of keys
- Direct Phantom API for wallet (not React adapter wrappers, due to Vite duplicate React issue)
- x402 protocol for micropayments (simulated via AI agents)
- Moltbook Network for decentralized agent orchestration
- MonkeyOS matches landing page style: retro-container borders, floating bananas, monkey/crab characters, jungle background, thick 4px borders, heavy drop-shadows, pixel-art-rendering, bg-black/60 backdrop-blur-sm panels
- Agent hub uses same visual language as Home.tsx: retro-container cards, border-4 border-foreground, shadow-[6px_6px_0px_rgba(0,0,0,0.6)], drop-shadow text, animated monkey/crab characters
- Agent view: INTEL tab (full-height AI scanner) + TOOLS tab (raw data/forms), retro-button tab switcher with border-4 border-foreground
- AI scans (Rug Buster, Repo Ape) generate real analysis via Claude and persist results
- Hub cards show live stats (agent count, market count, scan count, etc.)
- Native browser scrolling for mobile compatibility on Sanctuary map
