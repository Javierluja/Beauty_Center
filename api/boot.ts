import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.use("/api/trpc/*", async (c) => {
  const resHeaders = new Headers();
  
  let request = c.req.raw;
  if (!request.url.startsWith("http")) {
    request = new Request(c.req.url, c.req.raw);
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async (opts) => {
      const ctx = await createContext(opts);
      // Pasar los headers de respuesta del contexto
      ctx.resHeaders = resHeaders;
      return ctx;
    },
  });

  // Agregar los headers de respuesta que fueron establecidos en el contexto
  for (const [key, value] of resHeaders.entries()) {
    response.headers.append(key, value);
  }

  return response;
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction && !process.env.VERCEL) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite.js");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}


