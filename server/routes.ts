import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAgentConfig } from "./agents";
import Anthropic from "@anthropic-ai/sdk";
import { insertConversationSchema, insertMessageSchema, insertSanctuaryPixelSchema, insertMoltbookAgentSchema, insertPredictionSchema, insertPredictionBetSchema, insertTransactionSchema } from "@shared/schema";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/agents/:agentId/conversations", async (req, res) => {
    try {
      const convs = await storage.getConversationsByAgent(req.params.agentId);
      res.json(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/agents/:agentId/conversations", async (req, res) => {
    try {
      const agentConfig = getAgentConfig(req.params.agentId);
      if (!agentConfig) return res.status(404).json({ error: "Agent not found" });
      const conv = await storage.createConversation({
        agentId: req.params.agentId,
        title: req.body.title || `${agentConfig.name} Session`,
      });
      res.status(201).json(conv);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const msgs = await storage.getMessagesByConversation(parseInt(req.params.id));
      res.json(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      if (!content || typeof content !== 'string') return res.status(400).json({ error: "Content is required" });

      const conv = await storage.getConversation(conversationId);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });

      const agentConfig = getAgentConfig(conv.agentId);
      if (!agentConfig) return res.status(404).json({ error: "Agent not found" });

      await storage.createMessage({ conversationId, role: "user", content });

      const history = await storage.getMessagesByConversation(conversationId);
      const chatMessages: Anthropic.MessageParam[] = history.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        system: agentConfig.systemPrompt,
        messages: chatMessages,
        max_tokens: 1024,
      });

      let fullResponse = "";

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }

      await storage.createMessage({ conversationId, role: "assistant", content: fullResponse });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      await storage.deleteConversation(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.get("/api/sanctuary/pixels", async (req, res) => {
    try {
      const pixels = await storage.getAllSanctuaryPixels();
      res.json(pixels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pixels" });
    }
  });

  app.post("/api/sanctuary/pixels", async (req, res) => {
    try {
      const parsed = insertSanctuaryPixelSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid pixel data", details: parsed.error.issues });
      const existing = await storage.getSanctuaryPixel(parsed.data.plotIndex);
      if (existing) return res.status(409).json({ error: "Pixel already claimed" });
      const pixel = await storage.claimSanctuaryPixel(parsed.data);
      res.status(201).json(pixel);
    } catch (error) {
      res.status(500).json({ error: "Failed to claim pixel" });
    }
  });

  app.get("/api/moltbook/agents", async (_req, res) => {
    try {
      const agents = await storage.getAllMoltbookAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.post("/api/moltbook/agents", async (req, res) => {
    try {
      const { name, type, capabilities } = req.body;
      if (!name || !type) return res.status(400).json({ error: "Name and type are required" });
      const apiKeyPrefix = `molt_${Math.random().toString(36).slice(2, 10)}`;
      const agent = await storage.createMoltbookAgent({
        name,
        type,
        capabilities: capabilities || "general",
        apiKeyPrefix,
        status: "active",
      });
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to register agent" });
    }
  });

  app.patch("/api/moltbook/agents/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required" });
      const agent = await storage.updateMoltbookAgentStatus(parseInt(req.params.id), status);
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  app.get("/api/predictions", async (_req, res) => {
    try {
      const preds = await storage.getAllPredictions();
      res.json(preds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  app.post("/api/predictions", async (req, res) => {
    try {
      const { title, description, category } = req.body;
      if (!title || !description) return res.status(400).json({ error: "Title and description are required" });
      const pred = await storage.createPrediction({
        title,
        description,
        category: category || "crypto",
        oddsYes: 50,
        oddsNo: 50,
        poolYes: 0,
        poolNo: 0,
        status: "active",
      });
      res.status(201).json(pred);
    } catch (error) {
      res.status(500).json({ error: "Failed to create prediction" });
    }
  });

  app.post("/api/predictions/:id/bet", async (req, res) => {
    try {
      const predictionId = parseInt(req.params.id);
      const { side, amount, walletAddress } = req.body;
      if (!side || !amount || !walletAddress) return res.status(400).json({ error: "Side, amount, and walletAddress are required" });
      if (side !== 'yes' && side !== 'no') return res.status(400).json({ error: "Side must be 'yes' or 'no'" });
      const pred = await storage.getPrediction(predictionId);
      if (!pred) return res.status(404).json({ error: "Prediction not found" });
      if (pred.status !== 'active') return res.status(400).json({ error: "Prediction is not active" });

      const bet = await storage.placeBet({ predictionId, side, amount: parseFloat(amount), walletAddress });
      await storage.updatePredictionPool(predictionId, side, parseFloat(amount));
      const updated = await storage.getPrediction(predictionId);
      res.status(201).json({ bet, prediction: updated });
    } catch (error) {
      res.status(500).json({ error: "Failed to place bet" });
    }
  });

  app.get("/api/security/scans", async (_req, res) => {
    try {
      const scans = await storage.getAllSecurityScans();
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  app.post("/api/security/scan", async (req, res) => {
    try {
      const { contractAddress } = req.body;
      if (!contractAddress) return res.status(400).json({ error: "Contract address is required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ status: "scanning", message: "Analyzing contract bytecode..." })}\n\n`);

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: `You are a Solana smart contract security analyzer. Analyze the given contract address and return ONLY valid JSON with these exact fields:
{
  "tokenName": "string (inferred token name or 'Unknown Token')",
  "safetyScore": number (0-100),
  "mintAuth": "REVOKED" or "ACTIVE" or "UNKNOWN",
  "freezeAuth": "REVOKED" or "ACTIVE" or "UNKNOWN",
  "lpLocked": "LOCKED" or "UNLOCKED" or "BURNED" or "UNKNOWN",
  "holderDistribution": "HEALTHY" or "CONCENTRATED" or "WHALE_HEAVY",
  "verdict": "SAFE" or "CAUTION" or "DANGER" or "HIGH_RISK"
}
Generate realistic but simulated analysis data. Be varied in your results - not everything should be safe.`,
        messages: [{ role: "user", content: `Analyze Solana contract: ${contractAddress}` }],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      let scanData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        scanData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      } catch {
        scanData = {
          tokenName: "Unknown Token",
          safetyScore: 45,
          mintAuth: "UNKNOWN",
          freezeAuth: "UNKNOWN",
          lpLocked: "UNKNOWN",
          holderDistribution: "UNKNOWN",
          verdict: "CAUTION",
        };
      }

      const scan = await storage.createSecurityScan({
        contractAddress,
        tokenName: scanData.tokenName || "Unknown Token",
        safetyScore: scanData.safetyScore || 50,
        mintAuth: scanData.mintAuth || "UNKNOWN",
        freezeAuth: scanData.freezeAuth || "UNKNOWN",
        lpLocked: scanData.lpLocked || "UNKNOWN",
        holderDistribution: scanData.holderDistribution || "UNKNOWN",
        verdict: scanData.verdict || "CAUTION",
      });

      res.write(`data: ${JSON.stringify({ status: "complete", scan })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Security scan error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Scan failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to perform scan" });
      }
    }
  });

  app.get("/api/repos/scans", async (_req, res) => {
    try {
      const scans = await storage.getAllRepoScans();
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repo scans" });
    }
  });

  app.post("/api/repos/scan", async (req, res) => {
    try {
      const { repoUrl } = req.body;
      if (!repoUrl) return res.status(400).json({ error: "Repo URL is required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ status: "scanning", message: "Cloning and analyzing repository..." })}\n\n`);

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: `You are a GitHub repository analyzer for crypto projects. Analyze the given repo URL and return ONLY valid JSON:
{
  "repoName": "string (repo name from URL)",
  "legitScore": number (0-100, how legitimate/real the project is),
  "commitCount": number (realistic commit count),
  "contributorCount": number (realistic contributor count),
  "findings": "string (2-3 sentence summary of key findings)",
  "recommendation": "LEGIT" or "SUSPICIOUS" or "LIKELY_LARP" or "HIGH_QUALITY"
}
Generate realistic but simulated analysis. Be varied - not everything should be good.`,
        messages: [{ role: "user", content: `Analyze GitHub repo: ${repoUrl}` }],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      let scanData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        scanData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      } catch {
        scanData = {
          repoName: repoUrl.split('/').pop() || 'unknown',
          legitScore: 50,
          commitCount: 42,
          contributorCount: 3,
          findings: "Unable to fully analyze. Manual review recommended.",
          recommendation: "SUSPICIOUS",
        };
      }

      const scan = await storage.createRepoScan({
        repoUrl,
        repoName: scanData.repoName || repoUrl.split('/').pop() || 'unknown',
        legitScore: scanData.legitScore || 50,
        commitCount: scanData.commitCount || 0,
        contributorCount: scanData.contributorCount || 0,
        findings: scanData.findings || "Analysis incomplete",
        recommendation: scanData.recommendation || "SUSPICIOUS",
      });

      res.write(`data: ${JSON.stringify({ status: "complete", scan })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Repo scan error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Scan failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to perform repo scan" });
      }
    }
  });

  // === TRANSACTIONS (Banana Bot) ===
  app.get("/api/transactions", async (_req, res) => {
    try {
      const txs = await storage.getAllTransactions();
      res.json(txs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { recipient, amount, token } = req.body;
      if (!recipient || !amount) return res.status(400).json({ error: "Recipient and amount are required" });
      const txHash = `${Math.random().toString(36).slice(2, 8)}...${Math.random().toString(36).slice(2, 6)}`;
      const tx = await storage.createTransaction({
        recipient,
        amount: parseFloat(amount),
        token: token || "USDC",
        status: "confirmed",
        txHash,
        protocol: "x402",
      });
      res.status(201).json(tx);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // === ATTENTION POSITIONS (Trend Puncher) ===
  app.get("/api/attention/positions", async (_req, res) => {
    try {
      let positions = await storage.getAllAttentionPositions();
      if (positions.length === 0) {
        const seeds = [
          { narrative: "#AI", virality: 94, momentum: "up", currentPrice: 2.45 },
          { narrative: "#Solana", virality: 87, momentum: "up", currentPrice: 1.82 },
          { narrative: "#RWA", virality: 72, momentum: "flat", currentPrice: 0.94 },
          { narrative: "#DePIN", virality: 68, momentum: "down", currentPrice: 0.67 },
          { narrative: "#Memecoins", virality: 81, momentum: "up", currentPrice: 1.23 },
          { narrative: "#ZK", virality: 59, momentum: "down", currentPrice: 0.45 },
        ];
        for (const s of seeds) {
          await storage.createAttentionPosition({
            narrative: s.narrative,
            shares: 0,
            avgPrice: s.currentPrice,
            currentPrice: s.currentPrice,
            virality: s.virality,
            momentum: s.momentum,
          });
        }
        positions = await storage.getAllAttentionPositions();
      }
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attention positions" });
    }
  });

  app.post("/api/attention/trade", async (req, res) => {
    try {
      const { narrative, action, shares: shareCount } = req.body;
      if (!narrative || !action || !shareCount) return res.status(400).json({ error: "Narrative, action, and shares are required" });
      if (action !== 'buy' && action !== 'sell') return res.status(400).json({ error: "Action must be 'buy' or 'sell'" });

      const position = await storage.getAttentionPosition(narrative);
      if (!position) return res.status(404).json({ error: "Narrative not found" });

      const qty = parseInt(shareCount);
      if (action === 'sell' && position.shares < qty) return res.status(400).json({ error: "Not enough shares" });

      const newShares = action === 'buy' ? position.shares + qty : position.shares - qty;
      const newAvgPrice = action === 'buy'
        ? ((position.avgPrice * position.shares) + (position.currentPrice * qty)) / (position.shares + qty || 1)
        : position.avgPrice;

      const updated = await storage.updateAttentionPosition(position.id, newShares, newAvgPrice);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to execute trade" });
    }
  });

  // === VAULT POSITIONS (Ape Vault) ===
  app.get("/api/vaults", async (_req, res) => {
    try {
      let vaults = await storage.getAllVaultPositions();
      if (vaults.length === 0) {
        const seeds = [
          { vaultName: "SOL-USDC", protocol: "Raydium", token: "SOL", apy: 24.5, tvl: 12400000 },
          { vaultName: "PUNCH-SOL", protocol: "Orca", token: "PUNCH", apy: 142.8, tvl: 890000 },
          { vaultName: "USDC Lending", protocol: "Meteora", token: "USDC", apy: 8.2, tvl: 45000000 },
          { vaultName: "JUP-USDC", protocol: "Raydium", token: "JUP", apy: 34.1, tvl: 5600000 },
          { vaultName: "BONK-SOL", protocol: "Orca", token: "BONK", apy: 89.3, tvl: 2100000 },
        ];
        for (const s of seeds) {
          await storage.createVaultPosition({ ...s, stakedAmount: 0 });
        }
        vaults = await storage.getAllVaultPositions();
      }
      res.json(vaults);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vaults" });
    }
  });

  app.post("/api/vaults/:id/stake", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount, action } = req.body;
      if (!amount || !action) return res.status(400).json({ error: "Amount and action required" });

      const vault = await storage.getVaultPosition(
        (await storage.getAllVaultPositions()).find(v => v.id === id)?.vaultName || ''
      );
      if (!vault) return res.status(404).json({ error: "Vault not found" });

      const qty = parseFloat(amount);
      let newStake: number;
      if (action === 'stake') {
        newStake = vault.stakedAmount + qty;
      } else if (action === 'unstake') {
        if (vault.stakedAmount < qty) return res.status(400).json({ error: "Not enough staked" });
        newStake = vault.stakedAmount - qty;
      } else {
        return res.status(400).json({ error: "Action must be 'stake' or 'unstake'" });
      }

      const updated = await storage.updateVaultStake(vault.id, newStake);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vault stake" });
    }
  });

  return httpServer;
}
