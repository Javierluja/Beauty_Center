import { authRouter } from "./auth-router";
import { customerRouter } from "./customer-router";
import { serviceRouter } from "./service-router";
import { productRouter } from "./product-router";
import { appointmentRouter } from "./appointment-router";
import { saleRouter } from "./sale-router";
import { notificationRouter } from "./notification-router";
import { expenseRouter } from "./expense-router";
import { sessionRouter } from "./session-router";
import { userRouter } from "./user-router";
import { purchaseRouter } from "./purchase-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  customers: customerRouter,
  service: serviceRouter,
  product: productRouter,
  appointment: appointmentRouter,
  sale: saleRouter,
  notification: notificationRouter,
  expense: expenseRouter,
  session: sessionRouter,
  user: userRouter,
  purchase: purchaseRouter,
});

export type AppRouter = typeof appRouter;
