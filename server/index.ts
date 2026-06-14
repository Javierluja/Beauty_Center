import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import type { IncomingMessage, ServerResponse } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleTestLogin(res: ServerResponse) {
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

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end(`All checks passed successfully! User found: ${!!user}`);
  } catch (error: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end(`Error: ${error.message}`);
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // 1. Reconstruir la URL absoluta
    const host = req.headers.host || "localhost";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const urlStr = `${protocol}://${host}${req.url}`;
    const url = new URL(urlStr);

    // 2. Enrutar petición de diagnóstico
    if (url.pathname === "/api/trpc/test-login") {
      return handleTestLogin(res);
    }

    // 3. Enrutar peticiones de tRPC
    if (url.pathname.startsWith("/api/trpc/")) {
      // Leer el cuerpo de la petición de forma segura usando acumulador de Node.js
      let bodyBuffer: Buffer | undefined = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        const chunks: any[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        bodyBuffer = Buffer.concat(chunks);
      }

      // Construir el objeto Web Request estándar a partir del Request de Node.js
      const webReq = new Request(urlStr, {
        method: req.method,
        headers: req.headers as any,
        body: bodyBuffer,
      });

      // Procesar la petición usando el adaptador oficial de tRPC
      const webRes = await fetchRequestHandler({
        endpoint: "/api/trpc",
        req: webReq,
        router: appRouter,
        createContext,
      });

      // Escribir el código de estado y cabeceras de respuesta al objeto Node.js res
      res.statusCode = webRes.status;
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Leer el cuerpo de respuesta de tRPC y enviarlo
      const resBody = await webRes.text();
      res.end(resBody);
      return;
    }

    // 4. Responder 404 para cualquier otra ruta de la API
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not Found" }));
  } catch (error: any) {
    console.error("[FATAL ERROR] in Vercel handler:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Internal Server Error",
      message: error.message,
      stack: error.stack,
    }));
  }
}
