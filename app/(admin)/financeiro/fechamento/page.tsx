import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import MonthlyClosingDashboard from "@/components/financeiro/MonthlyClosingDashboard";

export type MonthlyClosingPreview = {
  monthStart: string;

  grossRevenue: number;
  professionalCommissions: number;
  studioRevenue: number;

  manualIncome: number;
  expenses: number;
  withdrawals: number;

  netResult: number;

  financialEntriesCount: number;
  cashMovementsCount: number;
};

export type MonthlyClosingHistory = {
  id: string;

  month_start: string;

  gross_revenue:
    | number
    | string;

  professional_commissions:
    | number
    | string;

  studio_revenue:
    | number
    | string;

  manual_income:
    | number
    | string;

  expenses:
    | number
    | string;

  withdrawals:
    | number
    | string;

  net_result:
    | number
    | string;

  financial_entries_count: number;

  cash_movements_count: number;

  status:
    | "closed"
    | "reopened";

  notes:
    | string
    | null;

  closed_at: string;

  closed_by_user:
    | {
        id: string;
        full_name: string | null;
      }[]
    | null;
};

export default async function MonthlyClosingPage() {
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

  const now =
    new Date();

  const monthParts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year:
          "numeric",
        month:
          "2-digit",
        timeZone:
          "America/Sao_Paulo",
      }
    ).formatToParts(
      now
    );

  const year =
    monthParts.find(
      (
        part
      ) =>
        part.type ===
        "year"
    )?.value;

  const month =
    monthParts.find(
      (
        part
      ) =>
        part.type ===
        "month"
    )?.value;

  const monthStart =
    `${year}-${month}-01`;

  const nextMonthDate =
    new Date(
      Number(
        year
      ),
      Number(
        month
      ),
      1
    );

  const nextMonthYear =
    nextMonthDate
      .getFullYear();

  const nextMonth =
    String(
      nextMonthDate
        .getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const nextMonthStart =
    `${nextMonthYear}-${nextMonth}-01`;

  const [
    entriesResult,
    movementsResult,
    closingsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "financial_entries"
        )
        .select(`
          id,
          gross_amount,
          professional_amount,
          studio_amount,

          appointments!inner (
            id,
            start_at
          )
        `)
        .gte(
          "appointments.start_at",
          `${monthStart}T00:00:00-03:00`
        )
        .lt(
          "appointments.start_at",
          `${nextMonthStart}T00:00:00-03:00`
        ),

      supabase
        .from(
          "cash_movements"
        )
        .select(`
          id,
          type,
          amount,
          movement_date
        `)
        .gte(
          "movement_date",
          monthStart
        )
        .lt(
          "movement_date",
          nextMonthStart
        ),

      supabase
        .from(
          "monthly_closings"
        )
        .select(`
          id,
          month_start,
          gross_revenue,
          professional_commissions,
          studio_revenue,
          manual_income,
          expenses,
          withdrawals,
          net_result,
          financial_entries_count,
          cash_movements_count,
          status,
          notes,
          closed_at,

          closed_by_user:profiles!monthly_closings_closed_by_fkey (
            id,
            full_name
          )
        `)
        .order(
          "month_start",
          {
            ascending:
              false,
          }
        ),
    ]);

  if (
    entriesResult.error
  ) {
    console.error(
      "Erro ao carregar financeiro do mês:",
      entriesResult.error
    );
  }

  if (
    movementsResult.error
  ) {
    console.error(
      "Erro ao carregar movimentações do mês:",
      movementsResult.error
    );
  }

  if (
    closingsResult.error
  ) {
    console.error(
      "Erro ao carregar fechamentos:",
      closingsResult.error
    );
  }

  const entries =
    entriesResult.data ??
    [];

  const movements =
    movementsResult.data ??
    [];

  const grossRevenue =
    entries.reduce(
      (
        total,
        entry
      ) =>
        total +
        Number(
          entry.gross_amount
        ),
      0
    );

  const professionalCommissions =
    entries.reduce(
      (
        total,
        entry
      ) =>
        total +
        Number(
          entry.professional_amount
        ),
      0
    );

  const studioRevenue =
    entries.reduce(
      (
        total,
        entry
      ) =>
        total +
        Number(
          entry.studio_amount
        ),
      0
    );

  const manualIncome =
    movements
      .filter(
        (
          movement
        ) =>
          movement.type ===
          "income"
      )
      .reduce(
        (
          total,
          movement
        ) =>
          total +
          Number(
            movement.amount
          ),
        0
      );

  const expenses =
    movements
      .filter(
        (
          movement
        ) =>
          movement.type ===
          "expense"
      )
      .reduce(
        (
          total,
          movement
        ) =>
          total +
          Number(
            movement.amount
          ),
        0
      );

  const withdrawals =
    movements
      .filter(
        (
          movement
        ) =>
          movement.type ===
          "withdrawal"
      )
      .reduce(
        (
          total,
          movement
        ) =>
          total +
          Number(
            movement.amount
          ),
        0
      );

  const netResult =
      studioRevenue
    + manualIncome
    - expenses
    - withdrawals;

  const preview:
    MonthlyClosingPreview = {
      monthStart,

      grossRevenue,

      professionalCommissions,

      studioRevenue,

      manualIncome,

      expenses,

      withdrawals,

      netResult,

      financialEntriesCount:
        entries.length,

      cashMovementsCount:
        movements.length,
    };

  const closings =
    (
      closingsResult.data ??
      []
    ) as unknown as MonthlyClosingHistory[];

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
          Fechamento mensal
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
          Confira o resultado financeiro
          do mês antes de realizar o
          fechamento.
        </p>
      </div>

      <div className="mt-8">
        <MonthlyClosingDashboard
          preview={
            preview
          }
          closings={
            closings
          }
        />
      </div>
    </div>
  );
}