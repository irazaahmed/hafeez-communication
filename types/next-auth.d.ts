import type { DefaultSession } from "next-auth";

/**
 * Hafeez Communication is single-admin: the only role is "ADMIN". Auth is
 * env-based (see auth.ts) with no User table, so role is a plain literal
 * rather than a Prisma enum.
 */
type Role = "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

// next-auth/jwt is a pure re-export of @auth/core/jwt, so the JWT interface
// must be augmented at its source module for the callbacks to be typed.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
  }
}
