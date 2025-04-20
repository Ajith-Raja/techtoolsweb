import { 
  users, 
  type User, 
  type InsertUser, 
  userAnalysisHistory,
  analysisTypeEnum
} from "@shared/schema";
import type { Store } from "express-session";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

// Analysis history interface
export interface AnalysisHistoryItem {
  id: number;
  userId: number;
  analysisType: typeof analysisTypeEnum.enumValues[number];
  targetUrl: string;
  resultData: any;
  favorite: boolean;
  notes: string | null;
  createdAt: string;
}

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Analysis history methods
  getUserAnalysisHistory(userId: number): Promise<AnalysisHistoryItem[]>;
  getAnalysisById(id: number): Promise<AnalysisHistoryItem | undefined>;
  saveAnalysis(analysis: Omit<AnalysisHistoryItem, 'id' | 'createdAt'>): Promise<AnalysisHistoryItem>;
  updateAnalysis(id: number, updates: Partial<AnalysisHistoryItem>): Promise<AnalysisHistoryItem | undefined>;
  deleteAnalysis(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private analysisHistory: Map<number, AnalysisHistoryItem>;
  private userIdToAnalysisIds: Map<number, Set<number>>;
  userCurrentId: number;
  analysisCurrentId: number;
  sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.analysisHistory = new Map();
    this.userIdToAnalysisIds = new Map();
    this.userCurrentId = 1;
    this.analysisCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every day
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const currentDate = new Date().toISOString();
    const user: User = { 
      id, 
      username: insertUser.username,
      password: insertUser.password,
      createdAt: currentDate,
      email: insertUser.email || null,
      displayName: insertUser.displayName || null,
      plan: "free",
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser as User);
    return updatedUser as User;
  }
  
  // Analysis history methods
  async getUserAnalysisHistory(userId: number): Promise<AnalysisHistoryItem[]> {
    const analysisIds = this.userIdToAnalysisIds.get(userId) || new Set<number>();
    const userAnalyses: AnalysisHistoryItem[] = [];
    
    // Convert Set to Array before iteration to avoid Set iteration issues
    Array.from(analysisIds).forEach(id => {
      const analysis = this.analysisHistory.get(id);
      if (analysis) {
        userAnalyses.push(analysis);
      }
    });
    
    // Sort by createdAt in descending order (newest first)
    return userAnalyses.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async getAnalysisById(id: number): Promise<AnalysisHistoryItem | undefined> {
    return this.analysisHistory.get(id);
  }
  
  async saveAnalysis(analysis: Omit<AnalysisHistoryItem, 'id' | 'createdAt'>): Promise<AnalysisHistoryItem> {
    const id = this.analysisCurrentId++;
    const currentDate = new Date().toISOString();
    
    const newAnalysis: AnalysisHistoryItem = {
      ...analysis,
      id,
      createdAt: currentDate
    };
    
    this.analysisHistory.set(id, newAnalysis);
    
    // Track this analysis for the user
    if (!this.userIdToAnalysisIds.has(analysis.userId)) {
      this.userIdToAnalysisIds.set(analysis.userId, new Set());
    }
    this.userIdToAnalysisIds.get(analysis.userId)!.add(id);
    
    return newAnalysis;
  }
  
  async updateAnalysis(id: number, updates: Partial<AnalysisHistoryItem>): Promise<AnalysisHistoryItem | undefined> {
    const analysis = await this.getAnalysisById(id);
    if (!analysis) return undefined;
    
    const updatedAnalysis = { ...analysis, ...updates };
    this.analysisHistory.set(id, updatedAnalysis);
    return updatedAnalysis;
  }
  
  async deleteAnalysis(id: number): Promise<boolean> {
    const analysis = this.analysisHistory.get(id);
    if (!analysis) return false;
    
    this.analysisHistory.delete(id);
    
    // Remove from user's set of analysis ids
    const userAnalysisIds = this.userIdToAnalysisIds.get(analysis.userId);
    if (userAnalysisIds) {
      userAnalysisIds.delete(id);
    }
    
    return true;
  }
}

export const storage = new MemStorage();
