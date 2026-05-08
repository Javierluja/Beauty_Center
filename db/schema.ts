import {
  mysqlTable,
  varchar,
  text,
  decimal,
  timestamp,
  int,
  date,
  boolean,
} from "drizzle-orm/mysql-core";

// Esquema 2.2.1: Soporte para Créditos, Estados de Venta y Notificaciones
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),
  role: varchar("role", { length: 50 }).notNull().default("ventas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const services = mysqlTable("services", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: int("duration").notNull().default(30),
  category: varchar("category", { length: 100 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: int("stock").default(0).notNull(),
  minStock: int("minStock").default(5).notNull(),
  category: varchar("category", { length: 100 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const appointments = mysqlTable("appointments", {
  id: int("id").primaryKey().autoincrement(),
  clientId: int("clientId").notNull(),
  serviceId: int("serviceId").notNull(),
  packId: int("packId"), // Link opcional a un pack de sesiones
  staffName: varchar("staffName", { length: 255 }),
  appointmentDate: date("appointmentDate").notNull(),
  appointmentTime: varchar("appointmentTime", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sales = mysqlTable("sales", {
  id: int("id").primaryKey().autoincrement(),
  clientId: int("clientId"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  finalTotal: decimal("finalTotal", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), 
  status: varchar("status", { length: 20 }).notNull().default("paid"), 
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const saleItems = mysqlTable("saleItems", {
  id: int("id").primaryKey().autoincrement(),
  saleId: int("saleId").notNull(),
  type: varchar("type", { length: 20 }).notNull(), 
  itemId: int("itemId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
});

export const expenses = mysqlTable("expenses", {
  id: int("id").primaryKey().autoincrement(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sessionPacks = mysqlTable("sessionPacks", {
  id: int("id").primaryKey().autoincrement(),
  clientId: int("clientId").notNull(),
  serviceId: int("serviceId").notNull(),
  customTitle: varchar("customTitle", { length: 255 }),
  totalSessions: int("totalSessions").notNull(),
  remainingSessions: int("remainingSessions").notNull(),
  purchaseDate: date("purchaseDate").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sessionUsage = mysqlTable("sessionUsage", {
  id: int("id").primaryKey().autoincrement(),
  packId: int("packId").notNull(),
  sessionNumber: int("sessionNumber").notNull(),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
  notes: text("notes"),
});

export const suppliers = mysqlTable("suppliers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  rut: varchar("rut", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const purchases = mysqlTable("purchases", {
  id: int("id").primaryKey().autoincrement(),
  supplierId: int("supplierId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  rut: varchar("rut", { length: 20 }), // RUT del emisor (proveedor)
  netAmount: decimal("netAmount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull(), // IVA
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, paid
  notes: text("notes"),
  purchaseDate: date("purchaseDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const purchaseItems = mysqlTable("purchaseItems", {
  id: int("id").primaryKey().autoincrement(),
  purchaseId: int("purchaseId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("salePrice", { precision: 10, scale: 2 }), // Nuevo precio de venta sugerido
});

export const notifications = mysqlTable("notifications", {
  id: int("id").primaryKey().autoincrement(),
  clientId: int("clientId").notNull(),
  appointmentId: int("appointmentId"),
  type: varchar("type", { length: 50 }).notNull(), // reminder, confirm, etc
  message: text("message").notNull(),
  sent: int("sent").default(0).notNull(), // 0: no, 1: yes
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
