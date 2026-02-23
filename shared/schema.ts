import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const sanctuaryPixels = pgTable("sanctuary_pixels", {
  id: serial("id").primaryKey(),
  plotIndex: integer("plot_index").notNull().unique(),
  ownerName: text("owner_name").notNull(),
  color: text("color").notNull().default("#FFD700"),
  message: text("message"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const moltbookAgents = pgTable("moltbook_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  apiKeyPrefix: text("api_key_prefix").notNull(),
  capabilities: text("capabilities").notNull(),
  endpoint: text("endpoint").notNull().default("https://moltbook.network/v1"),
  region: text("region").notNull().default("us-east-1"),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  tasksFailed: integer("tasks_failed").notNull().default(0),
  uptimeSeconds: integer("uptime_seconds").notNull().default(0),
  lastHeartbeat: timestamp("last_heartbeat").default(sql`CURRENT_TIMESTAMP`).notNull(),
  registeredAt: timestamp("registered_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const agentTaskLogs = pgTable("agent_task_logs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  taskType: text("task_type").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("completed"),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("crypto"),
  oddsYes: real("odds_yes").notNull().default(50),
  oddsNo: real("odds_no").notNull().default(50),
  poolYes: real("pool_yes").notNull().default(0),
  poolNo: real("pool_no").notNull().default(0),
  status: text("status").notNull().default("active"),
  resolvedOutcome: text("resolved_outcome"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const predictionBets = pgTable("prediction_bets", {
  id: serial("id").primaryKey(),
  predictionId: integer("prediction_id").notNull().references(() => predictions.id, { onDelete: "cascade" }),
  side: text("side").notNull(),
  amount: real("amount").notNull(),
  walletAddress: text("wallet_address").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const securityScans = pgTable("security_scans", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull(),
  tokenName: text("token_name"),
  safetyScore: integer("safety_score").notNull(),
  mintAuth: text("mint_auth").notNull(),
  freezeAuth: text("freeze_auth").notNull(),
  lpLocked: text("lp_locked").notNull(),
  holderDistribution: text("holder_distribution").notNull(),
  verdict: text("verdict").notNull(),
  scannedAt: timestamp("scanned_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const repoScans = pgTable("repo_scans", {
  id: serial("id").primaryKey(),
  repoUrl: text("repo_url").notNull(),
  repoName: text("repo_name").notNull(),
  legitScore: integer("legit_score").notNull(),
  commitCount: integer("commit_count").notNull(),
  contributorCount: integer("contributor_count").notNull(),
  findings: text("findings").notNull(),
  recommendation: text("recommendation").notNull(),
  scannedAt: timestamp("scanned_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  recipient: text("recipient").notNull(),
  amount: real("amount").notNull(),
  token: text("token").notNull().default("USDC"),
  status: text("status").notNull().default("confirmed"),
  txHash: text("tx_hash").notNull(),
  protocol: text("protocol").notNull().default("x402"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const attentionPositions = pgTable("attention_positions", {
  id: serial("id").primaryKey(),
  narrative: text("narrative").notNull(),
  shares: integer("shares").notNull().default(0),
  avgPrice: real("avg_price").notNull(),
  currentPrice: real("current_price").notNull(),
  virality: integer("virality").notNull().default(50),
  momentum: text("momentum").notNull().default("flat"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const vaultPositions = pgTable("vault_positions", {
  id: serial("id").primaryKey(),
  vaultName: text("vault_name").notNull(),
  protocol: text("protocol").notNull(),
  token: text("token").notNull(),
  stakedAmount: real("staked_amount").notNull().default(0),
  apy: real("apy").notNull(),
  tvl: real("tvl").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertSanctuaryPixelSchema = createInsertSchema(sanctuaryPixels).omit({ id: true, createdAt: true });
export const insertMoltbookAgentSchema = createInsertSchema(moltbookAgents).omit({ id: true, registeredAt: true, lastHeartbeat: true });
export const insertAgentTaskLogSchema = createInsertSchema(agentTaskLogs).omit({ id: true, createdAt: true });
export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true, createdAt: true, resolvedOutcome: true });
export const insertPredictionBetSchema = createInsertSchema(predictionBets).omit({ id: true, createdAt: true });
export const insertSecurityScanSchema = createInsertSchema(securityScans).omit({ id: true, scannedAt: true });
export const insertRepoScanSchema = createInsertSchema(repoScans).omit({ id: true, scannedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertAttentionPositionSchema = createInsertSchema(attentionPositions).omit({ id: true, updatedAt: true });
export const insertVaultPositionSchema = createInsertSchema(vaultPositions).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type SanctuaryPixel = typeof sanctuaryPixels.$inferSelect;
export type InsertSanctuaryPixel = z.infer<typeof insertSanctuaryPixelSchema>;
export type MoltbookAgent = typeof moltbookAgents.$inferSelect;
export type InsertMoltbookAgent = z.infer<typeof insertMoltbookAgentSchema>;
export type AgentTaskLog = typeof agentTaskLogs.$inferSelect;
export type InsertAgentTaskLog = z.infer<typeof insertAgentTaskLogSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type PredictionBet = typeof predictionBets.$inferSelect;
export type InsertPredictionBet = z.infer<typeof insertPredictionBetSchema>;
export type SecurityScan = typeof securityScans.$inferSelect;
export type InsertSecurityScan = z.infer<typeof insertSecurityScanSchema>;
export type RepoScan = typeof repoScans.$inferSelect;
export type InsertRepoScan = z.infer<typeof insertRepoScanSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AttentionPosition = typeof attentionPositions.$inferSelect;
export type InsertAttentionPosition = z.infer<typeof insertAttentionPositionSchema>;
export type VaultPosition = typeof vaultPositions.$inferSelect;
export type InsertVaultPosition = z.infer<typeof insertVaultPositionSchema>;
