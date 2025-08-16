import { 
  users, products, cartItems, orders, orderItems, projects, milestones, progressImages,
  type User, type InsertUser, type Product, type InsertProduct, 
  type CartItem, type InsertCartItem, type Order, type InsertOrder,
  type Project, type InsertProject, type Milestone, type InsertMilestone,
  type ProgressImage, type InsertProgressImage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProductsBySeller(sellerId: string): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  searchProducts(query: string, category?: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Cart
  getCartItems(userId: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  
  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrdersBySeller(sellerId: string): Promise<Order[]>;
  createOrder(order: InsertOrder, items: { productId: string; quantity: number; price: string }[]): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByClient(clientId: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Milestones
  getMilestonesByProject(projectId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string): Promise<boolean>;
  
  // Progress Images
  getProgressImagesByProject(projectId: string): Promise<ProgressImage[]>;
  createProgressImage(image: InsertProgressImage): Promise<ProgressImage>;
  deleteProgressImage(id: string): Promise<boolean>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.sellerId, sellerId)).orderBy(desc(products.createdAt));
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async searchProducts(query: string, category?: string): Promise<Product[]> {
    let whereClause = eq(products.isActive, true);

    // Add search filter if query is provided and not empty
    if (query && query.trim()) {
      whereClause = and(whereClause, like(products.name, `%${query}%`));
    }

    // Add category filter if category is provided
    if (category && category.trim()) {
      whereClause = and(whereClause, eq(products.category, category));
    }

    return db.select().from(products).where(whereClause).orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(productData).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Cart
  async getCartItems(userId: string): Promise<CartItem[]> {
    return db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId)));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db.update(cartItems)
        .set({ quantity: existingItem.quantity + item.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    }

    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [item] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return item || undefined;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.rowCount >= 0;
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    const ordersWithSellerProducts = await db
      .select({ orders })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(products.sellerId, sellerId))
      .orderBy(desc(orders.createdAt));

    return ordersWithSellerProducts.map(row => row.orders);
  }

  async createOrder(order: InsertOrder, items: { productId: string; quantity: number; price: string }[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();
      
      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });
      }

      return newOrder;
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({ status: status as any }).where(eq(orders.id, id)).returning();
    return order || undefined;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByClient(clientId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
  }

  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db.update(projects).set(projectData).where(eq(projects.id, id)).returning();
    return project || undefined;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }

  // Milestones
  async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    return db.select().from(milestones).where(eq(milestones.projectId, projectId)).orderBy(desc(milestones.createdAt));
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [newMilestone] = await db.insert(milestones).values(milestone).returning();
    return newMilestone;
  }

  async updateMilestone(id: string, milestoneData: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const [milestone] = await db.update(milestones).set(milestoneData).where(eq(milestones.id, id)).returning();
    return milestone || undefined;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const result = await db.delete(milestones).where(eq(milestones.id, id));
    return result.rowCount > 0;
  }

  // Progress Images
  async getProgressImagesByProject(projectId: string): Promise<ProgressImage[]> {
    return db.select().from(progressImages).where(eq(progressImages.projectId, projectId)).orderBy(desc(progressImages.createdAt));
  }

  async createProgressImage(image: InsertProgressImage): Promise<ProgressImage> {
    const [newImage] = await db.insert(progressImages).values(image).returning();
    return newImage;
  }

  async deleteProgressImage(id: string): Promise<boolean> {
    const result = await db.delete(progressImages).where(eq(progressImages.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
