import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";

const app = new Hono<{ Bindings: HttpBindings }>();

// 🛡️ 1. CABECERAS DE SEGURIDAD (HTTP Secure Headers)
app.use("*", secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://va.vercel-scripts.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https://*"],
    connectSrc: ["'self'", "https://*", "wss://*"],
  },
  xFrameOptions: "DENY",
  xXssProtection: "1; mode=block",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
}));

// 🌐 2. CONFIGURACIÓN DE CORS RESTRICTIVA
app.use("*", cors({
  origin: (origin, c) => {
    // Permitir desarrollo local y el dominio oficial de producción
    if (!origin) return null;
    const allowedPatterns = [
      /^https:\/\/beautyventas\.vercel\.app$/,
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/
    ];
    if (allowedPatterns.some(p => p.test(origin))) {
      return origin;
    }
    return null; // Denegar el resto
  },
  credentials: true,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
}));

// ⏱️ 3. RATE LIMITING BÁSICO EN MEMORIA PARA ENDPOINTS CRÍTICOS
// Almacenamos timestamps de intentos por IP para evitar ataques de fuerza bruta en login/register
const rateLimitMap = new Map<string, number[]>();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10;  // máx 10 peticiones por minuto para endpoints sensibles

app.use("/api/trpc/*", async (c, next) => {
  const isSensitive = c.req.url.includes("auth.login") || c.req.url.includes("auth.register");
  
  if (isSensitive) {
    const ip = c.env?.incoming?.socket?.remoteAddress || c.req.header("x-forwarded-for") || "unknown-ip";
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    
    // Filtrar los que están fuera de la ventana
    const validTimestamps = timestamps.filter(t => now - t < LIMIT_WINDOW_MS);
    
    if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      return c.json({
        error: {
          message: "Límite de intentos excedido. Por favor intenta de nuevo en un minuto.",
          code: -32005, // código de error customizado
        }
      }, 429);
    }
    
    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);
  }
  
  await next();
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));



app.use("/api/trpc/*", async (c) => {
  const resHeaders = new Headers();
  
  const request = new Proxy(c.req.raw, {
    get(target, prop) {
      if (prop === "url") {
        return c.req.url;
      }
      if (prop === "text") {
        return () => c.req.text();
      }
      if (prop === "json") {
        return () => c.req.json();
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


