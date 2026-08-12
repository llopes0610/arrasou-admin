"use client";

import type {
  ElementType,
  ReactNode,
} from "react";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Loader2,
  Phone,
  Plus,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* ============================================================
   PROPS
============================================================ */

type NewAppointmentModalProps = {
  open: boolean;

  selectedDate:
    | string
    | null;

  currentUserRole:
    | "admin"
    | "professional";

  onClose: () => void;

  onCreated: () =>
    | void
    | Promise<void>;
};

/* ============================================================
   TIPOS
============================================================ */

type Professional = {
  id: string;
  display_name: string;
  profile_id: string;
};

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
};

type Service = {
  id: string;
  name: string;

  /*
   * numeric do PostgreSQL pode ser
   * retornado como string dependendo
   * da tipagem/configuração.
   */
  price:
    | number
    | string;

  duration_minutes: number;
  active: boolean;
};

/*
 * Formato bruto retornado
 * pelo Supabase.
 */
type ProfessionalServiceQueryRow = {
  id: string;
  professional_id: string;
  service_id: string;

  commission_percentage:
    | number
    | string
    | null;

  active: boolean;

  /*
   * A relação está vindo como array.
   */
  services:
    | Service[]
    | null;
};

/*
 * Formato normalizado usado
 * pelo restante do componente.
 */
type ProfessionalService = {
  id: string;
  professional_id: string;
  service_id: string;

  commission_percentage:
    | number
    | string
    | null;

  active: boolean;

  service: Service;
};

/* ============================================================
   COMPONENTE
============================================================ */

export default function NewAppointmentModal({
  open,
  selectedDate,
  currentUserRole,
  onClose,
  onCreated,
}: NewAppointmentModalProps) {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  /* ==========================================================
     DADOS
  ========================================================== */

  const [
    professionals,
    setProfessionals,
  ] =
    useState<Professional[]>(
      []
    );

  const [
    professionalServices,
    setProfessionalServices,
  ] =
    useState<
      ProfessionalService[]
    >([]);

  const [
    clients,
    setClients,
  ] =
    useState<Client[]>(
      []
    );

  /* ==========================================================
     FORMULÁRIO
  ========================================================== */

  const [
    selectedProfessional,
    setSelectedProfessional,
  ] =
    useState("");

  const [
    selectedService,
    setSelectedService,
  ] =
    useState("");

  const [
    selectedClient,
    setSelectedClient,
  ] =
    useState("");

  const [
    createNewClient,
    setCreateNewClient,
  ] =
    useState(false);

  const [
    clientName,
    setClientName,
  ] =
    useState("");

  const [
    clientPhone,
    setClientPhone,
  ] =
    useState("");

  const [
    appointmentDate,
    setAppointmentDate,
  ] =
    useState("");

  const [
    appointmentTime,
    setAppointmentTime,
  ] =
    useState("");

  const [
    notes,
    setNotes,
  ] =
    useState("");

  /* ==========================================================
     ESTADO DA UI
  ========================================================== */

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    loadingData,
    setLoadingData,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /* ==========================================================
     SERVIÇOS DA PROFISSIONAL
  ========================================================== */

  const availableServices =
    useMemo(() => {
      const byId =
        new Map<
          string,
          Service
        >();

      professionalServices
        .filter(
          (item) =>
            item.professional_id ===
              selectedProfessional &&
            item.active &&
            item.service.active
        )
        .forEach(
          (item) => {
            byId.set(
              item.service.id,
              item.service
            );
          }
        );

      return Array.from(
        byId.values()
      );
    }, [
      professionalServices,
      selectedProfessional,
    ]);

  const currentService =
    useMemo(
      () =>
        availableServices.find(
          (service) =>
            service.id ===
            selectedService
        ) ?? null,
      [
        availableServices,
        selectedService,
      ]
    );

  const formattedPrice =
    currentService
      ? new Intl.NumberFormat(
          "pt-BR",
          {
            style:
              "currency",

            currency:
              "BRL",
          }
        ).format(
          Number(
            currentService.price
          )
        )
      : "R$ 0,00";

  /* ==========================================================
     CARREGAR DADOS
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled =
      false;

    async function loadData() {
      setLoadingData(
        true
      );

      setError("");

      try {
        const [
          professionalsResult,
          professionalServicesResult,
          clientsResult,
        ] =
          await Promise.all([
            /*
             * PROFISSIONAIS
             */
            supabase
              .from(
                "professionals"
              )
              .select(`
                id,
                profile_id,
                display_name
              `)
              .eq(
                "active",
                true
              )
              .order(
                "display_name"
              ),

            /*
             * SERVIÇOS POR PROFISSIONAL
             */
            supabase
              .from(
                "professional_services"
              )
              .select(`
                id,
                professional_id,
                service_id,
                commission_percentage,
                active,

                services (
                  id,
                  name,
                  price,
                  duration_minutes,
                  active
                )
              `)
              .eq(
                "active",
                true
              ),

            /*
             * CLIENTES
             */
            supabase
              .from(
                "clients"
              )
              .select(`
                id,
                full_name,
                phone
              `)
              .order(
                "full_name"
              ),
          ]);

        if (
          professionalsResult.error
        ) {
          throw professionalsResult.error;
        }

        if (
          professionalServicesResult.error
        ) {
          throw professionalServicesResult.error;
        }

        if (
          clientsResult.error
        ) {
          throw clientsResult.error;
        }

        if (cancelled) {
          return;
        }

        /*
         * ====================================================
         * PROFISSIONAIS
         * ====================================================
         */

        const professionalRows =
          (
            professionalsResult.data ??
            []
          ) as unknown as Professional[];

        /*
         * ====================================================
         * SERVIÇOS
         *
         * Normalizamos o retorno:
         *
         * services: Service[]
         *
         * para:
         *
         * service: Service
         * ====================================================
         */

        const rawServiceRows =
          (
            professionalServicesResult.data ??
            []
          ) as unknown as ProfessionalServiceQueryRow[];

        const normalizedServiceRows =
          rawServiceRows
            .map(
              (
                row
              ):
                | ProfessionalService
                | null => {
                const service =
                  row.services?.[0];

                if (!service) {
                  return null;
                }

                return {
                  id:
                    row.id,

                  professional_id:
                    row.professional_id,

                  service_id:
                    row.service_id,

                  commission_percentage:
                    row.commission_percentage,

                  active:
                    row.active,

                  service,
                };
              }
            )
            .filter(
              (
                row
              ): row is ProfessionalService =>
                row !== null
            );

        /*
         * ====================================================
         * CLIENTES
         * ====================================================
         */

        const clientRows =
          (
            clientsResult.data ??
            []
          ) as unknown as Client[];

        setProfessionals(
          professionalRows
        );

        setProfessionalServices(
          normalizedServiceRows
        );

        setClients(
          clientRows
        );

        /*
         * Profissional comum:
         * com RLS correto deve enxergar
         * somente o próprio registro.
         */
        if (
          currentUserRole ===
            "professional"
        ) {
          if (
            professionalRows.length ===
            1
          ) {
            setSelectedProfessional(
              professionalRows[0].id
            );
          } else if (
            professionalRows.length ===
            0
          ) {
            setError(
              "Não encontramos o cadastro profissional vinculado ao seu usuário."
            );
          }
        }
      } catch (
        loadError
      ) {
        console.error(
          "Erro ao carregar dados do agendamento:",
          loadError
        );

        if (!cancelled) {
          setError(
            "Não foi possível carregar os dados do agendamento."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingData(
            false
          );
        }
      }
    }

    void loadData();

    return () => {
      cancelled =
        true;
    };
  }, [
    open,
    currentUserRole,
    supabase,
  ]);

  /* ==========================================================
     DATA VINDO DO CALENDÁRIO
  ========================================================== */

  useEffect(() => {
    if (
      !open ||
      !selectedDate
    ) {
      return;
    }

    const date =
      new Date(
        selectedDate
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return;
    }

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
        date
      );

    const year =
      parts.find(
        (part) =>
          part.type ===
          "year"
      )?.value ?? "";

    const month =
      parts.find(
        (part) =>
          part.type ===
          "month"
      )?.value ?? "";

    const day =
      parts.find(
        (part) =>
          part.type ===
          "day"
      )?.value ?? "";

    if (
      year &&
      month &&
      day
    ) {
      setAppointmentDate(
        `${year}-${month}-${day}`
      );
    }

    /*
     * Se veio clique de horário
     * no FullCalendar.
     */
    if (
      selectedDate.includes(
        "T"
      )
    ) {
      const timeParts =
        new Intl.DateTimeFormat(
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
        ).formatToParts(
          date
        );

      const hour =
        timeParts.find(
          (part) =>
            part.type ===
            "hour"
        )?.value ?? "";

      const minute =
        timeParts.find(
          (part) =>
            part.type ===
            "minute"
        )?.value ?? "";

      if (
        hour &&
        minute
      ) {
        setAppointmentTime(
          `${hour}:${minute}`
        );
      }
    }
  }, [
    open,
    selectedDate,
  ]);

  /* ==========================================================
     AO TROCAR PROFISSIONAL
  ========================================================== */

  useEffect(() => {
    setSelectedService(
      ""
    );
  }, [
    selectedProfessional,
  ]);

  /* ==========================================================
     LIMPAR FORMULÁRIO
  ========================================================== */

  function resetForm() {
    setSelectedService(
      ""
    );

    setSelectedClient(
      ""
    );

    setCreateNewClient(
      false
    );

    setClientName(
      ""
    );

    setClientPhone(
      ""
    );

    setAppointmentDate(
      ""
    );

    setAppointmentTime(
      ""
    );

    setNotes(
      ""
    );

    setError(
      ""
    );

    setSuccess(
      false
    );

    if (
      currentUserRole ===
      "admin"
    ) {
      setSelectedProfessional(
        ""
      );
    }
  }

  /* ==========================================================
     FECHAR
  ========================================================== */

  function handleClose() {
    if (loading) {
      return;
    }

    resetForm();

    onClose();
  }

  /* ==========================================================
     CRIAR AGENDAMENTO
  ========================================================== */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    /*
     * ========================================================
     * VALIDAÇÕES
     * ========================================================
     */

    if (
      !selectedProfessional
    ) {
      setError(
        "Selecione uma profissional."
      );

      return;
    }

    if (
      !selectedService
    ) {
      setError(
        "Selecione um serviço."
      );

      return;
    }

    if (
      !currentService
    ) {
      setError(
        "O serviço selecionado não está disponível para esta profissional."
      );

      return;
    }

    if (
      !createNewClient &&
      !selectedClient
    ) {
      setError(
        "Selecione uma cliente."
      );

      return;
    }

    if (
      createNewClient &&
      !clientName.trim()
    ) {
      setError(
        "Informe o nome da nova cliente."
      );

      return;
    }

    if (
      !appointmentDate ||
      !appointmentTime
    ) {
      setError(
        "Informe data e horário."
      );

      return;
    }

    setLoading(
      true
    );

    try {
      /*
       * Studio opera em São Paulo.
       *
       * Banco recebe TIMESTAMPTZ.
       */
      const startAt =
        `${appointmentDate}T${appointmentTime}:00-03:00`;

      const {
        error:
          rpcError,
      } =
        await supabase.rpc(
          "create_appointment",
          {
            p_client_id:
              createNewClient
                ? null
                : selectedClient,

            p_client_name:
              createNewClient
                ? clientName.trim()
                : "",

            p_client_phone:
              createNewClient
                ? clientPhone.trim()
                : "",

            p_professional_id:
              selectedProfessional,

            p_service_id:
              selectedService,

            p_start_at:
              startAt,

            p_notes:
              notes.trim() ||
              null,
          }
        );

      if (
        rpcError
      ) {
        const message =
          rpcError.message.toLowerCase();

        if (
          message.includes(
            "appointments_no_professional_overlap"
          ) ||
          message.includes(
            "conflicting key value"
          )
        ) {
          setError(
            "Essa profissional já possui um atendimento nesse horário."
          );

          return;
        }

        throw rpcError;
      }

      setSuccess(
        true
      );

      /*
       * Pequeno tempo para feedback
       * visual antes de atualizar.
       */
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            400
          )
      );

      resetForm();

      await onCreated();
    } catch (
      submitError
    ) {
      console.error(
        "Erro ao criar agendamento:",
        submitError
      );

      setError(
        "Não foi possível criar o agendamento. Verifique os dados e tente novamente."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /* ==========================================================
     NÃO RENDERIZAR
  ========================================================== */

  if (!open) {
    return null;
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-end
        justify-center
        bg-black/55
        backdrop-blur-sm

        sm:items-center
        sm:p-4
      "
      onClick={
        handleClose
      }
    >
      <div
        className="
          flex
          max-h-[94dvh]
          w-full
          flex-col
          overflow-hidden
          rounded-t-[1.5rem]
          bg-white
          shadow-2xl

          sm:max-w-2xl
          sm:rounded-2xl
        "
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        {/* ==================================================
            HEADER
        =================================================== */}

        <div
          className="
            flex
            shrink-0
            items-start
            justify-between
            gap-4
            border-b
            border-black/10
            px-5
            py-5

            sm:px-6
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.24em]
                text-[#C9A227]
              "
            >
              Agenda
            </p>

            <h2
              className="
                mt-2
                font-serif
                text-2xl
                font-semibold
                text-[#111]
              "
            >
              Novo agendamento
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Preencha os dados
              do atendimento.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              loading
            }
            aria-label="Fechar"
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-black/10
              text-black/45
              transition-colors

              hover:bg-black/[0.03]

              disabled:opacity-50
            "
          >
            <X
              className="
                h-4
                w-4
              "
            />
          </button>
        </div>

        {/* ==================================================
            FORM
        =================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="
            flex
            min-h-0
            flex-1
            flex-col
          "
        >
          <div
            className="
              flex-1
              space-y-7
              overflow-y-auto
              px-5
              py-6

              sm:px-6
            "
          >
            {loadingData ? (
              <div
                className="
                  flex
                  min-h-[320px]
                  items-center
                  justify-center
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    text-black/45
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

                  Carregando dados...
                </div>
              </div>
            ) : (
              <>
                {/* ==================================================
                    PROFISSIONAL
                =================================================== */}

                <FormSection
                  number="01"
                  title="Profissional"
                >
                  <SelectWrapper
                    icon={
                      UserRound
                    }
                  >
                    <select
                      value={
                        selectedProfessional
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedProfessional(
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        currentUserRole ===
                          "professional" ||
                        loading
                      }
                      required
                      className="
                        h-12
                        w-full
                        appearance-none
                        bg-transparent
                        pl-11
                        pr-10
                        text-sm
                        text-[#111]
                        outline-none

                        disabled:cursor-not-allowed
                        disabled:bg-black/[0.02]
                      "
                    >
                      <option value="">
                        Selecione a profissional
                      </option>

                      {professionals.map(
                        (
                          professional
                        ) => (
                          <option
                            key={
                              professional.id
                            }
                            value={
                              professional.id
                            }
                          >
                            {
                              professional.display_name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </SelectWrapper>
                </FormSection>

                {/* ==================================================
                    SERVIÇO
                =================================================== */}

                <FormSection
                  number="02"
                  title="Serviço"
                >
                  <SelectWrapper
                    icon={
                      WandSparkles
                    }
                  >
                    <select
                      value={
                        selectedService
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedService(
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        !selectedProfessional ||
                        loading
                      }
                      required
                      className="
                        h-12
                        w-full
                        appearance-none
                        bg-transparent
                        pl-11
                        pr-10
                        text-sm
                        text-[#111]
                        outline-none

                        disabled:cursor-not-allowed
                        disabled:bg-black/[0.02]
                      "
                    >
                      <option value="">
                        Selecione o serviço
                      </option>

                      {availableServices.map(
                        (
                          service
                        ) => (
                          <option
                            key={
                              service.id
                            }
                            value={
                              service.id
                            }
                          >
                            {
                              service.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </SelectWrapper>

                  {currentService && (
                    <div
                      className="
                        mt-3
                        grid
                        grid-cols-2
                        gap-3
                      "
                    >
                      <div
                        className="
                          rounded-xl
                          bg-[#FAFAF8]
                          p-3
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
                          Duração
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            font-semibold
                            text-[#111]
                          "
                        >
                          {
                            currentService.duration_minutes
                          }{" "}
                          min
                        </p>
                      </div>

                      <div
                        className="
                          rounded-xl
                          bg-[#F8F1D9]
                          p-3
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
                          Valor
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            font-semibold
                            text-[#111]
                          "
                        >
                          {
                            formattedPrice
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </FormSection>

                {/* ==================================================
                    CLIENTE
                =================================================== */}

                <FormSection
                  number="03"
                  title="Cliente"
                >
                  <div
                    className="
                      mb-3
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
                        setCreateNewClient(
                          false
                        )
                      }
                      className={`
                        min-h-11
                        rounded-lg
                        px-3
                        py-2.5
                        text-xs
                        font-semibold
                        transition-all

                        ${
                          !createNewClient
                            ? "bg-white text-[#111] shadow-sm"
                            : "text-black/40"
                        }
                      `}
                    >
                      Cliente cadastrada
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCreateNewClient(
                          true
                        )
                      }
                      className={`
                        min-h-11
                        rounded-lg
                        px-3
                        py-2.5
                        text-xs
                        font-semibold
                        transition-all

                        ${
                          createNewClient
                            ? "bg-white text-[#111] shadow-sm"
                            : "text-black/40"
                        }
                      `}
                    >
                      Nova cliente
                    </button>
                  </div>

                  {!createNewClient ? (
                    <SelectWrapper
                      icon={
                        UserRound
                      }
                    >
                      <select
                        value={
                          selectedClient
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedClient(
                            event
                              .target
                              .value
                          )
                        }
                        required
                        className="
                          h-12
                          w-full
                          appearance-none
                          bg-transparent
                          pl-11
                          pr-10
                          text-sm
                          text-[#111]
                          outline-none
                        "
                      >
                        <option value="">
                          Selecione a cliente
                        </option>

                        {clients.map(
                          (
                            client
                          ) => (
                            <option
                              key={
                                client.id
                              }
                              value={
                                client.id
                              }
                            >
                              {
                                client.full_name
                              }

                              {client.phone
                                ? ` • ${client.phone}`
                                : ""}
                            </option>
                          )
                        )}
                      </select>
                    </SelectWrapper>
                  ) : (
                    <div
                      className="
                        grid
                        gap-3

                        sm:grid-cols-2
                      "
                    >
                      <InputWrapper
                        icon={
                          UserRound
                        }
                      >
                        <input
                          type="text"
                          value={
                            clientName
                          }
                          onChange={(
                            event
                          ) =>
                            setClientName(
                              event
                                .target
                                .value
                            )
                          }
                          required
                          autoComplete="name"
                          placeholder="Nome da cliente"
                          className="
                            h-12
                            w-full
                            bg-transparent
                            pl-11
                            pr-4
                            text-sm
                            text-[#111]
                            outline-none

                            placeholder:text-black/25
                          "
                        />
                      </InputWrapper>

                      <InputWrapper
                        icon={
                          Phone
                        }
                      >
                        <input
                          type="tel"
                          value={
                            clientPhone
                          }
                          onChange={(
                            event
                          ) =>
                            setClientPhone(
                              event
                                .target
                                .value
                            )
                          }
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="Telefone"
                          className="
                            h-12
                            w-full
                            bg-transparent
                            pl-11
                            pr-4
                            text-sm
                            text-[#111]
                            outline-none

                            placeholder:text-black/25
                          "
                        />
                      </InputWrapper>
                    </div>
                  )}
                </FormSection>

                {/* ==================================================
                    DATA E HORÁRIO
                =================================================== */}

                <FormSection
                  number="04"
                  title="Data e horário"
                >
                  <div
                    className="
                      grid
                      gap-3

                      sm:grid-cols-2
                    "
                  >
                    <InputWrapper
                      icon={
                        CalendarDays
                      }
                    >
                      <input
                        type="date"
                        value={
                          appointmentDate
                        }
                        onChange={(
                          event
                        ) =>
                          setAppointmentDate(
                            event
                              .target
                              .value
                          )
                        }
                        required
                        className="
                          h-12
                          w-full
                          bg-transparent
                          pl-11
                          pr-4
                          text-sm
                          text-[#111]
                          outline-none
                        "
                      />
                    </InputWrapper>

                    <InputWrapper
                      icon={
                        Clock3
                      }
                    >
                      <input
                        type="time"
                        value={
                          appointmentTime
                        }
                        onChange={(
                          event
                        ) =>
                          setAppointmentTime(
                            event
                              .target
                              .value
                          )
                        }
                        step={1800}
                        required
                        className="
                          h-12
                          w-full
                          bg-transparent
                          pl-11
                          pr-4
                          text-sm
                          text-[#111]
                          outline-none
                        "
                      />
                    </InputWrapper>
                  </div>

                  {currentService &&
                    appointmentTime && (
                      <div
                        className="
                          mt-3
                          flex
                          items-center
                          gap-2
                          rounded-xl
                          border
                          border-[#C9A227]/20
                          bg-[#C9A227]/5
                          px-4
                          py-3
                        "
                      >
                        <Clock3
                          className="
                            h-4
                            w-4
                            shrink-0
                            text-[#C9A227]
                          "
                        />

                        <p
                          className="
                            text-xs
                            text-black/55
                          "
                        >
                          Término previsto:{" "}
                          <strong
                            className="
                              text-[#111]
                            "
                          >
                            {calculateEndTime(
                              appointmentTime,
                              currentService.duration_minutes
                            )}
                          </strong>
                        </p>
                      </div>
                    )}
                </FormSection>

                {/* ==================================================
                    OBSERVAÇÃO
                =================================================== */}

                <FormSection
                  number="05"
                  title="Observações"
                  optional
                >
                  <textarea
                    value={
                      notes
                    }
                    onChange={(
                      event
                    ) =>
                      setNotes(
                        event
                          .target
                          .value
                      )
                    }
                    rows={3}
                    placeholder="Informações importantes sobre o atendimento..."
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-black/10
                      bg-white
                      px-4
                      py-3
                      text-base
                      text-[#111]
                      outline-none
                      transition-all

                      placeholder:text-black/25

                      focus:border-[#C9A227]/60
                      focus:ring-2
                      focus:ring-[#C9A227]/10

                      sm:text-sm
                    "
                  />
                </FormSection>

                {/* ==================================================
                    ERRO
                =================================================== */}

                {error && (
                  <div
                    role="alert"
                    className="
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      px-4
                      py-3
                      text-sm
                      leading-6
                      text-red-700
                    "
                  >
                    {error}
                  </div>
                )}

                {/* ==================================================
                    SUCESSO
                =================================================== */}

                {success && (
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-green-200
                      bg-green-50
                      px-4
                      py-3
                      text-sm
                      text-green-700
                    "
                  >
                    <Check
                      className="
                        h-4
                        w-4
                        shrink-0
                      "
                    />

                    Agendamento criado
                    com sucesso.
                  </div>
                )}
              </>
            )}
          </div>

          {/* ==================================================
              FOOTER
          =================================================== */}

          {!loadingData && (
            <div
              className="
                flex
                shrink-0
                flex-col-reverse
                gap-3
                border-t
                border-black/10
                bg-white
                px-5
                pt-4
                pb-[calc(1rem+env(safe-area-inset-bottom))]

                sm:flex-row
                sm:justify-end
                sm:px-6
                sm:pb-4
              "
            >
              <button
                type="button"
                onClick={
                  handleClose
                }
                disabled={
                  loading
                }
                className="
                  min-h-11
                  rounded-xl
                  border
                  border-black/10
                  px-5
                  text-sm
                  font-medium
                  text-black/55
                  transition-colors

                  hover:bg-black/[0.03]

                  disabled:opacity-50
                "
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="
                  flex
                  min-h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#C9A227]
                  px-6
                  text-sm
                  font-semibold
                  text-black
                  transition-all

                  hover:bg-[#E0C56E]

                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading ? (
                  <>
                    <Loader2
                      className="
                        h-4
                        w-4
                        animate-spin
                      "
                    />

                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus
                      className="
                        h-4
                        w-4
                      "
                    />

                    Criar agendamento
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   FORM SECTION
============================================================ */

type FormSectionProps = {
  number: string;
  title: string;
  optional?: boolean;
  children: ReactNode;
};

function FormSection({
  number,
  title,
  optional = false,
  children,
}: FormSectionProps) {
  return (
    <section>
      <div
        className="
          mb-3
          flex
          items-center
          gap-2
        "
      >
        <span
          className="
            text-[9px]
            font-bold
            tracking-wider
            text-[#C9A227]
          "
        >
          {number}
        </span>

        <h3
          className="
            text-sm
            font-semibold
            text-[#111]
          "
        >
          {title}
        </h3>

        {optional && (
          <span
            className="
              text-[10px]
              text-black/30
            "
          >
            opcional
          </span>
        )}
      </div>

      {children}
    </section>
  );
}

/* ============================================================
   WRAPPERS
============================================================ */

type WrapperProps = {
  icon: ElementType;
  children: ReactNode;
};

function SelectWrapper({
  icon: Icon,
  children,
}: WrapperProps) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-xl
        border
        border-black/10
        bg-white
        transition-all

        focus-within:border-[#C9A227]/60
        focus-within:ring-2
        focus-within:ring-[#C9A227]/10
      "
    >
      <Icon
        className="
          pointer-events-none
          absolute
          left-4
          top-1/2
          z-10
          h-4
          w-4
          -translate-y-1/2
          text-black/30
        "
      />

      {children}

      <ChevronDown
        className="
          pointer-events-none
          absolute
          right-4
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-black/30
        "
      />
    </div>
  );
}

function InputWrapper({
  icon: Icon,
  children,
}: WrapperProps) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-xl
        border
        border-black/10
        bg-white
        transition-all

        focus-within:border-[#C9A227]/60
        focus-within:ring-2
        focus-within:ring-[#C9A227]/10
      "
    >
      <Icon
        className="
          pointer-events-none
          absolute
          left-4
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-black/30
        "
      />

      {children}
    </div>
  );
}

/* ============================================================
   HORÁRIO FINAL
============================================================ */

function calculateEndTime(
  startTime: string,
  durationMinutes: number
) {
  const [
    hours,
    minutes,
  ] =
    startTime
      .split(":")
      .map(
        Number
      );

  const totalMinutes =
    hours *
      60 +
    minutes +
    durationMinutes;

  const endHours =
    Math.floor(
      totalMinutes /
        60
    ) %
    24;

  const endMinutes =
    totalMinutes %
    60;

  return `${String(
    endHours
  ).padStart(
    2,
    "0"
  )}:${String(
    endMinutes
  ).padStart(
    2,
    "0"
  )}`;
}