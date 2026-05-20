import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.get("/api/trpc/test-login", async (c) => {
  try {
    console.log("[DIAG] 1. Starting test-login");
    const { getDb } = await import("./queries/connection.js");
    const { sql } = await import("drizzle-orm");
    
    console.log("[DIAG] 2. Connecting to DB");
    const db = getDb();
    const result = await db.execute(sql`SELECT 1`);
    console.log("[DIAG] 3. DB test query success");

    console.log("[DIAG] 4. Hashing check");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("test123456", 10);
    const match = await bcrypt.default.compare("test123456", hash);
    console.log("[DIAG] 5. Hashing success (match:", match, ")");

    console.log("[DIAG] 6. Sign JWT check");
    const jose = await import("jose");
    const SECRET = new TextEncoder().encode(process.env.APP_SECRET || "fallback");
    const token = await new jose.SignJWT({ test: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);
    console.log("[DIAG] 7. JWT sign success");

    console.log("[DIAG] 8. Cookie serialization check");
    const cookie = await import("cookie");
    const { getSessionCookieOptions } = await import("./lib/cookies.js");
    const { Session } = await import("../contracts/constants.js");

    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
    console.log("[DIAG] 8.1 Cookie options:", JSON.stringify(cookieOpts));
    
    const cookieStr = cookie.default.serialize(Session.cookieName, token, cookieOpts as any);
    console.log("[DIAG] 8.2 Cookie string serialized");

    const testHeaders = new Headers();
    testHeaders.append("set-cookie", cookieStr);
    console.log("[DIAG] 8.3 Cookie appended to Headers");

    return c.text("All checks passed successfully!");
  } catch (error: any) {
    console.error("[DIAG] Error in test-login:", error);
    return c.text(`Error: ${error.message}`);
  }
});

app.use("/api/trpc/*", async (c) => {
  const resHeaders = new Headers();
  
  const request = new Proxy(c.req.raw, {
    get(target, prop) {
      if (prop === "url") {
        return c.req.url;
      }
      const value = Reflect.get(target, prop);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

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

  // Leer el cuerpo como texto para evitar bloqueos/deadlocks de streams (ReadableStream) en Vercel
  const bodyText = await response.text();

  // Crear una nueva respuesta con los headers combinados para evitar errores de cabeceras inmutables
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of resHeaders.entries()) {
    newHeaders.append(key, value);
  }

  return new Response(bodyText, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
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


