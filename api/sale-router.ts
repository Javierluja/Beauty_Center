import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAllSales,
  findSaleById,
  createSale,
  addSaleItem,
  getSalesSummary,
  getDailyPaymentMethods,
  updateSaleStatus,
  updateSaleAbono,
} from "./queries/sales";
import { getDailySummary } from "./queries/expenses"; // Importación verificada

export const saleRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        clientId: z.number().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(({ input }) => findAllSales(input)),

  updateStatus: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.string()
    }))
    .mutation(async ({ input }) => {
      return await updateSaleStatus(input.id, input.status);
    }),

  updateAbono: authedQuery
    .input(z.object({
      id: z.number(),
      amount: z.string()
    }))
    .mutation(async ({ input }) => {
      return await updateSaleAbono(input.id, input.amount);
    }),

  summary: authedQuery
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional()
    )
    .query(({ input }) => getSalesSummary(input?.dateFrom, input?.dateTo)),

  dailySummary: authedQuery.query(() => getDailySummary()),
  
  paymentMethodsDetail: authedQuery.query(() => getDailyPaymentMethods()),

  create: authedQuery
    .input(
      z.object({
        clientId: z.number().optional(),
        total: z.string(),
        discount: z.string().optional().default("0"),
        finalTotal: z.string(),
        paymentMethod: z.string(),
        status: z.string().optional().default("paid"),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            type: z.string(), // Cambiado a string para mayor flexibilidad
            itemId: z.number(),
            name: z.string(),
            quantity: z.number(),
            unitPrice: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { items, ...saleData } = input;
      
      // Calcular totales si no vienen (por simplicidad en el front)
      const subtotal = items.reduce((acc, i) => acc + (Number(i.unitPrice) * i.quantity), 0);
      const finalTotal = subtotal - Number(saleData.discount || 0);

      const sale = await createSale({
        ...saleData,
        total: subtotal.toString(),
        finalTotal: finalTotal.toString(),
        createdBy: ctx.user.id,
      });

      if (sale) {
        for (const item of items) {
          await addSaleItem({
            saleId: sale.id,
            ...item,
            totalPrice: (Number(item.unitPrice) * item.quantity).toString()
          });
        }
      }

      return sale;
    }),

  byId: authedQuery
    .input(z.number())
    .query(({ input }) => findSaleById(input)),
});
