"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

export type AnamnesisFormData = {
  id: string;
  request_id: string;
  client_id: string;
  appointment_id: string | null;

  full_name: string;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  cep: string | null;
  how_did_you_find_us: string | null;

  smoker: boolean | null;
  pregnant: boolean | null;
  breastfeeding: boolean | null;
  hypertension: boolean | null;
  diabetes: boolean | null;
  allergies: boolean | null;
  herpes: boolean | null;
  heart_disease: boolean | null;
  anemia: boolean | null;
  glaucoma: boolean | null;
  hepatitis: boolean | null;
  autoimmune_disease: boolean | null;
  roaccutane: boolean | null;
  epilepsy: boolean | null;
  hiv: boolean | null;
  skin_problems: boolean | null;
  keloids: boolean | null;
  oncological_history: boolean | null;
  continuous_medication: boolean | null;
  other_health_problem: string | null;

  procedure_type: string | null;
  technique: string | null;
  pigment: string | null;
  needle_blade: string | null;
  phototype: string | null;
  skin_color: string | null;

  image_authorized: boolean | null;
  accepted_terms: boolean;
  client_signature: string | null;
  professional_signature: string | null;

  submitted_at: string | null;
  created_at: string;
};

type AnamnesisDetailsModalProps = {
  open: boolean;
  loading: boolean;
  error: string;
  form: AnamnesisFormData | null;
  onClose: () => void;
};

const healthItems: {
  key: keyof Pick<
    AnamnesisFormData,
    | "smoker"
    | "pregnant"
    | "breastfeeding"
    | "hypertension"
    | "diabetes"
    | "allergies"
    | "herpes"
    | "heart_disease"
    | "anemia"
    | "glaucoma"
    | "hepatitis"
    | "autoimmune_disease"
    | "roaccutane"
    | "epilepsy"
    | "hiv"
    | "skin_problems"
    | "keloids"
    | "oncological_history"
    | "continuous_medication"
  >;
  label: string;
}[] = [
  { key: "smoker", label: "Fuma" },
  { key: "pregnant", label: "Gestante" },
  { key: "breastfeeding", label: "Amamentando" },
  { key: "hypertension", label: "Hipertensão" },
  { key: "diabetes", label: "Diabetes" },
  { key: "allergies", label: "Alergias" },
  { key: "herpes", label: "Herpes" },
  { key: "heart_disease", label: "Cardiopatia" },
  { key: "anemia", label: "Anemia" },
  { key: "glaucoma", label: "Glaucoma" },
  { key: "hepatitis", label: "Hepatite" },
  { key: "autoimmune_disease", label: "Doença autoimune" },
  { key: "roaccutane", label: "Uso de Roacutan" },
  { key: "epilepsy", label: "Epilepsia" },
  { key: "hiv", label: "HIV" },
  { key: "skin_problems", label: "Problemas de pele" },
  { key: "keloids", label: "Tendência a queloides" },
  { key: "oncological_history", label: "Antecedentes oncológicos" },
  { key: "continuous_medication", label: "Medicamento contínuo" },
];

export default function AnamnesisDetailsModal({
  open,
  loading,
  error,
  form,
  onClose,
}: AnamnesisDetailsModalProps) {
  if (!open) {
    return null;
  }

  const positiveHealthItems =
    form
      ? healthItems.filter(
          (item) =>
            form[item.key] === true
        )
      : [];

  return (
    <div
      className="
        fixed
        inset-0
        z-[150]
        flex
        items-end
        justify-center
        bg-black/60
        backdrop-blur-sm

        sm:items-center
        sm:p-4
      "
      onClick={onClose}
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

          sm:max-w-3xl
          sm:rounded-2xl
        "
        onClick={(event) =>
          event.stopPropagation()
        }
      >
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
              Anamnese
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
              Ficha preenchida
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="
            flex-1
            overflow-y-auto
            px-5
            py-6

            sm:px-6
          "
        >
          {loading ? (
            <div
              className="
                flex
                min-h-[360px]
                items-center
                justify-center
              "
            >
              <Loader2
                className="
                  h-5
                  w-5
                  animate-spin
                  text-[#C9A227]
                "
              />
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
          ) : !form ? (
            <div
              className="
                py-12
                text-center
                text-sm
                text-black/40
              "
            >
              Ficha não encontrada.
            </div>
          ) : (
            <div className="space-y-7">
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  rounded-2xl
                  bg-[#FAFAF8]
                  p-5

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-[0.14em]
                      text-black/35
                    "
                  >
                    Cliente
                  </p>

                  <p
                    className="
                      mt-2
                      font-serif
                      text-2xl
                      font-semibold
                      text-[#111]
                    "
                  >
                    {form.full_name}
                  </p>

                  {form.submitted_at && (
                    <p
                      className="
                        mt-1
                        text-xs
                        text-black/40
                      "
                    >
                      Preenchida em{" "}
                      {formatDateTime(
                        form.submitted_at
                      )}
                    </p>
                  )}
                </div>

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    self-start
                    rounded-full
                    bg-green-100
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-green-700

                    sm:self-auto
                  "
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Preenchida
                </div>
              </div>

              {positiveHealthItems.length > 0 && (
                <section
                  className="
                    rounded-2xl
                    border
                    border-amber-200
                    bg-amber-50
                    p-5
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >
                    <AlertTriangle
                      className="
                        mt-0.5
                        h-5
                        w-5
                        shrink-0
                        text-amber-700
                      "
                    />

                    <div>
                      <h3
                        className="
                          text-sm
                          font-bold
                          text-amber-900
                        "
                      >
                        Atenção no histórico de saúde
                      </h3>

                      <p
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-amber-800
                        "
                      >
                        A cliente marcou “Sim” para as condições abaixo.
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      mt-4
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    {positiveHealthItems.map(
                      (item) => (
                        <span
                          key={item.key}
                          className="
                            rounded-full
                            border
                            border-amber-200
                            bg-white
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-amber-900
                          "
                        >
                          {item.label}
                        </span>
                      )
                    )}
                  </div>
                </section>
              )}

              <Section
                title="Dados pessoais"
                icon={FileText}
              >
                <div
                  className="
                    grid
                    gap-3

                    sm:grid-cols-2
                  "
                >
                  <DataItem
                    label="Nome"
                    value={form.full_name}
                  />
                  <DataItem
                    label="Nascimento"
                    value={
                      form.birth_date
                        ? formatOnlyDate(
                            form.birth_date
                          )
                        : "Não informado"
                    }
                  />
                  <DataItem
                    label="CPF"
                    value={
                      form.cpf ??
                      "Não informado"
                    }
                  />
                  <DataItem
                    label="RG"
                    value={
                      form.rg ??
                      "Não informado"
                    }
                  />
                  <DataItem
                    label="Telefone"
                    value={
                      form.phone ??
                      "Não informado"
                    }
                  />
                  <DataItem
                    label="E-mail"
                    value={
                      form.email ??
                      "Não informado"
                    }
                  />
                  <DataItem
                    label="Endereço"
                    value={
                      [
                        form.address,
                        form.city,
                        form.cep,
                      ]
                        .filter(Boolean)
                        .join(" • ") ||
                      "Não informado"
                    }
                    full
                  />
                  <DataItem
                    label="Como conheceu o Studio"
                    value={
                      form.how_did_you_find_us ??
                      "Não informado"
                    }
                    full
                  />
                </div>
              </Section>

              <Section
                title="Histórico de saúde"
                icon={AlertTriangle}
              >
                <div
                  className="
                    grid
                    gap-2

                    sm:grid-cols-2
                  "
                >
                  {healthItems.map(
                    (item) => (
                      <HealthItem
                        key={item.key}
                        label={item.label}
                        value={
                          form[item.key]
                        }
                      />
                    )
                  )}
                </div>

                <div className="mt-3">
                  <DataItem
                    label="Outro problema de saúde"
                    value={
                      form.other_health_problem ??
                      "Não informado"
                    }
                    full
                  />
                </div>
              </Section>

              <Section
                title="Procedimento"
                icon={FileText}
              >
                <div
                  className="
                    grid
                    gap-3

                    sm:grid-cols-2
                  "
                >
                  <DataItem
                    label="Procedimento"
                    value={
                      formatProcedure(
                        form.procedure_type
                      )
                    }
                  />
                  <DataItem
                    label="Técnica"
                    value={
                      form.technique ??
                      "Não preenchida"
                    }
                  />
                  <DataItem
                    label="Pigmento"
                    value={
                      form.pigment ??
                      "Não preenchido"
                    }
                  />
                  <DataItem
                    label="Agulha / lâmina"
                    value={
                      form.needle_blade ??
                      "Não preenchida"
                    }
                  />
                  <DataItem
                    label="Fototipo"
                    value={
                      form.phototype ??
                      "Não preenchido"
                    }
                  />
                  <DataItem
                    label="Cor da pele"
                    value={
                      form.skin_color ??
                      "Não preenchida"
                    }
                  />
                </div>
              </Section>

              <Section
                title="Consentimento"
                icon={ShieldCheck}
              >
                <div
                  className="
                    grid
                    gap-3

                    sm:grid-cols-2
                  "
                >
                  <DataItem
                    label="Termo de responsabilidade"
                    value={
                      form.accepted_terms
                        ? "Aceito"
                        : "Não aceito"
                    }
                  />
                  <DataItem
                    label="Uso de imagem"
                    value={
                      form.image_authorized
                        ? "Autorizado"
                        : "Não autorizado"
                    }
                  />
                  <DataItem
                    label="Assinatura da cliente"
                    value={
                      form.client_signature ??
                      "Não informada"
                    }
                    full
                  />
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
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
        <Icon
          className="
            h-4
            w-4
            text-[#C9A227]
          "
        />

        <h3
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.12em]
            text-black/45
          "
        >
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function DataItem({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl
        bg-[#FAFAF8]
        p-4

        ${
          full
            ? "sm:col-span-2"
            : ""
        }
      `}
    >
      <p
        className="
          text-[9px]
          font-semibold
          uppercase
          tracking-wider
          text-black/30
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          break-words
          text-sm
          font-medium
          text-[#111]
        "
      >
        {value}
      </p>
    </div>
  );
}

function HealthItem({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  const positive =
    value === true;

  return (
    <div
      className={`
        flex
        items-center
        justify-between
        gap-3
        rounded-xl
        border
        p-3

        ${
          positive
            ? "border-amber-200 bg-amber-50"
            : "border-black/[0.06] bg-[#FAFAF8]"
        }
      `}
    >
      <span
        className="
          text-xs
          font-medium
          text-[#111]
        "
      >
        {label}
      </span>

      <span
        className={`
          rounded-full
          px-2.5
          py-1
          text-[9px]
          font-bold
          uppercase

          ${
            positive
              ? "bg-amber-200 text-amber-900"
              : "bg-green-100 text-green-700"
          }
        `}
      >
        {positive
          ? "Sim"
          : "Não"}
      </span>
    </div>
  );
}

function formatProcedure(
  value: string | null
) {
  const labels:
    Record<string, string> = {
      sobrancelhas:
        "Sobrancelhas",
      labios:
        "Lábios",
      olhos:
        "Olhos",
      cilios:
        "Cílios",
    };

  if (!value) {
    return "Não informado";
  }

  return (
    labels[value] ??
    value
  );
}

function formatOnlyDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value.split("-");

  return `${day}/${month}/${year}`;
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