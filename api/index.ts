import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js.js";
import { createContext } from "./context.js.js";

// Vercel Serverless Function handler
// This is the entry point for all /api/* requests
export default async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC ERROR] ${path}:`, error.message);
      }
    },
  });
}
