"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  CircleDollarSign,
  Plus,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";

import type {
  CashMovement,
  CashResponsibleUser,
} from "@/app/(admin)/financeiro/movimentacoes/page";

import NewCashMovementModal from "./NewCashMovementModal";

type CashMovementsDashboardProps = {
  movements:
    CashMovement[];

  responsibleUsers:
    CashResponsibleUser[];

  currentUserId:
    string;
};

type MovementFilter =
  | "all"
  | "expense"
  | "withdrawal"
  | "income";

export default function CashMovementsDashboard({
  movements,
  responsibleUsers,
  currentUserId,
}: CashMovementsDashboardProps) {
  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    filter,
    setFilter,
  ] =
    useState<MovementFilter>(
      "all"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const currentMonthMovements =
    useMemo(
      () =>
        movements.filter(
          (
            movement
          ) =>
            isCurrentMonth(
              movement.movement_date
            )
        ),
      [
        movements,
      ]
    );

  const filteredMovements =
    useMemo(() => {
      const term =
        normalizeText(
          search
        );

      return movements.filter(
        (
          movement
        ) => {
          if (
            filter !==
              "all" &&
            movement.type !==
              filter
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

          return (
            normalizeText(
              movement.description
            ).includes(
              term
            ) ||
            normalizeText(
              movement.category
            ).includes(
              term
            )
          );
        }
      );
    }, [
      movements,
      filter,
      search,
    ]);

  const expenses =
    currentMonthMovements
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
    currentMonthMovements
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

  const incomes =
    currentMonthMovements
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

  const netMovement =
    incomes -
    expenses -
    withdrawals;

  return (
    <>
      <div
        className="
          flex
          flex-col
          gap-4

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <p
            className="
              text-xs
              text-black/40
            "
          >
            Resumo do mês atual
          </p>

          <p
            className="
              mt-1
              text-sm
              font-medium
              text-[#111]
            "
          >
            {formatCurrentMonth()}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setModalOpen(
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
            bg-[#C9A227]
            px-5
            text-sm
            font-semibold
            text-black

            hover:bg-[#E0C56E]
          "
        >
          <Plus
            className="
              h-4
              w-4
            "
          />

          Nova movimentação
        </button>
      </div>

      <div
        className="
          mt-6
          grid
          gap-4

          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <SummaryCard
          label="Entradas manuais"
          value={
            formatCurrency(
              incomes
            )
          }
          icon={
            ArrowUpCircle
          }
        />

        <SummaryCard
          label="Despesas"
          value={
            formatCurrency(
              expenses
            )
          }
          icon={
            ArrowDownCircle
          }
        />

        <SummaryCard
          label="Retiradas"
          value={
            formatCurrency(
              withdrawals
            )
          }
          icon={
            WalletCards
          }
        />

        <SummaryCard
          label="Saldo das movimentações"
          value={
            formatCurrency(
              netMovement
            )
          }
          icon={
            CircleDollarSign
          }
          highlight
        />
      </div>

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
              Histórico
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Movimentações registradas
              no caixa.
            </p>
          </div>

          <div
            className="
              flex
              flex-col
              gap-3

              lg:flex-row
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
              <FilterButton
                active={
                  filter ===
                  "all"
                }
                onClick={() =>
                  setFilter(
                    "all"
                  )
                }
              >
                Todos
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "expense"
                }
                onClick={() =>
                  setFilter(
                    "expense"
                  )
                }
              >
                Despesas
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "withdrawal"
                }
                onClick={() =>
                  setFilter(
                    "withdrawal"
                  )
                }
              >
                Retiradas
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "income"
                }
                onClick={() =>
                  setFilter(
                    "income"
                  )
                }
              >
                Entradas
              </FilterButton>
            </div>

            <div
              className="
                relative
                w-full

                lg:w-[280px]
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
                placeholder="Buscar..."
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
                "
              />
            </div>
          </div>
        </div>

        {filteredMovements.length ===
        0 ? (
          <div
            className="
              py-12
              text-center
            "
          >
            <CircleDollarSign
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
              Nenhuma movimentação
            </p>
          </div>
        ) : (
          <div>
            {filteredMovements.map(
              (
                movement
              ) => (
                <MovementRow
                  key={
                    movement.id
                  }
                  movement={
                    movement
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      <NewCashMovementModal
        open={
          modalOpen
        }
        responsibleUsers={
          responsibleUsers
        }
        currentUserId={
          currentUserId
        }
        onClose={() =>
          setModalOpen(
            false
          )
        }
      />
    </>
  );
}

function MovementRow({
  movement,
}: {
  movement:
    CashMovement;
}) {
  const responsible =
    movement
      .responsible_user?.[0];

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

          md:flex-row
          md:items-center
          md:justify-between
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
                movement.description
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
                {
                  movement.category
                }
              </span>

              <span>
                {
                  getMovementTypeLabel(
                    movement.type
                  )
                }
              </span>

              {responsible && (
                <span>
                  {
                    responsible.full_name
                  }
                </span>
              )}

              <span>
                {
                  formatOnlyDate(
                    movement.movement_date
                  )
                }
              </span>
            </div>
          </div>
        </div>

        <p
          className={`
            text-lg
            font-bold

            ${
              movement.type ===
              "income"
                ? "text-green-700"
                : "text-[#111]"
            }
          `}
        >
          {movement.type !==
            "income" &&
            "- "}

          {
            formatCurrency(
              Number(
                movement.amount
              )
            )
          }
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon:
    React.ElementType;
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
            : "border-black/10 bg-white"
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

      <p
        className={`
          mt-5
          text-xs

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

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick:
    () => void;
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

        ${
          active
            ? "bg-[#111] text-white"
            : "text-black/40"
        }
      `}
    >
      {children}
    </button>
  );
}

function isCurrentMonth(
  value: string
) {
  const date =
    new Date(
      `${value}T12:00:00-03:00`
    );

  const now =
    new Date();

  const a =
    new Intl.DateTimeFormat(
      "en-US",
      {
        year:
          "numeric",
        month:
          "numeric",
        timeZone:
          "America/Sao_Paulo",
      }
    ).formatToParts(
      date
    );

  const b =
    new Intl.DateTimeFormat(
      "en-US",
      {
        year:
          "numeric",
        month:
          "numeric",
        timeZone:
          "America/Sao_Paulo",
      }
    ).formatToParts(
      now
    );

  return (
    a.find(
      (
        part
      ) =>
        part.type ===
        "year"
    )?.value ===
      b.find(
        (
          part
        ) =>
          part.type ===
          "year"
      )?.value &&
    a.find(
      (
        part
      ) =>
        part.type ===
        "month"
    )?.value ===
      b.find(
        (
          part
        ) =>
          part.type ===
          "month"
      )?.value
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

function formatOnlyDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value.split("-");

  return `${day}/${month}/${year}`;
}

function formatCurrentMonth() {
  return new Intl.DateTimeFormat(
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
    new Date()
  );
}

function getMovementTypeLabel(
  type:
    CashMovement["type"]
) {
  switch (
    type
  ) {
    case "expense":
      return "Despesa";

    case "withdrawal":
      return "Retirada";

    case "income":
      return "Entrada";
  }
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