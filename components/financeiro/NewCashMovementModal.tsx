"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import type {
  CashResponsibleUser,
} from "@/app/(admin)/financeiro/movimentacoes/page";

type NewCashMovementModalProps = {
  open: boolean;

  responsibleUsers:
    CashResponsibleUser[];

  currentUserId:
    string;

  onClose:
    () => void;
};

export default function NewCashMovementModal({
  open,
  responsibleUsers,
  currentUserId,
  onClose,
}: NewCashMovementModalProps) {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const [
    type,
    setType,
  ] =
    useState<
      "expense" |
      "withdrawal" |
      "income"
    >(
      "expense"
    );

  const [
    category,
    setCategory,
  ] =
    useState(
      "material"
    );

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    amount,
    setAmount,
  ] =
    useState("");

  const [
    movementDate,
    setMovementDate,
  ] =
    useState(
      getToday()
    );

  const [
    responsibleUserId,
    setResponsibleUserId,
  ] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState("pix");

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

    const parsedAmount =
      Number(
        amount.replace(
          ",",
          "."
        )
      );

    if (
      !description.trim()
    ) {
      setError(
        "Informe a descrição."
      );

      return;
    }

    if (
      !parsedAmount ||
      parsedAmount <= 0
    ) {
      setError(
        "Informe um valor válido."
      );

      return;
    }

    setLoading(
      true
    );

    try {
      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "cash_movements"
          )
          .insert({
            type,

            category,

            description:
              description.trim(),

            amount:
              parsedAmount,

            movement_date:
              movementDate,

            responsible_user_id:
              responsibleUserId ||
              null,

            payment_method:
              paymentMethod,

            notes:
              notes.trim() ||
              null,

            created_by:
              currentUserId,
          });

      if (
        insertError
      ) {
        console.error(
          "Erro ao registrar movimentação:",
          insertError
        );

        setError(
          insertError.message
        );

        return;
      }

      onClose();

      router.refresh();
    } catch (
      exception
    ) {
      console.error(
        "Erro inesperado:",
        exception
      );

      setError(
        "Não foi possível registrar a movimentação."
      );
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
          max-h-[94dvh]
          w-full
          overflow-y-auto
          rounded-t-[1.5rem]
          bg-white

          sm:max-w-xl
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
              Caixa
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
              Nova movimentação
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
            <Field label="Tipo">
              <select
                value={
                  type
                }
                onChange={(
                  event
                ) =>
                  setType(
                    event.target
                      .value as typeof type
                  )
                }
                className={inputClass}
              >
                <option value="expense">
                  Despesa
                </option>

                <option value="withdrawal">
                  Retirada / Sangria
                </option>

                <option value="income">
                  Entrada manual
                </option>
              </select>
            </Field>

            <Field label="Categoria">
              <select
                value={
                  category
                }
                onChange={(
                  event
                ) =>
                  setCategory(
                    event
                      .target
                      .value
                  )
                }
                className={inputClass}
              >
                <option value="material">
                  Material
                </option>

                <option value="aluguel">
                  Aluguel
                </option>

                <option value="energia">
                  Energia
                </option>

                <option value="internet">
                  Internet
                </option>

                <option value="marketing">
                  Marketing
                </option>

                <option value="manutencao">
                  Manutenção
                </option>

                <option value="sangria">
                  Sangria
                </option>

                <option value="outros">
                  Outros
                </option>
              </select>
            </Field>

            <Field label="Descrição">
              <input
                value={
                  description
                }
                onChange={(
                  event
                ) =>
                  setDescription(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Ex.: Compra de pigmentos"
                className={inputClass}
              />
            </Field>

            <div
              className="
                grid
                gap-4

                sm:grid-cols-2
              "
            >
              <Field label="Valor">
                <input
                  inputMode="decimal"
                  value={
                    amount
                  }
                  onChange={(
                    event
                  ) =>
                    setAmount(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="0,00"
                  className={inputClass}
                />
              </Field>

              <Field label="Data">
                <input
                  type="date"
                  value={
                    movementDate
                  }
                  onChange={(
                    event
                  ) =>
                    setMovementDate(
                      event
                        .target
                        .value
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Responsável">
              <select
                value={
                  responsibleUserId
                }
                onChange={(
                  event
                ) =>
                  setResponsibleUserId(
                    event
                      .target
                      .value
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Não informar
                </option>

                {responsibleUsers.map(
                  (
                    user
                  ) => (
                    <option
                      key={
                        user.id
                      }
                      value={
                        user.id
                      }
                    >
                      {user.full_name ??
                        "Usuário"}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Forma de pagamento">
              <select
                value={
                  paymentMethod
                }
                onChange={(
                  event
                ) =>
                  setPaymentMethod(
                    event
                      .target
                      .value
                  )
                }
                className={inputClass}
              >
                <option value="pix">
                  PIX
                </option>

                <option value="cash">
                  Dinheiro
                </option>

                <option value="credit_card">
                  Crédito
                </option>

                <option value="debit_card">
                  Débito
                </option>

                <option value="bank_transfer">
                  Transferência
                </option>

                <option value="other">
                  Outro
                </option>
              </select>
            </Field>

            <Field label="Observações">
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
                className={inputClass}
              />
            </Field>

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

              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass = `
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
`;

function Field({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <label>
      <span
        className="
          mb-2
          block
          text-xs
          font-semibold
          text-[#111]
        "
      >
        {label}
      </span>

      {children}
    </label>
  );
}

function getToday() {
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
    new Date()
  );
}