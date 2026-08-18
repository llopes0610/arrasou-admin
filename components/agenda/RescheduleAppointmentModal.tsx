"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Clock3,
  Loader2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type RescheduleAppointmentModalProps = {
  open: boolean;

  appointmentId:
    | string
    | null;

  currentStartAt:
    | string
    | null;

  currentEndAt:
    | string
    | null;

  clientName:
    string;

  serviceName:
    string;

  onClose:
    () => void;

  onUpdated:
    () =>
      | void
      | Promise<void>;
};

export default function RescheduleAppointmentModal({
  open,
  appointmentId,
  currentStartAt,
  currentEndAt,
  clientName,
  serviceName,
  onClose,
  onUpdated,
}: RescheduleAppointmentModalProps) {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const [
    date,
    setDate,
  ] =
    useState("");

  const [
    time,
    setTime,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    if (
      !open ||
      !currentStartAt
    ) {
      return;
    }

    setDate(
      formatDateInput(
        currentStartAt
      )
    );

    setTime(
      formatTimeInput(
        currentStartAt
      )
    );

    setError("");
  }, [
    open,
    currentStartAt,
  ]);

  if (
    !open ||
    !appointmentId ||
    !currentStartAt ||
    !currentEndAt
  ) {
    return null;
  }

  async function handleSubmit(
  event:
    FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (
    !date ||
    !time
  ) {
    setError(
      "Informe a nova data e o novo horário."
    );

    return;
  }

  const startAt =
    currentStartAt;

  const endAt =
    currentEndAt;

  if (
    !startAt ||
    !endAt
  ) {
    setError(
      "Não foi possível identificar o horário atual do atendimento."
    );

    return;
  }

  const originalStart =
    new Date(
      startAt
    );

  const originalEnd =
    new Date(
      endAt
    );

  const durationMs =
    originalEnd.getTime() -
    originalStart.getTime();

  if (
    !Number.isFinite(
      durationMs
    ) ||
    durationMs <= 0
  ) {
    setError(
      "Não foi possível identificar a duração do atendimento."
    );

    return;
  }

  const newStart =
    new Date(
      `${date}T${time}:00-03:00`
    );

  if (
    Number.isNaN(
      newStart.getTime()
    )
  ) {
    setError(
      "Data ou horário inválido."
    );

    return;
  }

  const newEnd =
    new Date(
      newStart.getTime() +
      durationMs
    );

  setLoading(
    true
  );

  setError("");

  try {
    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          "appointments"
        )
        .update({
          start_at:
            newStart.toISOString(),

          end_at:
            newEnd.toISOString(),

          status:
            "scheduled",
        })
        .eq(
          "id",
          appointmentId
        );

    if (
      updateError
    ) {
      throw updateError;
    }

    await onUpdated();

    onClose();
  } catch (
    updateError
  ) {
    console.error(
      "Erro ao remarcar atendimento:",
      updateError
    );

    setError(
      "Não foi possível remarcar o atendimento."
    );
  } finally {
    setLoading(
      false
    );
  }
}

  function handleBackdropClose() {
    if (
      loading
    ) {
      return;
    }

    onClose();
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[130]
        flex
        items-end
        justify-center
        bg-black/60
        backdrop-blur-sm

        sm:items-center
        sm:p-4
      "
      onClick={
        handleBackdropClose
      }
    >
      <div
        className="
          w-full
          overflow-hidden
          rounded-t-[1.5rem]
          bg-white
          shadow-2xl

          sm:max-w-lg
          sm:rounded-2xl
        "
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <div
          className="
            flex
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
                tracking-[0.22em]
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
              Remarcar atendimento
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Escolha a nova data e o novo horário.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleBackdropClose
            }
            disabled={
              loading
            }
            aria-label="Fechar"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-black/10
              text-black/40

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

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div
            className="
              space-y-5
              p-5

              sm:p-6
            "
          >
            {/* RESUMO */}

            <div
              className="
                rounded-2xl
                bg-[#FAFAF8]
                p-4
              "
            >
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-black/35
                "
              >
                Atendimento
              </p>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  text-[#111]
                "
              >
                {clientName}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-black/45
                "
              >
                {serviceName}
              </p>

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  gap-x-4
                  gap-y-2
                  border-t
                  border-black/[0.06]
                  pt-3
                  text-xs
                  text-black/45
                "
              >
                <span>
                  Atual:{" "}
                  {formatCurrentDateTime(
                    currentStartAt
                  )}
                </span>

                <span>
                  Duração:{" "}
                  {formatDuration(
                    currentStartAt,
                    currentEndAt
                  )}
                </span>
              </div>
            </div>

            {/* NOVA DATA */}

            <div>
              <label
                htmlFor="reschedule-date"
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-semibold
                  text-[#111]
                "
              >
                <CalendarDays
                  className="
                    h-4
                    w-4
                    text-[#C9A227]
                  "
                />

                Nova data
              </label>

              <input
                id="reschedule-date"
                type="date"
                value={
                  date
                }
                onChange={(
                  event
                ) =>
                  setDate(
                    event.target.value
                  )
                }
                required
                className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-black/10
                  bg-white
                  px-4
                  text-base
                  text-[#111]
                  outline-none

                  focus:border-[#C9A227]/60
                  focus:ring-2
                  focus:ring-[#C9A227]/10

                  sm:text-sm
                "
              />
            </div>

            {/* NOVO HORÁRIO */}

            <div>
              <label
                htmlFor="reschedule-time"
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-semibold
                  text-[#111]
                "
              >
                <Clock3
                  className="
                    h-4
                    w-4
                    text-[#C9A227]
                  "
                />

                Novo horário
              </label>

              <input
                id="reschedule-time"
                type="time"
                value={
                  time
                }
                onChange={(
                  event
                ) =>
                  setTime(
                    event.target.value
                  )
                }
                required
                step="300"
                className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-black/10
                  bg-white
                  px-4
                  text-base
                  text-[#111]
                  outline-none

                  focus:border-[#C9A227]/60
                  focus:ring-2
                  focus:ring-[#C9A227]/10

                  sm:text-sm
                "
              />
            </div>

            <div
              className="
                rounded-xl
                border
                border-[#C9A227]/20
                bg-[#C9A227]/5
                px-4
                py-3
                text-xs
                leading-5
                text-black/50
              "
            >
              A duração atual será preservada automaticamente.
              Após a remarcação, o status voltará para
              <strong className="text-[#111]"> Agendado</strong>.
            </div>

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
                  text-red-700
                "
              >
                {error}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              border-t
              border-black/10
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
                handleBackdropClose
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
                text-black/50

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

                hover:bg-[#E0C56E]

                disabled:opacity-60
              "
            >
              {loading && (
                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
                  "
                />
              )}

              Confirmar remarcação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDateInput(
  value: string
) {
  return new Intl.DateTimeFormat(
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
  ).format(
    new Date(
      value
    )
  );
}

function formatTimeInput(
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

function formatCurrentDateTime(
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

function formatDuration(
  startAt: string,
  endAt: string
) {
  const start =
    new Date(
      startAt
    );

  const end =
    new Date(
      endAt
    );

  const minutes =
    Math.round(
      (
        end.getTime() -
        start.getTime()
      ) /
      60000
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

  const remainingMinutes =
    minutes %
    60;

  if (
    remainingMinutes ===
    0
  ) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}