import * as jose from "jose";
import * as cookie from "cookie";
import { findUserById } from "./queries/users";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";

if (!process.env.APP_SECRET) {
  throw new Error("APP_SECRET is missing");
}

const SECRET = new TextEncoder().encode(process.env.APP_SECRET);

export async function signSessionToken(payload: { id: number; email: string; role: string }) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET);
    return payload as { id: number; email: string; role: string };
  } catch {
    return null;
  }
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Verificamos que el usuario aún exista en la DB
  const user = await findUserById(payload.id);
  return user || null;
}
