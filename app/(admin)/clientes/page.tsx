import {
  CalendarCheck2,
  CircleDollarSign,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import ClientsTable from "@/components/clientes/ClientsTable";

type ClientAppointment = {
  id: string;

  start_at: string;

  status:
    | "scheduled"
    | "confirmed"
    | "completed"
    | "canceled"
    | "no_show";

  appointment_services:
    | {
        id: string;
        service_name: string;
        unit_price: number | string;
      }[]
    | null;
};

export type ClientListItem = {
  id: string;

  full_name: string;

  phone: string | null;

  email: string | null;

  notes: string | null;

  created_at: string;

  appointments:
    | ClientAppointment[]
    | null;
};

export default async function ClientesPage() {
  const supabase =
    await createClient();

  /*
   * ==========================================================
   * CLIENTES + HISTÓRICO
   * ==========================================================
   */

  const {
    data,
    error,
  } =
    await supabase
      .from("clients")
      .select(`
        id,
        full_name,
        phone,
        email,
        notes,
        created_at,

        appointments (
          id,
          start_at,
          status,

          appointment_services (
            id,
            service_name,
            unit_price
          )
        )
      `)
      .order(
        "full_name",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Erro ao carregar clientes:",
      error
    );
  }

  const clients =
    (
      data ?? []
    ) as unknown as ClientListItem[];

  /*
   * ==========================================================
   * INDICADORES
   * ==========================================================
   */

  const totalClients =
    clients.length;

  const clientsWithCompletedAppointments =
    clients.filter(
      (client) =>
        client.appointments?.some(
          (appointment) =>
            appointment.status ===
            "completed"
        )
    ).length;

  const completedAppointments =
    clients.reduce(
      (
        total,
        client
      ) =>
        total +
        (
          client.appointments?.filter(
            (appointment) =>
              appointment.status ===
              "completed"
          ).length ?? 0
        ),
      0
    );

  const totalRevenue =
    clients.reduce(
      (
        clientTotal,
        client
      ) => {
        const completed =
          client.appointments?.filter(
            (appointment) =>
              appointment.status ===
              "completed"
          ) ?? [];

        const clientRevenue =
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

        return (
          clientTotal +
          clientRevenue
        );
      },
      0
    );

  return (
    <div>
      {/* HEADER */}

      <div>
        <p className="text-sm text-black/40">
          Relacionamento
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
          Clientes
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
          Consulte clientes, acompanhe
          o histórico de atendimentos e
          acesse as fichas de anamnese
          de cada cliente.
        </p>
      </div>

      {/* CARDS */}

      <div
        className="
          mt-8
          grid
          gap-4

          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <MetricCard
          title="Clientes cadastradas"
          value={String(
            totalClients
          )}
          icon={UsersRound}
        />

        <MetricCard
          title="Clientes atendidas"
          value={String(
            clientsWithCompletedAppointments
          )}
          icon={UserRoundCheck}
        />

        <MetricCard
          title="Atendimentos realizados"
          value={String(
            completedAppointments
          )}
          icon={CalendarCheck2}
        />

        <MetricCard
          title="Produção histórica"
          value={formatCurrency(
            totalRevenue
          )}
          icon={CircleDollarSign}
        />
      </div>

      {/* CLIENTES */}

      <div className="mt-8">
        <ClientsTable
          clients={clients}
        />
      </div>
    </div>
  );
}

/* ============================================================
   CARD
============================================================ */

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-black/10
        bg-white
        p-5
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-[#C9A227]/10
        "
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
        className="
          mt-5
          text-xs
          font-medium
          text-black/40
        "
      >
        {title}
      </p>

      <p
        className="
          mt-2
          text-2xl
          font-bold
          text-[#111]
        "
      >
        {value}
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
      style: "currency",
      currency: "BRL",
    }
  ).format(value);
}