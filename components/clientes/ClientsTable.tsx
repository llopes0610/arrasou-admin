"use client";

import Link from "next/link";

import {
  ChevronRight,
  Phone,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  ClientListItem,
} from "@/app/(admin)/clientes/page";

type ClientsTableProps = {
  clients: ClientListItem[];
};

export default function ClientsTable({
  clients,
}: ClientsTableProps) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  /*
   * ==========================================================
   * FILTRO
   * ==========================================================
   */

  const filteredClients =
    useMemo(() => {
      const term =
        normalizeText(
          search
        );

      if (!term) {
        return clients;
      }

      return clients.filter(
        (client) => {
          const name =
            normalizeText(
              client.full_name
            );

          const phone =
            normalizeText(
              client.phone ?? ""
            );

          const email =
            normalizeText(
              client.email ?? ""
            );

          return (
            name.includes(term) ||
            phone.includes(term) ||
            email.includes(term)
          );
        }
      );
    }, [
      clients,
      search,
    ]);

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-black/10
        bg-white
      "
    >
      {/* HEADER */}

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
            Base de clientes
          </h2>

          <p
            className="
              mt-1
              text-xs
              text-black/40
            "
          >
            {clients.length}{" "}
            {clients.length === 1
              ? "cliente cadastrada"
              : "clientes cadastradas"}
          </p>
        </div>

        {/* BUSCA */}

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
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar por nome ou telefone..."
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
              text-[#111]
              outline-none
              transition-all

              placeholder:text-black/30

              focus:border-[#C9A227]/60
              focus:bg-white
              focus:ring-2
              focus:ring-[#C9A227]/10
            "
          />
        </div>
      </div>

      {/* RESULTADO */}

      {filteredClients.length ===
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
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-[#C9A227]/10
            "
          >
            <UsersRound
              className="
                h-5
                w-5
                text-[#C9A227]
              "
            />
          </div>

          <p
            className="
              mt-4
              text-sm
              font-semibold
              text-[#111]
            "
          >
            Nenhuma cliente encontrada
          </p>

          <p
            className="
              mt-1
              text-xs
              text-black/40
            "
          >
            Tente pesquisar outro
            nome ou telefone.
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP */}

          <div className="hidden md:block">
            <div
              className="
                grid
                grid-cols-[minmax(220px,2fr)_1.2fr_1fr_1fr_1fr_40px]
                gap-4
                border-b
                border-black/[0.06]
                bg-[#FAFAF8]
                px-6
                py-3
              "
            >
              <TableHeader>
                Cliente
              </TableHeader>

              <TableHeader>
                Telefone
              </TableHeader>

              <TableHeader>
                Última visita
              </TableHeader>

              <TableHeader>
                Atendimentos
              </TableHeader>

              <TableHeader>
                Total gasto
              </TableHeader>

              <span />
            </div>

            {filteredClients.map(
              (client) => (
                <ClientDesktopRow
                  key={client.id}
                  client={client}
                />
              )
            )}
          </div>

          {/* MOBILE */}

          <div className="md:hidden">
            {filteredClients.map(
              (client) => (
                <ClientMobileRow
                  key={client.id}
                  client={client}
                />
              )
            )}
          </div>
        </>
      )}
    </section>
  );
}

/* ============================================================
   DESKTOP
============================================================ */

function ClientDesktopRow({
  client,
}: {
  client: ClientListItem;
}) {
  const metrics =
    getClientMetrics(
      client
    );

  return (
    <Link
      href={`/clientes/${client.id}`}
      className="
        grid
        grid-cols-[minmax(220px,2fr)_1.2fr_1fr_1fr_1fr_40px]
        items-center
        gap-4
        border-b
        border-black/[0.06]
        px-6
        py-4
        transition-colors
        last:border-b-0

        hover:bg-[#FAFAF8]
      "
    >
      {/* CLIENTE */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >
        <ClientAvatar
          name={
            client.full_name
          }
        />

        <div className="min-w-0">
          <p
            className="
              truncate
              text-sm
              font-semibold
              text-[#111]
            "
          >
            {client.full_name}
          </p>

          {client.email && (
            <p
              className="
                mt-0.5
                truncate
                text-xs
                text-black/35
              "
            >
              {client.email}
            </p>
          )}
        </div>
      </div>

      {/* TELEFONE */}

      <p
        className="
          text-sm
          text-black/55
        "
      >
        {client.phone ??
          "—"}
      </p>

      {/* ÚLTIMA VISITA */}

      <p
        className="
          text-sm
          text-black/55
        "
      >
        {metrics.lastVisit
          ? formatDate(
              metrics.lastVisit
            )
          : "—"}
      </p>

      {/* ATENDIMENTOS */}

      <p
        className="
          text-sm
          font-semibold
          text-[#111]
        "
      >
        {
          metrics.completedCount
        }
      </p>

      {/* TOTAL */}

      <p
        className="
          text-sm
          font-semibold
          text-[#111]
        "
      >
        {formatCurrency(
          metrics.totalSpent
        )}
      </p>

      <ChevronRight
        className="
          h-4
          w-4
          text-black/25
        "
      />
    </Link>
  );
}

/* ============================================================
   MOBILE
============================================================ */

function ClientMobileRow({
  client,
}: {
  client: ClientListItem;
}) {
  const metrics =
    getClientMetrics(
      client
    );

  return (
    <Link
      href={`/clientes/${client.id}`}
      className="
        block
        border-b
        border-black/[0.06]
        p-5
        last:border-b-0
      "
    >
      <div
        className="
          flex
          items-center
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
          <ClientAvatar
            name={
              client.full_name
            }
          />

          <div className="min-w-0">
            <p
              className="
                truncate
                text-sm
                font-semibold
                text-[#111]
              "
            >
              {client.full_name}
            </p>

            {client.phone && (
              <p
                className="
                  mt-1
                  flex
                  items-center
                  gap-1
                  text-xs
                  text-black/40
                "
              >
                <Phone
                  className="
                    h-3
                    w-3
                  "
                />

                {client.phone}
              </p>
            )}
          </div>
        </div>

        <ChevronRight
          className="
            h-4
            w-4
            shrink-0
            text-black/25
          "
        />
      </div>

      <div
        className="
          mt-4
          grid
          grid-cols-3
          gap-2
        "
      >
        <MobileMetric
          label="Visitas"
          value={String(
            metrics.completedCount
          )}
        />

        <MobileMetric
          label="Última"
          value={
            metrics.lastVisit
              ? formatShortDate(
                  metrics.lastVisit
                )
              : "—"
          }
        />

        <MobileMetric
          label="Gasto"
          value={formatCurrency(
            metrics.totalSpent
          )}
        />
      </div>
    </Link>
  );
}

/* ============================================================
   HELPERS VISUAIS
============================================================ */

function ClientAvatar({
  name,
}: {
  name: string;
}) {
  return (
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
        text-sm
        font-bold
        text-[#A18016]
      "
    >
      {name
        .charAt(0)
        .toUpperCase() ||
        (
          <UserRound
            className="
              h-4
              w-4
            "
          />
        )}
    </div>
  );
}

function TableHeader({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      className="
        text-[10px]
        font-semibold
        uppercase
        tracking-[0.12em]
        text-black/35
      "
    >
      {children}
    </span>
  );
}

function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        bg-[#FAFAF8]
        p-3
      "
    >
      <p
        className="
          text-[8px]
          font-semibold
          uppercase
          tracking-wider
          text-black/30
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-xs
          font-semibold
          text-[#111]
        "
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   MÉTRICAS
============================================================ */

function getClientMetrics(
  client: ClientListItem
) {
  const completed =
    client.appointments?.filter(
      (appointment) =>
        appointment.status ===
        "completed"
    ) ?? [];

  const sorted =
    [...completed].sort(
      (
        a,
        b
      ) =>
        new Date(
          b.start_at
        ).getTime() -
        new Date(
          a.start_at
        ).getTime()
    );

  const lastVisit =
    sorted[0]?.start_at ??
    null;

  const totalSpent =
    completed.reduce(
      (
        appointmentTotal,
        appointment
      ) =>
        appointmentTotal +
        (
          appointment
            .appointment_services ??
          []
        ).reduce(
          (
            serviceTotal,
            service
          ) =>
            serviceTotal +
            Number(
              service.unit_price
            ),
          0
        ),
      0
    );

  return {
    completedCount:
      completed.length,

    lastVisit,

    totalSpent,
  };
}

/* ============================================================
   FORMATADORES
============================================================ */

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

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value);
}

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(value)
  );
}

function formatShortDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(value)
  );
}