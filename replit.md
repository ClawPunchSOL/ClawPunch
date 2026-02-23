# Monkey OS - Retro Crypto Utility Dashboard

## Overview
A 16-bit pixel-art crypto utility dashboard featuring 7 AI-driven utility agents operating on Solana, an interactive Sanctuary pixel map, and immersive parallax jungle scrolling.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + wouter routing
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **AI**: OpenAI via Replit AI Integrations (no API key needed)
- **Styling**: Retro 16-bit pixel art aesthetic throughout

## Pages
- `/` - Home: Parallax jungle scrolling landing page
- `/app` or `/os` - MonkeyOS: AI agent dashboard with chat terminal
- `/sanctuary` - Sanctuary: Interactive 1M pixel grid for conservation donations

## 7 AI Utility Agents
All agents are powered by real AI (GPT-5-mini) with custom system prompts:
1. **Banana Bot** - x402 micropayments & transfers
2. **Swarm Monkey** - Moltbook agent manager
3. **Punch Oracle** - Prediction markets assistant
4. **Trend Puncher** - Attention market trading
5. **Vault Swinger** (Ape Vault) - Yield & treasury manager
6. **Rug Buster** - Solana rug-pull detection via x402
7. **Repo Ape** - GitHub alpha scanner & LARP scoring

## API Routes
- `POST /api/agents/:agentId/conversations` - Create conversation
- `GET /api/agents/:agentId/conversations` - List conversations
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message (SSE streaming)
- `DELETE /api/conversations/:id` - Delete conversation
- `GET /api/sanctuary/pixels` - Get claimed pixels
- `POST /api/sanctuary/pixels` - Claim a pixel

## Database Schema
- `users` - Basic user table
- `conversations` - Agent chat sessions (agentId, title)
- `messages` - Chat messages (conversationId, role, content)
- `sanctuary_pixels` - Claimed pixel plots (plotIndex, ownerName, color)

## Key Files
- `shared/schema.ts` - Drizzle schema + types
- `server/agents.ts` - Agent system prompts and configs
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - PostgreSQL connection
- `client/src/pages/MonkeyOS.tsx` - Agent dashboard with streaming chat
- `client/src/pages/Sanctuary.tsx` - Pixel grid map
- `client/src/pages/Home.tsx` - Landing page
- `gitbook/DOCUMENTATION.md` - Extensive project documentation

## Design Choices
- Client-side execution model (SCE) - no backend custody of keys
- x402 protocol for micropayments (simulated via AI agents)
- Moltbook Network for decentralized agent orchestration
- Native browser scrolling for mobile compatibility on Sanctuary map
- Clawd character lore (escaped Claude AI instance)
