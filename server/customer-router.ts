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
        birthDate: z.string().optional().or(z.literal("")).transform(v => v || undefined),
        rut: z.string().optional().or(z.literal("")).transform(v => v || undefined),
        address: z.string().optional().or(z.literal("")).transform(v => v || undefined),
        profession: z.string().optional().or(z.literal("")).transform(v => v || undefined),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[API] Creando cliente:", input.name);
      const client = await createClient(input as any);
      
      try {
        if (client) {
          fetch("https://script.google.com/macros/s/AKfycbz_Xa916OIVWUyKwhpM4K73vntd0kaxgtuGuOG8fTdkkwg9mHAzLM9yLbhDU1i5z9c_Dg/exec", {
            method: "POST",
            body: JSON.stringify({
              tipo: "cliente",
              id: client.id,
              nombre: client.name,
              telefono: client.phone,
              fecha: new Date().toLocaleString('es-ES')
            })
          }).catch(e => console.error(e));
        }
      } catch(e) {}
      
      return client;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        phone: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
        email: z.string().email().optional().or(z.literal("")).transform(v => v || undefined).optional(),
        notes: z.string().optional(),
        birthDate: z.string().optional().or(z.literal("")).transform(v => v || undefined).optional(),
        rut: z.string().optional().or(z.literal("")).transform(v => v || undefined).optional(),
        address: z.string().optional().or(z.literal("")).transform(v => v || undefined).optional(),
        profession: z.string().optional().or(z.literal("")).transform(v => v || undefined).optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateClient(id, data);
    }),

  delete: authedQuery
    .use(async ({ ctx, next }) => {
      // allow both admin_pro and admin
      if (ctx.user?.role !== "admin_pro" && ctx.user?.role !== "admin") {
        throw new Error("No tienes permisos para eliminar clientes");
      }
      return next({ ctx });
    })
    .input(z.number())
    .mutation(({ input }) => deleteClient(input)),

  addBalance: authedQuery
    .input(
      z.object({
        id: z.number(),
        amountToAdd: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const client = await findClientById(input.id);
      if (!client) throw new Error("Cliente no encontrado");
      const currentBalance = Number(client.balance || 0);
      const newBalance = currentBalance + input.amountToAdd;
      return updateClient(input.id, { balance: newBalance.toString() });
    }),

  setBalance: authedQuery
    .input(
      z.object({
        id: z.number(),
        balance: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return updateClient(input.id, { balance: input.balance.toString() });
    }),

  bulkCreate: adminQuery
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== "admin_pro") {
        throw new Error("Solo el admin_pro puede hacer carga masiva");
      }
      return next({ ctx });
    })
    .input(z.array(z.any()))
    .mutation(async ({ input }) => {
      const { bulkCreateClients } = await import("./queries/clients.js");
      return bulkCreateClients(input);
    }),
});


