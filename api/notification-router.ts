import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.js";
import {
  findAllNotifications,
  markNotificationAsSent,
  deleteNotification,
  createNotification,
} from "./queries/notifications.js";

export const notificationRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        clientId: z.number().optional(),
        sent: z.number().optional(), // Cambiado de boolean a number (0 o 1)
        type: z.string().optional(),
      }).optional()
    )
    .query(({ input }) => findAllNotifications(input)),

  markAsSent: authedQuery
    .input(z.number())
    .mutation(({ input }) => markNotificationAsSent(input)),

  create: authedQuery
    .input(
      z.object({
        clientId: z.number(),
        appointmentId: z.number().optional(),
        type: z.string(),
        message: z.string(),
      })
    )
    .mutation(({ input }) => createNotification(input)),

  delete: authedQuery
    .input(z.number())
    .mutation(({ input }) => deleteNotification(input)),
});
