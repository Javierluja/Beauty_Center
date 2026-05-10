import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";

export default async function handler(req: Request) {
  // Construir URL completa para TRPC
  const url = new URL(req.url, `https://${req.headers.get("host") || "localhost"}`);
  
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    }),
    router: appRouter,
    createContext,
  });
}
