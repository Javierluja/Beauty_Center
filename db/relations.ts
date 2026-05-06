import { relations } from "drizzle-orm";
import {
  users,
  customers,
  services,
  appointments,
  sales,
  saleItems,
  sessionPacks,
  sessionUsage,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  sales: many(sales),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  appointments: many(appointments),
  sales: many(sales),
  sessionPacks: many(sessionPacks),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments),
  sessionPacks: many(sessionPacks),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(customers, {
    fields: [appointments.clientId],
    references: [customers.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  client: one(customers, {
    fields: [sales.clientId],
    references: [customers.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
}));

export const sessionPacksRelations = relations(sessionPacks, ({ one, many }) => ({
  client: one(customers, {
    fields: [sessionPacks.clientId],
    references: [customers.id],
  }),
  service: one(services, {
    fields: [sessionPacks.serviceId],
    references: [services.id],
  }),
  usage: many(sessionUsage),
}));

export const sessionUsageRelations = relations(sessionUsage, ({ one }) => ({
  pack: one(sessionPacks, {
    fields: [sessionUsage.packId],
    references: [sessionPacks.id],
  }),
}));
