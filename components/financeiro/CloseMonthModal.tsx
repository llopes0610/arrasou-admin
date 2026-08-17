"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  LockKeyhole,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import type {
  MonthlyClosingPreview,
} from "@/app/(admin)/financeiro/fechamento/page";

type CloseMonthModalProps = {
  open: boolean;

  preview:
    MonthlyClosingPreview;

  onClose:
    () => void;

  onCreated:
    () => void;
};

export default function CloseMonthModal({
  open,
  preview,
  onClose,
  onCreated,
}: CloseMonthModalProps) {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

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

  if (!open) {
    return null;
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(
      true
    );

    try {
      const {
        error:
          rpcError,
      } =
        await supabase.rpc(
          "create_monthly_closing",
          {
            p_month:
              preview.monthStart,

            p_notes:
              notes.trim() ||
              null,
          }
        );

      if (
        rpcError
      ) {
        console.error(
          "Erro ao fechar mês:",
          rpcError
        );

        setError(
          rpcError.message
        );

        return;
      }

      onCreated();
    } finally {
      setLoading(
        false
      );
    }
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
        onClose
      }
    >
      <div
        className="
          w-full
          rounded-t-[1.5rem]
          bg-white

          sm:max-w-lg
          sm:rounded-2xl
        "
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <div
          className="
            flex
            items-start
            justify-between
            border-b
            border-black/10
            p-5

            sm:p-6
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#C9A227]
              "
            >
              Financeiro
            </p>

            <h2
              className="
                mt-1
                font-serif
                text-2xl
                font-semibold
                text-[#111]
              "
            >
              Fechar mês
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-black/10
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
              space-y-5
              p-5

              sm:p-6
            "
          >
            <div
              className="
                rounded-2xl
                bg-[#111]
                p-5
                text-white
              "
            >
              <LockKeyhole
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
                  uppercase
                  tracking-wider
                  text-white/35
                "
              >
                Resultado líquido
              </p>

              <p
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-[#C9A227]
                "
              >
                {
                  formatCurrency(
                    preview.netResult
                  )
                }
              </p>
            </div>

            <p
              className="
                text-sm
                leading-6
                text-black/50
              "
            >
              Ao fechar o mês, os valores
              atuais serão gravados como
              histórico do período.
            </p>

            <div>
              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  text-[#111]
                "
              >
                Observação
              </label>

              <textarea
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
                placeholder="Opcional"
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-black/10
                  p-4
                  text-sm
                  outline-none
                "
              />
            </div>

            {error && (
              <div
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

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              border-t
              border-black/10
              p-5

              sm:flex-row
              sm:justify-end
              sm:p-6
            "
          >
            <button
              type="button"
              onClick={
                onClose
              }
              className="
                min-h-11
                rounded-xl
                border
                border-black/10
                px-5
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

                disabled:opacity-50
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

              Confirmar fechamento
            </button>
          </div>
        </form>
      </div>
    </div>
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