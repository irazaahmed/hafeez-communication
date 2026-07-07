import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { verifyAdminCredentials } from "@/lib/admin-auth";

/**
 * Full (Node runtime) Auth.js instance: edge-safe base config from
 * auth.config.ts + the Credentials provider.
 *
 * Hafeez Communication is a SINGLE-ADMIN panel. The credential lives in the
 * AdminUser table (see lib/admin-auth.ts). The first login is bootstrapped
 * from env (ADMIN_EMAIL / ADMIN_PASSWORD_HASH); afterwards the admin can
 * change the password from the settings screen.
 *
 * Import `auth`, `signIn`, `signOut` from here everywhere EXCEPT proxy.ts
 * (proxy builds its own edge-safe instance from auth.config.ts).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        const admin = await verifyAdminCredentials(email, password);
        if (!admin) return null;

        return { id: admin.id, email: admin.email, role: "ADMIN" as const };
      },
    }),
  ],
});
