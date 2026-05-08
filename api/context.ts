import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authenticateRequest } from "./auth-logic.js";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: any;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    // Asegurar que req.headers es un objeto Headers
    const headers = opts.req.headers instanceof Headers 
      ? opts.req.headers 
      : new Headers(opts.req.headers as any);
    
    ctx.user = await authenticateRequest(headers);
  } catch {
    // Authentication is optional here
  }
  return ctx;
}

