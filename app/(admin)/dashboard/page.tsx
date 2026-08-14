import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Scissors,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "canceled"
  | "no_show";

type SupabaseRelation<T> =
  | T
  | T[]
  | null;

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

type ClientRelation = {
  id: string;
  full_name: string;
  phone: string | null;
};

type ProfessionalRelation = {
  id: string;
  display_name: string;
};

type TodayAppointment = {
  id: string;

  start_at: string;
  end_at: string;

  status: AppointmentStatus;

  clients:
    SupabaseRelation<ClientRelation>;

  professionals:
    SupabaseRelation<ProfessionalRelation>;

  appointment_services:
    | {
        id: string;
        service_name: string;
        unit_price: number | string;
        commission_percentage: number | string;
      }[]
    | null;
};

type ProfessionalCommission = {
  professionalId: string;
  professionalName: string;
  amount: number;
  appointments: number;
};

export default async function DashboardPage() {
  const supabase =
    await createClient();

  /* ==========================================================
     USUÁRIO
  ========================================================== */

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (!userId) {
    return null;
  }

  /* ==========================================================
     PERFIL
  ========================================================== */

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

  const isAdmin =
    profile?.role ===
    "admin";

  /* ==========================================================
     HOJE
  ========================================================== */

  const today =
    getSaoPauloDate();

  const startOfDay =
    `${today}T00:00:00-03:00`;

  const endOfDay =
    `${today}T23:59:59.999-03:00`;

  /* ==========================================================
     CONSULTAS
  ========================================================== */

  const appointmentsResult =
    await supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        end_at,
        status,

        clients (
          id,
          full_name,
          phone
        ),

        professionals (
          id,
          display_name
        ),

        appointment_services (
          id,
          service_name,
          unit_price,
          commission_percentage
        )
      `)
      .gte(
        "start_at",
        startOfDay
      )
      .lte(
        "start_at",
        endOfDay
      )
      .order(
        "start_at",
        {
          ascending: true,
        }
      );

  if (appointmentsResult.error) {
    console.error(
      "Erro ao carregar dashboard:",
      appointmentsResult.error
    );
  }

  const appointments =
    (
      appointmentsResult.data ??
      []
    ) as unknown as TodayAppointment[];

  /* ==========================================================
     INDICADORES
  ========================================================== */

  const validAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status !==
        "canceled"
    );

  const completedAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "completed"
    );

  /*
   * O Dashboard é uma visão operacional DO DIA.
   *
   * Faturamento e comissão são calculados apenas sobre
   * atendimentos concluídos cuja data do atendimento é hoje.
   * Assim, lançamentos financeiros criados em outro momento
   * não contaminam os indicadores do dia.
   */

  const grossRevenue =
    completedAppointments.reduce(
      (
        total,
        appointment
      ) =>
        total +
        (
          appointment.appointment_services ??
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

  const commissionMap =
    new Map<
      string,
      ProfessionalCommission
    >();

  completedAppointments.forEach(
    (
      appointment
    ) => {
      const professional =
        getRelation(
          appointment.professionals
        );

      const professionalId =
        professional?.id ??
        "sem-profissional";

      const professionalName =
        professional?.display_name ??
        "Profissional";

      const appointmentCommission =
        (
          appointment.appointment_services ??
          []
        ).reduce(
          (
            total,
            service
          ) =>
            total +
            Number(
              service.unit_price
            ) *
              (
                Number(
                  service.commission_percentage
                ) /
                100
              ),
          0
        );

      const current =
        commissionMap.get(
          professionalId
        );

      if (current) {
        current.amount +=
          appointmentCommission;

        current.appointments += 1;

        return;
      }

      commissionMap.set(
        professionalId,
        {
          professionalId,
          professionalName,
          amount:
            appointmentCommission,
          appointments: 1,
        }
      );
    }
  );

  const professionalCommissions =
    Array.from(
      commissionMap.values()
    ).sort(
      (
        a,
        b
      ) =>
        b.amount -
        a.amount
    );

  const professionalAmount =
    professionalCommissions.reduce(
      (
        total,
        professional
      ) =>
        total +
        professional.amount,
      0
    );

  const studioAmount =
    grossRevenue -
    professionalAmount;

  return (
    <div
      className="
        min-w-0
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>
        <p
          className="
            text-xs
            font-medium
            uppercase
            tracking-[0.18em]
            text-[#C9A227]

            sm:text-sm
            sm:normal-case
            sm:tracking-normal
            sm:text-black/40
          "
        >
          Visão geral
        </p>

        <h1
          className="
            mt-1
            font-serif
            text-3xl
            font-semibold
            tracking-[-0.02em]
            text-[#111]

            sm:text-4xl
          "
        >
          Dashboard
        </h1>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-black/45
          "
        >
          {isAdmin
            ? "Acompanhe os resultados e atendimentos do Studio."
            : "Acompanhe sua agenda, produção e resultados."}
        </p>
      </div>

      {/* =====================================================
          CARDS MOBILE / DESKTOP
      ====================================================== */}

      <div
        className="
          mt-6
          grid
          grid-cols-2
          gap-3

          sm:mt-8
          sm:gap-4

          xl:grid-cols-4
        "
      >
        <DashboardCard
          title="Agendamentos"
          desktopTitle="Agendamentos hoje"
          value={
            String(
              validAppointments.length
            )
          }
          icon={
            CalendarDays
          }
        />

        <DashboardCard
          title="Concluídos"
          desktopTitle="Atendimentos"
          value={
            String(
              completedAppointments.length
            )
          }
          icon={
            CheckCircle2
          }
        />

        <DashboardCard
          title={
            isAdmin
              ? "Faturamento"
              : "Produção"
          }
          desktopTitle={
            isAdmin
              ? "Faturamento"
              : "Produção"
          }
          value={
            formatCurrency(
              grossRevenue
            )
          }
          icon={
            CircleDollarSign
          }
        />

        <DashboardCard
          title={
            isAdmin
              ? "Comissões"
              : "Comissão"
          }
          desktopTitle={
            isAdmin
              ? "Comissões"
              : "Minha comissão"
          }
          value={
            formatCurrency(
              professionalAmount
            )
          }
          icon={
            WalletCards
          }
        />
      </div>

      {/* =====================================================
          STUDIO
          SOMENTE ADMIN
      ====================================================== */}

      {isAdmin && (
        <section
          className="
            mt-4
            overflow-hidden
            rounded-2xl
            border
            border-[#C9A227]/20
            bg-[#111]
            p-5
            text-white

            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <TrendingUp
                  className="
                    h-4
                    w-4
                    text-[#C9A227]
                  "
                />

                <p
                  className="
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-white/40

                    sm:text-xs
                  "
                >
                  Receita líquida do Studio
                </p>
              </div>

              <p
                className="
                  mt-3
                  text-3xl
                  font-bold
                  tracking-tight
                  text-[#C9A227]

                  sm:text-4xl
                "
              >
                {formatCurrency(
                  studioAmount
                )}
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-2
                gap-2

                sm:block
              "
            >
              <div
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  px-4
                  py-3
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
                  Produção
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  {formatCurrency(
                    grossRevenue
                  )}
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  px-4
                  py-3

                  sm:hidden
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
                  Comissões
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  {formatCurrency(
                    professionalAmount
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          COMISSÕES POR PROFISSIONAL
          SOMENTE ADMIN - VISÃO DO DIA
      ====================================================== */}

      {isAdmin && (
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
              flex
              flex-col
              gap-2
              border-b
              border-black/[0.06]
              px-4
              py-4

              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-6
              sm:py-5
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-[#C9A227]
                "
              >
                Hoje
              </p>

              <h2
                className="
                  mt-1
                  font-serif
                  text-xl
                  font-semibold
                  text-[#111]

                  sm:text-2xl
                "
              >
                Comissões por profissional
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-black/40
                "
              >
                Valores gerados pelos atendimentos concluídos hoje.
              </p>
            </div>

            <div
              className="
                w-fit
                rounded-xl
                bg-[#F8F1D9]
                px-4
                py-2
                text-sm
                font-bold
                text-[#8A6D0A]
              "
            >
              {formatCurrency(
                professionalAmount
              )}
            </div>
          </div>

          {professionalCommissions.length ===
          0 ? (
            <div
              className="
                px-6
                py-8
                text-center
                text-sm
                text-black/40
              "
            >
              Nenhuma comissão gerada hoje.
            </div>
          ) : (
            <div
              className="
                grid
                gap-3
                p-4

                sm:grid-cols-2
                sm:p-6

                xl:grid-cols-3
              "
            >
              {professionalCommissions.map(
                (
                  professional
                ) => (
                  <div
                    key={
                      professional.professionalId
                    }
                    className="
                      rounded-xl
                      border
                      border-black/[0.07]
                      bg-[#FAFAF8]
                      p-4
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
                          flex-1
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
                            professional.professionalName
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
                            professional.appointments
                          }{" "}
                          {professional.appointments ===
                          1
                            ? "atendimento concluído"
                            : "atendimentos concluídos"}
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        mt-4
                        border-t
                        border-black/[0.06]
                        pt-3
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
                        Comissão do dia
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
                          professional.amount
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          AGENDA DE HOJE
      ====================================================== */}

      <section
        className="
          mt-6
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-white

          sm:mt-8
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            border-b
            border-black/[0.06]
            px-4
            py-4

            sm:px-6
            sm:py-5
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-[#C9A227]

                sm:hidden
              "
            >
              Hoje
            </p>

            <h2
              className="
                mt-1
                font-serif
                text-xl
                font-semibold
                text-[#111]

                sm:mt-0
                sm:text-2xl
              "
            >
              Agenda de hoje
            </h2>

            <p
              className="
                mt-1
                text-[11px]
                capitalize
                text-black/35

                sm:text-xs
              "
            >
              {formatToday()}
            </p>
          </div>

          <div
            className="
              flex
              h-10
              min-w-10
              items-center
              justify-center
              rounded-xl
              bg-[#F8F1D9]
              px-3
              text-sm
              font-bold
              text-[#8A6D0A]

              sm:h-auto
              sm:min-w-0
              sm:px-4
              sm:py-2
            "
          >
            {
              validAppointments.length
            }

            <span
              className="
                ml-1
                hidden
                font-semibold

                sm:inline
              "
            >
              {validAppointments.length ===
              1
                ? "horário"
                : "horários"}
            </span>
          </div>
        </div>

        {/* EMPTY */}

        {appointments.length ===
        0 ? (
          <div
            className="
              flex
              min-h-[240px]
              flex-col
              items-center
              justify-center
              px-6
              py-10
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
              <CalendarDays
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
              Nenhum atendimento hoje
            </p>

            <p
              className="
                mt-1
                max-w-xs
                text-xs
                leading-5
                text-black/40
              "
            >
              Os próximos agendamentos
              aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            {/* ===============================================
                MOBILE TIMELINE
            ================================================ */}

            <div
              className="
                md:hidden
              "
            >
              {appointments.map(
                (
                  appointment,
                  index
                ) => (
                  <MobileAppointmentItem
                    key={
                      appointment.id
                    }
                    appointment={
                      appointment
                    }
                    showProfessional={
                      isAdmin
                    }
                    last={
                      index ===
                      appointments.length -
                        1
                    }
                  />
                )
              )}
            </div>

            {/* ===============================================
                DESKTOP
            ================================================ */}

            <div
              className="
                hidden
                md:block
              "
            >
              {appointments.map(
                (
                  appointment
                ) => (
                  <DesktopAppointmentItem
                    key={
                      appointment.id
                    }
                    appointment={
                      appointment
                    }
                    showProfessional={
                      isAdmin
                    }
                  />
                )
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   DASHBOARD CARD
============================================================ */

function DashboardCard({
  title,
  desktopTitle,
  value,
  icon: Icon,
}: {
  title: string;

  desktopTitle: string;

  value: string;

  icon:
    React.ElementType;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-2xl
        border
        border-black/[0.07]
        bg-white
        p-4

        sm:p-5
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-xl
          bg-[#C9A227]/10

          sm:h-10
          sm:w-10
        "
      >
        <Icon
          className="
            h-[18px]
            w-[18px]
            text-[#C9A227]

            sm:h-5
            sm:w-5
          "
        />
      </div>

      <p
        className="
          mt-4
          truncate
          text-[10px]
          font-medium
          text-black/40

          sm:mt-5
          sm:text-xs
        "
      >
        <span
          className="
            sm:hidden
          "
        >
          {title}
        </span>

        <span
          className="
            hidden
            sm:inline
          "
        >
          {desktopTitle}
        </span>
      </p>

      <p
        className="
          mt-1
          truncate
          text-xl
          font-bold
          tracking-[-0.02em]
          text-[#111]

          sm:mt-2
          sm:text-2xl
        "
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   MOBILE TIMELINE
============================================================ */

function MobileAppointmentItem({
  appointment,
  showProfessional,
  last,
}: {
  appointment:
    TodayAppointment;

  showProfessional:
    boolean;

  last:
    boolean;
}) {
  const client =
    getRelation(
      appointment.clients
    );

  const professional =
    getRelation(
      appointment.professionals
    );

  const service =
    appointment
      .appointment_services?.[0] ??
    null;

  return (
    <div
      className="
        grid
        grid-cols-[56px_20px_minmax(0,1fr)]
        px-4
      "
    >
      {/* HORÁRIO */}

      <div
        className="
          pt-5
          text-right
        "
      >
        <p
          className="
            text-xs
            font-bold
            text-[#111]
          "
        >
          {formatTime(
            appointment.start_at
          )}
        </p>

        <p
          className="
            mt-0.5
            text-[9px]
            text-black/30
          "
        >
          {formatTime(
            appointment.end_at
          )}
        </p>
      </div>

      {/* TIMELINE */}

      <div
        className="
          relative
          flex
          justify-center
        "
      >
        {!last && (
          <div
            className="
              absolute
              bottom-0
              top-8
              w-px
              bg-black/[0.08]
            "
          />
        )}

        <div
          className={`
            relative
            z-10
            mt-[22px]
            h-3
            w-3
            rounded-full
            border-2
            border-white
            ring-2

            ${getTimelineDot(
              appointment.status
            )}
          `}
        />
      </div>

      {/* CARD */}

      <div
        className={`
          ml-2
          py-4

          ${
            !last
              ? "border-b border-black/[0.06]"
              : ""
          }
        `}
      >
        <div
          className="
            rounded-xl
            bg-[#FAFAF8]
            p-4
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >
            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  truncate
                  text-sm
                  font-bold
                  text-[#111]
                "
              >
                {client?.full_name ??
                  "Cliente"}
              </p>

              <p
                className="
                  mt-1
                  flex
                  min-w-0
                  items-center
                  gap-1.5
                  truncate
                  text-xs
                  text-black/45
                "
              >
                <Scissors
                  className="
                    h-3
                    w-3
                    shrink-0
                    text-[#C9A227]
                  "
                />

                <span
                  className="
                    truncate
                  "
                >
                  {service
                    ?.service_name ??
                    "Atendimento"}
                </span>
              </p>

              {showProfessional && (
                <p
                  className="
                    mt-1.5
                    flex
                    items-center
                    gap-1.5
                    text-[10px]
                    text-black/35
                  "
                >
                  <UserRound
                    className="
                      h-3
                      w-3
                    "
                  />

                  {professional
                    ?.display_name ??
                    "Profissional"}
                </p>
              )}
            </div>

            <p
              className="
                shrink-0
                text-sm
                font-bold
                text-[#111]
              "
            >
              {formatCurrency(
                Number(
                  service?.unit_price ??
                    0
                )
              )}
            </p>
          </div>

          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <StatusBadge
              status={
                appointment.status
              }
            />

            <div
              className="
                flex
                items-center
                gap-1
                text-[10px]
                text-black/30
              "
            >
              <Clock3
                className="
                  h-3
                  w-3
                "
              />

              {formatDuration(
                appointment.start_at,
                appointment.end_at
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DESKTOP ITEM
============================================================ */

function DesktopAppointmentItem({
  appointment,
  showProfessional,
}: {
  appointment:
    TodayAppointment;

  showProfessional:
    boolean;
}) {
  const client =
    getRelation(
      appointment.clients
    );

  const professional =
    getRelation(
      appointment.professionals
    );

  const service =
    appointment
      .appointment_services?.[0] ??
    null;

  return (
    <div
      className="
        flex
        flex-col
        gap-4
        border-b
        border-black/[0.06]
        px-6
        py-5
        last:border-b-0

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
            min-w-[68px]
            flex-col
            items-center
            justify-center
            rounded-xl
            bg-[#F8F1D9]
            px-3
            py-3
          "
        >
          <Clock3
            className="
              h-4
              w-4
              text-[#C9A227]
            "
          />

          <strong
            className="
              mt-1
              text-sm
              text-[#111]
            "
          >
            {formatTime(
              appointment.start_at
            )}
          </strong>
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
              font-bold
              text-[#111]
            "
          >
            {client?.full_name ??
              "Cliente"}
          </p>

          <div
            className="
              mt-1
              flex
              flex-wrap
              items-center
              gap-x-3
              gap-y-1
              text-xs
              text-black/40
            "
          >
            <span
              className="
                flex
                items-center
                gap-1
              "
            >
              <Scissors
                className="
                  h-3
                  w-3
                "
              />

              {service
                ?.service_name ??
                "Atendimento"}
            </span>

            {showProfessional && (
              <span
                className="
                  flex
                  items-center
                  gap-1
                "
              >
                <UserRound
                  className="
                    h-3
                    w-3
                  "
                />

                {professional
                  ?.display_name ??
                  "Profissional"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className="
          flex
          items-center
          justify-between
          gap-4

          md:justify-end
        "
      >
        <p
          className="
            text-sm
            font-bold
            text-[#111]
          "
        >
          {formatCurrency(
            Number(
              service?.unit_price ??
                0
            )
          )}
        </p>

        <StatusBadge
          status={
            appointment.status
          }
        />
      </div>
    </div>
  );
}

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  status,
}: {
  status:
    AppointmentStatus;
}) {
  const config = {
    scheduled: {
      label:
        "Agendado",

      className:
        "bg-[#F8F1D9] text-[#8A6D0A]",
    },

    confirmed: {
      label:
        "Confirmado",

      className:
        "bg-[#111] text-white",
    },

    completed: {
      label:
        "Concluído",

      className:
        "bg-green-100 text-green-700",
    },

    canceled: {
      label:
        "Cancelado",

      className:
        "bg-neutral-100 text-neutral-500",
    },

    no_show: {
      label:
        "Faltou",

      className:
        "bg-red-100 text-red-700",
    },
  }[status];

  return (
    <span
      className={`
        inline-flex
        shrink-0
        rounded-full
        px-2.5
        py-1.5
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

function getTimelineDot(
  status:
    AppointmentStatus
) {
  switch (
    status
  ) {
    case "confirmed":
      return "bg-[#111] ring-[#111]/20";

    case "completed":
      return "bg-[#C9A227] ring-[#C9A227]/20";

    case "no_show":
      return "bg-red-500 ring-red-500/20";

    case "canceled":
      return "bg-neutral-300 ring-neutral-300/30";

    default:
      return "bg-[#E0C56E] ring-[#C9A227]/20";
  }
}

/* ============================================================
   HELPERS
============================================================ */

function getSaoPauloDate() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        timeZone:
          "America/Sao_Paulo",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
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

function formatTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,

      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(
      value
    )
  );
}

function formatToday() {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday:
        "long",

      day:
        "2-digit",

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

function formatDuration(
  start: string,
  end: string
) {
  const startDate =
    new Date(
      start
    );

  const endDate =
    new Date(
      end
    );

  const minutes =
    Math.max(
      0,
      Math.round(
        (
          endDate.getTime() -
          startDate.getTime()
        ) /
          60000
      )
    );

  if (
    minutes < 60
  ) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  const remainder =
    minutes %
    60;

  if (
    remainder === 0
  ) {
    return `${hours}h`;
  }

  return `${hours}h${String(
    remainder
  ).padStart(
    2,
    "0"
  )}`;
}