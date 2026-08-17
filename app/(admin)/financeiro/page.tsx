import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import FinancialDashboard from "@/components/financeiro/FinancialDashboard";

/* ============================================================
   RELAÇÕES SUPABASE
============================================================ */

export type SupabaseRelation<T> =
  | T
  | T[]
  | null;

/* ============================================================
   LANÇAMENTOS FINANCEIROS
============================================================ */

export type FinancialEntry = {
  id: string;

  appointment_id: string;

  professional_id: string;

  service_name: string;

  gross_amount:
    | number
    | string;

  commission_percentage:
    | number
    | string;

  professional_amount:
    | number
    | string;

  studio_amount:
    | number
    | string;

  created_at: string;

  professionals:
    SupabaseRelation<{
      id: string;
      display_name: string;
    }>;

  appointments:
    SupabaseRelation<{
      id: string;

      start_at: string;

      payment_method:
        | "pix"
        | "cash"
        | "credit_card"
        | "debit_card"
        | "other"
        | null;

      clients:
        SupabaseRelation<{
          id: string;
          full_name: string;
        }>;
    }>;
};

/* ============================================================
   COMISSÕES PENDENTES
============================================================ */

export type PendingProfessionalCommission = {
  professional_id: string;

  professional_name: string;

  entries_count:
    | number
    | string;

  gross_amount:
    | number
    | string;

  commission_amount:
    | number
    | string;

  studio_amount:
    | number
    | string;

  oldest_entry_at:
    | string
    | null;

  newest_entry_at:
    | string
    | null;
};

/* ============================================================
   FECHAMENTOS
============================================================ */

export type CommissionSettlement = {
  id: string;

  professional_id: string;

  period_start: string;

  period_end: string;

  gross_amount:
    | number
    | string;

  commission_amount:
    | number
    | string;

  studio_amount:
    | number
    | string;

  status:
    | "pending"
    | "paid"
    | "canceled";

  paid_at:
    | string
    | null;

  notes:
    | string
    | null;

  created_at: string;

  updated_at: string;

  professionals:
    SupabaseRelation<{
      id: string;
      display_name: string;
    }>;
};

export default async function FinanceiroPage() {
  const supabase =
    await createClient();

  /*
   * ==========================================================
   * USUÁRIO
   * ==========================================================
   */

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  /*
   * ==========================================================
   * PERFIL
   * ==========================================================
   */

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        active
      `)
      .eq(
        "id",
        userId
      )
      .single();

  if (
    profileError ||
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

  /*
   * ==========================================================
   * CONSULTAS FINANCEIRAS
   * ==========================================================
   */

  const [
    entriesResult,
    pendingResult,
    settlementsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "financial_entries"
        )
        .select(`
          id,
          appointment_id,
          professional_id,
          service_name,
          gross_amount,
          commission_percentage,
          professional_amount,
          studio_amount,
          created_at,

          professionals (
            id,
            display_name
          ),

          appointments (
            id,
            start_at,
            payment_method,

            clients (
              id,
              full_name
            )
          )
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),

      supabase
        .from(
          "pending_professional_commissions"
        )
        .select(`
          professional_id,
          professional_name,
          entries_count,
          gross_amount,
          commission_amount,
          studio_amount,
          oldest_entry_at,
          newest_entry_at
        `)
        .order(
          "professional_name",
          {
            ascending: true,
          }
        ),

      supabase
        .from(
          "commission_settlements"
        )
        .select(`
          id,
          professional_id,
          period_start,
          period_end,
          gross_amount,
          commission_amount,
          studio_amount,
          status,
          paid_at,
          notes,
          created_at,
          updated_at,

          professionals (
            id,
            display_name
          )
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),
    ]);

  /*
   * ==========================================================
   * ERROS
   * ==========================================================
   */

  if (
    entriesResult.error
  ) {
    console.error(
      "Erro ao carregar lançamentos financeiros:",
      entriesResult.error
    );
  }

  if (
    pendingResult.error
  ) {
    console.error(
      "Erro ao carregar comissões pendentes:",
      pendingResult.error
    );
  }

  if (
    settlementsResult.error
  ) {
    console.error(
      "Erro ao carregar fechamentos:",
      settlementsResult.error
    );
  }

  /*
   * ==========================================================
   * DADOS
   * ==========================================================
   */

  const entries =
    (
      entriesResult.data ??
      []
    ) as unknown as FinancialEntry[];

  const pendingCommissions =
    (
      pendingResult.data ??
      []
    ) as unknown as PendingProfessionalCommission[];

  const settlements =
    (
      settlementsResult.data ??
      []
    ) as unknown as CommissionSettlement[];

  return (
    <div>
      <div>
        <p
          className="
            text-sm
            text-black/40
          "
        >
          Gestão financeira
        </p>

        <h1
          className="
            mt-1
            font-serif
            text-3xl
            font-semibold
            text-[#111]

            sm:text-4xl
          "
        >
          Financeiro
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-black/45
          "
        >
          {profile.role ===
          "admin"
            ? "Acompanhe faturamento, comissões, valores a pagar e receita do Studio."
            : "Acompanhe sua produção, seus valores a receber e histórico financeiro."}
        </p>
      </div>

      <div className="mt-8">
        <FinancialDashboard
          entries={
            entries
          }
          pendingCommissions={
            pendingCommissions
          }
          settlements={
            settlements
          }
          currentUserRole={
            profile.role
          }
        />
      </div>
    </div>
  );
}