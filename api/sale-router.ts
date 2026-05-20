import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.js";
import {
  findAllSales,
  findSaleById,
  createSale,
  addSaleItem,
  getSalesSummary,
  getDailyPaymentMethods,
  updateSaleStatus,
  updateSaleAbono,
  findSaleItems,
} from "./queries/sales.js";
import { getDailySummary } from "./queries/expenses.js"; // Importación verificada

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
      
      const subtotal = items.reduce((acc, i) => acc + (Number(i.unitPrice) * i.quantity), 0);
      const finalTotal = subtotal - Number(saleData.discount || 0);

      // --- LOGIC PARA GIFTCARD ---
      if (saleData.paymentMethod === 'gift_card') {
        if (!saleData.clientId) {
          throw new Error("El pago con Gift Card requiere un cliente registrado.");
        }
        const { findClientById, updateClient } = await import("./queries/clients.js");
        const client = await findClientById(saleData.clientId);
        if (!client) throw new Error("Cliente no encontrado.");
        
        const currentBalance = Number(client.balance || 0);
        if (currentBalance < finalTotal) {
          throw new Error(`Saldo insuficiente. El cliente solo tiene $${currentBalance.toLocaleString()} a favor.`);
        }
        
        await updateClient(saleData.clientId, { balance: (currentBalance - finalTotal).toString() });
      }

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

          if (item.type === 'product') {
            const { updateProductStock } = await import("./queries/products.js");
            await updateProductStock(item.itemId, -item.quantity);
          }
        }
        
        // --- WEBHOOK A GOOGLE SHEETS ---
        try {
          let clientName = "Cliente General";
          if (saleData.clientId) {
            const { findClientById } = await import("./queries/clients.js");
            const c = await findClientById(saleData.clientId);
            if (c) clientName = c.name;
          }
          
          fetch("https://script.google.com/macros/s/AKfycbz_Xa916OIVWUyKwhpM4K73vntd0kaxgtuGuOG8fTdkkwg9mHAzLM9yLbhDU1i5z9c_Dg/exec", {
            method: "POST",
            body: JSON.stringify({
              tipo: "venta",
              id: sale.id,
              cliente: clientName,
              total: finalTotal.toString(),
              metodo: saleData.paymentMethod,
              fecha: new Date().toLocaleString('es-ES')
            })
          }).catch(err => console.error("[Webhook Error]:", err));
        } catch (e) {
          console.error("[Webhook Error] Could not send data to Google Sheets", e);
        }
      }

      return sale;
    }),

  byId: authedQuery
    .input(z.number())
    .query(({ input }) => findSaleById(input)),

  getItems: authedQuery
    .input(z.number())
    .query(({ input }) => findSaleItems(input)),
});


