"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type LoginState = { error: string } | undefined;

/**
 * Server action for the /login form. On success, signIn issues a redirect
 * (thrown as NEXT_REDIRECT — must be re-thrown) to /admin. On bad
 * credentials, returns an error message for the form to display.
 *
 * Single-admin app: the only valid destination is /admin.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailRaw = formData.get("email");
  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // re-throw NEXT_REDIRECT so the redirect happens
  }
}

/** Server action to sign out; usable from any form (see SignOutButton). */
export async function logout() {
  await signOut({ redirectTo: "/login" });
}
