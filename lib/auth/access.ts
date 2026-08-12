import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AccessScope =
  | "full"
  | "agenda_only";

export type AppRole =
  | "admin"
  | "professional";

export type CurrentProfile = {
  id: string;
  full_name: string | null;
  role: AppRole;
  access_scope: AccessScope;
  active: boolean;
};

/*
 * ============================================================
 * USUÁRIO ATUAL
 * ============================================================
 */

export async function getCurrentProfile(): Promise<CurrentProfile> {
  const supabase =
    await createClient();

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const {
    data: profile,
    error,
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        access_scope,
        active
      `)
      .eq(
        "id",
        userId
      )
      .single();

  if (
    error ||
    !profile ||
    !profile.active
  ) {
    redirect("/login");
  }

  if (
    profile.role !== "admin" &&
    profile.role !== "professional"
  ) {
    redirect("/login");
  }

  return profile as CurrentProfile;
}

/*
 * ============================================================
 * EXIGIR ACESSO COMPLETO
 * ============================================================
 */

export async function requireFullAccess() {
  const profile =
    await getCurrentProfile();

  /*
   * Admin sempre possui acesso completo.
   */
  if (
    profile.role === "admin"
  ) {
    return profile;
  }

  /*
   * Profissional agenda_only:
   * joga diretamente para Agenda.
   */
  if (
    profile.access_scope ===
    "agenda_only"
  ) {
    redirect("/agenda");
  }

  return profile;
}

/*
 * ============================================================
 * EXIGIR ADMIN
 * ============================================================
 */

export async function requireAdmin() {
  const profile =
    await getCurrentProfile();

  if (
    profile.role !== "admin"
  ) {
    redirect("/agenda");
  }

  return profile;
}