"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Search,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

import type {
  FinancialEntry,
} from "@/app/(admin)/financeiro/page";

type FinancialDashboardProps = {
  entries:
    FinancialEntry[];

  currentUserRole:
    | "admin"
    | "professional";
};

type PeriodFilter =
  | "today"
  | "week"
  | "month"
  | "all";

export default function FinancialDashboard({
  entries,
  currentUserRole,
}: FinancialDashboardProps) {
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
            entry.professionals?.[0]
              ?.display_name ??
            "";

          const appointment =
            entry.appointments?.[0];

          const client =
            appointment
              ?.clients?.[0]
              ?.full_name ??
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
            entry.professionals?.[0];

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
    entry.professionals?.[0];

  const appointment =
    entry.appointments?.[0];

  const client =
    appointment
      ?.clients?.[0];

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