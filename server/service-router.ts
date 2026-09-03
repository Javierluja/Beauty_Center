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
        const result = await createService(input as any);
        console.log("[API] Servicio creado exitosamente:", result);
        try {
          const { syncToGoogleSheets } = await import("./lib/backup-sheets.js");
          syncToGoogleSheets({
            tipo: "servicio",
            id: (result as any)?.id || "",
            nombre: input.name,
            precio: String(input.price),
            duracion: input.duration,
            categoria: input.category || "General",
          });
        } catch (e) {}
        return result;
      } catch (err) {
        console.error("[API ERROR] Fallo en la mutación:", err);
        throw err;
      }
    }),

  update: authedQuery
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
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const res = await updateService(id, data);
      try {
        const s = await findServiceById(id);
        const { syncToGoogleSheets } = await import("./lib/backup-sheets.js");
        syncToGoogleSheets({
          tipo: "servicio",
          id: id,
          nombre: s?.name || data.name || "",
          precio: String(s?.price || data.price || ""),
          duracion: s?.duration || data.duration || 30,
          categoria: s?.category || data.category || "General",
        });
      } catch (e) {}
      return res;
    }),

  delete: authedQuery
    .use(async ({ ctx, next }) => {
      // allow both admin_pro and admin
      if (ctx.user?.role !== "admin_pro" && ctx.user?.role !== "admin") {
        throw new Error("No tienes permisos para eliminar servicios");
      }
      return next({ ctx });
    })
    .input(z.number())
    .mutation(({ input }) => deleteService(input)),

  bulkCreate: adminQuery
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== "admin_pro") {
        throw new Error("Solo el admin_pro puede hacer carga masiva");
      }
      return next({ ctx });
    })
    .input(z.array(z.any()))
    .mutation(async ({ input }) => {
      const { bulkCreateServices } = await import("./queries/services.js");
      return bulkCreateServices(input);
    }),
});
