# Monkey OS - Retro Crypto Utility Dashboard

## Overview
A 16-bit pixel-art crypto utility dashboard featuring 7 AI-driven utility agents operating on Solana, an interactive Sanctuary pixel map, and immersive parallax jungle scrolling.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + wouter routing
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **AI**: Anthropic Claude (claude-sonnet-4-5) via Replit AI Integrations
- **Styling**: Retro 16-bit pixel art aesthetic throughout

## Pages
- `/` - Home: Parallax jungle scrolling landing page
- `/app` or `/os` - MonkeyOS: AI agent dashboard with tool panels + chat
- `/sanctuary` - Sanctuary: Interactive 1M pixel grid for conservation donations

## 7 AI Utility Agents
All agents are powered by Claude with custom system prompts AND specialized tool panels:
1. **Banana Bot** - x402 payment form (send USDC/SOL/PUNCH) + chat
2. **Swarm Monkey** - Moltbook agent registration form + live roster + chat
3. **Punch Oracle** - Prediction market cards, betting modal, odds bars + chat
4. **Trend Puncher** - Attention market dashboard, buy/sell narrative shares + chat
5. **Ape Vault** - DeFi vault staking dashboard, APY display + chat
6. **Rug Buster** - Contract scanner with AI-generated safety scores + chat
7. **Repo Ape** - GitHub repo analyzer with AI-generated legitimacy scores + chat

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

### Agent Tools
- `GET/POST /api/moltbook/agents` - Register/list Moltbook agents
- `PATCH /api/moltbook/agents/:id/status` - Toggle agent status
- `GET/POST /api/predictions` - Create/list prediction markets
- `POST /api/predictions/:id/bet` - Place bet on prediction
- `GET /api/security/scans` - List security scan history
- `POST /api/security/scan` - AI-powered contract security scan (SSE)
- `GET /api/repos/scans` - List repo scan history
- `POST /api/repos/scan` - AI-powered repo legitimacy scan (SSE)

## Database Schema
- `users` - Basic user table
- `conversations` - Agent chat sessions (agentId, title)
- `messages` - Chat messages (conversationId, role, content)
- `sanctuary_pixels` - Claimed pixel plots (plotIndex, ownerName, color)
- `moltbook_agents` - Registered AI agents (name, type, status, apiKeyPrefix)
- `predictions` - Prediction markets (title, oddsYes/No, poolYes/No, status)
- `prediction_bets` - Bets on predictions (side, amount, walletAddress)
- `security_scans` - Contract scan results (safetyScore, mintAuth, freezeAuth, etc.)
- `repo_scans` - Repo analysis results (legitScore, commitCount, findings, etc.)

## Key Files
- `shared/schema.ts` - Drizzle schema + types
- `server/agents.ts` - Agent system prompts and configs
- `server/routes.ts` - API endpoints (Claude + agent tools)
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - PostgreSQL connection
- `client/src/pages/MonkeyOS.tsx` - Agent hub + tool panels + streaming chat
- `client/src/components/agents/` - Individual agent tool panel components
- `client/src/pages/Sanctuary.tsx` - Pixel grid map
- `client/src/pages/Home.tsx` - Landing page

## Design Choices
- Client-side execution model (SCE) - no backend custody of keys
- x402 protocol for micropayments (simulated via AI agents)
- Moltbook Network for decentralized agent orchestration
- Each agent has a tool panel (forms, data displays) ABOVE the chat
- AI scans (Rug Buster, Repo Ape) generate real analysis via Claude and persist results
- Native browser scrolling for mobile compatibility on Sanctuary map
