"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Clock3,
  CircleDollarSign,
  Loader2,
  Percent,
  Plus,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import type {
  ProfessionalItem,
  ProfessionalServiceLink,
  ServiceItem,
} from "./ServicesManager";

type ServiceModalProps = {
  open: boolean;

  service:
    ServiceItem | null;

  professionals:
    ProfessionalItem[];

  links:
    ProfessionalServiceLink[];

  onClose:
    () => void;
};

type ProfessionalConfiguration = {
  selected: boolean;

  commission: string;
};

export default function ServiceModal({
  open,
  service,
  professionals,
  links,
  onClose,
}: ServiceModalProps) {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState("");

  const [
    price,
    setPrice,
  ] =
    useState("");

  const [
    duration,
    setDuration,
  ] =
    useState("");

  const [
    active,
    setActive,
  ] =
    useState(true);

  const [
    professionalConfig,
    setProfessionalConfig,
  ] =
    useState<
      Record<
        string,
        ProfessionalConfiguration
      >
    >({});

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

  const editing =
    Boolean(
      service
    );

  /*
   * ==========================================================
   * CARREGAR FORMULÁRIO
   * ==========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setSuccess("");

    if (service) {
      setName(
        service.name
      );

      setDescription(
        service.description ??
          ""
      );

      setCategory(
        service.category ??
          ""
      );

      setPrice(
        String(
          service.price
        )
      );

      setDuration(
        String(
          service.duration_minutes
        )
      );

      setActive(
        service.active
      );
    } else {
      setName("");
      setDescription("");
      setCategory("");
      setPrice("");
      setDuration("");
      setActive(true);
    }

    /*
     * Configuração por profissional.
     */
    const config:
      Record<
        string,
        ProfessionalConfiguration
      > = {};

    professionals.forEach(
      (
        professional
      ) => {
        const existingLink =
          service
            ? links.find(
                (link) =>
                  link.service_id ===
                    service.id &&
                  link.professional_id ===
                    professional.id
              )
            : null;

        config[
          professional.id
        ] = {
          selected:
            Boolean(
              existingLink?.active
            ),

          commission:
            existingLink
              ? String(
                  existingLink.commission_percentage
                )
              : "0",
        };
      }
    );

    setProfessionalConfig(
      config
    );
  }, [
    open,
    service,
    professionals,
    links,
  ]);

  /*
   * ==========================================================
   * CONFIG PROFISSIONAL
   * ==========================================================
   */

  function toggleProfessional(
    professionalId: string
  ) {
    setProfessionalConfig(
      (
        current
      ) => ({
        ...current,

        [professionalId]: {
          selected:
            !current[
              professionalId
            ]?.selected,

          commission:
            current[
              professionalId
            ]?.commission ??
            "0",
        },
      })
    );
  }

  function updateCommission(
    professionalId: string,
    commission: string
  ) {
    setProfessionalConfig(
      (
        current
      ) => ({
        ...current,

        [professionalId]: {
          selected:
            current[
              professionalId
            ]?.selected ??
            true,

          commission,
        },
      })
    );
  }

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

    /*
     * Validações.
     */
    if (
      !name.trim()
    ) {
      setError(
        "Informe o nome do serviço."
      );

      return;
    }

    const numericPrice =
      Number(
        price
          .replace(
            ",",
            "."
          )
      );

    if (
      Number.isNaN(
        numericPrice
      ) ||
      numericPrice <
        0
    ) {
      setError(
        "Informe um valor válido."
      );

      return;
    }

    const numericDuration =
      Number(
        duration
      );

    if (
      !Number.isInteger(
        numericDuration
      ) ||
      numericDuration <=
        0
    ) {
      setError(
        "Informe uma duração válida."
      );

      return;
    }

    /*
     * Pelo menos uma profissional.
     */
    const selectedProfessionals =
      professionals.filter(
        (
          professional
        ) =>
          professionalConfig[
            professional.id
          ]?.selected
      );

    if (
      selectedProfessionals.length ===
      0
    ) {
      setError(
        "Vincule pelo menos uma profissional ao serviço."
      );

      return;
    }

    /*
     * Validar comissões.
     */
    for (
      const professional
      of selectedProfessionals
    ) {
      const commission =
        Number(
          professionalConfig[
            professional.id
          ].commission
            .replace(
              ",",
              "."
            )
        );

      if (
        Number.isNaN(
          commission
        ) ||
        commission <
          0 ||
        commission >
          100
      ) {
        setError(
          `A comissão de ${professional.display_name} deve estar entre 0% e 100%.`
        );

        return;
      }
    }

    setLoading(
      true
    );

    try {
      let serviceId =
        service?.id;

      /*
       * ======================================================
       * EDITAR SERVIÇO
       * ======================================================
       */

      if (
        serviceId
      ) {
        const {
          error:
            serviceError,
        } =
          await supabase
            .from(
              "services"
            )
            .update({
              name:
                name.trim(),

              description:
                description.trim() ||
                null,

              category:
                category.trim() ||
                null,

              price:
                numericPrice,

              duration_minutes:
                numericDuration,

              active,
            })
            .eq(
              "id",
              serviceId
            );

        if (
          serviceError
        ) {
          throw serviceError;
        }
      }

      /*
       * ======================================================
       * NOVO SERVIÇO
       * ======================================================
       */

      else {
        const {
          data:
            createdService,

          error:
            serviceError,
        } =
          await supabase
            .from(
              "services"
            )
            .insert({
              name:
                name.trim(),

              description:
                description.trim() ||
                null,

              category:
                category.trim() ||
                null,

              price:
                numericPrice,

              duration_minutes:
                numericDuration,

              active,
            })
            .select(
              "id"
            )
            .single();

        if (
          serviceError
        ) {
          throw serviceError;
        }

        serviceId =
          createdService.id;
      }

      if (
        !serviceId
      ) {
        throw new Error(
          "ID do serviço não identificado."
        );
      }

      /*
       * ======================================================
       * VÍNCULOS ATIVOS
       * ======================================================
       */

      const activeLinks =
        selectedProfessionals.map(
          (
            professional
          ) => ({
            professional_id:
              professional.id,

            service_id:
              serviceId,

            commission_percentage:
              Number(
                professionalConfig[
                  professional.id
                ].commission.replace(
                  ",",
                  "."
                )
              ),

            active:
              true,
          })
        );

      const {
        error:
          upsertError,
      } =
        await supabase
          .from(
            "professional_services"
          )
          .upsert(
            activeLinks,
            {
              onConflict:
                "professional_id,service_id",
            }
          );

      if (
        upsertError
      ) {
        throw upsertError;
      }

      /*
       * ======================================================
       * VÍNCULOS REMOVIDOS
       *
       * Não apagamos.
       * Apenas marcamos como inativos.
       * ======================================================
       */

      const deselectedIds =
        professionals
          .filter(
            (
              professional
            ) =>
              !professionalConfig[
                professional.id
              ]?.selected
          )
          .map(
            (
              professional
            ) =>
              professional.id
          );

      if (
        deselectedIds.length >
        0
      ) {
        const {
          error:
            deactivateError,
        } =
          await supabase
            .from(
              "professional_services"
            )
            .update({
              active:
                false,
            })
            .eq(
              "service_id",
              serviceId
            )
            .in(
              "professional_id",
              deselectedIds
            );

        if (
          deactivateError
        ) {
          throw deactivateError;
        }
      }

      setSuccess(
        editing
          ? "Serviço atualizado com sucesso."
          : "Serviço criado com sucesso."
      );

      /*
       * Atualiza Server Components.
       */
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
        "Erro ao salvar serviço:",
        saveError
      );

      setError(
        "Não foi possível salvar o serviço. Verifique os dados e tente novamente."
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
        z-[120]
        flex
        items-end
        justify-center
        bg-black/55
        backdrop-blur-sm

        sm:items-center
        sm:p-4
      "
      onClick={() => {
        if (
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[94vh]
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
        {/* HEADER */}

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
                tracking-[0.22em]
                text-[#C9A227]
              "
            >
              Serviços
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
                ? "Editar serviço"
                : "Novo serviço"}
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Configure procedimento,
              preço e profissionais.
            </p>
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
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-black/10
              text-black/45

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

        {/* FORM */}

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
            {/* DADOS */}

            <FormSection
              number="01"
              title="Informações do serviço"
            >
              <div
                className="
                  grid
                  gap-3
                "
              >
                <InputField
                  label="Nome"
                  icon={
                    WandSparkles
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
                    placeholder="Ex: Micropigmentação"
                    required
                    className={inputClass}
                  />
                </InputField>

                <div
                  className="
                    grid
                    gap-3

                    sm:grid-cols-2
                  "
                >
                  <InputField
                    label="Categoria"
                    icon={
                      WandSparkles
                    }
                  >
                    <input
                      type="text"
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
                      placeholder="Ex: Sobrancelhas"
                      className={inputClass}
                    />
                  </InputField>

                  <div
                    className="
                      flex
                      items-end
                    "
                  >
                    <label
                      className="
                        flex
                        h-12
                        w-full
                        cursor-pointer
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-black/10
                        px-4
                      "
                    >
                      <div>
                        <p
                          className="
                            text-xs
                            font-semibold
                            text-[#111]
                          "
                        >
                          Serviço ativo
                        </p>

                        <p
                          className="
                            text-[10px]
                            text-black/35
                          "
                        >
                          Disponível para agenda
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
                          h-4
                          w-4
                          accent-[#C9A227]
                        "
                      />
                    </label>
                  </div>
                </div>

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
                    Descrição
                  </label>

                  <textarea
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
                    rows={3}
                    placeholder="Descrição do procedimento..."
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-black/10
                      px-4
                      py-3
                      text-sm
                      text-[#111]
                      outline-none

                      placeholder:text-black/25

                      focus:border-[#C9A227]/60
                      focus:ring-2
                      focus:ring-[#C9A227]/10
                    "
                  />
                </div>
              </div>
            </FormSection>

            {/* PREÇO / DURAÇÃO */}

            <FormSection
              number="02"
              title="Preço e duração"
            >
              <div
                className="
                  grid
                  gap-3

                  sm:grid-cols-2
                "
              >
                <InputField
                  label="Valor"
                  icon={
                    CircleDollarSign
                  }
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      price
                    }
                    onChange={(
                      event
                    ) =>
                      setPrice(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="0,00"
                    required
                    className={inputClass}
                  />
                </InputField>

                <InputField
                  label="Duração em minutos"
                  icon={
                    Clock3
                  }
                >
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      duration
                    }
                    onChange={(
                      event
                    ) =>
                      setDuration(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="60"
                    required
                    className={inputClass}
                  />
                </InputField>
              </div>
            </FormSection>

            {/* PROFISSIONAIS */}

            <FormSection
              number="03"
              title="Profissionais e comissão"
            >
              <p
                className="
                  mb-4
                  text-xs
                  leading-5
                  text-black/40
                "
              >
                Selecione quem realiza
                este serviço e informe
                quanto a profissional
                recebe sobre cada
                atendimento.
              </p>

              <div
                className="
                  space-y-3
                "
              >
                {professionals.map(
                  (
                    professional
                  ) => {
                    const config =
                      professionalConfig[
                        professional.id
                      ];

                    const selected =
                      config?.selected ??
                      false;

                    return (
                      <div
                        key={
                          professional.id
                        }
                        className={`
                          rounded-xl
                          border
                          p-4
                          transition-all

                          ${
                            selected
                              ? "border-[#C9A227]/50 bg-[#C9A227]/5"
                              : "border-black/10 bg-white"
                          }
                        `}
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-4
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              toggleProfessional(
                                professional.id
                              )
                            }
                            className="
                              flex
                              min-w-0
                              flex-1
                              items-center
                              gap-3
                              text-left
                            "
                          >
                            <div
                              className={`
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-full

                                ${
                                  selected
                                    ? "bg-[#C9A227] text-black"
                                    : "bg-[#FAFAF8] text-black/35"
                                }
                              `}
                            >
                              {selected ? (
                                <Check
                                  className="
                                    h-4
                                    w-4
                                  "
                                />
                              ) : (
                                <UserRound
                                  className="
                                    h-4
                                    w-4
                                  "
                                />
                              )}
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
                                  font-semibold
                                  text-[#111]
                                "
                              >
                                {
                                  professional.display_name
                                }
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[10px]
                                  text-black/35
                                "
                              >
                                {selected
                                  ? "Profissional vinculada"
                                  : "Clique para vincular"}
                              </p>
                            </div>
                          </button>
                        </div>

                        {selected && (
                          <div
                            className="
                              mt-4
                              border-t
                              border-black/[0.06]
                              pt-4
                            "
                          >
                            <label
                              className="
                                mb-2
                                block
                                text-xs
                                font-semibold
                                text-black/50
                              "
                            >
                              Comissão da profissional
                            </label>

                            <div
                              className="
                                relative
                              "
                            >
                              <Percent
                                className="
                                  absolute
                                  left-4
                                  top-1/2
                                  h-4
                                  w-4
                                  -translate-y-1/2
                                  text-[#C9A227]
                                "
                              />

                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  config?.commission ??
                                  "0"
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateCommission(
                                    professional.id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="
                                  h-11
                                  w-full
                                  rounded-xl
                                  border
                                  border-black/10
                                  bg-white
                                  pl-11
                                  pr-4
                                  text-sm
                                  font-semibold
                                  text-[#111]
                                  outline-none

                                  focus:border-[#C9A227]/60
                                "
                              />
                            </div>

                            <CommissionPreview
                              price={
                                Number(
                                  price.replace(
                                    ",",
                                    "."
                                  )
                                ) ||
                                0
                              }
                              commission={
                                Number(
                                  config?.commission ??
                                    0
                                ) ||
                                0
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </FormSection>

            {/* MENSAGENS */}

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
                  leading-6
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
              shrink-0
              flex-col-reverse
              gap-3
              border-t
              border-black/10
              bg-white
              px-5
              py-4

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
                font-medium
                text-black/50

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
                  {editing ? (
                    <Check
                      className="
                        h-4
                        w-4
                      "
                    />
                  ) : (
                    <Plus
                      className="
                        h-4
                        w-4
                      "
                    />
                  )}

                  {editing
                    ? "Salvar alterações"
                    : "Criar serviço"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   PREVIEW DA COMISSÃO
============================================================ */

function CommissionPreview({
  price,
  commission,
}: {
  price: number;
  commission: number;
}) {
  const professional =
    price *
    (
      commission /
      100
    );

  const studio =
    price -
    professional;

  return (
    <div
      className="
        mt-3
        grid
        grid-cols-2
        gap-2
      "
    >
      <div
        className="
          rounded-lg
          bg-white
          p-3
        "
      >
        <p
          className="
            text-[8px]
            font-semibold
            uppercase
            tracking-wider
            text-black/30
          "
        >
          Profissional
        </p>

        <p
          className="
            mt-1
            text-sm
            font-bold
            text-[#111]
          "
        >
          {formatCurrency(
            professional
          )}
        </p>
      </div>

      <div
        className="
          rounded-lg
          bg-[#111]
          p-3
          text-white
        "
      >
        <p
          className="
            text-[8px]
            font-semibold
            uppercase
            tracking-wider
            text-white/35
          "
        >
          Studio
        </p>

        <p
          className="
            mt-1
            text-sm
            font-bold
            text-[#C9A227]
          "
        >
          {formatCurrency(
            studio
          )}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTES AUXILIARES
============================================================ */

function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <section>
      <div
        className="
          mb-4
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
      </div>

      {children}
    </section>
  );
}

function InputField({
  label,
  icon: Icon,
  children,
}: {
  label: string;

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