"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Check,
  Clipboard,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

import AnamnesisDetailsModal, {
  type AnamnesisFormData,
} from "@/components/anamnese/AnamnesisDetailsModal";

type AnamnesisRequest = {
  id: string;
  token: string;

  status:
    | "pending"
    | "completed"
    | "expired"
    | "canceled";

  appointment_id:
    | string
    | null;

  expires_at: string;

  completed_at:
    | string
    | null;

  created_at: string;
};

type ClientAnamnesisCardProps = {
  clientId: string;

  clientName: string;

  clientPhone:
    | string
    | null;
};

export default function ClientAnamnesisCard({
  clientId,
  clientName,
  clientPhone,
}: ClientAnamnesisCardProps) {
  const [
    requests,
    setRequests,
  ] =
    useState<
      AnamnesisRequest[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    copiedToken,
    setCopiedToken,
  ] =
    useState<
      string | null
    >(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] =
    useState(false);

  const [
    detailsLoading,
    setDetailsLoading,
  ] =
    useState(false);

  const [
    detailsError,
    setDetailsError,
  ] =
    useState("");

  const [
    selectedForm,
    setSelectedForm,
  ] =
    useState<
      AnamnesisFormData | null
    >(null);

  const loadRequests =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setError("");

        try {
          const response =
            await fetch(
              `/api/anamnese/requests?clientId=${encodeURIComponent(
                clientId
              )}`,
              {
                cache:
                  "no-store",
              }
            );

          const result =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              result.error ||
                "Erro ao carregar fichas."
            );
          }

          setRequests(
            result.requests ??
              []
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Não foi possível carregar as fichas."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        clientId,
      ]
    );

  useEffect(() => {
    void loadRequests();
  }, [
    loadRequests,
  ]);

  async function handleCreate() {
    setCreating(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/anamnese/requests",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                clientId,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Não foi possível gerar a ficha."
        );
      }

      await loadRequests();

      if (
        result.request
          ?.token
      ) {
        await copyLink(
          result.request
            .token
        );
      }
    } catch (
      createError
    ) {
      setError(
        createError instanceof
          Error
          ? createError.message
          : "Não foi possível gerar a ficha."
      );
    } finally {
      setCreating(
        false
      );
    }
  }

  function getPublicUrl(
    token: string
  ) {
    if (
      typeof window ===
      "undefined"
    ) {
      return "";
    }

    return `${window.location.origin}/anamnese/${token}`;
  }

  async function copyLink(
    token: string
  ) {
    const url =
      getPublicUrl(
        token
      );

    if (!url) {
      return;
    }

    try {
      await navigator
        .clipboard
        .writeText(
          url
        );

      setCopiedToken(
        token
      );

      window.setTimeout(
        () => {
          setCopiedToken(
            null
          );
        },
        2500
      );
    } catch (
      copyError
    ) {
      console.error(
        "Erro ao copiar link:",
        copyError
      );
    }
  }

  function openForm(
    token: string
  ) {
    const url =
      getPublicUrl(
        token
      );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function sendWhatsApp(
    token: string
  ) {
    const formUrl =
      getPublicUrl(
        token
      );

    const message =
      `Olá, ${clientName}! 😊\n\n` +
      `Aqui é do Studio Arrasou Sobrancelhas.\n\n` +
      `Antes do seu procedimento, precisamos que você preencha sua ficha de anamnese pelo link abaixo:\n\n` +
      `${formUrl}\n\n` +
      `O preenchimento é rápido e suas informações serão utilizadas para a segurança do seu atendimento. ✨`;

    const phone =
      normalizePhone(
        clientPhone
      );

    const whatsappUrl =
      phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(
            message
          )}`
        : `https://wa.me/?text=${encodeURIComponent(
            message
          )}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function openDetails(
    requestId: string
  ) {
    setDetailsOpen(
      true
    );

    setDetailsLoading(
      true
    );

    setDetailsError("");

    setSelectedForm(
      null
    );

    try {
      const response =
        await fetch(
          `/api/anamnese/requests?requestId=${encodeURIComponent(
            requestId
          )}&includeForm=true`,
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Não foi possível abrir a ficha."
        );
      }

      setSelectedForm(
        result.form
      );
    } catch (
      viewError
    ) {
      setDetailsError(
        viewError instanceof
          Error
          ? viewError.message
          : "Não foi possível abrir a ficha."
      );
    } finally {
      setDetailsLoading(
        false
      );
    }
  }

  const latestRequest =
    requests[0] ??
    null;

  return (
    <>
      <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-black/10
        bg-white
      "
    >
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          gap-4
          border-b
          border-black/10
          p-5

          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-6
        "
      >
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
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#C9A227]/10
            "
          >
            <FileText
              className="
                h-5
                w-5
                text-[#C9A227]
              "
            />
          </div>

          <div>
            <h2
              className="
                font-serif
                text-xl
                font-semibold
                text-[#111]
              "
            >
              Ficha de Anamnese
            </h2>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-black/40
              "
            >
              Gere o link para a cliente
              preencher a ficha sem
              precisar acessar o sistema.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            handleCreate
          }
          disabled={
            creating
          }
          className="
            flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[#C9A227]
            px-5
            text-sm
            font-semibold
            text-black

            hover:bg-[#E0C56E]

            disabled:opacity-60
          "
        >
          {creating ? (
            <Loader2
              className="
                h-4
                w-4
                animate-spin
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

          Gerar ficha
        </button>
      </div>

      {/* CONTEÚDO */}

      <div
        className="
          p-5

          sm:p-6
        "
      >
        {loading ? (
          <div
            className="
              flex
              items-center
              justify-center
              gap-2
              py-8
              text-sm
              text-black/40
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

            Carregando...
          </div>
        ) : error ? (
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
        ) : !latestRequest ? (
          <div
            className="
              rounded-xl
              bg-[#FAFAF8]
              px-5
              py-8
              text-center
            "
          >
            <FileText
              className="
                mx-auto
                h-7
                w-7
                text-[#C9A227]
              "
            />

            <p
              className="
                mt-3
                text-sm
                font-semibold
                text-[#111]
              "
            >
              Nenhuma ficha gerada
            </p>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Clique em Gerar ficha
              para criar o primeiro link.
            </p>
          </div>
        ) : (
          <>
            <div
              className="
                flex
                flex-col
                gap-4
                rounded-2xl
                bg-[#FAFAF8]
                p-4

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
                    gap-2
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-[#111]
                    "
                  >
                    Ficha mais recente
                  </p>

                  <StatusBadge
                    status={
                      latestRequest.status
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
                  Gerada em{" "}
                  {formatDateTime(
                    latestRequest
                      .created_at
                  )}
                </p>

                {latestRequest.status ===
                  "pending" && (
                  <p
                    className="
                      mt-1
                      text-xs
                      text-black/40
                    "
                  >
                    Link válido até{" "}
                    {formatDateTime(
                      latestRequest
                        .expires_at
                    )}
                  </p>
                )}

                {latestRequest.status ===
                  "completed" &&
                  latestRequest
                    .completed_at && (
                    <p
                      className="
                        mt-1
                        text-xs
                        text-green-700
                      "
                    >
                      Preenchida em{" "}
                      {formatDateTime(
                        latestRequest
                          .completed_at
                      )}
                    </p>
                  )}
              </div>

              {latestRequest.status ===
                "pending" && (
                <div
                  className="
                    grid
                    gap-2

                    sm:grid-cols-3
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      copyLink(
                        latestRequest
                          .token
                      )
                    }
                    className="
                      flex
                      min-h-10
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-black/10
                      bg-white
                      px-3
                      text-xs
                      font-semibold
                      text-black/55
                    "
                  >
                    {copiedToken ===
                    latestRequest.token ? (
                      <Check
                        className="
                          h-4
                          w-4
                          text-green-600
                        "
                      />
                    ) : (
                      <Clipboard
                        className="
                          h-4
                          w-4
                        "
                      />
                    )}

                    {copiedToken ===
                    latestRequest.token
                      ? "Copiado"
                      : "Copiar"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openForm(
                        latestRequest
                          .token
                      )
                    }
                    className="
                      flex
                      min-h-10
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-black/10
                      bg-white
                      px-3
                      text-xs
                      font-semibold
                      text-black/55
                    "
                  >
                    <ExternalLink
                      className="
                        h-4
                        w-4
                      "
                    />

                    Abrir
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      sendWhatsApp(
                        latestRequest
                          .token
                      )
                    }
                    className="
                      flex
                      min-h-10
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[#111]
                      px-3
                      text-xs
                      font-semibold
                      text-white
                    "
                  >
                    <MessageCircle
                      className="
                        h-4
                        w-4
                      "
                    />

                    WhatsApp
                  </button>
                </div>
              )}

              {latestRequest.status ===
                "completed" && (
                <button
                  type="button"
                  onClick={() =>
                    void openDetails(
                      latestRequest.id
                    )
                  }
                  className="
                    flex
                    min-h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#111]
                    px-4
                    text-xs
                    font-semibold
                    text-white
                  "
                >
                  <Eye
                    className="
                      h-4
                      w-4
                    "
                  />

                  Visualizar ficha
                </button>
              )}
            </div>

            {requests.length >
              1 && (
              <div
                className="
                  mt-5
                  border-t
                  border-black/[0.06]
                  pt-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.14em]
                      text-black/35
                    "
                  >
                    Histórico
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void loadRequests()
                    }
                    className="
                      flex
                      items-center
                      gap-1
                      text-[10px]
                      text-black/35
                    "
                  >
                    <RefreshCw
                      className="
                        h-3
                        w-3
                      "
                    />

                    Atualizar
                  </button>
                </div>

                <div
                  className="
                    mt-3
                    space-y-2
                  "
                >
                  {requests
                    .slice(
                      1
                    )
                    .map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                            rounded-xl
                            border
                            border-black/[0.06]
                            px-4
                            py-3
                          "
                        >
                          <div>
                            <p
                              className="
                                text-xs
                                font-medium
                                text-[#111]
                              "
                            >
                              {formatDateTime(
                                item.created_at
                              )}
                            </p>
                          </div>

                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >
                            <StatusBadge
                              status={
                                item.status
                              }
                            />

                            {item.status ===
                              "completed" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void openDetails(
                                    item.id
                                  )
                                }
                                className="
                                  flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-black/10
                                  bg-white
                                  text-black/45
                                "
                                aria-label="Visualizar ficha"
                              >
                                <Eye
                                  className="
                                    h-3.5
                                    w-3.5
                                  "
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>

      <AnamnesisDetailsModal
        open={
          detailsOpen
        }
        loading={
          detailsLoading
        }
        error={
          detailsError
        }
        form={
          selectedForm
        }
        onClose={() => {
          setDetailsOpen(
            false
          );

          setSelectedForm(
            null
          );

          setDetailsError("");
        }}
      />
    </>
  );
}

function StatusBadge({
  status,
}: {
  status:
    AnamnesisRequest["status"];
}) {
  const config = {
    pending: {
      label:
        "Aguardando",
      classes:
        "bg-amber-100 text-amber-800",
    },

    completed: {
      label:
        "Preenchida",
      classes:
        "bg-green-100 text-green-700",
    },

    expired: {
      label:
        "Expirada",
      classes:
        "bg-neutral-100 text-neutral-500",
    },

    canceled: {
      label:
        "Cancelada",
      classes:
        "bg-red-100 text-red-700",
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
        font-bold
        uppercase
        tracking-wide

        ${config.classes}
      `}
    >
      {config.label}
    </span>
  );
}

function normalizePhone(
  phone:
    | string
    | null
) {
  if (!phone) {
    return "";
  }

  let numbers =
    phone.replace(
      /\D/g,
      ""
    );

  /*
   * Se o telefone estiver sem DDI,
   * adicionamos Brasil.
   */
  if (
    numbers.length ===
      10 ||
    numbers.length ===
      11
  ) {
    numbers =
      `55${numbers}`;
  }

  return numbers;
}

function formatDateTime(
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

      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(
      value
    )
  );
}