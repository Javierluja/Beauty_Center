import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";

// Vercel Serverless Function handler
export default async function handler(req: Request) {
  // Construir la URL completa
  const url = new URL(req.url, `https://${req.headers.get('host')}`);
  
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request(url, req),
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC ERROR] ${path}:`, error.message);
      }
    },
  });
}
