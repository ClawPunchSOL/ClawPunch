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

  app.get("/moltbook/agents/:slug", async (req, res) => {
    try {
      const agents = await storage.getAllMoltbookAgents();
      const agent = agents.find(a => a.endpoint === `/moltbook/agents/${req.params.slug}`);
      if (!agent) return res.status(404).json({ error: "Agent not found on Moltbook Network", slug: req.params.slug });

      const logs = await storage.getTaskLogsByAgent(agent.id);
      const uptime = Math.floor((Date.now() - new Date(agent.registeredAt).getTime()) / 1000);
      const successRate = agent.tasksCompleted + agent.tasksFailed > 0
        ? Math.round((agent.tasksCompleted / (agent.tasksCompleted + agent.tasksFailed)) * 100)
        : 100;

      res.setHeader("Content-Type", "text/html");
      res.send(`<!DOCTYPE html>
<html><head><title>${agent.name} | Moltbook Network</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#e0e0e0;font-family:'Courier New',monospace;padding:20px}
.container{max-width:640px;margin:0 auto}
h1{color:#60a5fa;font-size:18px;margin-bottom:4px}
.status{display:inline-block;padding:2px 8px;font-size:11px;font-weight:bold;margin-bottom:16px;
  ${agent.status === 'active' ? 'background:#22c55e20;color:#22c55e;border:1px solid #22c55e50' : 'background:#ef444420;color:#ef4444;border:1px solid #ef444450'}}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.card{background:#111;border:1px solid #333;padding:10px}
.card .label{font-size:9px;color:#666;text-transform:uppercase;margin-bottom:2px}
.card .value{font-size:13px;color:#fff}
.card .value.blue{color:#60a5fa}
.card .value.green{color:#22c55e}
.card .value.yellow{color:#eab308}
.log{background:#111;border:1px solid #333;padding:8px;margin-top:4px;font-size:11px}
.log .type{color:#60a5fa;font-weight:bold}
.log .ok{color:#22c55e}.log .fail{color:#ef4444}
.log .time{color:#666;font-size:10px}
h2{font-size:12px;color:#666;margin:16px 0 8px;text-transform:uppercase;letter-spacing:1px}
.footer{margin-top:24px;padding-top:12px;border-top:1px solid #222;font-size:10px;color:#444;text-align:center}
</style></head><body>
<div class="container">
<h1>⬡ ${agent.name}</h1>
<div class="status">${agent.status.toUpperCase()}</div>
<div class="grid">
<div class="card"><div class="label">Type</div><div class="value">${agent.type}</div></div>
<div class="card"><div class="label">Region</div><div class="value blue">${agent.region}</div></div>
<div class="card"><div class="label">API Key</div><div class="value">${agent.apiKeyPrefix}••••••</div></div>
<div class="card"><div class="label">Uptime</div><div class="value green">${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m</div></div>
<div class="card"><div class="label">Tasks Completed</div><div class="value green">${agent.tasksCompleted}</div></div>
<div class="card"><div class="label">Tasks Failed</div><div class="value" style="color:${agent.tasksFailed > 0 ? '#ef4444' : '#22c55e'}">${agent.tasksFailed}</div></div>
<div class="card"><div class="label">Success Rate</div><div class="value yellow">${successRate}%</div></div>
<div class="card"><div class="label">Capabilities</div><div class="value">${agent.capabilities}</div></div>
</div>
${logs.length > 0 ? `<h2>Recent Tasks (${logs.length})</h2>
${logs.slice(0, 10).map(l => `<div class="log">
<span class="type">${l.taskType.toUpperCase()}</span>
<span class="${l.status === 'completed' ? 'ok' : 'fail'}"> ${l.status === 'completed' ? '✓' : '✗'}</span>
<span class="time"> ${l.durationMs}ms</span>
<div style="margin-top:4px;color:#999">${l.description.slice(0, 200)}</div>
</div>`).join('')}` : ''}
<div class="footer">Moltbook Network v1.0 | Endpoint: ${agent.endpoint} | Registered: ${new Date(agent.registeredAt).toISOString()}</div>
</div></body></html>`);
    } catch (error) {
      res.status(500).json({ error: "Failed to load agent status page" });
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

  app.get("/api/moltbook/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getMoltbookAgent(parseInt(req.params.id));
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      res.json(agent);
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

  app.post("/api/moltbook/agents/deploy", async (req, res) => {
    try {
      const { name, type, capabilities, region } = req.body;
      if (!name || !type) return res.status(400).json({ error: "Name and type are required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);

      send({ stage: "init", message: "Initializing deployment pipeline..." });
      await new Promise(r => setTimeout(r, 400));

      const apiKeyPrefix = `molt_${Math.random().toString(36).slice(2, 10)}`;
      const agentSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
      const endpoint = `/moltbook/agents/${agentSlug}`;
      const selectedRegion = region || ["us-east-1", "eu-west-1", "ap-southeast-1"][Math.floor(Math.random() * 3)];

      send({ stage: "provisioning", message: `Provisioning compute node in ${selectedRegion}...` });
      await new Promise(r => setTimeout(r, 600));

      send({ stage: "keys", message: `Generating API key: ${apiKeyPrefix}••••••` });
      await new Promise(r => setTimeout(r, 400));

      send({ stage: "configuring", message: "Configuring agent runtime and capabilities..." });
      await new Promise(r => setTimeout(r, 500));

      let aiConfig = "";
      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 300,
          messages: [{ role: "user", content: `You are the Moltbook Network deployment system. An agent named "${name}" (type: ${type}, capabilities: ${capabilities || "general"}) is being deployed to ${selectedRegion}. Generate a brief deployment config report (3-5 lines) in a terminal/log style. Include: allocated resources (vCPU, RAM), network endpoint, security policy, and heartbeat interval. Keep it terse and technical like real infrastructure logs. No markdown.` }],
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            aiConfig += event.delta.text;
            send({ stage: "configuring", message: event.delta.text, streaming: true });
          }
        }
      } catch {
        aiConfig = `Resources: 2 vCPU / 4GB RAM | Endpoint: ${endpoint} | Security: mTLS | Heartbeat: 30s`;
        send({ stage: "configuring", message: aiConfig });
      }

      send({ stage: "deploying", message: "Deploying container to Moltbook Network..." });
      await new Promise(r => setTimeout(r, 600));

      send({ stage: "healthcheck", message: "Running health check..." });
      await new Promise(r => setTimeout(r, 400));

      const agent = await storage.createMoltbookAgent({
        name,
        type,
        capabilities: capabilities || "general",
        apiKeyPrefix,
        status: "active",
        endpoint,
        region: selectedRegion,
        tasksCompleted: 0,
        tasksFailed: 0,
        uptimeSeconds: 0,
      });

      await storage.createTaskLog({
        agentId: agent.id,
        taskType: "deployment",
        description: `Agent deployed to ${selectedRegion} | Endpoint: ${endpoint}`,
        status: "completed",
        durationMs: 2400,
      });

      send({ stage: "live", message: `Agent "${name}" is LIVE on Moltbook Network`, agent });
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: "Deployment failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/moltbook/agents/:id/dispatch", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { taskType, prompt } = req.body;
      if (!taskType) return res.status(400).json({ error: "Task type is required" });

      const agent = await storage.getMoltbookAgent(id);
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      if (agent.status !== "active") return res.status(400).json({ error: "Agent is not active" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);
      const startTime = Date.now();

      send({ stage: "dispatching", message: `Dispatching "${taskType}" task to ${agent.name}...` });
      await new Promise(r => setTimeout(r, 300));

      send({ stage: "executing", message: `${agent.name} executing on ${agent.endpoint}...` });

      let result = "";
      try {
        const taskPrompts: Record<string, string> = {
          scan: `You are ${agent.name}, a ${agent.type} agent on the Moltbook Network. Execute a blockchain scan task. Report findings in 3-5 terse lines. Include: blocks scanned, anomalies found, risk level. No markdown, terminal style.`,
          monitor: `You are ${agent.name}, a ${agent.type} agent on the Moltbook Network. Execute a monitoring sweep. Report: active pools checked, price deviations detected, whale movements, alert level. 3-5 terse lines, terminal style. No markdown.`,
          trade: `You are ${agent.name}, a ${agent.type} agent on the Moltbook Network. Execute a trade analysis task. Report: opportunities identified, risk/reward ratios, recommended action. 3-5 terse lines, terminal style. No markdown.`,
          analyze: `You are ${agent.name}, a ${agent.type} agent on the Moltbook Network. Execute an analysis task. ${prompt || 'Analyze current market conditions.'}. Report findings in 3-5 terse lines, terminal style. No markdown.`,
        };

        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 300,
          messages: [{ role: "user", content: taskPrompts[taskType] || taskPrompts.analyze }],
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            result += event.delta.text;
            send({ stage: "executing", message: event.delta.text, streaming: true });
          }
        }
      } catch (aiError: any) {
        console.error("[dispatch] AI error:", aiError?.message || aiError);
        result = `Task completed with default handler. No anomalies detected.`;
        send({ stage: "executing", message: result });
      }

      const durationMs = Date.now() - startTime;
      const success = Math.random() > 0.05;

      const log = await storage.createTaskLog({
        agentId: agent.id,
        taskType,
        description: result.slice(0, 500),
        status: success ? "completed" : "failed",
        durationMs,
      });

      await storage.updateMoltbookAgent(agent.id, {
        tasksCompleted: agent.tasksCompleted + (success ? 1 : 0),
        tasksFailed: agent.tasksFailed + (success ? 0 : 1),
        lastHeartbeat: new Date(),
      });

      send({ stage: "complete", message: `Task ${success ? 'completed' : 'failed'} in ${durationMs}ms`, log, success });
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: "Task dispatch failed" })}\n\n`);
      res.end();
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
