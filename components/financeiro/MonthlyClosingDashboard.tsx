"use client";

import {
  useState,
} from "react";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CircleDollarSign,
  LockKeyhole,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import type {
  MonthlyClosingHistory,
  MonthlyClosingPreview,
} from "@/app/(admin)/financeiro/fechamento/page";

import CloseMonthModal from "./CloseMonthModal";

type MonthlyClosingDashboardProps = {
  preview:
    MonthlyClosingPreview;

  closings:
    MonthlyClosingHistory[];
};

export default function MonthlyClosingDashboard({
  preview,
  closings,
}: MonthlyClosingDashboardProps) {
  const router =
    useRouter();

  const supabase =
    createClient();

  const [
    closeModalOpen,
    setCloseModalOpen,
  ] =
    useState(false);

  const [
    loadingClosingId,
    setLoadingClosingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    error,
    setError,
  ] =
    useState("");

  const currentClosing =
    closings.find(
      (
        closing
      ) =>
        closing.month_start ===
        preview.monthStart
    );

  const monthAlreadyClosed =
    currentClosing?.status ===
    "closed";

  async function handleReopen(
    closingId: string
  ) {
    const confirmed =
      window.confirm(
        "Deseja realmente reabrir este fechamento?"
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setLoadingClosingId(
      closingId
    );

    try {
      const {
        error:
          rpcError,
      } =
        await supabase.rpc(
          "reopen_monthly_closing",
          {
            p_closing_id:
              closingId,
          }
        );

      if (
        rpcError
      ) {
        console.error(
          "Erro ao reabrir fechamento:",
          rpcError
        );

        setError(
          rpcError.message
        );

        return;
      }

      router.refresh();
    } finally {
      setLoadingClosingId(
        null
      );
    }
  }

  return (
    <>
      <section
        className="
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-white
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-black/10
            p-5

            lg:flex-row
            lg:items-center
            lg:justify-between

            sm:p-6
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#C9A227]
              "
            >
              Prévia
            </p>

            <h2
              className="
                mt-1
                font-serif
                text-2xl
                font-semibold
                text-[#111]
              "
            >
              {
                formatMonth(
                  preview.monthStart
                )
              }
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Valores calculados a partir
              dos lançamentos atuais.
            </p>
          </div>

          {monthAlreadyClosed ? (
            <div
              className="
                rounded-xl
                bg-green-50
                px-4
                py-3
                text-sm
                font-semibold
                text-green-700
              "
            >
              Mês fechado
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                setCloseModalOpen(
                  true
                )
              }
              className="
                flex
                min-h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#111]
                px-5
                text-sm
                font-semibold
                text-white

                hover:bg-[#C9A227]
                hover:text-black
              "
            >
              <LockKeyhole
                className="
                  h-4
                  w-4
                "
              />

              Fechar mês
            </button>
          )}
        </div>

        <div
          className="
            grid
            gap-px
            bg-black/[0.06]

            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <MetricCard
            label="Faturamento bruto"
            value={
              formatCurrency(
                preview.grossRevenue
              )
            }
            icon={
              CircleDollarSign
            }
          />

          <MetricCard
            label="Comissões"
            value={
              formatCurrency(
                preview.professionalCommissions
              )
            }
            icon={
              WalletCards
            }
          />

          <MetricCard
            label="Receita do Studio"
            value={
              formatCurrency(
                preview.studioRevenue
              )
            }
            icon={
              TrendingUp
            }
          />

          <MetricCard
            label="Atendimentos"
            value={
              String(
                preview.financialEntriesCount
              )
            }
            icon={
              CalendarDays
            }
          />
        </div>
      </section>

      <section
        className="
          mt-6
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-white
        "
      >
        <div
          className="
            border-b
            border-black/10
            p-5

            sm:p-6
          "
        >
          <h2
            className="
              font-serif
              text-2xl
              font-semibold
              text-[#111]
            "
          >
            Movimentações
          </h2>

          <p
            className="
              mt-1
              text-xs
              text-black/40
            "
          >
            Entradas, despesas e retiradas
            registradas no mês.
          </p>
        </div>

        <div
          className="
            grid
            gap-px
            bg-black/[0.06]

            sm:grid-cols-3
          "
        >
          <MetricCard
            label="Entradas manuais"
            value={
              formatCurrency(
                preview.manualIncome
              )
            }
            icon={
              ArrowUpCircle
            }
          />

          <MetricCard
            label="Despesas"
            value={
              formatCurrency(
                preview.expenses
              )
            }
            icon={
              ArrowDownCircle
            }
          />

          <MetricCard
            label="Retiradas"
            value={
              formatCurrency(
                preview.withdrawals
              )
            }
            icon={
              WalletCards
            }
          />
        </div>
      </section>

      <section
        className="
          mt-6
          overflow-hidden
          rounded-2xl
          border
          border-[#C9A227]/20
          bg-[#111]
          text-white
        "
      >
        <div
          className="
            p-6

            sm:p-8
          "
        >
          <p
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-[#C9A227]
            "
          >
            Resultado do mês
          </p>

          <p
            className="
              mt-3
              text-4xl
              font-bold
              text-[#C9A227]

              sm:text-5xl
            "
          >
            {
              formatCurrency(
                preview.netResult
              )
            }
          </p>

          <div
            className="
              mt-6
              grid
              gap-2

              sm:grid-cols-4
            "
          >
            <ResultItem
              label="Receita Studio"
              value={
                preview.studioRevenue
              }
              operation="+"
            />

            <ResultItem
              label="Entradas"
              value={
                preview.manualIncome
              }
              operation="+"
            />

            <ResultItem
              label="Despesas"
              value={
                preview.expenses
              }
              operation="-"
            />

            <ResultItem
              label="Retiradas"
              value={
                preview.withdrawals
              }
              operation="-"
            />
          </div>
        </div>
      </section>

      {error && (
        <div
          className="
            mt-6
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}

      <section
        className="
          mt-8
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-white
        "
      >
        <div
          className="
            border-b
            border-black/10
            p-5

            sm:p-6
          "
        >
          <h2
            className="
              font-serif
              text-2xl
              font-semibold
              text-[#111]
            "
          >
            Histórico de fechamentos
          </h2>
        </div>

        {closings.length ===
        0 ? (
          <div
            className="
              py-10
              text-center
              text-sm
              text-black/40
            "
          >
            Nenhum fechamento realizado.
          </div>
        ) : (
          <div>
            {closings.map(
              (
                closing
              ) => (
                <div
                  key={
                    closing.id
                  }
                  className="
                    border-b
                    border-black/[0.06]
                    px-5
                    py-5
                    last:border-b-0

                    sm:px-6
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      gap-4

                      lg:flex-row
                      lg:items-center
                      lg:justify-between
                    "
                  >
                    <div>
                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-2
                        "
                      >
                        <p
                          className="
                            text-sm
                            font-semibold
                            text-[#111]
                          "
                        >
                          {
                            formatMonth(
                              closing.month_start
                            )
                          }
                        </p>

                        <span
                          className={`
                            rounded-full
                            px-2.5
                            py-1
                            text-[9px]
                            font-bold
                            uppercase

                            ${
                              closing.status ===
                              "closed"
                                ? "bg-green-100 text-green-700"
                                : "bg-[#F8F1D9] text-[#8A6D0A]"
                            }
                          `}
                        >
                          {closing.status ===
                          "closed"
                            ? "Fechado"
                            : "Reaberto"}
                        </span>
                      </div>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-black/40
                        "
                      >
                        Resultado:{" "}
                        {formatCurrency(
                          Number(
                            closing.net_result
                          )
                        )}
                      </p>
                    </div>

                    {closing.status ===
                      "closed" && (
                      <button
                        type="button"
                        disabled={
                          loadingClosingId ===
                          closing.id
                        }
                        onClick={() =>
                          handleReopen(
                            closing.id
                          )
                        }
                        className="
                          min-h-10
                          rounded-xl
                          border
                          border-black/10
                          px-4
                          text-xs
                          font-semibold
                          text-black/50

                          hover:bg-black/[0.03]

                          disabled:opacity-50
                        "
                      >
                        Reabrir fechamento
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <CloseMonthModal
        open={
          closeModalOpen
        }
        preview={
          preview
        }
        onClose={() =>
          setCloseModalOpen(
            false
          )
        }
        onCreated={() => {
          setCloseModalOpen(
            false
          );

          router.refresh();
        }}
      />
    </>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon:
    React.ElementType;
}) {
  return (
    <div
      className="
        bg-white
        p-5

        sm:p-6
      "
    >
      <Icon
        className="
          h-5
          w-5
          text-[#C9A227]
        "
      />

      <p
        className="
          mt-4
          text-xs
          text-black/40
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          text-xl
          font-bold
          text-[#111]
        "
      >
        {value}
      </p>
    </div>
  );
}

function ResultItem({
  label,
  value,
  operation,
}: {
  label: string;
  value: number;
  operation:
    | "+"
    | "-";
}) {
  return (
    <div
      className="
        rounded-xl
        bg-white/[0.04]
        p-4
      "
    >
      <p
        className="
          text-[9px]
          uppercase
          tracking-wider
          text-white/30
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-semibold
          text-white
        "
      >
        {operation}{" "}
        {
          formatCurrency(
            value
          )
        }
      </p>
    </div>
  );
}

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",
      currency:
        "BRL",
    }
  ).format(
    value
  );
}

function formatMonth(
  value: string
) {
  const date =
    new Date(
      `${value}T12:00:00-03:00`
    );

  const formatted =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        month:
          "long",
        year:
          "numeric",
        timeZone:
          "America/Sao_Paulo",
      }
    ).format(
      date
    );

  return (
    formatted
      .charAt(0)
      .toUpperCase() +
    formatted.slice(1)
  );
}