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

  create: adminQuery
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
    .mutation(({ input }) => {
      console.log("[API] Creando producto:", input.name);
      return createProduct(input);
    }),

  update: adminQuery
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
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateProduct(id, data);
    }),

  delete: adminQuery
    .input(z.number())
    .mutation(({ input }) => deleteProduct(input)),

  adjustStock: adminQuery
    .input(
      z.object({
        id: z.number(),
        quantity: z.number(),
      })
    )
    .mutation(({ input }) => updateProductStock(input.id, input.quantity)),
});

