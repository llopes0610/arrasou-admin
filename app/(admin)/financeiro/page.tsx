import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import FinancialDashboard from "@/components/financeiro/FinancialDashboard";

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
    | {
        id: string;
        display_name: string;
      }[]
    | null;

  appointments:
    | {
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
          | {
              id: string;
              full_name: string;
            }[]
          | null;
      }[]
    | null;
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

  const {
    data: profile,
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
    !profile ||
    !profile.active
  ) {
    redirect("/login");
  }

  /*
   * ==========================================================
   * FINANCEIRO
   *
   * O RLS já garante:
   *
   * ADMIN
   * → todos os lançamentos
   *
   * PROFISSIONAL
   * → apenas os próprios lançamentos
   * ==========================================================
   */

  const {
    data,
    error,
  } =
    await supabase
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
      );

  if (error) {
    console.error(
      "Erro ao carregar financeiro:",
      error
    );
  }

  const entries =
    (
      data ?? []
    ) as unknown as FinancialEntry[];

  return (
    <div>
      <div>
        <p className="text-sm text-black/40">
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
            ? "Acompanhe faturamento, comissões e receita do Studio."
            : "Acompanhe sua produção e seus valores a receber."}
        </p>
      </div>

      <div className="mt-8">
        <FinancialDashboard
          entries={entries}
          currentUserRole={
            profile.role
          }
        />
      </div>
    </div>
  );
}