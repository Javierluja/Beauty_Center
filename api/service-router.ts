import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware.js";
import {
  findAllServices,
  findServiceById,
  createService,
  updateService,
  deleteService,
} from "./queries/services.js";
import { getDb } from "./queries/connection.js"; // RUTA ASEGURADA

export const serviceRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          search: z.string().optional(),
          active: z.boolean().optional(),
        })
        .optional()
    )
    .query(({ input }) => findAllServices(input?.search, input?.active)),

  byId: authedQuery
    .input(z.number())
    .query(({ input }) => findServiceById(input)),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1, "El nombre es requerido"),
        description: z.string().optional().default(""),
        price: z.union([z.string(), z.number()]).transform(v => String(v)),
        duration: z.union([z.string(), z.number()]).transform(v => Number(v) || 30),
        category: z.string().optional().default("General"),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[API] Recibida petición para crear servicio:", input.name);
      try {
        const result = await createService(input);
        console.log("[API] Servicio creado exitosamente:", result);
        return result;
      } catch (err) {
        console.error("[API ERROR] Fallo en la mutación:", err);
        throw err;
      }
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
        duration: z.union([z.string(), z.number()]).transform(v => Number(v)).optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateService(id, data);
    }),

  delete: adminQuery
    .input(z.number())
    .mutation(({ input }) => deleteService(input)),
});

