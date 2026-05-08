import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware.js";
import {
  findAllClients,
  findClientById,
  createClient,
  updateClient,
  deleteClient,
} from "./queries/clients.js";

export const customerRouter = createRouter({
  list: authedQuery
    .input(z.string().optional())
    .query(({ input }) => findAllClients(input)),

  byId: authedQuery
    .input(z.number())
    .query(({ input }) => findClientById(input)),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1, "El nombre es requerido"),
        phone: z.union([z.string(), z.number()]).transform(v => String(v)),
        email: z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
        notes: z.string().optional().default(""),
      })
    )
    .mutation(({ input }) => {
      console.log("[API] Creando cliente:", input.name);
      return createClient(input);
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        phone: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
        email: z.string().email().optional().or(z.literal("")).transform(v => v || undefined).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateClient(id, data);
    }),

  delete: adminQuery
    .input(z.number())
    .mutation(({ input }) => deleteClient(input)),
});
