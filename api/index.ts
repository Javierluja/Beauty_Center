import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";

// Vercel Serverless Function handler
export default async function handler(req: Request) {
  // Asegurar que req es un Request válido
  if (!(req instanceof Request)) {
    // Si no es un Request, convertirlo
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const newReq = new Request(req.url || 'http://localhost/api/trpc', {
      method: req.method || 'POST',
      headers: new Headers(req.headers || {}),
      body: req.method !== 'GET' ? body : undefined,
    });
    req = newReq;
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: req as Request,
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC ERROR] ${path}:`, error.message);
      }
    },
  });
}
