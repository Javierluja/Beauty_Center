import { authRouter } from "./auth-router.js.js";
import { customerRouter } from "./customer-router.js.js";
import { serviceRouter } from "./service-router.js.js";
import { productRouter } from "./product-router.js.js";
import { appointmentRouter } from "./appointment-router.js.js";
import { saleRouter } from "./sale-router.js.js";
import { notificationRouter } from "./notification-router.js.js";
import { expenseRouter } from "./expense-router.js.js";
import { sessionRouter } from "./session-router.js.js";
import { userRouter } from "./user-router.js.js";
import { purchaseRouter } from "./purchase-router.js.js";
import { createRouter, publicQuery } from "./middleware.js.js";

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
