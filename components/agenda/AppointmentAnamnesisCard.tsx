"use client";

import {
  Check,
  Clipboard,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Plus,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import AnamnesisDetailsModal, {
  type AnamnesisFormData,
} from "@/components/anamnese/AnamnesisDetailsModal";

type AnamnesisRequest = {
  id: string;
  token: string;
  client_id: string;
  appointment_id: string | null;

  status:
    | "pending"
    | "completed"
    | "expired"
    | "canceled";

  expires_at: string;
  completed_at: string | null;
  created_at: string;
};

type AppointmentAnamnesisCardProps = {
  appointmentId: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
};

export default function AppointmentAnamnesisCard({
  appointmentId,
  clientId,
  clientName,
  clientPhone,
}: AppointmentAnamnesisCardProps) {
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
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              `/api/anamnese/requests?appointmentId=${encodeURIComponent(
                appointmentId
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
                "Não foi possível carregar a anamnese."
            );
          }

          setRequests(
            result.requests ??
              []
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Não foi possível carregar a anamnese."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        appointmentId,
      ]
    );

  useEffect(() => {
    void loadRequests();
  }, [
    loadRequests,
  ]);

  async function handleCreate() {
    setCreating(true);
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
                appointmentId,
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
          ?.status ===
          "completed"
      ) {
        await openDetails(
          result.request.id
        );

        return;
      }

      if (
        result.request
          ?.token
      ) {
        await copyLink(
          result.request.token
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
      setCreating(false);
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
      getPublicUrl(token);

    if (!url) {
      return;
    }

    await navigator
      .clipboard
      .writeText(url);

    setCopiedToken(token);

    window.setTimeout(
      () => {
        setCopiedToken(
          null
        );
      },
      2500
    );
  }

  function sendWhatsApp(
    token: string
  ) {
    const formUrl =
      getPublicUrl(token);

    const message =
      `Olá, ${clientName}! 😊\n\n` +
      `Aqui é do Studio Arrasou Sobrancelhas.\n\n` +
      `Antes do seu atendimento, precisamos que você preencha sua ficha de anamnese pelo link abaixo:\n\n` +
      `${formUrl}\n\n` +
      `O preenchimento é rápido e as informações são importantes para a segurança do seu procedimento. ✨`;

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
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError("");
    setSelectedForm(null);

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
      setDetailsLoading(false);
    }
  }

  const latestRequest =
    requests[0] ??
    null;

  return (
    <>
      <div
        className="
          rounded-2xl
          border
          border-black/10
          bg-[#FAFAF8]
          p-4
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4

            sm:flex-row
            sm:items-center
            sm:justify-between
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
              <p
                className="
                  text-sm
                  font-semibold
                  text-[#111]
                "
              >
                Ficha de Anamnese
              </p>

              {loading ? (
                <p
                  className="
                    mt-1
                    text-xs
                    text-black/40
                  "
                >
                  Carregando...
                </p>
              ) : !latestRequest ? (
                <p
                  className="
                    mt-1
                    text-xs
                    text-black/40
                  "
                >
                  Nenhuma ficha vinculada a este atendimento.
                </p>
              ) : (
                <div
                  className="
                    mt-1
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <StatusBadge
                    status={
                      latestRequest.status
                    }
                  />

                  {latestRequest.status ===
                    "completed" &&
                    latestRequest
                      .completed_at && (
                      <span
                        className="
                          text-[10px]
                          text-black/35
                        "
                      >
                        {formatDateTime(
                          latestRequest
                            .completed_at
                        )}
                      </span>
                    )}
                </div>
              )}
            </div>
          </div>

          {!loading && (
            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              {!latestRequest ||
              latestRequest.status ===
                "expired" ||
              latestRequest.status ===
                "canceled" ? (
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
                    min-h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#C9A227]
                    px-4
                    text-xs
                    font-semibold
                    text-black

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
              ) : latestRequest.status ===
                "pending" ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void copyLink(
                        latestRequest.token
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
                      sendWhatsApp(
                        latestRequest.token
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
                </>
              ) : latestRequest.status ===
                "completed" ? (
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
              ) : null}
            </div>
          )}
        </div>

        {error && (
          <div
            className="
              mt-4
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-xs
              text-red-700
            "
          >
            {error}
          </div>
        )}
      </div>

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
          setDetailsOpen(false);
          setSelectedForm(null);
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
      className:
        "bg-amber-100 text-amber-800",
    },

    completed: {
      label:
        "Preenchida",
      className:
        "bg-green-100 text-green-700",
    },

    expired: {
      label:
        "Expirada",
      className:
        "bg-neutral-100 text-neutral-500",
    },

    canceled: {
      label:
        "Cancelada",
      className:
        "bg-red-100 text-red-700",
    },
  }[status];

  return (
    <span
      className={`
        rounded-full
        px-2.5
        py-1
        text-[9px]
        font-bold
        uppercase
        tracking-wide

        ${config.className}
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
      hour12:
        false,
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(value)
  );
}