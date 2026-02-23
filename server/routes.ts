import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAgentConfig } from "./agents";
import OpenAI from "openai";
import { insertConversationSchema, insertMessageSchema, insertSanctuaryPixelSchema } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
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
      if (!agentConfig) {
        return res.status(404).json({ error: "Agent not found" });
      }
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

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content is required" });
      }

      const conv = await storage.getConversation(conversationId);
      if (!conv) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const agentConfig = getAgentConfig(conv.agentId);
      if (!agentConfig) {
        return res.status(404).json({ error: "Agent not found" });
      }

      await storage.createMessage({
        conversationId,
        role: "user",
        content,
      });

      const history = await storage.getMessagesByConversation(conversationId);
      const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: agentConfig.systemPrompt },
        ...history.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 1024,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
      });

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
      console.error("Error fetching pixels:", error);
      res.status(500).json({ error: "Failed to fetch pixels" });
    }
  });

  app.post("/api/sanctuary/pixels", async (req, res) => {
    try {
      const parsed = insertSanctuaryPixelSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid pixel data", details: parsed.error.issues });
      }
      const existing = await storage.getSanctuaryPixel(parsed.data.plotIndex);
      if (existing) {
        return res.status(409).json({ error: "Pixel already claimed" });
      }
      const pixel = await storage.claimSanctuaryPixel(parsed.data);
      res.status(201).json(pixel);
    } catch (error) {
      console.error("Error claiming pixel:", error);
      res.status(500).json({ error: "Failed to claim pixel" });
    }
  });

  return httpServer;
}
