import { authRouter } from "./auth-router.js";
import { customerRouter } from "./customer-router.js";
import { serviceRouter } from "./service-router.js";
import { productRouter } from "./product-router.js";
import { appointmentRouter } from "./appointment-router.js";
import { saleRouter } from "./sale-router.js";
import { notificationRouter } from "./notification-router.js";
import { expenseRouter } from "./expense-router.js";
import { sessionRouter } from "./session-router.js";
import { userRouter } from "./user-router.js";
import { purchaseRouter } from "./purchase-router.js";
import { createRouter, publicQuery } from "./middleware.js";

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
