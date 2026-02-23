import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  users, conversations, messages, sanctuaryPixels,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type SanctuaryPixel, type InsertSanctuaryPixel,
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
    return db.select().from(conversations)
      .where(eq(conversations.agentId, agentId))
      .orderBy(desc(conversations.createdAt));
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
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getSanctuaryPixel(plotIndex: number): Promise<SanctuaryPixel | undefined> {
    const [pixel] = await db.select().from(sanctuaryPixels)
      .where(eq(sanctuaryPixels.plotIndex, plotIndex));
    return pixel;
  }

  async getAllSanctuaryPixels(): Promise<SanctuaryPixel[]> {
    return db.select().from(sanctuaryPixels);
  }

  async claimSanctuaryPixel(data: InsertSanctuaryPixel): Promise<SanctuaryPixel> {
    const [pixel] = await db.insert(sanctuaryPixels).values(data).returning();
    return pixel;
  }
}

export const storage = new DatabaseStorage();
