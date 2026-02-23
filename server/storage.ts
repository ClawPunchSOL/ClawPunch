import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  users, conversations, messages, sanctuaryPixels,
  moltbookAgents, predictions, predictionBets, securityScans, repoScans,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type SanctuaryPixel, type InsertSanctuaryPixel,
  type MoltbookAgent, type InsertMoltbookAgent,
  type Prediction, type InsertPrediction,
  type PredictionBet, type InsertPredictionBet,
  type SecurityScan, type InsertSecurityScan,
  type RepoScan, type InsertRepoScan,
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

  getAllPredictions(): Promise<Prediction[]>;
  getPrediction(id: number): Promise<Prediction | undefined>;
  createPrediction(data: InsertPrediction): Promise<Prediction>;
  placeBet(data: InsertPredictionBet): Promise<PredictionBet>;
  getBetsByPrediction(predictionId: number): Promise<PredictionBet[]>;
  updatePredictionPool(id: number, side: string, amount: number): Promise<void>;

  getAllSecurityScans(): Promise<SecurityScan[]>;
  createSecurityScan(data: InsertSecurityScan): Promise<SecurityScan>;

  getAllRepoScans(): Promise<RepoScan[]>;
  createRepoScan(data: InsertRepoScan): Promise<RepoScan>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }
  async getConversationsByAgent(agentId: string): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.agentId, agentId)).orderBy(desc(conversations.createdAt));
  }
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conv] = await db.insert(conversations).values(data).returning();
    return conv;
  }
  async deleteConversation(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }
  async createMessage(data: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getSanctuaryPixel(plotIndex: number): Promise<SanctuaryPixel | undefined> {
    const [pixel] = await db.select().from(sanctuaryPixels).where(eq(sanctuaryPixels.plotIndex, plotIndex));
    return pixel;
  }
  async getAllSanctuaryPixels(): Promise<SanctuaryPixel[]> {
    return db.select().from(sanctuaryPixels);
  }
  async claimSanctuaryPixel(data: InsertSanctuaryPixel): Promise<SanctuaryPixel> {
    const [pixel] = await db.insert(sanctuaryPixels).values(data).returning();
    return pixel;
  }

  async getAllMoltbookAgents(): Promise<MoltbookAgent[]> {
    return db.select().from(moltbookAgents).orderBy(desc(moltbookAgents.registeredAt));
  }
  async createMoltbookAgent(data: InsertMoltbookAgent): Promise<MoltbookAgent> {
    const [agent] = await db.insert(moltbookAgents).values(data).returning();
    return agent;
  }
  async updateMoltbookAgentStatus(id: number, status: string): Promise<MoltbookAgent | undefined> {
    const [agent] = await db.update(moltbookAgents).set({ status }).where(eq(moltbookAgents.id, id)).returning();
    return agent;
  }

  async getAllPredictions(): Promise<Prediction[]> {
    return db.select().from(predictions).orderBy(desc(predictions.createdAt));
  }
  async getPrediction(id: number): Promise<Prediction | undefined> {
    const [pred] = await db.select().from(predictions).where(eq(predictions.id, id));
    return pred;
  }
  async createPrediction(data: InsertPrediction): Promise<Prediction> {
    const [pred] = await db.insert(predictions).values(data).returning();
    return pred;
  }
  async placeBet(data: InsertPredictionBet): Promise<PredictionBet> {
    const [bet] = await db.insert(predictionBets).values(data).returning();
    return bet;
  }
  async getBetsByPrediction(predictionId: number): Promise<PredictionBet[]> {
    return db.select().from(predictionBets).where(eq(predictionBets.predictionId, predictionId)).orderBy(desc(predictionBets.createdAt));
  }
  async updatePredictionPool(id: number, side: string, amount: number): Promise<void> {
    const pred = await this.getPrediction(id);
    if (!pred) return;
    const newPoolYes = side === 'yes' ? pred.poolYes + amount : pred.poolYes;
    const newPoolNo = side === 'no' ? pred.poolNo + amount : pred.poolNo;
    const total = newPoolYes + newPoolNo;
    const oddsYes = total > 0 ? Math.round((newPoolYes / total) * 100) : 50;
    const oddsNo = total > 0 ? 100 - oddsYes : 50;
    await db.update(predictions).set({ poolYes: newPoolYes, poolNo: newPoolNo, oddsYes, oddsNo }).where(eq(predictions.id, id));
  }

  async getAllSecurityScans(): Promise<SecurityScan[]> {
    return db.select().from(securityScans).orderBy(desc(securityScans.scannedAt));
  }
  async createSecurityScan(data: InsertSecurityScan): Promise<SecurityScan> {
    const [scan] = await db.insert(securityScans).values(data).returning();
    return scan;
  }

  async getAllRepoScans(): Promise<RepoScan[]> {
    return db.select().from(repoScans).orderBy(desc(repoScans.scannedAt));
  }
  async createRepoScan(data: InsertRepoScan): Promise<RepoScan> {
    const [scan] = await db.insert(repoScans).values(data).returning();
    return scan;
  }
}

export const storage = new DatabaseStorage();
