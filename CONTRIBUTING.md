# Contributing to ClawPunch

Thank you for your interest in contributing to ClawPunch. This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Anthropic API key

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/ClawPunch.git
cd ClawPunch

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Fill in your API keys in .env

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

| Directory | Purpose |
|:----------|:--------|
| `client/src/pages/` | Page-level React components |
| `client/src/components/agents/` | Individual agent panel UIs |
| `server/routes.ts` | Express API route handlers |
| `server/agents.ts` | Agent configurations and system prompts |
| `server/storage.ts` | Database operations via Drizzle ORM |
| `shared/schema.ts` | Database schema and TypeScript types |
| `docs/` | Documentation |

## Adding a New Agent

1. **Define the agent** in `server/agents.ts` — add the ID to the `AgentId` type union and create an `AgentConfig` with its system prompt
2. **Add storage methods** in `server/storage.ts` if the agent needs persistent data
3. **Create API routes** in `server/routes.ts` for any agent-specific endpoints
4. **Build the panel** in `client/src/components/agents/` — create a new `*Panel.tsx` component
5. **Register the panel** in `client/src/pages/MonkeyOS.tsx`
6. **Update the schema** in `shared/schema.ts` if new database tables are needed

## Code Style

- TypeScript strict mode
- Functional React components with hooks
- Tailwind CSS for styling
- Drizzle ORM for database operations
- Zod for request validation

## Pull Request Process

1. Fork the repository and create a feature branch from `main`
2. Make your changes with clear, descriptive commits
3. Ensure the application builds without errors: `npm run build`
4. Update documentation if you've changed APIs or added features
5. Open a pull request with a clear description of changes

## Commit Messages

Use clear, descriptive commit messages:

```
Add market momentum analysis to Trend Puncher agent
Fix Rug Buster safety score calculation for LP lock check
Update DeFi Llama vault data refresh interval
```

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Include expected vs actual behavior
- Tag issues appropriately (`bug`, `enhancement`, `agent`, `security`)

## License

By contributing to ClawPunch, you agree that your contributions will be licensed under the MIT License.
