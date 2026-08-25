import Link from "next/link";

import {
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  CircleDollarSign,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import ClientAnamnesisCard from "@/components/clientes/ClientAnamnesisCard";

type ClientDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "canceled"
  | "no_show";

type ClientAppointment = {
  id: string;

  start_at: string;
  end_at: string;

  status:
    AppointmentStatus;

  notes: string | null;

  professionals:
    | {
        id: string;
        display_name: string;
      }[]
    | null;

  appointment_services:
    | {
        id: string;
        service_name: string;
        unit_price:
          | number
          | string;
      }[]
    | null;
};

type ClientDetails = {
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

export default async function ClientDetailsPage({
  params,
}: ClientDetailsPageProps) {
  const {
    id,
  } =
    await params;

  const supabase =
    await createClient();

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
          end_at,
          status,
          notes,

          professionals (
            id,
            display_name
          ),

          appointment_services (
            id,
            service_name,
            unit_price
          )
        )
      `)
      .eq(
        "id",
        id
      )
      .single();

  if (
    error ||
    !data
  ) {
    notFound();
  }

  const client =
    data as unknown as ClientDetails;

  const appointments =
    [
      ...(
        client.appointments ??
        []
      ),
    ].sort(
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

  const completed =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "completed"
    );

  const totalSpent =
    completed.reduce(
      (
        total,
        appointment
      ) =>
        total +
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

  const lastVisit =
    completed[0]?.start_at ??
    null;

  return (
    <div>
      {/* VOLTAR */}

      <Link
        href="/clientes"
        className="
          inline-flex
          items-center
          gap-2
          text-sm
          font-medium
          text-black/45
          transition-colors

          hover:text-[#111]
        "
      >
        <ArrowLeft
          className="
            h-4
            w-4
          "
        />

        Voltar para clientes
      </Link>

      {/* HEADER */}

      <div
        className="
          mt-6
          flex
          flex-col
          gap-5

          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div
          className="
            flex
            items-center
            gap-4
          "
        >
          <div
            className="
              flex
              h-16
              w-16
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#C9A227]/10
              font-serif
              text-2xl
              font-semibold
              text-[#A18016]
            "
          >
            {client.full_name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-[#C9A227]
              "
            >
              Cliente
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
              {client.full_name}
            </h1>

            <p
              className="
                mt-1
                text-xs
                text-black/35
              "
            >
              Cliente desde{" "}
              {formatDate(
                client.created_at
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}

      <div
        className="
          mt-8
          grid
          gap-4

          sm:grid-cols-3
        "
      >
        <InfoMetric
          icon={
            CalendarCheck2
          }
          label="Atendimentos"
          value={String(
            completed.length
          )}
        />

        <InfoMetric
          icon={
            CalendarClock
          }
          label="Última visita"
          value={
            lastVisit
              ? formatDate(
                  lastVisit
                )
              : "Nenhuma"
          }
        />

        <InfoMetric
          icon={
            CircleDollarSign
          }
          label="Total gasto"
          value={formatCurrency(
            totalSpent
          )}
        />
      </div>

      {/* ANAMNESE */}

      <div className="mt-8">
        <ClientAnamnesisCard
          clientId={
            client.id
          }
          clientName={
            client.full_name
          }
          clientPhone={
            client.phone
          }
        />
      </div>

      <div
        className="
          mt-8
          grid
          gap-6

          xl:grid-cols-[360px_minmax(0,1fr)]
        "
      >
        {/* CADASTRO */}

        <aside
          className="
            rounded-2xl
            border
            border-black/10
            bg-white
            p-6
          "
        >
          <h2
            className="
              font-serif
              text-xl
              font-semibold
              text-[#111]
            "
          >
            Informações
          </h2>

          <div
            className="
              mt-6
              space-y-5
            "
          >
            <ContactItem
              icon={
                UserRound
              }
              label="Nome"
              value={
                client.full_name
              }
            />

            <ContactItem
              icon={
                Phone
              }
              label="Telefone"
              value={
                client.phone ??
                "Não informado"
              }
            />

            <ContactItem
              icon={
                Mail
              }
              label="E-mail"
              value={
                client.email ??
                "Não informado"
              }
            />
          </div>

          {client.notes && (
            <div
              className="
                mt-6
                border-t
                border-black/[0.06]
                pt-5
              "
            >
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-black/35
                "
              >
                Observações
              </p>

              <p
                className="
                  mt-2
                  whitespace-pre-wrap
                  text-sm
                  leading-6
                  text-black/55
                "
              >
                {client.notes}
              </p>
            </div>
            
          )}
        </aside>

        {/* HISTÓRICO */}

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
              border-b
              border-black/10
              px-6
              py-5
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
              Histórico
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Todos os agendamentos
              desta cliente.
            </p>
          </div>

          {appointments.length ===
          0 ? (
            <div
              className="
                flex
                min-h-[280px]
                items-center
                justify-center
                px-6
                text-center
                text-sm
                text-black/35
              "
            >
              Nenhum atendimento
              registrado.
            </div>
            
          ) : (
            appointments.map(
              (appointment) => (
                <HistoryItem
                  key={
                    appointment.id
                  }
                  appointment={
                    appointment
                  }
                  
                  
                />
              )
            )
          )}
        </section>
      </div>
    </div>
    
  );
}



/* ============================================================
   HISTORY
============================================================ */

function HistoryItem({
  appointment,
}: {
  appointment:
    ClientAppointment;
}) {
  const professional =
    appointment
      .professionals?.[0] ??
    null;

  const services =
    appointment
      .appointment_services ??
    [];

  const total =
    services.reduce(
      (
        sum,
        service
      ) =>
        sum +
        Number(
          service.unit_price
        ),
      0
    );

  return (
    <div
      className="
        border-b
        border-black/[0.06]
        px-6
        py-5
        last:border-b-0
      "
    >
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
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-[#111]
              "
            >
              {formatDateTime(
                appointment.start_at
              )}
            </p>

            <StatusBadge
              status={
                appointment.status
              }
            />
          </div>

          <p
            className="
              mt-2
              text-xs
              text-black/40
            "
          >
            {professional
              ?.display_name ??
              "Profissional"}
          </p>

          <div
            className="
              mt-2
              flex
              flex-wrap
              gap-2
            "
          >
            {services.map(
              (service) => (
                <span
                  key={
                    service.id
                  }
                  className="
                    rounded-full
                    bg-[#FAFAF8]
                    px-3
                    py-1
                    text-xs
                    text-black/55
                  "
                >
                  {
                    service.service_name
                  }
                </span>
              )
            )}
          </div>
        </div>

        <strong
          className="
            text-sm
            text-[#111]
          "
        >
          {formatCurrency(
            total
          )}
        </strong>
      </div>

      {appointment.notes && (
        <p
          className="
            mt-4
            rounded-xl
            bg-[#FAFAF8]
            p-3
            text-xs
            leading-5
            text-black/45
          "
        >
          {appointment.notes}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   AUXILIARES
============================================================ */

function InfoMetric({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;

  label: string;

  value: string;
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
          text-[10px]
          font-semibold
          uppercase
          tracking-wider
          text-black/35
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
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

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;

  label: string;

  value: string;
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-[#C9A227]/10
        "
      >
        <Icon
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
            text-[9px]
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
            break-all
            text-sm
            font-medium
            text-[#111]
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    AppointmentStatus;
}) {
  const config = {
    scheduled: {
      label: "Agendado",
      className:
        "bg-[#F8F1D9] text-[#8A6D0A]",
    },

    confirmed: {
      label: "Confirmado",
      className:
        "bg-[#111] text-white",
    },

    completed: {
      label: "Concluído",
      className:
        "bg-green-100 text-green-700",
    },

    canceled: {
      label: "Cancelado",
      className:
        "bg-red-100 text-red-700",
    },

    no_show: {
      label: "Faltou",
      className:
        "bg-amber-100 text-amber-800",
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
        font-semibold
        uppercase
        tracking-wide

        ${config.className}
      `}
    >
      {config.label}
    </span>
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

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(value)
  );
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",

      hour12: false,

      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(value)
  );
}