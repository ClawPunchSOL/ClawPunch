import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  users, conversations, messages, sanctuaryPixels,
  moltbookAgents, agentTaskLogs, predictions, predictionBets, securityScans, repoScans,
  transactions, attentionPositions, vaultPositions,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type SanctuaryPixel, type InsertSanctuaryPixel,
  type MoltbookAgent, type InsertMoltbookAgent,
  type AgentTaskLog, type InsertAgentTaskLog,
  type Prediction, type InsertPrediction,
  type PredictionBet, type InsertPredictionBet,
  type SecurityScan, type InsertSecurityScan,
  type RepoScan, type InsertRepoScan,
  type Transaction, type InsertTransaction,
  type AttentionPosition, type InsertAttentionPosition,
  type VaultPosition, type InsertVaultPosition,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByAgent(agentId: string): Promise<Conversation[]>;
  createConversation(data: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;

  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;

  getSanctuaryPixel(plotIndex: number): Promise<SanctuaryPixel | undefined>;
  getAllSanctuaryPixels(): Promise<SanctuaryPixel[]>;
  claimSanctuaryPixel(data: InsertSanctuaryPixel): Promise<SanctuaryPixel>;

  getAllMoltbookAgents(): Promise<MoltbookAgent[]>;
  createMoltbookAgent(data: InsertMoltbookAgent): Promise<MoltbookAgent>;
  updateMoltbookAgentStatus(id: number, status: string): Promise<MoltbookAgent | undefined>;
  updateMoltbookAgent(id: number, data: Partial<MoltbookAgent>): Promise<MoltbookAgent | undefined>;
  getMoltbookAgent(id: number): Promise<MoltbookAgent | undefined>;
  deleteMoltbookAgent(id: number): Promise<void>;

  getTaskLogsByAgent(agentId: number): Promise<AgentTaskLog[]>;
  createTaskLog(data: InsertAgentTaskLog): Promise<AgentTaskLog>;
  getAllTaskLogs(): Promise<AgentTaskLog[]>;

  getAllPredictions(): Promise<Prediction[]>;
  getPrediction(id: number): Promise<Prediction | undefined>;
  createPrediction(data: InsertPrediction): Promise<Prediction>;
  updatePrediction(id: number, data: Partial<Prediction>): Promise<Prediction | undefined>;
  placeBet(data: InsertPredictionBet): Promise<PredictionBet>;
  getBetsByPrediction(predictionId: number): Promise<PredictionBet[]>;
  updatePredictionPool(id: number, side: string, amount: number): Promise<void>;

  getAllSecurityScans(): Promise<SecurityScan[]>;
  createSecurityScan(data: InsertSecurityScan): Promise<SecurityScan>;

  getAllRepoScans(): Promise<RepoScan[]>;
  getRepoScanByUrl(repoUrl: string): Promise<RepoScan | undefined>;
  createRepoScan(data: InsertRepoScan): Promise<RepoScan>;

  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;

  getAllAttentionPositions(): Promise<AttentionPosition[]>;
  getAttentionPosition(narrative: string): Promise<AttentionPosition | undefined>;
  createAttentionPosition(data: InsertAttentionPosition): Promise<AttentionPosition>;
  updateAttentionPosition(id: number, shares: number, avgPrice: number): Promise<AttentionPosition | undefined>;
  updateAttentionMarketData(id: number, data: Partial<AttentionPosition>): Promise<AttentionPosition | undefined>;
  deleteAllAttentionPositions(): Promise<void>;

  getAllVaultPositions(): Promise<VaultPosition[]>;
  getVaultPosition(vaultName: string): Promise<VaultPosition | undefined>;
  createVaultPosition(data: InsertVaultPosition): Promise<VaultPosition>;
  updateVaultStake(id: number, stakedAmount: number): Promise<VaultPosition | undefined>;
  updateVaultMarketData(id: number, data: Partial<VaultPosition>): Promise<VaultPosition | undefined>;
  deleteVaultPosition(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser: InsertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getConversation(id: number) {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }
  async getConversationsByAgent(agentId: string) {
    return db.select().from(conversations).where(eq(conversations.agentId, agentId)).orderBy(desc(conversations.createdAt));
  }
  async createConversation(data: InsertConversation) {
    const [conv] = await db.insert(conversations).values(data).returning();
    return conv;
  }
  async deleteConversation(id: number) {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number) {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }
  async createMessage(data: InsertMessage) {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getSanctuaryPixel(plotIndex: number) {
    const [pixel] = await db.select().from(sanctuaryPixels).where(eq(sanctuaryPixels.plotIndex, plotIndex));
    return pixel;
  }
  async getAllSanctuaryPixels() {
    return db.select().from(sanctuaryPixels);
  }
  async claimSanctuaryPixel(data: InsertSanctuaryPixel) {
    const [pixel] = await db.insert(sanctuaryPixels).values(data).returning();
    return pixel;
  }

  async getAllMoltbookAgents() {
    return db.select().from(moltbookAgents).orderBy(desc(moltbookAgents.registeredAt));
  }
  async createMoltbookAgent(data: InsertMoltbookAgent) {
    const [agent] = await db.insert(moltbookAgents).values(data).returning();
    return agent;
  }
  async updateMoltbookAgentStatus(id: number, status: string) {
    const [agent] = await db.update(moltbookAgents).set({ status }).where(eq(moltbookAgents.id, id)).returning();
    return agent;
  }
  async updateMoltbookAgent(id: number, data: Partial<MoltbookAgent>) {
    const [agent] = await db.update(moltbookAgents).set(data).where(eq(moltbookAgents.id, id)).returning();
    return agent;
  }
  async getMoltbookAgent(id: number) {
    const [agent] = await db.select().from(moltbookAgents).where(eq(moltbookAgents.id, id));
    return agent;
  }
  async deleteMoltbookAgent(id: number) {
    await db.delete(agentTaskLogs).where(eq(agentTaskLogs.agentId, id));
    await db.delete(moltbookAgents).where(eq(moltbookAgents.id, id));
  }

  async getTaskLogsByAgent(agentId: number) {
    return db.select().from(agentTaskLogs).where(eq(agentTaskLogs.agentId, agentId)).orderBy(desc(agentTaskLogs.createdAt));
  }
  async createTaskLog(data: InsertAgentTaskLog) {
    const [log] = await db.insert(agentTaskLogs).values(data).returning();
    return log;
  }
  async getAllTaskLogs() {
    return db.select().from(agentTaskLogs).orderBy(desc(agentTaskLogs.createdAt));
  }

  async getAllPredictions() {
    return db.select().from(predictions).orderBy(desc(predictions.createdAt));
  }
  async getPrediction(id: number) {
    const [pred] = await db.select().from(predictions).where(eq(predictions.id, id));
    return pred;
  }
  async createPrediction(data: InsertPrediction) {
    const [pred] = await db.insert(predictions).values(data).returning();
    return pred;
  }
  async updatePrediction(id: number, data: Partial<Prediction>) {
    const [pred] = await db.update(predictions).set(data).where(eq(predictions.id, id)).returning();
    return pred;
  }
  async placeBet(data: InsertPredictionBet) {
    const [bet] = await db.insert(predictionBets).values(data).returning();
    return bet;
  }
  async getBetsByPrediction(predictionId: number) {
    return db.select().from(predictionBets).where(eq(predictionBets.predictionId, predictionId)).orderBy(desc(predictionBets.createdAt));
  }
  async updatePredictionPool(id: number, side: string, amount: number) {
    const pred = await this.getPrediction(id);
    if (!pred) return;
    const newPoolYes = side === 'yes' ? pred.poolYes + amount : pred.poolYes;
    const newPoolNo = side === 'no' ? pred.poolNo + amount : pred.poolNo;
    const total = newPoolYes + newPoolNo;
    const oddsYes = total > 0 ? Math.round((newPoolYes / total) * 100) : 50;
    await db.update(predictions).set({ poolYes: newPoolYes, poolNo: newPoolNo, oddsYes, oddsNo: 100 - oddsYes }).where(eq(predictions.id, id));
  }

  async getAllSecurityScans() {
    return db.select().from(securityScans).orderBy(desc(securityScans.scannedAt));
  }
  async createSecurityScan(data: InsertSecurityScan) {
    const [scan] = await db.insert(securityScans).values(data).returning();
    return scan;
  }

  async getAllRepoScans() {
    return db.select().from(repoScans).orderBy(desc(repoScans.scannedAt));
  }
  async getRepoScanByUrl(repoUrl: string) {
    const [scan] = await db.select().from(repoScans).where(eq(repoScans.repoUrl, repoUrl)).orderBy(desc(repoScans.scannedAt)).limit(1);
    return scan;
  }
  async createRepoScan(data: InsertRepoScan) {
    const [scan] = await db.insert(repoScans).values(data).returning();
    return scan;
  }

  async getAllTransactions() {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }
  async createTransaction(data: InsertTransaction) {
    const [tx] = await db.insert(transactions).values(data).returning();
    return tx;
  }

  async getAllAttentionPositions() {
    return db.select().from(attentionPositions).orderBy(desc(attentionPositions.virality));
  }
  async getAttentionPosition(narrative: string) {
    const [pos] = await db.select().from(attentionPositions).where(eq(attentionPositions.narrative, narrative));
    return pos;
  }
  async createAttentionPosition(data: InsertAttentionPosition) {
    const [pos] = await db.insert(attentionPositions).values(data).returning();
    return pos;
  }
  async updateAttentionPosition(id: number, shares: number, avgPrice: number) {
    const [pos] = await db.update(attentionPositions).set({ shares, avgPrice }).where(eq(attentionPositions.id, id)).returning();
    return pos;
  }
  async updateAttentionMarketData(id: number, data: Partial<AttentionPosition>) {
    const [pos] = await db.update(attentionPositions).set(data).where(eq(attentionPositions.id, id)).returning();
    return pos;
  }
  async deleteAllAttentionPositions() {
    await db.delete(attentionPositions);
  }

  async getAllVaultPositions() {
    return db.select().from(vaultPositions).orderBy(desc(vaultPositions.apy));
  }
  async getVaultPosition(vaultName: string) {
    const [pos] = await db.select().from(vaultPositions).where(eq(vaultPositions.vaultName, vaultName));
    return pos;
  }
  async createVaultPosition(data: InsertVaultPosition) {
    const [pos] = await db.insert(vaultPositions).values(data).returning();
    return pos;
  }
  async updateVaultStake(id: number, stakedAmount: number) {
    const [pos] = await db.update(vaultPositions).set({ stakedAmount }).where(eq(vaultPositions.id, id)).returning();
    return pos;
  }
  async updateVaultMarketData(id: number, data: Partial<VaultPosition>) {
    const { id: _id, createdAt: _ca, ...updateData } = data as any;
    const [pos] = await db.update(vaultPositions).set(updateData).where(eq(vaultPositions.id, id)).returning();
    return pos;
  }
  async deleteVaultPosition(id: number) {
    await db.delete(vaultPositions).where(eq(vaultPositions.id, id));
  }
}

export const storage = new DatabaseStorage();
