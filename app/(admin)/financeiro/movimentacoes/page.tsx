import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CashMovementsDashboard from "@/components/financeiro/CashMovementsDashboard";

export type CashMovement = {
  id: string;

  type:
    | "expense"
    | "withdrawal"
    | "income";

  category: string;

  description: string;

  amount:
    | number
    | string;

  movement_date: string;

  responsible_user_id:
    | string
    | null;

  payment_method:
    | "pix"
    | "cash"
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "other"
    | null;

  notes:
    | string
    | null;

  created_by: string;

  created_at: string;

  responsible_user:
    | {
        id: string;
        full_name: string | null;
      }[]
    | null;

  created_by_user:
    | {
        id: string;
        full_name: string | null;
      }[]
    | null;
};

export type CashResponsibleUser = {
  id: string;
  full_name:
    | string
    | null;
};

export default async function CashMovementsPage() {
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
    !profile.active ||
    profile.role !== "admin"
  ) {
    redirect("/agenda");
  }

  const [
    movementsResult,
    usersResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "cash_movements"
        )
        .select(`
          id,
          type,
          category,
          description,
          amount,
          movement_date,
          responsible_user_id,
          payment_method,
          notes,
          created_by,
          created_at,

          responsible_user:profiles!cash_movements_responsible_user_id_fkey (
            id,
            full_name
          ),

          created_by_user:profiles!cash_movements_created_by_fkey (
            id,
            full_name
          )
        `)
        .order(
          "movement_date",
          {
            ascending:
              false,
          }
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        ),

      supabase
        .from(
          "profiles"
        )
        .select(`
          id,
          full_name
        `)
        .eq(
          "active",
          true
        )
        .eq(
          "role",
          "admin"
        )
        .order(
          "full_name"
        ),
    ]);

  if (
    movementsResult.error
  ) {
    console.error(
      "Erro ao carregar movimentações:",
      movementsResult.error
    );
  }

  if (
    usersResult.error
  ) {
    console.error(
      "Erro ao carregar responsáveis:",
      usersResult.error
    );
  }

  const movements =
    (
      movementsResult.data ??
      []
    ) as unknown as CashMovement[];

  const responsibleUsers =
    (
      usersResult.data ??
      []
    ) as CashResponsibleUser[];

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
          Movimentações
        </h1>

        <p
          className="
            mt-2
            max-w-2xl
            text-sm
            leading-6
            text-black/45
          "
        >
          Registre despesas, retiradas
          e outras movimentações da
          conta do Studio.
        </p>
      </div>

      <div className="mt-8">
        <CashMovementsDashboard
          movements={
            movements
          }
          responsibleUsers={
            responsibleUsers
          }
          currentUserId={
            userId
          }
        />
      </div>
    </div>
  );
}