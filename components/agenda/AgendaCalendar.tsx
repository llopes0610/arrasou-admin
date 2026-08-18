"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import FullCalendar, {
  type CalendarRef,
  type EventClickInfo,
} from "@fullcalendar/react";

import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import {
  CalendarDays,
  Loader2,
  Plus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import NewAppointmentModal from "./NewAppointmentModal";
import AppointmentDetailsModal from "./AppointmentDetailsModal";

/* ============================================================
   TIPOS
============================================================ */

type AgendaCalendarProps = {
  currentUserRole:
    | "admin"
    | "professional";
};

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "canceled"
  | "no_show";

type CalendarDateClickInfo = {
  dateStr: string;
};

type ClientRelation = {
  id: string;
  full_name: string;
  phone: string | null;
};

type ProfessionalRelation = {
  id: string;
  display_name: string;
};

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

type AppointmentServiceRelation = {
  id: string;
  service_name: string;

  unit_price:
    | number
    | string;
};

type AppointmentRow = {
  id: string;

  start_at: string;
  end_at: string;

  status:
    AppointmentStatus;

  notes:
    | string
    | null;

  clients:
    SupabaseRelation<ClientRelation>;

  professionals:
    SupabaseRelation<ProfessionalRelation>;

  appointment_services:
    | AppointmentServiceRelation[]
    | null;
};

type CalendarEvent = {
  id: string;

  title: string;

  start: string;
  end: string;

  backgroundColor: string;
  borderColor: string;
  textColor: string;

  extendedProps: {
    status:
      AppointmentStatus;

    clientName:
      string;

    clientPhone:
      | string
      | null;

    professionalName:
      string;

    serviceName:
      string;

    price:
      number;
  };
};

/* ============================================================
   COMPONENTE
============================================================ */

export default function AgendaCalendar({
  currentUserRole,
}: AgendaCalendarProps) {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const calendarRef =
    useRef<CalendarRef | null>(
      null
    );

  const calendarContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* ==========================================================
     RESPONSIVIDADE
  ========================================================== */

  const [
    isMobile,
    setIsMobile,
  ] =
    useState(false);

  /*
   * Detectamos a largura real do container,
   * não apenas a largura da janela.
   *
   * Isso funciona melhor porque no desktop
   * existe sidebar.
   */
  useEffect(() => {
    const element =
      calendarContainerRef.current;

    if (!element) {
      return;
    }

    const observer =
      new ResizeObserver(
        (
          entries
        ) => {
          const width =
            entries[0]
              ?.contentRect
              .width ?? 0;

          setIsMobile(
            width < 768
          );
        }
      );

    observer.observe(
      element
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  /*
   * Se atravessarmos o breakpoint,
   * mudamos a visualização.
   *
   * FullCalendar v7 usa changeView().
   */
  useEffect(() => {
    const calendarApi =
      calendarRef.current?.getApi();

    if (!calendarApi) {
      return;
    }

    const currentView =
      calendarApi.view.type;

    if (
      isMobile &&
      currentView ===
        "timeGridWeek"
    ) {
      calendarApi.changeView(
        "timeGridDay"
      );

      return;
    }

    /*
     * Ao voltar ao desktop:
     *
     * se estivermos em Dia por causa
     * do comportamento responsivo,
     * voltamos para Semana.
     */
    if (
      !isMobile &&
      currentView ===
        "timeGridDay"
    ) {
      calendarApi.changeView(
        "timeGridWeek"
      );
    }
  }, [
    isMobile,
  ]);

  /* ==========================================================
     EVENTOS
  ========================================================== */

  const [
    events,
    setEvents,
  ] =
    useState<
      CalendarEvent[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /* ==========================================================
     NOVO AGENDAMENTO
  ========================================================== */

  const [
    newAppointmentOpen,
    setNewAppointmentOpen,
  ] =
    useState(false);

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<
      string | null
    >(null);

  /* ==========================================================
     DETALHES
  ========================================================== */

  const [
    selectedAppointmentId,
    setSelectedAppointmentId,
  ] =
    useState<
      string | null
    >(null);

  const [
    appointmentDetailsOpen,
    setAppointmentDetailsOpen,
  ] =
    useState(false);

  /* ==========================================================
     CARREGAR AGENDA
  ========================================================== */

  const loadAppointments =
    useCallback(
      async () => {
        setLoading(
          true
        );

        try {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "appointments"
              )
              .select(`
                id,
                start_at,
                end_at,
                status,
                notes,

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
                  unit_price
                )
              `)
              .order(
                "start_at",
                {
                  ascending:
                    true,
                }
              );

          if (error) {
            throw error;
          }

          const rows =
            (
              data ??
              []
            ) as unknown as AppointmentRow[];

          const mappedEvents:
            CalendarEvent[] =
            rows.map(
              (
                appointment
              ) => {
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

                const clientName =
                  client?.full_name ??
                  "Cliente";

                const professionalName =
                  professional?.display_name ??
                  "Profissional";

                const serviceName =
                  service?.service_name ??
                  "Atendimento";

                const colors =
                  getStatusColors(
                    appointment.status
                  );

                return {
                  id:
                    appointment.id,

                  title:
                    currentUserRole ===
                    "admin"
                      ? `${clientName} • ${professionalName}`
                      : clientName,

                  start:
                    appointment.start_at,

                  end:
                    appointment.end_at,

                  ...colors,

                  extendedProps: {
                    status:
                      appointment.status,

                    clientName,

                    clientPhone:
                      client?.phone ??
                      null,

                    professionalName,

                    serviceName,

                    price:
                      Number(
                        service?.unit_price ??
                          0
                      ),
                  },
                };
              }
            );

          setEvents(
            mappedEvents
          );
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar agenda:",
            error
          );

          setEvents(
            []
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        currentUserRole,
        supabase,
      ]
    );

  useEffect(() => {
    void loadAppointments();
  }, [
    loadAppointments,
  ]);

  /* ==========================================================
     CLIQUE EM HORÁRIO
  ========================================================== */

  function handleDateClick(
    info:
      CalendarDateClickInfo
  ) {
    setSelectedDate(
      info.dateStr
    );

    setNewAppointmentOpen(
      true
    );
  }

  /* ==========================================================
     CLIQUE EM EVENTO
  ========================================================== */

  function handleEventClick(
    info:
      EventClickInfo
  ) {
    setSelectedAppointmentId(
      info.event.id
    );

    setAppointmentDetailsOpen(
      true
    );
  }

  /* ==========================================================
     NOVO
  ========================================================== */

  function handleNewAppointment() {
    setSelectedDate(
      null
    );

    setNewAppointmentOpen(
      true
    );
  }

  /* ==========================================================
     FECHAR MODAIS
  ========================================================== */

  function handleCloseNewAppointment() {
    setNewAppointmentOpen(
      false
    );

    setSelectedDate(
      null
    );
  }

  function handleCloseDetails() {
    setAppointmentDetailsOpen(
      false
    );

    setSelectedAppointmentId(
      null
    );
  }

  /* ==========================================================
     NAVEGAÇÃO MOBILE
  ========================================================== */

  function getCalendarApi() {
    return calendarRef
      .current
      ?.getApi();
  }

  function goPrevious() {
    getCalendarApi()
      ?.prev();
  }

  function goNext() {
    getCalendarApi()
      ?.next();
  }

  function goToday() {
    getCalendarApi()
      ?.today();
  }

  function changeMobileView(
    view:
      | "dayGridMonth"
      | "timeGridDay"
  ) {
    getCalendarApi()
      ?.changeView(
        view
      );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      <div
        ref={
          calendarContainerRef
        }
        className="
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-white
          shadow-sm
        "
      >
        {/* ==================================================
            HEADER
        =================================================== */}

        <div
          className="
            border-b
            border-black/10
            p-4

            sm:p-5
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
            <div>
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <CalendarDays
                  className="
                    h-5
                    w-5
                    text-[#C9A227]
                  "
                />

                <h2
                  className="
                    font-serif
                    text-xl
                    font-semibold
                    text-[#111]
                  "
                >
                  Calendário
                </h2>
              </div>

              <p
                className="
                  mt-1
                  text-xs
                  text-black/40
                "
              >
                {isMobile
                  ? "Toque em um horário para criar um atendimento."
                  : "Clique em um horário para criar um novo atendimento."}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleNewAppointment
              }
              className="
                flex
                min-h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#C9A227]
                px-5
                text-sm
                font-semibold
                text-black
                transition-all

                hover:bg-[#E0C56E]

                md:w-auto
              "
            >
              <Plus
                className="
                  h-4
                  w-4
                "
              />

              Novo agendamento
            </button>
          </div>

          {/* ================================================
              CONTROLES MOBILE
          ================================================= */}

          {isMobile && (
            <div
              className="
                mt-4
                border-t
                border-black/[0.06]
                pt-4
              "
            >
              {/* NAVEGAÇÃO */}

              <div
                className="
                  grid
                  grid-cols-[44px_1fr_44px]
                  items-center
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={
                    goPrevious
                  }
                  aria-label="Período anterior"
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-black/10
                    text-lg
                    text-black/55

                    active:bg-black/[0.04]
                  "
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={
                    goToday
                  }
                  className="
                    h-11
                    rounded-xl
                    border
                    border-black/10
                    px-4
                    text-xs
                    font-semibold
                    text-[#111]

                    active:bg-black/[0.04]
                  "
                >
                  Hoje
                </button>

                <button
                  type="button"
                  onClick={
                    goNext
                  }
                  aria-label="Próximo período"
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-black/10
                    text-lg
                    text-black/55

                    active:bg-black/[0.04]
                  "
                >
                  ›
                </button>
              </div>

              {/* VIEWS */}

              <div
                className="
                  mt-3
                  grid
                  grid-cols-2
                  rounded-xl
                  bg-[#F5F5F3]
                  p-1
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    changeMobileView(
                      "dayGridMonth"
                    )
                  }
                  className="
                    min-h-10
                    rounded-lg
                    text-xs
                    font-semibold
                    text-black/50

                    active:bg-white
                  "
                >
                  Mês
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeMobileView(
                      "timeGridDay"
                    )
                  }
                  className="
                    min-h-10
                    rounded-lg
                    bg-[#111]
                    text-xs
                    font-semibold
                    text-white
                  "
                >
                  Dia
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            CALENDÁRIO
        =================================================== */}

        <div
          className="
            relative
            p-2

            sm:p-4
            md:p-5
          "
        >
          {/* LOADING */}

          {loading && (
            <div
              className="
                absolute
                inset-0
                z-20
                flex
                min-h-[400px]
                items-center
                justify-center
                bg-white/80
                backdrop-blur-[2px]
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-black/50
                "
              >
                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
                    text-[#C9A227]
                  "
                />

                Carregando agenda...
              </div>
            </div>
          )}

          <div
            className="
              arrasou-calendar
              arrasou-calendar-mobile
              w-full
              min-w-0
            "
          >
            <FullCalendar
              ref={
                calendarRef
              }

              plugins={[
                classicThemePlugin,
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
              ]}

              /*
               * Começamos com Semana.
               *
               * ResizeObserver troca para Dia
               * assim que identifica mobile.
               */
              initialView="timeGridWeek"

              locale="pt-br"

              timeZone="America/Sao_Paulo"

              firstDay={1}

              height="auto"

              nowIndicator

              selectable

              allDaySlot={
                false
              }

              slotMinTime="08:00:00"

              slotMaxTime="21:00:00"

              slotDuration="00:30:00"

              /*
               * Em mobile usamos controles
               * próprios para economizar espaço.
               */
              headerToolbar={
                isMobile
                  ? false
                  : {
                      left:
                        "prev,next today",

                      center:
                        "title",

                      right:
                        "dayGridMonth,timeGridWeek,timeGridDay",
                    }
              }

              buttons={{
                today: {
                  text:
                    "Hoje",
                },

                dayGridMonth: {
                  text:
                    "Mês",
                },

                timeGridWeek: {
                  text:
                    "Semana",
                },

                timeGridDay: {
                  text:
                    "Dia",
                },
              }}

              events={
                events
              }

              dateClick={
                handleDateClick
              }

              eventClick={
                handleEventClick
              }

              eventTimeFormat={{
                hour:
                  "2-digit",

                minute:
                  "2-digit",

                hour12:
                  false,
              }}

              slotHeaderFormat={{
                hour:
                  "2-digit",

                minute:
                  "2-digit",

                hour12:
                  false,
              }}

              dayHeaderFormat={
                isMobile
                  ? {
                      weekday:
                        "long",

                      day:
                        "2-digit",

                      month:
                        "short",
                    }
                  : {
                      weekday:
                        "short",

                      day:
                        "2-digit",
                    }
              }

              /*
               * Espaço suficiente para tocar
               * em horários no celular.
               */
              eventMinHeight={
                isMobile
                  ? 42
                  : 20
              }

              /*
               * Conteúdo personalizado.
               */
              eventContent={(
                info
              ) => {
                const props =
                  info
                    .event
                    .extendedProps;

                if (
                  isMobile
                ) {
                  return (
                    <div
                      className="
                        min-w-0
                        px-2
                        py-1.5
                      "
                    >
                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-2
                        "
                      >
                        <span
                          className="
                            shrink-0
                            text-[10px]
                            font-bold
                          "
                        >
                          {
                            info.timeText
                          }
                        </span>

                        <span
                          className="
                            truncate
                            text-[11px]
                            font-semibold
                          "
                        >
                          {
                            props.clientName
                          }
                        </span>
                      </div>

                      <p
                        className="
                          mt-0.5
                          truncate
                          text-[9px]
                          opacity-75
                        "
                      >
                        {
                          props.serviceName
                        }

                        {currentUserRole ===
                          "admin" &&
                          ` • ${props.professionalName}`}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    className="
                      overflow-hidden
                      px-1
                      py-0.5
                    "
                  >
                    <p
                      className="
                        truncate
                        text-[11px]
                        font-semibold
                      "
                    >
                      {
                        info.timeText
                      }
                    </p>

                    <p
                      className="
                        truncate
                        text-[11px]
                        font-medium
                      "
                    >
                      {
                        props.clientName
                      }
                    </p>

                    <p
                      className="
                        truncate
                        text-[9px]
                        opacity-75
                      "
                    >
                      {
                        props.serviceName
                      }
                    </p>

                    {currentUserRole ===
                      "admin" && (
                      <p
                        className="
                          truncate
                          text-[9px]
                          opacity-70
                        "
                      >
                        {
                          props.professionalName
                        }
                      </p>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          NOVO AGENDAMENTO
      ====================================================== */}

      <NewAppointmentModal
        open={
          newAppointmentOpen
        }

        selectedDate={
          selectedDate
        }

        currentUserRole={
          currentUserRole
        }

        onClose={
          handleCloseNewAppointment
        }

        onCreated={
          async () => {
            handleCloseNewAppointment();

            await loadAppointments();
          }
        }
      />

      {/* =====================================================
          DETALHES
      ====================================================== */}

      <AppointmentDetailsModal
        open={
          appointmentDetailsOpen
        }

        appointmentId={
          selectedAppointmentId
        }

        onClose={
          handleCloseDetails
        }

        onUpdated={
          async () => {
            await loadAppointments();
          }
        }
      />
    </>
  );
}

/* ============================================================
   CORES
============================================================ */

function getStatusColors(
  status:
    AppointmentStatus
) {
  switch (
    status
  ) {
    case "confirmed":
      return {
        backgroundColor:
          "#111111",

        borderColor:
          "#111111",

        textColor:
          "#FFFFFF",
      };

    case "completed":
      return {
        backgroundColor:
          "#C9A227",

        borderColor:
          "#C9A227",

        textColor:
          "#000000",
      };

    case "no_show":
      return {
        backgroundColor:
          "#F59E0B",

        borderColor:
          "#D97706",

        textColor:
          "#111111",
      };

    case "canceled":
      return {
        backgroundColor:
          "#DC2626",

        borderColor:
          "#B91C1C",

        textColor:
          "#FFFFFF",
      };

    case "scheduled":
    default:
      return {
        backgroundColor:
          "#F4EAC8",

        borderColor:
          "#C9A227",

        textColor:
          "#111111",
      };
  }
}