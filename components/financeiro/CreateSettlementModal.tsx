"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import type {
  PendingProfessionalCommission,
} from "@/app/(admin)/financeiro/page";

type CreateSettlementModalProps = {
  open: boolean;

  commission:
    | PendingProfessionalCommission
    | null;

  onClose: () => void;

  onCreated: () =>
    | void
    | Promise<void>;
};

export default function CreateSettlementModal({
  open,
  commission,
  onClose,
  onCreated,
}: CreateSettlementModalProps) {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const [
    periodStart,
    setPeriodStart,
  ] =
    useState("");

  const [
    periodEnd,
    setPeriodEnd,
  ] =
    useState("");

  const [
    notes,
    setNotes,
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

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /*
   * ==========================================================
   * PREENCHER PERÍODO
   * ==========================================================
   */

  useEffect(() => {
    if (
      !open ||
      !commission
    ) {
      return;
    }

    setPeriodStart(
      toDateInput(
        commission.oldest_entry_at
      )
    );

    setPeriodEnd(
      toDateInput(
        commission.newest_entry_at
      )
    );

    setNotes("");
    setError("");
    setSuccess(false);
  }, [
    open,
    commission,
  ]);

  /*
   * ==========================================================
   * FECHAR
   * ==========================================================
   */

  function handleClose() {
    if (loading) {
      return;
    }

    onClose();
  }

  /*
   * ==========================================================
   * CRIAR FECHAMENTO
   * ==========================================================
   */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!commission) {
      return;
    }

    setError("");
    setSuccess(false);

    if (
      !periodStart ||
      !periodEnd
    ) {
      setError(
        "Informe o período do fechamento."
      );

      return;
    }

    if (
      periodEnd <
      periodStart
    ) {
      setError(
        "A data final não pode ser anterior à data inicial."
      );

      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error:
          rpcError,
      } =
        await supabase.rpc(
          "create_commission_settlement",
          {
            p_professional_id:
              commission.professional_id,

            p_period_start:
              periodStart,

            p_period_end:
              periodEnd,

            p_notes:
              notes.trim() ||
              null,
          }
        );

      if (rpcError) {
        console.error(
          "Erro ao criar fechamento:",
          rpcError
        );

        setError(
          getSettlementError(
            rpcError.message
          )
        );

        return;
      }

      if (!data) {
        setError(
          "O fechamento não foi criado."
        );

        return;
      }

      setSuccess(true);

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            450
          )
      );

      await onCreated();
    } catch (
      exception
    ) {
      console.error(
        "Erro inesperado ao criar fechamento:",
        exception
      );

      setError(
        "Não foi possível criar o fechamento."
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    !open ||
    !commission
  ) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[120]
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
          max-h-[94dvh]
          w-full
          overflow-y-auto
          rounded-t-[1.5rem]
          bg-white
          shadow-2xl

          sm:max-w-xl
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
                tracking-[0.2em]
                text-[#C9A227]
              "
            >
              Financeiro
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
              Criar fechamento
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Revise o período antes de
              confirmar.
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
              text-black/40

              hover:bg-black/[0.03]

              disabled:opacity-50
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div
            className="
              space-y-6
              p-5

              sm:p-6
            "
          >
            {/* PROFISSIONAL */}

            <div
              className="
                flex
                items-center
                gap-3
                rounded-xl
                bg-[#FAFAF8]
                p-4
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
                    text-[9px]
                    uppercase
                    tracking-wider
                    text-black/35
                  "
                >
                  Profissional
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
                    commission.professional_name
                  }
                </p>
              </div>
            </div>

            {/* PERÍODO */}

            <div>
              <div
                className="
                  mb-3
                  flex
                  items-center
                  gap-2
                "
              >
                <CalendarDays
                  className="
                    h-4
                    w-4
                    text-[#C9A227]
                  "
                />

                <p
                  className="
                    text-sm
                    font-semibold
                    text-[#111]
                  "
                >
                  Período
                </p>
              </div>

              <div
                className="
                  grid
                  gap-3

                  sm:grid-cols-2
                "
              >
                <DateField
                  label="De"
                  value={
                    periodStart
                  }
                  onChange={
                    setPeriodStart
                  }
                />

                <DateField
                  label="Até"
                  value={
                    periodEnd
                  }
                  onChange={
                    setPeriodEnd
                  }
                />
              </div>
            </div>

            {/* RESUMO */}

            <div
              className="
                rounded-2xl
                bg-[#111]
                p-5
                text-white
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <WalletCards
                  className="
                    h-4
                    w-4
                    text-[#C9A227]
                  "
                />

                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.16em]
                    text-white/40
                  "
                >
                  Resumo atual
                </p>
              </div>

              <div
                className="
                  mt-4
                  grid
                  grid-cols-3
                  gap-2
                "
              >
                <Metric
                  label="Produção"
                  value={
                    formatCurrency(
                      Number(
                        commission.gross_amount
                      )
                    )
                  }
                />

                <Metric
                  label="Comissão"
                  value={
                    formatCurrency(
                      Number(
                        commission.commission_amount
                      )
                    )
                  }
                />

                <Metric
                  label="Studio"
                  value={
                    formatCurrency(
                      Number(
                        commission.studio_amount
                      )
                    )
                  }
                  gold
                />
              </div>

              <p
                className="
                  mt-4
                  text-[10px]
                  leading-5
                  text-white/35
                "
              >
                O valor definitivo será
                recalculado pelo banco
                conforme o período
                selecionado.
              </p>
            </div>

            {/* OBSERVAÇÃO */}

            <div>
              <label
                htmlFor="settlement-notes"
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-[#111]
                "
              >
                Observação
                <span
                  className="
                    ml-1
                    font-normal
                    text-black/30
                  "
                >
                  opcional
                </span>
              </label>

              <textarea
                id="settlement-notes"
                value={
                  notes
                }
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Ex.: fechamento primeira quinzena de agosto"
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
                  outline-none

                  focus:border-[#C9A227]/60
                  focus:ring-2
                  focus:ring-[#C9A227]/10

                  sm:text-sm
                "
              />
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

            {success && (
              <div
                className="
                  flex
                  items-center
                  gap-2
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
                <CheckCircle2
                  className="
                    h-4
                    w-4
                  "
                />

                Fechamento criado com sucesso.
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
              {loading ? (
                <>
                  <Loader2
                    className="
                      h-4
                      w-4
                      animate-spin
                    "
                  />

                  Criando...
                </>
              ) : (
                "Criar fechamento"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label>
      <span
        className="
          mb-2
          block
          text-[10px]
          font-semibold
          uppercase
          tracking-wider
          text-black/35
        "
      >
        {label}
      </span>

      <input
        type="date"
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
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
          outline-none

          focus:border-[#C9A227]/60
          focus:ring-2
          focus:ring-[#C9A227]/10

          sm:text-sm
        "
      />
    </label>
  );
}

function Metric({
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

function toDateInput(
  value:
    | string
    | null
) {
  if (!value) {
    return "";
  }

  const formatter =
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
    );

  return formatter.format(
    new Date(
      value
    )
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

function getSettlementError(
  message: string
) {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "não existem lançamentos"
    )
  ) {
    return "Não existem lançamentos pendentes nesse período.";
  }

  if (
    normalized.includes(
      "não possui comissão"
    )
  ) {
    return "Essa profissional não possui comissão a pagar nesse período.";
  }

  if (
    normalized.includes(
      "período final"
    )
  ) {
    return "Confira as datas informadas.";
  }

  if (
    normalized.includes(
      "acesso negado"
    )
  ) {
    return "Seu usuário não possui permissão para criar fechamentos.";
  }

  return "Não foi possível criar o fechamento.";
}