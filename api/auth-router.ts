import * as cookie from "cookie";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./auth-logic";
import { findUserByEmail, createUser } from "./queries/users";
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

      const opts = getSessionCookieOptions(ctx.req?.headers ??{});
      ctx.resHeaders?.append?.(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...opts,
          maxAge: 60 * 60 * 24 * 7, // 7 días
        }),
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
      
      const newUser = await createUser({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: "admin_pro" // El primer usuario que se registre será admin_pro
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
