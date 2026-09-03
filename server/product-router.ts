import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware.js";
import {
  findAllProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "./queries/products.js";

export const productRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          search: z.string().optional(),
          active: z.boolean().optional(),
          lowStock: z.boolean().optional(),
        })
        .optional()
    )
    .query(({ input }) =>
      findAllProducts(input?.search, input?.active, input?.lowStock)
    ),

  byId: authedQuery
    .input(z.number())
    .query(({ input }) => findProductById(input)),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1, "El nombre es requerido"),
        description: z.string().optional().default(""),
        sku: z.string().optional().default(""),
        price: z.union([z.string(), z.number()]).transform(v => String(v)),
        stock: z.union([z.string(), z.number()]).transform(v => Number(v) || 0),
        minStock: z.union([z.string(), z.number()]).transform(v => Number(v) || 5),
        category: z.string().optional().default("General"),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[API] Creando producto:", input.name);
      const res = await createProduct(input as any);
      try {
        const { syncToGoogleSheets } = await import("./lib/backup-sheets.js");
        syncToGoogleSheets({
          tipo: "producto",
          id: (res as any)?.id || "",
          nombre: input.name,
          sku: input.sku || "",
          precio: String(input.price),
          stock: input.stock,
          minStock: input.minStock,
          categoria: input.category || "General",
        });
      } catch (e) {}
      return res;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        price: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
        stock: z.union([z.string(), z.number()]).transform(v => Number(v)).optional(),
        minStock: z.union([z.string(), z.number()]).transform(v => Number(v)).optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const res = await updateProduct(id, data);
      try {
        const prod = await findProductById(id);
        const { syncToGoogleSheets } = await import("./lib/backup-sheets.js");
        syncToGoogleSheets({
          tipo: "producto",
          id: id,
          nombre: prod?.name || data.name || "",
          sku: prod?.sku || data.sku || "",
          precio: String(prod?.price || data.price || ""),
          stock: prod?.stock ?? data.stock,
          minStock: prod?.minStock ?? data.minStock,
          categoria: prod?.category || data.category || "General",
        });
      } catch (e) {}
      return res;
    }),

  delete: authedQuery
    .use(async ({ ctx, next }) => {
      // allow both admin_pro and admin
      if (ctx.user?.role !== "admin_pro" && ctx.user?.role !== "admin") {
        throw new Error("No tienes permisos para eliminar productos");
      }
      return next({ ctx });
    })
    .input(z.number())
    .mutation(({ input }) => deleteProduct(input)),

  adjustStock: authedQuery
    .input(
      z.object({
        id: z.number(),
        quantity: z.number(),
      })
    )
    .mutation(({ input }) => updateProductStock(input.id, input.quantity)),

  bulkCreate: adminQuery
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== "admin_pro") {
        throw new Error("Solo el admin_pro puede hacer carga masiva");
      }
      return next({ ctx });
    })
    .input(z.array(z.any()))
    .mutation(async ({ input }) => {
      const { bulkCreateProducts } = await import("./queries/products.js");
      return bulkCreateProducts(input);
    }),
});


