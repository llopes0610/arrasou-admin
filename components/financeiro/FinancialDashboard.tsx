"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Loader2,
  Search,
  TrendingUp,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import type {
  CommissionSettlement,
  FinancialEntry,
  PendingProfessionalCommission,
  SupabaseRelation,
} from "@/app/(admin)/financeiro/page";

import { createClient } from "@/lib/supabase/client";

import CreateSettlementModal from "./CreateSettlementModal";

type FinancialDashboardProps = {
  entries:
    FinancialEntry[];

  pendingCommissions:
    PendingProfessionalCommission[];

  settlements:
    CommissionSettlement[];

  currentUserRole:
    | "admin"
    | "professional";
};

type PeriodFilter =
  | "today"
  | "week"
  | "month"
  | "all";

function getRelation<T>(
  relation: SupabaseRelation<T>
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export default function FinancialDashboard({
  entries,
  pendingCommissions,
  settlements,
  currentUserRole,
}: FinancialDashboardProps) {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const [
    settlementActionLoading,
    setSettlementActionLoading,
  ] =
    useState<
      string | null
    >(null);

  const [
    settlementActionError,
    setSettlementActionError,
  ] =
    useState("");

  const [
    settlementOpen,
    setSettlementOpen,
  ] =
    useState(false);

  const [
    selectedCommission,
    setSelectedCommission,
  ] =
    useState<
      PendingProfessionalCommission | null
    >(null);

  const [
    period,
    setPeriod,
  ] =
    useState<PeriodFilter>(
      "month"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  /*
   * ==========================================================
   * FILTRO DE PERÍODO
   * ==========================================================
   */

  const periodEntries =
    useMemo(() => {
      return entries.filter(
        (entry) =>
          matchesPeriod(
            entry.created_at,
            period
          )
      );
    }, [
      entries,
      period,
    ]);

  /*
   * ==========================================================
   * BUSCA
   * ==========================================================
   */

  const filteredEntries =
    useMemo(() => {
      const term =
        normalizeText(
          search
        );

      if (!term) {
        return periodEntries;
      }

      return periodEntries.filter(
        (entry) => {
          const professional =
            getRelation(
              entry.professionals
            )?.display_name ??
            "";

          const appointment =
            getRelation(
              entry.appointments
            );

          const client =
            getRelation(
              appointment?.clients ??
                null
            )?.full_name ??
            "";

          return (
            normalizeText(
              entry.service_name
            ).includes(
              term
            ) ||
            normalizeText(
              professional
            ).includes(
              term
            ) ||
            normalizeText(
              client
            ).includes(
              term
            )
          );
        }
      );
    }, [
      periodEntries,
      search,
    ]);

  /*
   * ==========================================================
   * TOTAIS
   * ==========================================================
   */

  const grossRevenue =
    periodEntries.reduce(
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

  const professionalTotal =
    periodEntries.reduce(
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

  const studioTotal =
    periodEntries.reduce(
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

  /*
   * ==========================================================
   * PRODUÇÃO POR PROFISSIONAL
   * ==========================================================
   */

  const professionals =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            id: string;
            name: string;
            gross: number;
            commission: number;
            studio: number;
            appointments: number;
          }
        >();

      periodEntries.forEach(
        (entry) => {
          const professional =
            getRelation(
              entry.professionals
            );

          if (!professional) {
            return;
          }

          const existing =
            map.get(
              professional.id
            );

          if (existing) {
            existing.gross +=
              Number(
                entry.gross_amount
              );

            existing.commission +=
              Number(
                entry.professional_amount
              );

            existing.studio +=
              Number(
                entry.studio_amount
              );

            existing.appointments +=
              1;
          } else {
            map.set(
              professional.id,
              {
                id:
                  professional.id,

                name:
                  professional.display_name,

                gross:
                  Number(
                    entry.gross_amount
                  ),

                commission:
                  Number(
                    entry.professional_amount
                  ),

                studio:
                  Number(
                    entry.studio_amount
                  ),

                appointments:
                  1,
              }
            );
          }
        }
      );

      return Array.from(
        map.values()
      ).sort(
        (
          a,
          b
        ) =>
          b.gross -
          a.gross
      );
    }, [
      periodEntries,
    ]);

  const isAdmin =
    currentUserRole ===
    "admin";

  /*
   * ==========================================================
   * COMISSÕES PENDENTES
   * ==========================================================
   */

  const payablePendingCommissions =
    pendingCommissions.filter(
      (item) =>
        Number(
          item.commission_amount
        ) > 0
    );

  const pendingCommissionTotal =
    payablePendingCommissions.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.commission_amount
        ),
      0
    );

  const pendingGrossTotal =
    pendingCommissions.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.gross_amount
        ),
      0
    );

  const pendingStudioTotal =
    pendingCommissions.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.studio_amount
        ),
      0
    );

  /*
   * ==========================================================
   * AÇÕES DE FECHAMENTO
   * ==========================================================
   */

  async function handleMarkSettlementPaid(
    settlement:
      CommissionSettlement
  ) {
    if (
      settlement.status !==
      "pending"
    ) {
      return;
    }

    const professional =
      getRelation(
        settlement.professionals
      );

    const confirmed =
      window.confirm(
        `Confirmar o pagamento de ${formatCurrency(
          Number(
            settlement.commission_amount
          )
        )} para ${
          professional?.display_name ??
          "a profissional"
        }?`
      );

    if (!confirmed) {
      return;
    }

    setSettlementActionError("");
    setSettlementActionLoading(
      settlement.id
    );

    try {
      const {
        error,
      } =
        await supabase.rpc(
          "mark_commission_settlement_paid",
          {
            p_settlement_id:
              settlement.id,
          }
        );

      if (error) {
        console.error(
          "Erro ao marcar fechamento como pago:",
          error
        );

        setSettlementActionError(
          error.message ||
            "Não foi possível marcar o fechamento como pago."
        );

        return;
      }

      router.refresh();
    } catch (
      exception
    ) {
      console.error(
        "Erro inesperado ao marcar fechamento como pago:",
        exception
      );

      setSettlementActionError(
        "Não foi possível marcar o fechamento como pago."
      );
    } finally {
      setSettlementActionLoading(
        null
      );
    }
  }

  async function handleCancelSettlement(
    settlement:
      CommissionSettlement
  ) {
    if (
      settlement.status !==
      "pending"
    ) {
      return;
    }

    const professional =
      getRelation(
        settlement.professionals
      );

    const confirmed =
      window.confirm(
        `Cancelar o fechamento de ${
          professional?.display_name ??
          "profissional"
        }? Os lançamentos voltarão para Comissões pendentes.`
      );

    if (!confirmed) {
      return;
    }

    setSettlementActionError("");
    setSettlementActionLoading(
      settlement.id
    );

    try {
      const {
        error,
      } =
        await supabase.rpc(
          "cancel_commission_settlement",
          {
            p_settlement_id:
              settlement.id,
          }
        );

      if (error) {
        console.error(
          "Erro ao cancelar fechamento:",
          error
        );

        setSettlementActionError(
          error.message ||
            "Não foi possível cancelar o fechamento."
        );

        return;
      }

      router.refresh();
    } catch (
      exception
    ) {
      console.error(
        "Erro inesperado ao cancelar fechamento:",
        exception
      );

      setSettlementActionError(
        "Não foi possível cancelar o fechamento."
      );
    } finally {
      setSettlementActionLoading(
        null
      );
    }
  }

  return (
    <div>
      {/* ======================================================
          FILTRO DE PERÍODO
      ======================================================= */}

      <div
        className="
          flex
          flex-col
          gap-4
          rounded-2xl
          border
          border-black/10
          bg-white
          p-4

          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div
          className="
            flex
            overflow-x-auto
            rounded-xl
            bg-[#F5F5F3]
            p-1
          "
        >
          <PeriodButton
            active={
              period ===
              "today"
            }
            onClick={() =>
              setPeriod(
                "today"
              )
            }
          >
            Hoje
          </PeriodButton>

          <PeriodButton
            active={
              period ===
              "week"
            }
            onClick={() =>
              setPeriod(
                "week"
              )
            }
          >
            Semana
          </PeriodButton>

          <PeriodButton
            active={
              period ===
              "month"
            }
            onClick={() =>
              setPeriod(
                "month"
              )
            }
          >
            Mês
          </PeriodButton>

          <PeriodButton
            active={
              period ===
              "all"
            }
            onClick={() =>
              setPeriod(
                "all"
              )
            }
          >
            Todo período
          </PeriodButton>
        </div>

        <p
          className="
            text-xs
            text-black/35
          "
        >
          {
            periodEntries.length
          }{" "}
          {periodEntries.length ===
          1
            ? "lançamento"
            : "lançamentos"}
        </p>
      </div>

      {/* ======================================================
          KPIs
      ======================================================= */}

      <div
        className="
          mt-5
          grid
          gap-4

          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <FinanceCard
          label={
            isAdmin
              ? "Faturamento bruto"
              : "Minha produção"
          }
          value={formatCurrency(
            grossRevenue
          )}
          icon={
            CircleDollarSign
          }
        />

        <FinanceCard
          label={
            isAdmin
              ? "Comissões"
              : "Tenho a receber"
          }
          value={formatCurrency(
            professionalTotal
          )}
          icon={
            WalletCards
          }
          highlight={
            !isAdmin
          }
        />

        {isAdmin ? (
          <>
            <FinanceCard
              label="Receita do Studio"
              value={formatCurrency(
                studioTotal
              )}
              icon={
                TrendingUp
              }
              highlight
            />

            <FinanceCard
              label="Atendimentos pagos"
              value={String(
                periodEntries.length
              )}
              icon={
                CalendarDays
              }
            />
          </>
        ) : (
          <>
            <FinanceCard
              label="Atendimentos"
              value={String(
                periodEntries.length
              )}
              icon={
                CalendarDays
              }
            />

            <FinanceCard
              label="Média por atendimento"
              value={formatCurrency(
                periodEntries.length
                  ? grossRevenue /
                      periodEntries.length
                  : 0
              )}
              icon={
                TrendingUp
              }
            />
          </>
        )}
      </div>

      {/* ======================================================
          COMISSÕES PENDENTES
          ADMIN
      ======================================================= */}

      {isAdmin && (
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
                Contas a pagar
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
                Comissões pendentes
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-black/40
                "
              >
                Valores acumulados que ainda não entraram em um fechamento.
              </p>
            </div>

            <div
              className="
                rounded-xl
                bg-[#F8F1D9]
                px-4
                py-3
              "
            >
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-black/35
                "
              >
                Total a pagar
              </p>

              <p
                className="
                  mt-1
                  text-xl
                  font-bold
                  text-[#111]
                "
              >
                {formatCurrency(
                  pendingCommissionTotal
                )}
              </p>
            </div>
          </div>

          {payablePendingCommissions.length ===
          0 ? (
            <div
              className="
                px-6
                py-10
                text-center
              "
            >
              <WalletCards
                className="
                  mx-auto
                  h-7
                  w-7
                  text-[#C9A227]
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  font-semibold
                  text-[#111]
                "
              >
                Nenhuma comissão pendente
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-black/40
                "
              >
                Novos valores aparecerão após atendimentos concluídos.
              </p>
            </div>
          ) : (
            <div
              className="
                grid
                gap-px
                bg-black/[0.06]

                lg:grid-cols-2
              "
            >
              {payablePendingCommissions.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.professional_id
                    }
                    className="
                      bg-white
                      p-5

                      sm:p-6
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      "
                    >
                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                        "
                      >
                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#C9A227]/10
                          "
                        >
                          <UserRound
                            className="
                              h-4
                              w-4
                              text-[#C9A227]
                            "
                          />
                        </div>

                        <div
                          className="
                            min-w-0
                          "
                        >
                          <p
                            className="
                              truncate
                              text-sm
                              font-semibold
                              text-[#111]
                            "
                          >
                            {
                              item.professional_name
                            }
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-[10px]
                              text-black/40
                            "
                          >
                            {
                              Number(
                                item.entries_count
                              )
                            }{" "}
                            {Number(
                              item.entries_count
                            ) === 1
                              ? "lançamento pendente"
                              : "lançamentos pendentes"}
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                          text-right
                        "
                      >
                        <p
                          className="
                            text-[9px]
                            uppercase
                            tracking-wider
                            text-black/30
                          "
                        >
                          A pagar
                        </p>

                        <p
                          className="
                            mt-1
                            text-lg
                            font-bold
                            text-[#A18016]
                          "
                        >
                          {formatCurrency(
                            Number(
                              item.commission_amount
                            )
                          )}
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        mt-5
                        grid
                        grid-cols-3
                        gap-2
                      "
                    >
                      <MiniValue
                        label="Produção"
                        value={formatCurrency(
                          Number(
                            item.gross_amount
                          )
                        )}
                      />

                      <MiniValue
                        label="Comissão"
                        value={formatCurrency(
                          Number(
                            item.commission_amount
                          )
                        )}
                      />

                      <MiniValue
                        label="Studio"
                        value={formatCurrency(
                          Number(
                            item.studio_amount
                          )
                        )}
                        gold
                      />
                    </div>

                    <div
                      className="
                        mt-4
                        flex
                        flex-wrap
                        gap-x-4
                        gap-y-1
                        border-t
                        border-black/[0.06]
                        pt-3
                        text-[10px]
                        text-black/35
                      "
                    >
                      {item.oldest_entry_at && (
                        <span>
                          Desde{" "}
                          {formatShortDate(
                            item.oldest_entry_at
                          )}
                        </span>
                      )}

                      {item.newest_entry_at && (
                        <span>
                          Último lançamento{" "}
                          {formatShortDate(
                            item.newest_entry_at
                          )}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCommission(
                          item
                        );

                        setSettlementOpen(
                          true
                        );
                      }}
                      className="
                        mt-4
                        flex
                        min-h-11
                        w-full
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#111]
                        px-4
                        text-xs
                        font-semibold
                        text-white
                        transition-colors

                        hover:bg-[#C9A227]
                        hover:text-black
                      "
                    >
                      Criar fechamento
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          <div
            className="
              grid
              gap-px
              border-t
              border-black/[0.06]
              bg-black/[0.06]

              sm:grid-cols-3
            "
          >
            <PendingSummary
              label="Produção ainda não fechada"
              value={formatCurrency(
                pendingGrossTotal
              )}
            />

            <PendingSummary
              label="Comissões ainda não fechadas"
              value={formatCurrency(
                pendingCommissionTotal
              )}
            />

            <PendingSummary
              label="Studio nesses lançamentos"
              value={formatCurrency(
                pendingStudioTotal
              )}
              gold
            />
          </div>
        </section>
      )}

      {/* ======================================================
          HISTÓRICO DE FECHAMENTOS
          ADMIN
      ======================================================= */}

      {isAdmin && (
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
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#C9A227]
              "
            >
              Pagamentos
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
              Histórico de fechamentos
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Fechamentos pendentes, pagos ou cancelados.
            </p>
          </div>

          {settlementActionError && (
            <div
              className="
                mx-5
                mt-5
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-700

                sm:mx-6
              "
            >
              {
                settlementActionError
              }
            </div>
          )}

          {settlements.length ===
          0 ? (
            <div
              className="
                px-6
                py-10
                text-center
              "
            >
              <CalendarDays
                className="
                  mx-auto
                  h-7
                  w-7
                  text-[#C9A227]
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  font-semibold
                  text-[#111]
                "
              >
                Nenhum fechamento realizado
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-black/40
                "
              >
                Os fechamentos de comissão aparecerão aqui.
              </p>
            </div>
          ) : (
            <div>
              {settlements.map(
                (
                  settlement
                ) => {
                  const professional =
                    getRelation(
                      settlement.professionals
                    );

                  return (
                    <div
                      key={
                        settlement.id
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
                          lg:items-start
                          lg:justify-between
                        "
                      >
                        <div
                          className="
                            min-w-0
                          "
                        >
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
                              {professional?.display_name ??
                                "Profissional"}
                            </p>

                            <SettlementStatus
                              status={
                                settlement.status
                              }
                            />
                          </div>

                          <p
                            className="
                              mt-1
                              text-xs
                              text-black/40
                            "
                          >
                            {formatOnlyDate(
                              settlement.period_start
                            )}{" "}
                            até{" "}
                            {formatOnlyDate(
                              settlement.period_end
                            )}
                          </p>

                          {settlement.status ===
                            "paid" &&
                            settlement.paid_at && (
                              <p
                                className="
                                  mt-1
                                  text-[10px]
                                  text-green-700
                                "
                              >
                                Pago em{" "}
                                {formatDate(
                                  settlement.paid_at
                                )}
                              </p>
                            )}

                          {settlement.status ===
                            "canceled" && (
                              <p
                                className="
                                  mt-1
                                  text-[10px]
                                  text-black/35
                                "
                              >
                                Fechamento cancelado. Os lançamentos foram liberados novamente.
                              </p>
                            )}
                        </div>

                        <div
                          className="
                            w-full

                            lg:max-w-[520px]
                          "
                        >
                          <div
                            className="
                              grid
                              grid-cols-3
                              gap-2
                            "
                          >
                            <MiniValue
                              label="Produção"
                              value={formatCurrency(
                                Number(
                                  settlement.gross_amount
                                )
                              )}
                            />

                            <MiniValue
                              label="Comissão"
                              value={formatCurrency(
                                Number(
                                  settlement.commission_amount
                                )
                              )}
                            />

                            <MiniValue
                              label="Studio"
                              value={formatCurrency(
                                Number(
                                  settlement.studio_amount
                                )
                              )}
                              gold
                            />
                          </div>

                          {settlement.status ===
                            "pending" && (
                              <div
                                className="
                                  mt-3
                                  flex
                                  flex-col
                                  gap-2

                                  sm:flex-row
                                  sm:justify-end
                                "
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancelSettlement(
                                      settlement
                                    )
                                  }
                                  disabled={
                                    settlementActionLoading ===
                                    settlement.id
                                  }
                                  className="
                                    flex
                                    min-h-10
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    border
                                    border-red-200
                                    px-4
                                    text-xs
                                    font-semibold
                                    text-red-700
                                    transition-colors

                                    hover:bg-red-50

                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                  "
                                >
                                  {settlementActionLoading ===
                                  settlement.id ? (
                                    <Loader2
                                      className="
                                        h-4
                                        w-4
                                        animate-spin
                                      "
                                    />
                                  ) : (
                                    <XCircle
                                      className="
                                        h-4
                                        w-4
                                      "
                                    />
                                  )}

                                  Cancelar fechamento
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMarkSettlementPaid(
                                      settlement
                                    )
                                  }
                                  disabled={
                                    settlementActionLoading ===
                                    settlement.id
                                  }
                                  className="
                                    flex
                                    min-h-10
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    bg-[#111]
                                    px-4
                                    text-xs
                                    font-semibold
                                    text-white
                                    transition-colors

                                    hover:bg-[#C9A227]
                                    hover:text-black

                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                  "
                                >
                                  {settlementActionLoading ===
                                  settlement.id ? (
                                    <Loader2
                                      className="
                                        h-4
                                        w-4
                                        animate-spin
                                      "
                                    />
                                  ) : (
                                    <CheckCircle2
                                      className="
                                        h-4
                                        w-4
                                      "
                                    />
                                  )}

                                  Marcar como pago
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      )}

      {/* ======================================================
          PROFISSIONAIS
          ADMIN
      ======================================================= */}

      {isAdmin &&
        professionals.length >
          0 && (
          <section
            className="
              mt-8
              overflow-hidden
              rounded-2xl
              border
              border-black/10
              bg-[#111]
              text-white
            "
          >
            <div
              className="
                border-b
                border-white/10
                px-5
                py-5

                sm:px-6
              "
            >
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-[#C9A227]
                "
              >
                Equipe
              </p>

              <h2
                className="
                  mt-1
                  font-serif
                  text-2xl
                "
              >
                Produção por profissional
              </h2>
            </div>

            <div
              className="
                grid
                gap-px
                bg-white/10

                lg:grid-cols-2
              "
            >
              {professionals.map(
                (
                  professional
                ) => (
                  <div
                    key={
                      professional.id
                    }
                    className="
                      bg-[#111]
                      p-5

                      sm:p-6
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          bg-[#C9A227]/10
                        "
                      >
                        <UserRound
                          className="
                            h-4
                            w-4
                            text-[#C9A227]
                          "
                        />
                      </div>

                      <div>
                        <p
                          className="
                            text-sm
                            font-semibold
                          "
                        >
                          {
                            professional.name
                          }
                        </p>

                        <p
                          className="
                            mt-0.5
                            text-[10px]
                            text-white/35
                          "
                        >
                          {
                            professional.appointments
                          }{" "}
                          atendimentos
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        mt-5
                        grid
                        grid-cols-3
                        gap-2
                      "
                    >
                      <DarkMetric
                        label="Produção"
                        value={formatCurrency(
                          professional.gross
                        )}
                      />

                      <DarkMetric
                        label="Comissão"
                        value={formatCurrency(
                          professional.commission
                        )}
                      />

                      <DarkMetric
                        label="Studio"
                        value={formatCurrency(
                          professional.studio
                        )}
                        gold
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        )}

      {/* ======================================================
          LANÇAMENTOS
      ======================================================= */}

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
              Histórico de atendimentos concluídos.
            </p>
          </div>

          <div
            className="
              relative
              w-full

              lg:max-w-sm
            "
          >
            <Search
              className="
                absolute
                left-4
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-black/30
              "
            />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event
                    .target
                    .value
                )
              }
              placeholder="Cliente, serviço ou profissional..."
              className="
                h-11
                w-full
                rounded-xl
                border
                border-black/10
                bg-[#FAFAF8]
                pl-11
                pr-4
                text-sm
                outline-none

                focus:border-[#C9A227]/50
                focus:bg-white
              "
            />
          </div>
        </div>

        {filteredEntries.length ===
        0 ? (
          <div
            className="
              flex
              min-h-[300px]
              flex-col
              items-center
              justify-center
              px-6
              text-center
            "
          >
            <CircleDollarSign
              className="
                h-8
                w-8
                text-[#C9A227]
              "
            />

            <p
              className="
                mt-4
                text-sm
                font-semibold
                text-[#111]
              "
            >
              Nenhuma movimentação
            </p>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Atendimentos concluídos aparecerão aqui.
            </p>
          </div>
        ) : (
          <div>
            {filteredEntries.map(
              (
                entry
              ) => (
                <FinancialRow
                  key={
                    entry.id
                  }
                  entry={
                    entry
                  }
                  showProfessional={
                    isAdmin
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      <CreateSettlementModal
        open={
          settlementOpen
        }
        commission={
          selectedCommission
        }
        onClose={() => {
          setSettlementOpen(
            false
          );

          setSelectedCommission(
            null
          );
        }}
        onCreated={async () => {
          setSettlementOpen(
            false
          );

          setSelectedCommission(
            null
          );

          router.refresh();
        }}
      />
    </div>
  );
}

/* ============================================================
   LINHA FINANCEIRA
============================================================ */

function FinancialRow({
  entry,
  showProfessional,
}: {
  entry:
    FinancialEntry;

  showProfessional:
    boolean;
}) {
  const professional =
    getRelation(
      entry.professionals
    );

  const appointment =
    getRelation(
      entry.appointments
    );

  const client =
    getRelation(
      appointment?.clients ??
        null
    );

  return (
    <div
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
        <div
          className="
            flex
            min-w-0
            items-start
            gap-4
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#C9A227]/10
            "
          >
            {getPaymentIcon(
              appointment
                ?.payment_method
            )}
          </div>

          <div
            className="
              min-w-0
            "
          >
            <p
              className="
                truncate
                text-sm
                font-semibold
                text-[#111]
              "
            >
              {
                entry.service_name
              }
            </p>

            <div
              className="
                mt-1
                flex
                flex-wrap
                gap-x-3
                gap-y-1
                text-xs
                text-black/40
              "
            >
              <span>
                {client?.full_name ??
                  "Cliente"}
              </span>

              {showProfessional &&
                professional && (
                  <span>
                    {
                      professional.display_name
                    }
                  </span>
                )}

              <span>
                {formatDate(
                  appointment
                    ?.start_at ??
                    entry.created_at
                )}
              </span>

              <span>
                {getPaymentLabel(
                  appointment
                    ?.payment_method
                )}
              </span>
            </div>
          </div>
        </div>

        <div
          className="
            grid
            grid-cols-3
            gap-3

            lg:min-w-[330px]
          "
        >
          <MiniValue
            label={
              showProfessional
                ? "Total"
                : "Produção"
            }
            value={formatCurrency(
              Number(
                entry.gross_amount
              )
            )}
          />

          <MiniValue
            label="Profissional"
            value={formatCurrency(
              Number(
                entry.professional_amount
              )
            )}
          />

          <MiniValue
            label="Studio"
            value={formatCurrency(
              Number(
                entry.studio_amount
              )
            )}
            gold
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CARDS
============================================================ */

function FinanceCard({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        p-5

        ${
          highlight
            ? "border-[#C9A227]/20 bg-[#111] text-white"
            : "border-black/10 bg-white text-[#111]"
        }
      `}
    >
      <div
        className={`
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl

          ${
            highlight
              ? "bg-[#C9A227]/10"
              : "bg-[#C9A227]/10"
          }
        `}
      >
        <Icon
          className="
            h-5
            w-5
            text-[#C9A227]
          "
        />
      </div>

      <p
        className={`
          mt-5
          text-xs
          font-medium

          ${
            highlight
              ? "text-white/40"
              : "text-black/40"
          }
        `}
      >
        {label}
      </p>

      <p
        className={`
          mt-2
          text-2xl
          font-bold

          ${
            highlight
              ? "text-[#C9A227]"
              : "text-[#111]"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

function DarkMetric({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div
      className="
        rounded-xl
        bg-white/[0.04]
        p-3
      "
    >
      <p
        className="
          text-[8px]
          font-semibold
          uppercase
          tracking-wider
          text-white/30
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-1
          text-xs
          font-bold

          ${
            gold
              ? "text-[#C9A227]"
              : "text-white"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

function MiniValue({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div
      className="
        rounded-lg
        bg-[#FAFAF8]
        p-2.5
      "
    >
      <p
        className="
          text-[8px]
          uppercase
          tracking-wider
          text-black/30
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-1
          text-xs
          font-semibold

          ${
            gold
              ? "text-[#A18016]"
              : "text-[#111]"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

function PendingSummary({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div
      className="
        bg-white
        p-4

        sm:p-5
      "
    >
      <p
        className="
          text-[9px]
          uppercase
          tracking-wider
          text-black/35
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-1
          text-base
          font-bold

          ${
            gold
              ? "text-[#A18016]"
              : "text-[#111]"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

function SettlementStatus({
  status,
}: {
  status:
    | "pending"
    | "paid"
    | "canceled";
}) {
  const config = {
    pending: {
      label:
        "Pendente",
      className:
        "bg-[#F8F1D9] text-[#8A6D0A]",
    },
    paid: {
      label:
        "Pago",
      className:
        "bg-green-100 text-green-700",
    },
    canceled: {
      label:
        "Cancelado",
      className:
        "bg-neutral-100 text-neutral-500",
    },
  }[status];

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1
        text-[9px]
        font-bold
        uppercase
        tracking-[0.04em]

        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}

/* ============================================================
   PERÍODO
============================================================ */

function PeriodButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        whitespace-nowrap
        rounded-lg
        px-4
        py-2
        text-xs
        font-semibold
        transition-all

        ${
          active
            ? "bg-[#111] text-white shadow-sm"
            : "text-black/40 hover:text-black/70"
        }
      `}
    >
      {children}
    </button>
  );
}

/* ============================================================
   FILTRO POR DATA
============================================================ */

function matchesPeriod(
  value: string,
  period:
    PeriodFilter
) {
  if (
    period === "all"
  ) {
    return true;
  }

  const entry =
    new Date(
      value
    );

  const now =
    new Date();

  const entryDate =
    getSaoPauloParts(
      entry
    );

  const today =
    getSaoPauloParts(
      now
    );

  if (
    period ===
    "today"
  ) {
    return (
      entryDate.year ===
        today.year &&
      entryDate.month ===
        today.month &&
      entryDate.day ===
        today.day
    );
  }

  if (
    period ===
    "month"
  ) {
    return (
      entryDate.year ===
        today.year &&
      entryDate.month ===
        today.month
    );
  }

  /*
   * SEMANA
   *
   * Para simplificar a UI atual:
   * últimos 7 dias.
   */
  if (
    period ===
    "week"
  ) {
    const sevenDaysAgo =
      new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() -
        6
    );

    sevenDaysAgo.setHours(
      0,
      0,
      0,
      0
    );

    return (
      entry >=
      sevenDaysAgo
    );
  }

  return true;
}

function getSaoPauloParts(
  date: Date
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        year:
          "numeric",

        month:
          "numeric",

        day:
          "numeric",

        timeZone:
          "America/Sao_Paulo",
      }
    );

  const parts =
    formatter.formatToParts(
      date
    );

  return {
    year:
      Number(
        parts.find(
          (
            part
          ) =>
            part.type ===
            "year"
        )?.value
      ),

    month:
      Number(
        parts.find(
          (
            part
          ) =>
            part.type ===
            "month"
        )?.value
      ),

    day:
      Number(
        parts.find(
          (
            part
          ) =>
            part.type ===
            "day"
        )?.value
      ),
  };
}

/* ============================================================
   PAGAMENTO
============================================================ */

function getPaymentLabel(
  method:
    | string
    | null
    | undefined
) {
  switch (
    method
  ) {
    case "pix":
      return "PIX";

    case "cash":
      return "Dinheiro";

    case "credit_card":
      return "Crédito";

    case "debit_card":
      return "Débito";

    default:
      return "Outro";
  }
}

function getPaymentIcon(
  method:
    | string
    | null
    | undefined
) {
  switch (
    method
  ) {
    case "cash":
      return (
        <Banknote
          className="
            h-4
            w-4
            text-[#C9A227]
          "
        />
      );

    case "credit_card":
    case "debit_card":
      return (
        <CreditCard
          className="
            h-4
            w-4
            text-[#C9A227]
          "
        />
      );

    case "pix":
      return (
        <Landmark
          className="
            h-4
            w-4
            text-[#C9A227]
          "
        />
      );

    default:
      return (
        <CircleDollarSign
          className="
            h-4
            w-4
            text-[#C9A227]
          "
        />
      );
  }
}

/* ============================================================
   FORMATADORES
============================================================ */

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

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(
      value
    )
  );
}

function formatShortDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day:
        "2-digit",
      month:
        "2-digit",
      year:
        "numeric",
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(
      value
    )
  );
}

function formatOnlyDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function normalizeText(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}