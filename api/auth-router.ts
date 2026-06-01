import * as cookie from "cookie";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Session } from "../contracts/constants.js";
import { getSessionCookieOptions } from "./lib/cookies.js";
import { createRouter, authedQuery, publicQuery } from "./middleware.js";
import { signSessionToken } from "./auth-logic.js";
import { findUserByEmail, createUser } from "./queries/users.js";
import { TRPCError } from "@trpc/server";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  
  // LOGIN REAL CON EMAIL Y PASSWORD
  login: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await findUserByEmail(input.email);
      
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuario o contraseña incorrectos"
        });
      }

      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuario o contraseña incorrectos"
        });
      }

      const token = await signSessionToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      
  // 🔧 GUARDAR LA COOKIE DE SESIÓN
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, token, opts),
    );
      
      return { success: true, user: { id: user.id, name: user.name, role: user.role } };
    }),

  // REGISTRO DE NUEVOS USUARIOS
  register: publicQuery
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "El email ya está registrado"
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      // Consultamos si ya hay usuarios para decidir el rol inicial de forma segura
      const { getDb } = await import("./queries/connection.js");
      const { users } = await import("../db/schema.js");
      const db = getDb();
      const existingUsers = await db.select().from(users).limit(1);
      
      const role = existingUsers.length === 0 ? "admin_pro" : "ventas"; // Evita que se registren como admin si ya está en uso
      
      const newUser = await createUser({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: role
      });

      return { success: true, id: newUser?.id };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        ...opts,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});


