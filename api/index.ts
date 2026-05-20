import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";

async function handleTestLogin() {
  try {
    const { getDb } = await import("./queries/connection.js");
    const { sql } = await import("drizzle-orm");
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    
    const { findUserByEmail } = await import("./queries/users.js");
    const user = await findUserByEmail("lujamonkey@gmail.com");

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("test123456", 10);
    const match = await bcrypt.default.compare("test123456", hash);

    const jose = await import("jose");
    const SECRET = new TextEncoder().encode(process.env.APP_SECRET || "fallback");
    const token = await new jose.SignJWT({ test: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);

    return new Response(`All checks passed successfully! User found: ${!!user}`, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export default async function handler(req: Request) {
  try {
    // 1. Obtener la URL absoluta para evitar el error "Invalid URL" en Vercel
    let urlStr = req.url;
    if (urlStr.startsWith("/")) {
      const host = req.headers.get("host") || "localhost";
      const protocol = host.startsWith("localhost") ? "http" : "https";
      urlStr = `${protocol}://${host}${urlStr}`;
    }
    const url = new URL(urlStr);

    // 2. Enrutar las peticiones de tRPC
    if (url.pathname.startsWith("/api/trpc/")) {
      if (url.pathname === "/api/trpc/test-login") {
        return handleTestLogin();
      }

      // Crear un Request con URL absoluta y pasar el body intacto (evitando pasar body en GET/HEAD para prevenir TypeErrors)
      const reqOptions: RequestInit = {
        method: req.method,
        headers: req.headers,
      };
      if (req.method !== "GET" && req.method !== "HEAD") {
        reqOptions.body = req.body;
        (reqOptions as any).duplex = "half";
      }

      const absoluteReq = new Request(urlStr, reqOptions);

      return await fetchRequestHandler({
        endpoint: "/api/trpc",
        req: absoluteReq,
        router: appRouter,
        createContext,
      });
    }

    // 3. Responder 404 para cualquier otra ruta de la API
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[FATAL ERROR] in Vercel handler:", error);
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: error.message,
      stack: error.stack,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
