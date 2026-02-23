import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAgentConfig } from "./agents";
import Anthropic from "@anthropic-ai/sdk";
import { insertConversationSchema, insertMessageSchema, insertSanctuaryPixelSchema, insertMoltbookAgentSchema, insertPredictionSchema, insertPredictionBetSchema, insertTransactionSchema } from "@shared/schema";
import { scanSolanaToken } from "./solanaScanner";

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

  // === MOLTBOOK INTEGRATION (Real API: https://www.moltbook.com/api/v1) ===
  const MOLTBOOK_API = "https://www.moltbook.com/api/v1";

  const moltFetch = async (path: string, opts: RequestInit = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${MOLTBOOK_API}${path}`, { ...opts, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (e: any) {
      clearTimeout(timer);
      throw e;
    }
  };

  const solveVerificationChallenge = (challengeText: string): string => {
    const cleaned = challengeText.replace(/[\[\]^\/\-{}()\\]/g, '').replace(/\s+/g, ' ').toLowerCase();
    const wordToNum: Record<string, number> = {
      zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
      eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,
      eighteen:18,nineteen:19,twenty:20,twentyone:21,twentytwo:22,twentythree:23,
      twentyfour:24,twentyfive:25,thirty:30,thirtyfive:35,forty:40,fortyfive:45,
      fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,
      thousand:1000,million:1000000
    };
    const numbers: number[] = [];
    const words = cleaned.split(/\s+/);
    for (const w of words) {
      if (wordToNum[w] !== undefined) numbers.push(wordToNum[w]);
      else if (/^\d+(\.\d+)?$/.test(w)) numbers.push(parseFloat(w));
    }
    if (numbers.length < 2) return "0.00";
    const a = numbers[0], b = numbers[1];
    let result = 0;
    if (cleaned.includes('plus') || cleaned.includes('adds') || cleaned.includes('gains') || cleaned.includes('increases by') || cleaned.includes('more')) {
      result = a + b;
    } else if (cleaned.includes('minus') || cleaned.includes('slows by') || cleaned.includes('loses') || cleaned.includes('decreases by') || cleaned.includes('less') || cleaned.includes('subtracts') || cleaned.includes('drops')) {
      result = a - b;
    } else if (cleaned.includes('times') || cleaned.includes('multiplied') || cleaned.includes('multiplies')) {
      result = a * b;
    } else if (cleaned.includes('divided') || cleaned.includes('splits into') || cleaned.includes('per')) {
      result = b !== 0 ? a / b : 0;
    } else {
      result = a + b;
    }
    return result.toFixed(2);
  };

  app.get("/api/moltbook/agents", async (_req, res) => {
    try {
      const agents = await storage.getAllMoltbookAgents();
      res.json(agents.map(a => ({ ...a, apiKey: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/moltbook/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getMoltbookAgent(parseInt(req.params.id));
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      res.json({ ...agent, apiKey: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.get("/api/moltbook/agents/:id/logs", async (req, res) => {
    try {
      const logs = await storage.getTaskLogsByAgent(parseInt(req.params.id));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/moltbook/agents/register", async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: "Agent name is required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);

      const agentSlug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
      send({ stage: "init", message: `Registering "${agentSlug}" on Moltbook Network...` });

      let registerRes;
      try {
        registerRes = await moltFetch("/agents/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: agentSlug, description: description || `${name} - Monkey OS agent` }),
        }, 20000);
      } catch (e: any) {
        const msg = e.name === 'AbortError'
          ? "Moltbook API timed out (20s). Their server may be slow — try again."
          : `Could not reach Moltbook: ${e.message}`;
        send({ stage: "error", message: msg });
        res.end();
        return;
      }

      if (!registerRes.ok) {
        let errMsg = `HTTP ${registerRes.status}`;
        let retryInfo = "";
        try {
          const j = await registerRes.json();
          errMsg = j.message || errMsg;
          if (j.retry_after_seconds) retryInfo = ` Resets in ${Math.ceil(j.retry_after_seconds / 3600)}h.`;
          if (j.reset_at) retryInfo = ` Resets at ${new Date(j.reset_at).toLocaleString()}.`;
        } catch {}
        send({ stage: "error", message: `Moltbook error: ${errMsg}.${retryInfo}` });
        res.end();
        return;
      }

      const data = await registerRes.json();
      const agentData = data.agent || data;
      const apiKey = agentData.api_key || "";
      const claimUrl = agentData.claim_url || "";
      const verificationCode = agentData.verification_code || "";
      const profileUrl = `https://www.moltbook.com/u/${agentSlug}`;
      const apiKeyPrefix = apiKey.slice(0, 16);

      send({ stage: "registered", message: `Registered on Moltbook!` });
      send({ stage: "keys", message: `API Key: ${apiKeyPrefix}...` });
      send({ stage: "claim", message: `Claim URL: ${claimUrl}`, claimUrl });
      send({ stage: "verify", message: `Verification: ${verificationCode}` });

      const agent = await storage.createMoltbookAgent({
        name: agentSlug,
        type: "agent",
        capabilities: description || "general",
        apiKey,
        apiKeyPrefix,
        status: "pending_claim",
        claimUrl,
        verificationCode,
        moltbookAgentId: null,
        profileUrl,
        description: description || "",
        postsCount: 0,
      });

      await storage.createTaskLog({
        agentId: agent.id,
        taskType: "registration",
        description: `Registered on Moltbook. Claim: ${claimUrl}`,
        status: "completed",
        durationMs: 0,
      });

      send({
        stage: "done",
        message: `"${agentSlug}" registered on Moltbook! Send the claim URL to your human to activate.`,
        agent: { ...agent, apiKey: undefined },
        claimUrl,
        verificationCode,
      });
      res.end();
    } catch (error: any) {
      console.error("[moltbook register]", error?.message || error);
      res.write(`data: ${JSON.stringify({ stage: "error", message: `Registration failed: ${error?.message}` })}\n\n`);
      res.end();
    }
  });

  app.get("/api/moltbook/agents/:id/status", async (req, res) => {
    try {
      const agent = await storage.getMoltbookAgent(parseInt(req.params.id));
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      if (!agent.apiKey) {
        return res.json({ status: agent.status });
      }

      const statusRes = await moltFetch("/agents/status", {
        headers: { "Authorization": `Bearer ${agent.apiKey}` },
      });
      if (statusRes.ok) {
        const data = await statusRes.json();
        const newStatus = data.status === "claimed" ? "active" : data.status || agent.status;
        if (newStatus !== agent.status) {
          await storage.updateMoltbookAgent(agent.id, { status: newStatus });
        }
        return res.json({ ...data, dbStatus: newStatus });
      }
      res.json({ status: agent.status });
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  });

  app.get("/api/moltbook/agents/:id/profile", async (req, res) => {
    try {
      const agent = await storage.getMoltbookAgent(parseInt(req.params.id));
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      if (!agent.apiKey) {
        return res.json({ agent: { name: agent.name, description: agent.description } });
      }

      const profileRes = await moltFetch("/agents/me", {
        headers: { "Authorization": `Bearer ${agent.apiKey}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        return res.json(data);
      }
      res.json({ agent: { name: agent.name, description: agent.description } });
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  });

  app.post("/api/moltbook/agents/:id/post", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { submolt, title, content } = req.body;
      if (!title || !content) return res.status(400).json({ error: "Title and content required" });

      const agent = await storage.getMoltbookAgent(id);
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      if (!agent.apiKey) return res.status(400).json({ error: "Agent has no API key" });

      const postRes = await moltFetch("/posts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${agent.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submolt: submolt || "general", title, content }),
      });

      const postData = await postRes.json();

      if (!postRes.ok) {
        return res.status(postRes.status).json({ error: postData.message || postData.error || "Post failed" });
      }

      if (postData.verification_required && postData.post?.verification) {
        const v = postData.post.verification;
        const answer = solveVerificationChallenge(v.challenge_text);
        
        try {
          const verifyRes = await moltFetch("/verify", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${agent.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ verification_code: v.verification_code, answer }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            await storage.updateMoltbookAgent(id, { postsCount: (agent.postsCount || 0) + 1 });
            await storage.createTaskLog({
              agentId: id, taskType: "post",
              description: `Posted to m/${submolt || 'general'}: ${title} (verified)`,
              status: "completed", durationMs: 0,
            });
            return res.json({ success: true, post: postData.post, verified: true });
          } else {
            await storage.createTaskLog({
              agentId: id, taskType: "post",
              description: `Post verification failed: ${verifyData.error}`,
              status: "failed", durationMs: 0,
            });
            return res.json({ success: false, error: "Verification failed", details: verifyData });
          }
        } catch (verifyErr: any) {
          return res.status(500).json({ error: `Verification request failed: ${verifyErr.message}` });
        }
      }

      await storage.updateMoltbookAgent(id, { postsCount: (agent.postsCount || 0) + 1 });
      await storage.createTaskLog({
        agentId: id, taskType: "post",
        description: `Posted to m/${submolt || 'general'}: ${title}`,
        status: "completed", durationMs: 0,
      });
      res.json({ success: true, post: postData.post || postData });
    } catch (error: any) {
      res.status(500).json({ error: `Failed to post: ${error?.message}` });
    }
  });

  app.get("/api/moltbook/feed", async (req, res) => {
    try {
      const sort = (req.query.sort as string) || "hot";
      const limit = parseInt(req.query.limit as string) || 20;
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : null;

      let apiKey = "";
      if (agentId) {
        const agent = await storage.getMoltbookAgent(agentId);
        if (agent?.apiKey) apiKey = agent.apiKey;
      }

      const headers: Record<string, string> = {};
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const feedRes = await moltFetch(`/posts?sort=${sort}&limit=${limit}`, { headers });
      if (!feedRes.ok) {
        const errData = await feedRes.json().catch(() => ({}));
        return res.status(feedRes.status).json({ error: errData.message || "Failed to fetch feed" });
      }
      res.json(await feedRes.json());
    } catch (error: any) {
      res.status(500).json({ error: `Feed error: ${error?.message}` });
    }
  });

  app.get("/api/moltbook/submolts", async (req, res) => {
    try {
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : null;
      let apiKey = "";
      if (agentId) {
        const agent = await storage.getMoltbookAgent(agentId);
        if (agent?.apiKey) apiKey = agent.apiKey;
      }
      const headers: Record<string, string> = {};
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const subRes = await moltFetch("/submolts", { headers });
      if (!subRes.ok) return res.status(subRes.status).json({ error: "Failed to fetch submolts" });
      res.json(await subRes.json());
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  });

  app.post("/api/moltbook/agents/:id/upvote/:postId", async (req, res) => {
    try {
      const agent = await storage.getMoltbookAgent(parseInt(req.params.id));
      if (!agent?.apiKey || agent.apiKey.startsWith("local_"))
        return res.status(400).json({ error: "Need a real Moltbook agent" });

      const voteRes = await moltFetch(`/posts/${req.params.postId}/upvote`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${agent.apiKey}` },
      });
      res.json(await voteRes.json());
    } catch (error: any) {
      res.status(500).json({ error: error?.message });
    }
  });

  app.delete("/api/moltbook/agents/:id", async (req, res) => {
    try {
      await storage.deleteMoltbookAgent(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete agent" });
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

      res.write(`data: ${JSON.stringify({ status: "scanning", message: "Fetching on-chain data from Solana mainnet..." })}\n\n`);

      const onChainData = await scanSolanaToken(contractAddress);

      res.write(`data: ${JSON.stringify({ status: "scanning", message: "Analyzing token authorities and holder distribution..." })}\n\n`);

      let safetyScore = 50;
      let verdict: string = "CAUTION";
      let lpStatus: string = "UNKNOWN";

      if (!onChainData.isValidAddress) {
        safetyScore = 0;
        verdict = "DANGER";
        lpStatus = "UNKNOWN";
      } else if (!onChainData.isToken) {
        safetyScore = 10;
        verdict = "DANGER";
        lpStatus = "NOT_A_TOKEN";
      } else {
        let score = 100;

        if (onChainData.mintAuthority === "ACTIVE") score -= 30;
        if (onChainData.freezeAuthority === "ACTIVE") score -= 20;

        if (onChainData.holderDistribution === "WHALE_HEAVY") score -= 25;
        else if (onChainData.holderDistribution === "CONCENTRATED") score -= 15;

        if (onChainData.lpInfo.startsWith("LOCKED_IN_LP")) {
          lpStatus = "LOCKED";
          score += 5;
        } else if (onChainData.lpInfo === "NO_LP_FOUND") {
          lpStatus = "UNLOCKED";
          score -= 10;
        } else {
          lpStatus = onChainData.lpInfo;
        }

        safetyScore = Math.max(0, Math.min(100, score));

        if (safetyScore >= 70) verdict = "SAFE";
        else if (safetyScore >= 40) verdict = "CAUTION";
        else if (safetyScore >= 20) verdict = "DANGER";
        else verdict = "HIGH_RISK";
      }

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 512,
        system: `You are a Solana token security analyst. You are given REAL on-chain data that was just fetched from Solana mainnet. Based on this data, provide a token name if you recognize the address, and confirm the analysis. Return ONLY valid JSON:
{
  "tokenName": "string (recognized name or 'Unknown Token')"
}`,
        messages: [{ role: "user", content: `Contract: ${contractAddress}\nOn-chain data: mint authority ${onChainData.mintAuthority}, freeze authority ${onChainData.freezeAuthority}, ${onChainData.holderCount} top holders found, distribution: ${onChainData.holderDistribution}, LP: ${onChainData.lpInfo}, supply: ${onChainData.supply}, decimals: ${onChainData.decimals}${onChainData.tokenName ? `, metadata name: ${onChainData.tokenName}` : ''}${onChainData.error ? `, error: ${onChainData.error}` : ''}` }],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      let tokenName = onChainData.tokenName || "Unknown Token";
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.tokenName) tokenName = parsed.tokenName;
        }
      } catch {}

      const scan = await storage.createSecurityScan({
        contractAddress,
        tokenName,
        safetyScore,
        mintAuth: onChainData.isToken ? onChainData.mintAuthority : "UNKNOWN",
        freezeAuth: onChainData.isToken ? onChainData.freezeAuthority : "UNKNOWN",
        lpLocked: lpStatus,
        holderDistribution: onChainData.isToken ? onChainData.holderDistribution : "UNKNOWN",
        verdict,
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

  const normalizeRepoUrl = (url: string): string => {
    let cleaned = url.trim().replace(/\/+$/, '').replace(/\.git$/, '');
    cleaned = cleaned.replace(/^https?:\/\//i, '');
    cleaned = cleaned.replace(/^(www\.)?github\.com\//i, '');
    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return cleaned;
  };

  const fetchGitHubData = async (owner: string, repo: string) => {
    try {
      const [repoRes, commitsRes, contributorsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'MonkeyOS-RepoApe' }
        }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'MonkeyOS-RepoApe' }
        }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`, {
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'MonkeyOS-RepoApe' }
        }),
      ]);

      if (!repoRes.ok) return null;

      const repoData = await repoRes.json();

      let commitCount = 0;
      const linkHeader = commitsRes.headers.get('link');
      if (linkHeader) {
        const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
        if (lastMatch) commitCount = parseInt(lastMatch[1]);
      }
      if (commitCount === 0) {
        const commits = await commitsRes.json();
        commitCount = Array.isArray(commits) ? commits.length : 0;
      }

      let contributorCount = 0;
      if (contributorsRes.ok) {
        const contributors = await contributorsRes.json();
        contributorCount = Array.isArray(contributors) ? contributors.length : 0;
      }

      return {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description || '',
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        openIssues: repoData.open_issues_count || 0,
        language: repoData.language || 'Unknown',
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
        archived: repoData.archived,
        fork: repoData.fork,
        license: repoData.license?.spdx_id || 'None',
        commitCount,
        contributorCount,
        size: repoData.size,
        defaultBranch: repoData.default_branch,
        hasWiki: repoData.has_wiki,
        topics: repoData.topics || [],
      };
    } catch {
      return null;
    }
  };

  app.post("/api/repos/scan", async (req, res) => {
    try {
      const { repoUrl } = req.body;
      if (!repoUrl) return res.status(400).json({ error: "Repo URL is required" });

      const normalized = normalizeRepoUrl(repoUrl);
      const parts = normalized.split('/');
      if (parts.length < 2) return res.status(400).json({ error: "Invalid repo URL. Use format: github.com/owner/repo" });
      const [owner, repo] = parts;

      const existing = await storage.getRepoScanByUrl(normalized);
      if (existing) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.write(`data: ${JSON.stringify({ status: "scanning", message: "Found cached analysis..." })}\n\n`);
        res.write(`data: ${JSON.stringify({ status: "complete", scan: existing })}\n\n`);
        res.end();
        return;
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ status: "scanning", message: "Fetching repository data from GitHub..." })}\n\n`);

      const ghData = await fetchGitHubData(owner, repo);

      if (!ghData) {
        res.write(`data: ${JSON.stringify({ status: "scanning", message: "Repository not found or private. Generating analysis from URL..." })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ status: "scanning", message: `Found ${ghData.fullName} - ${ghData.stars} stars, ${ghData.commitCount} commits. Analyzing...` })}\n\n`);
      }

      let legitScore: number;
      let findings: string;
      let recommendation: string;
      let commitCount: number;
      let contributorCount: number;
      let repoName: string;

      if (ghData) {
        commitCount = ghData.commitCount;
        contributorCount = ghData.contributorCount;
        repoName = ghData.name;

        let score = 50;

        if (ghData.stars >= 1000) score += 15;
        else if (ghData.stars >= 100) score += 10;
        else if (ghData.stars >= 10) score += 5;
        else score -= 5;

        if (commitCount >= 500) score += 15;
        else if (commitCount >= 100) score += 10;
        else if (commitCount >= 20) score += 5;
        else score -= 10;

        if (contributorCount >= 10) score += 10;
        else if (contributorCount >= 3) score += 5;
        else score -= 5;

        if (ghData.license !== 'None') score += 5;
        if (ghData.archived) score -= 15;
        if (ghData.fork) score -= 10;

        const now = new Date();
        const lastPush = new Date(ghData.pushedAt);
        const daysSincePush = (now.getTime() - lastPush.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePush > 365) score -= 15;
        else if (daysSincePush > 180) score -= 10;
        else if (daysSincePush > 30) score -= 5;
        else score += 5;

        const created = new Date(ghData.createdAt);
        const ageMonths = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (ageMonths < 1 && commitCount < 10) score -= 10;

        legitScore = Math.max(0, Math.min(100, score));

        const parts: string[] = [];
        parts.push(`${ghData.language || 'Unknown language'} project with ${ghData.stars.toLocaleString()} stars, ${ghData.forks} forks.`);
        if (daysSincePush < 7) parts.push(`Actively maintained (last push ${Math.floor(daysSincePush)}d ago).`);
        else if (daysSincePush > 180) parts.push(`Stale project — last push ${Math.floor(daysSincePush)} days ago.`);
        if (ghData.archived) parts.push("WARNING: Repository is archived.");
        if (ghData.fork) parts.push("This is a fork, not an original project.");
        if (contributorCount <= 1) parts.push("Single contributor — higher centralization risk.");
        if (ghData.license === 'None') parts.push("No license detected.");
        if (ghData.topics.length > 0) parts.push(`Topics: ${ghData.topics.slice(0, 5).join(', ')}.`);

        findings = parts.join(' ');

        if (legitScore >= 75) recommendation = "HIGH_QUALITY";
        else if (legitScore >= 55) recommendation = "LEGIT";
        else if (legitScore >= 35) recommendation = "SUSPICIOUS";
        else recommendation = "LIKELY_LARP";

      } else {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 512,
          temperature: 0,
          system: `You analyze GitHub repositories for crypto projects. The repo could not be fetched from the GitHub API (it may be private, deleted, or the URL is wrong). Based on the URL alone, provide your best assessment. Return ONLY valid JSON:
{
  "repoName": "string",
  "legitScore": number (0-100),
  "commitCount": 0,
  "contributorCount": 0,
  "findings": "string (2-3 sentences)",
  "recommendation": "SUSPICIOUS" or "LIKELY_LARP"
}`,
          messages: [{ role: "user", content: `Analyze repo URL (could not fetch from GitHub API): ${normalized}` }],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        let scanData;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          scanData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
        } catch {
          scanData = {
            repoName: repo,
            legitScore: 25,
            commitCount: 0,
            contributorCount: 0,
            findings: "Repository could not be accessed via GitHub API. It may be private, deleted, or the URL is incorrect. Manual verification recommended.",
            recommendation: "SUSPICIOUS",
          };
        }

        repoName = scanData.repoName || repo;
        legitScore = scanData.legitScore ?? 25;
        commitCount = scanData.commitCount ?? 0;
        contributorCount = scanData.contributorCount ?? 0;
        findings = scanData.findings || "Repository could not be accessed.";
        recommendation = scanData.recommendation || "SUSPICIOUS";
      }

      const scan = await storage.createRepoScan({
        repoUrl: normalized,
        repoName,
        legitScore,
        commitCount,
        contributorCount,
        findings,
        recommendation,
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

  // === ATTENTION POSITIONS (Trend Puncher) — Real CoinGecko market data ===

  const NARRATIVE_COINS: Record<string, { coins: string; category: string }> = {
    "AI & Machine Learning": { coins: "render-token,fetch-ai,ocean-protocol,singularitynet,bittensor", category: "ai" },
    "Solana Ecosystem": { coins: "solana,raydium,jupiter-exchange-solana,jito-governance-token,marinade", category: "l1" },
    "Memecoins": { coins: "dogecoin,shiba-inu,pepe,bonk,dogwifcoin", category: "meme" },
    "DePIN": { coins: "helium,hivemapper,render-token,filecoin,arweave", category: "infra" },
    "RWA Tokenization": { coins: "ondo-finance,centrifuge,maple-finance,goldfinch,polymesh", category: "rwa" },
    "Layer 2 & ZK": { coins: "starknet,polygon-ecosystem-token,arbitrum,optimism,zksync", category: "l2" },
    "DeFi Blue Chips": { coins: "uniswap,aave,maker,lido-dao,curve-dao-token", category: "defi" },
    "Gaming & Metaverse": { coins: "the-sandbox,axie-infinity,immutable-x,gala,illuvium", category: "gaming" },
  };

  let lastMarketRefresh = 0;
  const REFRESH_INTERVAL = 120_000;

  const fetchCoinGeckoData = async (): Promise<Record<string, any> | null> => {
    const allCoinIds = [...new Set(Object.values(NARRATIVE_COINS).flatMap(n => n.coins.split(',')))].join(',');
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${allCoinIds}&order=market_cap_desc&per_page=250&sparkline=false&price_change_percentage=24h`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const map: Record<string, any> = {};
      for (const coin of data) {
        map[coin.id] = coin;
      }
      return map;
    } catch (e) {
      console.error("[TrendPuncher] CoinGecko fetch error:", e);
      return null;
    }
  };

  const computeNarrativeMetrics = (narrative: string, coinMap: Record<string, any>) => {
    const config = NARRATIVE_COINS[narrative];
    if (!config) return null;
    const coinIds = config.coins.split(',');
    const coins = coinIds.map(id => coinMap[id]).filter(Boolean);
    if (coins.length === 0) return null;

    const totalMarketCap = coins.reduce((s: number, c: any) => s + (c.market_cap || 0), 0);
    const totalVolume = coins.reduce((s: number, c: any) => s + (c.total_volume || 0), 0);
    const avgPriceChange = coins.reduce((s: number, c: any) => s + (c.price_change_percentage_24h || 0), 0) / coins.length;

    const volToCapRatio = totalMarketCap > 0 ? (totalVolume / totalMarketCap) * 100 : 0;
    let virality = Math.min(99, Math.max(5, Math.round(
      50 + (avgPriceChange * 2) + (volToCapRatio * 3)
    )));

    const momentum = avgPriceChange > 2 ? "up" : avgPriceChange < -2 ? "down" : "flat";

    const priceIndex = totalMarketCap > 0 ? parseFloat((totalVolume / 1e8).toFixed(2)) : 0.01;

    return {
      currentPrice: Math.max(0.01, priceIndex),
      virality,
      momentum,
      priceChange24h: parseFloat(avgPriceChange.toFixed(2)),
      volume24h: totalVolume,
      marketCap: totalMarketCap,
    };
  };

  const refreshNarrativeData = async () => {
    const now = Date.now();
    if (now - lastMarketRefresh < REFRESH_INTERVAL) return;
    lastMarketRefresh = now;

    const coinMap = await fetchCoinGeckoData();
    if (!coinMap) return;

    const positions = await storage.getAllAttentionPositions();

    for (const pos of positions) {
      const metrics = computeNarrativeMetrics(pos.narrative, coinMap);
      if (!metrics) continue;

      await storage.updateAttentionMarketData(pos.id, {
        currentPrice: metrics.currentPrice,
        virality: metrics.virality,
        momentum: metrics.momentum,
        priceChange24h: metrics.priceChange24h,
        volume24h: metrics.volume24h,
        marketCap: metrics.marketCap,
      });
    }
  };

  app.get("/api/attention/positions", async (_req, res) => {
    try {
      let positions = await storage.getAllAttentionPositions();

      if (positions.length === 0) {
        const coinMap = await fetchCoinGeckoData();

        for (const [narrative, config] of Object.entries(NARRATIVE_COINS)) {
          const metrics = coinMap ? computeNarrativeMetrics(narrative, coinMap) : null;
          await storage.createAttentionPosition({
            narrative,
            shares: 0,
            avgPrice: metrics?.currentPrice || 1.0,
            currentPrice: metrics?.currentPrice || 1.0,
            virality: metrics?.virality || 50,
            momentum: metrics?.momentum || "flat",
            category: config.category,
            coinIds: config.coins,
            priceChange24h: metrics?.priceChange24h || 0,
            volume24h: metrics?.volume24h || 0,
            marketCap: metrics?.marketCap || 0,
          });
        }
        positions = await storage.getAllAttentionPositions();
      } else {
        refreshNarrativeData().catch(() => {});
      }

      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attention positions" });
    }
  });

  app.post("/api/attention/refresh", async (_req, res) => {
    try {
      lastMarketRefresh = 0;
      await refreshNarrativeData();
      const positions = await storage.getAllAttentionPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh market data" });
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
