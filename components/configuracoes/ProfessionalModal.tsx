"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Check,
  Loader2,
  Mail,
  Percent,
  Phone,
  UserRound,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  ProfessionalItem,
} from "@/app/(admin)/configuracoes/page";

export default function ProfessionalModal({
  open,
  professional,
  onClose,
}: {
  open:
    boolean;

  professional:
    ProfessionalItem | null;

  onClose:
    () => void;
}) {
  const router =
    useRouter();

  const editing =
    Boolean(
      professional
    );

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    commission,
    setCommission,
  ] =
    useState("0");

  const [
    active,
    setActive,
  ] =
    useState(true);

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
    useState("");

  /*
   * ==========================================================
   * CARREGAR
   * ==========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setSuccess("");

    if (
      professional
    ) {
      setName(
        professional.display_name
      );

      setPhone(
        professional.phone ??
          ""
      );

      setCommission(
        String(
          professional.default_commission_percentage
        )
      );

      setActive(
        professional.active
      );

      setEmail("");
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setCommission("0");
      setActive(true);
    }
  }, [
    open,
    professional,
  ]);

  /*
   * ==========================================================
   * SALVAR
   * ==========================================================
   */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericCommission =
      Number(
        commission
      );

    if (
      !name.trim()
    ) {
      setError(
        "Informe o nome."
      );

      return;
    }

    if (
      Number.isNaN(
        numericCommission
      ) ||
      numericCommission <
        0 ||
      numericCommission >
        100
    ) {
      setError(
        "A comissão deve estar entre 0 e 100%."
      );

      return;
    }

    if (
      !editing &&
      !email.trim()
    ) {
      setError(
        "Informe o e-mail de acesso."
      );

      return;
    }

    if (
      !editing &&
      password.length <
        6
    ) {
      setError(
        "A senha deve possuir pelo menos 6 caracteres."
      );

      return;
    }

    setLoading(
      true
    );

    try {
      const endpoint =
        editing
          ? `/api/professionals/${professional!.id}`
          : "/api/professionals";

      const response =
        await fetch(
          endpoint,
          {
            method:
              editing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

                email:
                  email
                    .trim()
                    .toLowerCase(),

                password,

                phone:
                  phone.trim(),

                defaultCommission:
                  numericCommission,

                active,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ??
            "Erro ao salvar profissional."
        );
      }

      setSuccess(
        editing
          ? "Profissional atualizada com sucesso."
          : "Profissional criada com sucesso."
      );

      router.refresh();

      await new Promise(
        (
          resolve
        ) =>
          setTimeout(
            resolve,
            600
          )
      );

      onClose();
    } catch (
      saveError
    ) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  if (!open) {
    return null;
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
        bg-black/55
        backdrop-blur-sm

        sm:items-center
        sm:p-4
      "
      onClick={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-xl
          overflow-hidden
          rounded-t-3xl
          bg-white
          shadow-2xl

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
                tracking-[0.2em]
                text-[#C9A227]
              "
            >
              Equipe
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
              {editing
                ? "Editar profissional"
                : "Nova profissional"}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              loading
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
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
              max-h-[70vh]
              space-y-5
              overflow-y-auto
              p-5

              sm:p-6
            "
          >
            <Field
              label="Nome"
              icon={
                UserRound
              }
            >
              <input
                type="text"
                value={
                  name
                }
                onChange={(
                  event
                ) =>
                  setName(
                    event
                      .target
                      .value
                  )
                }
                className={
                  inputClass
                }
                placeholder="Nome da profissional"
              />
            </Field>

            {!editing && (
              <>
                <Field
                  label="E-mail de acesso"
                  icon={
                    Mail
                  }
                >
                  <input
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event
                          .target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                    placeholder="profissional@email.com"
                  />
                </Field>

                <Field
                  label="Senha inicial"
                  icon={
                    UserRound
                  }
                >
                  <input
                    type="password"
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event
                          .target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                    placeholder="Mínimo 6 caracteres"
                  />
                </Field>
              </>
            )}

            <Field
              label="Telefone"
              icon={
                Phone
              }
            >
              <input
                type="tel"
                value={
                  phone
                }
                onChange={(
                  event
                ) =>
                  setPhone(
                    event
                      .target
                      .value
                  )
                }
                className={
                  inputClass
                }
                placeholder="(13) 99999-9999"
              />
            </Field>

            <Field
              label="Comissão padrão (%)"
              icon={
                Percent
              }
            >
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={
                  commission
                }
                onChange={(
                  event
                ) =>
                  setCommission(
                    event
                      .target
                      .value
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            {editing && (
              <label
                className="
                  flex
                  cursor-pointer
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-black/10
                  p-4
                "
              >
                <div>
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-[#111]
                    "
                  >
                    Profissional ativa
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-black/40
                    "
                  >
                    Quando inativa, não
                    poderá operar normalmente
                    no sistema.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    active
                  }
                  onChange={(
                    event
                  ) =>
                    setActive(
                      event
                        .target
                        .checked
                    )
                  }
                  className="
                    h-5
                    w-5
                    accent-[#C9A227]
                  "
                />
              </label>
            )}

            {error && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
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
                  p-4
                  text-sm
                  text-green-700
                "
              >
                <Check
                  className="
                    h-4
                    w-4
                  "
                />

                {success}
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
              p-4

              sm:flex-row
              sm:justify-end
              sm:px-6
            "
          >
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                loading
              }
              className="
                h-11
                rounded-xl
                border
                border-black/10
                px-5
                text-sm
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
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#C9A227]
                px-6
                text-sm
                font-semibold
                text-black

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
                editing
                  ? "Salvar alterações"
                  : "Criar profissional"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label:
    string;

  icon:
    React.ElementType;

  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-xs
          font-semibold
          text-black/50
        "
      >
        {label}
      </label>

      <div
        className="
          relative
          overflow-hidden
          rounded-xl
          border
          border-black/10

          focus-within:border-[#C9A227]/60
          focus-within:ring-2
          focus-within:ring-[#C9A227]/10
        "
      >
        <Icon
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

        {children}
      </div>
    </div>
  );
}

const inputClass = `
  h-12
  w-full
  bg-transparent
  pl-11
  pr-4
  text-sm
  text-[#111]
  outline-none
  placeholder:text-black/25
`;