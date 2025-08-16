import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertCartItemSchema, insertOrderSchema, insertProjectSchema, insertMilestoneSchema, insertProgressImageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage_multer });

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Static file serving for uploads
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  }, (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category } = req.query;
      let products;
      
      if (search || category) {
        // Use search function for both search queries and category filtering
        products = await storage.searchProducts(search as string || "", category as string);
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", requireAuth, requireRole(["seller", "admin"]), upload.single('image'), async (req, res) => {
    try {
      const productData = {
        ...req.body,
        sellerId: req.user.id,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        stock: parseInt(req.body.stock) || 0,
      };
      
      const validatedData = insertProductSchema.parse(productData);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", requireAuth, requireRole(["seller", "admin"]), upload.single('image'), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Check if user owns the product or is admin
      if (req.user.role !== "admin" && product.sellerId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to edit this product" });
      }

      const updateData = {
        ...req.body,
        stock: req.body.stock ? parseInt(req.body.stock) : undefined,
      };

      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedProduct = await storage.updateProduct(req.params.id, updateData);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, requireRole(["seller", "admin"]), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (req.user.role !== "admin" && product.sellerId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to delete this product" });
      }

      await storage.deleteProduct(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Cart routes
  app.get("/api/cart", requireAuth, async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", requireAuth, async (req, res) => {
    try {
      const cartData = {
        ...req.body,
        userId: req.user.id,
      };
      const validatedData = insertCartItemSchema.parse(cartData);
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      res.status(400).json({ error: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", requireAuth, async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", requireAuth, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  // Order routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const { shippingAddress, items } = req.body;
      
      let total = 0;
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }
        total += parseFloat(product.price) * item.quantity;
      }

      const orderData = {
        userId: req.user.id,
        total: total.toString(),
        shippingAddress,
        status: "pending" as const,
      };

      const itemsWithPrices = await Promise.all(
        items.map(async (item: any) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            price: product!.price,
          };
        })
      );

      const order = await storage.createOrder(orderData, itemsWithPrices);

      // Clear cart after successful order
      await storage.clearCart(req.user.id);
      
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Failed to create order" });
    }
  });

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      let projects;
      if (req.user.role === "admin") {
        projects = await storage.getAllProjects();
      } else {
        projects = await storage.getProjectsByClient(req.user.id);
      }
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check permissions
      if (req.user.role !== "admin" && project.clientId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to view this project" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireAuth, requireRole(["client", "admin"]), async (req, res) => {
    try {
      const projectData = {
        ...req.body,
        clientId: req.user.id,
      };
      const validatedData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Failed to create project" });
    }
  });

  // Milestone routes
  app.get("/api/projects/:projectId/milestones", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (req.user.role !== "admin" && project.clientId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const milestones = await storage.getMilestonesByProject(req.params.projectId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/projects/:projectId/milestones", requireAuth, requireRole(["client", "admin"]), async (req, res) => {
    try {
      const milestoneData = {
        ...req.body,
        projectId: req.params.projectId,
      };
      const validatedData = insertMilestoneSchema.parse(milestoneData);
      const milestone = await storage.createMilestone(validatedData);
      res.status(201).json(milestone);
    } catch (error) {
      res.status(400).json({ error: "Failed to create milestone" });
    }
  });

  // Progress image routes
  app.get("/api/projects/:projectId/images", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (req.user.role !== "admin" && project.clientId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const images = await storage.getProgressImagesByProject(req.params.projectId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/projects/:projectId/images", requireAuth, requireRole(["client", "admin"]), upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const imageData = {
        projectId: req.params.projectId,
        milestoneId: req.body.milestoneId || null,
        imageUrl: `/uploads/${req.file.filename}`,
        description: req.body.description || "",
        uploadedBy: req.user.id,
      };

      const validatedData = insertProgressImageSchema.parse(imageData);
      const image = await storage.createProgressImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      res.status(400).json({ error: "Failed to upload image" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const products = await storage.getAllProducts();
      const projects = await storage.getAllProjects();
      
      res.json({
        totalUsers: users.length,
        totalBuyers: users.filter(u => u.role === "buyer").length,
        totalSellers: users.filter(u => u.role === "seller").length,
        totalClients: users.filter(u => u.role === "client").length,
        totalProducts: products.length,
        totalProjects: projects.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Seller-specific routes
  app.get("/api/seller/products", requireAuth, requireRole(["seller"]), async (req, res) => {
    try {
      const products = await storage.getProductsBySeller(req.user.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seller products" });
    }
  });

  app.get("/api/seller/orders", requireAuth, requireRole(["seller"]), async (req, res) => {
    try {
      const orders = await storage.getOrdersBySeller(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seller orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
