"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type AnamnesisPublicFormProps = {
  token: string;

  initialClient: {
    fullName: string;
    phone: string;
  };
};

type HealthAnswers = {
  smoker: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  hypertension: boolean;
  diabetes: boolean;
  allergies: boolean;
  herpes: boolean;
  heartDisease: boolean;
  anemia: boolean;
  glaucoma: boolean;
  hepatitis: boolean;
  autoimmuneDisease: boolean;
  roaccutane: boolean;
  epilepsy: boolean;
  hiv: boolean;
  skinProblems: boolean;
  keloids: boolean;
  oncologicalHistory: boolean;
  continuousMedication: boolean;
};

type FormState = {
  fullName: string;
  cpf: string;
  rg: string;
  /* DD/MM/AAAA na tela; convertido para AAAA-MM-DD no envio. */
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  cep: string;
  howDidYouFindUs: string;
  health: HealthAnswers;
  /* Confirmação explícita de que nenhuma condição se aplica. */
  noHealthConditions: boolean;
  otherHealthProblem: string;
  procedureType: string;
  imageAuthorized: boolean | null;
  acceptedTerms: boolean;
  clientSignature: string;
};

type Draft = {
  savedAt: number;
  step: number;
  form: FormState;
};

const TOTAL_STEPS = 4;

const STEP_NAMES = [
  "Seus dados",
  "Saúde",
  "Procedimento",
  "Termo",
];

/* Rascunho salvo no próprio celular, descartado após 7 dias. */
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const initialHealth: HealthAnswers = {
  smoker: false,
  pregnant: false,
  breastfeeding: false,
  hypertension: false,
  diabetes: false,
  allergies: false,
  herpes: false,
  heartDisease: false,
  anemia: false,
  glaucoma: false,
  hepatitis: false,
  autoimmuneDisease: false,
  roaccutane: false,
  epilepsy: false,
  hiv: false,
  skinProblems: false,
  keloids: false,
  oncologicalHistory: false,
  continuousMedication: false,
};

const healthQuestions: {
  key: keyof HealthAnswers;
  label: string;
}[] = [
  { key: "smoker", label: "Fumante" },
  { key: "pregnant", label: "Gestante" },
  { key: "breastfeeding", label: "Amamentando" },
  { key: "hypertension", label: "Hipertensão" },
  { key: "diabetes", label: "Diabetes" },
  { key: "allergies", label: "Alergias" },
  { key: "herpes", label: "Herpes" },
  { key: "heartDisease", label: "Cardiopatia" },
  { key: "anemia", label: "Anemia" },
  { key: "glaucoma", label: "Glaucoma" },
  { key: "hepatitis", label: "Hepatite (atual ou passada)" },
  { key: "autoimmuneDisease", label: "Doença autoimune" },
  { key: "roaccutane", label: "Uso de Roacutan" },
  { key: "epilepsy", label: "Epilepsia" },
  { key: "hiv", label: "Portador(a) de HIV" },
  { key: "skinProblems", label: "Problemas de pele" },
  { key: "keloids", label: "Tendência a queloides" },
  { key: "oncologicalHistory", label: "Antecedentes oncológicos" },
  { key: "continuousMedication", label: "Medicamentos de uso contínuo" },
];

/* Valores mantidos: o painel (AnamnesisDetailsModal) traduz estes códigos. */
const procedures = [
  { value: "sobrancelhas", label: "Sobrancelhas" },
  { value: "labios", label: "Lábios" },
  { value: "olhos", label: "Olhos" },
  { value: "cilios", label: "Cílios" },
];

/*
 * ============================================================
 * COMPONENTE
 *
 * O formulário só é montado no navegador, para poder
 * restaurar o rascunho salvo sem divergência de hidratação.
 * ============================================================
 */

const noopSubscribe = () => () => {};

export default function AnamnesisPublicForm(
  props: AnamnesisPublicFormProps
) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F7F6F2]">
        <Loader2 className="h-6 w-6 animate-spin text-[#C9A227]" />
      </main>
    );
  }

  return <AnamnesisForm {...props} />;
}

function AnamnesisForm({
  token,
  initialClient,
}: AnamnesisPublicFormProps) {
  const draftKey = `arrasou-anamnese-${token}`;

  const [initialDraft] = useState(() => readDraft(draftKey));

  const [step, setStep] = useState(initialDraft?.step ?? 1);

  const [form, setForm] = useState<FormState>(
    () =>
      initialDraft?.form ?? {
        fullName: initialClient.fullName,
        cpf: "",
        rg: "",
        birthDate: "",
        phone: maskPhone(initialClient.phone),
        email: "",
        address: "",
        city: "",
        cep: "",
        howDidYouFindUs: "",
        health: initialHealth,
        noHealthConditions: false,
        otherHealthProblem: "",
        procedureType: "",
        imageAuthorized: null,
        acceptedTerms: false,
        clientSignature: "",
      }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<
    null | "sent" | "already"
  >(null);

  /*
   * Salva o rascunho a cada alteração: a cliente pode sair
   * para o WhatsApp e voltar sem perder o que preencheu.
   */
  useEffect(() => {
    if (submitted) return;

    try {
      const draft: Draft = { savedAt: Date.now(), step, form };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      /* Armazenamento indisponível (aba anônima etc.). */
    }
  }, [draftKey, form, step, submitted]);

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function toggleHealth(key: keyof HealthAnswers) {
    setForm((current) => ({
      ...current,
      noHealthConditions: false,
      health: { ...current.health, [key]: !current.health[key] },
    }));
    setError("");
  }

  function toggleNoHealthConditions() {
    setForm((current) => ({
      ...current,
      noHealthConditions: !current.noHealthConditions,
      health: initialHealth,
    }));
    setError("");
  }

  function goToStep(target: number) {
    setError("");
    setStep(Math.min(TOTAL_STEPS, Math.max(1, target)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep() {
    const stepError = validateStep(step, form);

    if (stepError) {
      setError(stepError);
      return;
    }

    goToStep(step + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /*
     * Envio só acontece na última etapa. Antes, o botão
     * "Continuar" virava "Enviar" no mesmo toque e a ficha
     * era submetida ao chegar na etapa 4.
     */
    if (step < TOTAL_STEPS) {
      nextStep();
      return;
    }

    if (loading) return;

    for (let current = 1; current <= TOTAL_STEPS; current++) {
      const stepError = validateStep(current, form);

      if (stepError) {
        if (current !== step) goToStep(current);
        setError(stepError);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/anamnese/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          cpf: form.cpf,
          rg: form.rg,
          birthDate: toIsoDate(form.birthDate),
          phone: form.phone,
          email: form.email.trim(),
          address: form.address,
          city: form.city,
          cep: form.cep,
          howDidYouFindUs: form.howDidYouFindUs,
          ...form.health,
          otherHealthProblem: form.otherHealthProblem,
          procedureType: form.procedureType,
          imageAuthorized: form.imageAuthorized,
          acceptedTerms: form.acceptedTerms,
          clientSignature: form.clientSignature.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        error?: string;
        alreadySubmitted?: boolean;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Não foi possível enviar a ficha. Tente novamente em instantes."
        );
      }

      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        /* sem armazenamento */
      }

      setSubmitted(result?.alreadySubmitted ? "already" : "sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(
        submitError instanceof TypeError
          ? "Sem conexão com a internet. Verifique sua rede e toque em Enviar novamente."
          : submitError instanceof Error
            ? submitError.message
            : "Não foi possível enviar a ficha."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F7F6F2] px-4 py-10">
        <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />

          <h1 className="mt-6 font-serif text-3xl font-semibold text-[#111]">
            Ficha enviada
          </h1>

          <p className="mt-3 text-sm leading-6 text-black/50">
            {submitted === "already"
              ? "Sua ficha já havia sido recebida pelo Studio Arrasou Sobrancelhas. Não é preciso enviar novamente."
              : "Obrigada! Suas informações foram enviadas com sucesso para o Studio Arrasou Sobrancelhas."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#F7F6F2] sm:px-4 sm:py-10">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-white sm:min-h-0 sm:overflow-hidden sm:rounded-3xl sm:border sm:border-black/10 sm:shadow-sm"
      >
        {/* CABEÇALHO */}
        <div className="border-b border-black/10 px-5 pb-5 pt-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A227]">
            Studio Arrasou
          </p>

          <h1 className="mt-2 font-serif text-[1.75rem] font-semibold leading-tight text-[#111] sm:text-4xl">
            Ficha de Anamnese
          </h1>

          {step === 1 && (
            <p className="mt-2 text-sm leading-6 text-black/50">
              Leva cerca de 3 minutos. Suas respostas ficam salvas
              neste aparelho até o envio.
            </p>
          )}

          <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Etapas">
            {STEP_NAMES.map((name, index) => {
              const number = index + 1;

              return (
                <li key={name}>
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      number <= step ? "bg-[#C9A227]" : "bg-black/[0.08]"
                    }`}
                  />
                  <p
                    className={`mt-1.5 truncate text-[10px] font-semibold uppercase tracking-wide ${
                      number === step ? "text-[#8A6D0A]" : "text-black/30"
                    }`}
                  >
                    {name}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ETAPAS (pb extra no celular: espaço do rodapé fixo) */}
        <div className="flex-1 px-5 pb-48 pt-6 sm:p-8">
          {step === 1 && (
            <PersonalDataStep form={form} update={update} />
          )}

          {step === 2 && (
            <HealthStep
              form={form}
              toggleHealth={toggleHealth}
              toggleNoHealthConditions={toggleNoHealthConditions}
              update={update}
            />
          )}

          {step === 3 && (
            <ProcedureStep form={form} update={update} />
          )}

          {step === 4 && (
            <ConsentStep form={form} update={update} />
          )}
        </div>

        {/*
         * RODAPÉ FIXO no celular: erro + navegação sempre visíveis.
         * "fixed" e não "sticky": o body global tem overflow-x
         * hidden, o que desativa o sticky.
         */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:z-auto sm:px-8 sm:pb-6">
          {error && (
            <div
              role="alert"
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {step > 1 && (
              <button
                key="back"
                type="button"
                onClick={() => goToStep(step - 1)}
                disabled={loading}
                className="flex h-12 items-center justify-center gap-1 rounded-xl border border-black/10 px-4 text-sm font-semibold text-black/60 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
            )}

            {/*
             * "key" diferente: o React não reaproveita o botão
             * "Continuar" como "Enviar" no meio do toque.
             */}
            {step < TOTAL_STEPS ? (
              <button
                key="next"
                type="button"
                onClick={nextStep}
                className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-[#C9A227] text-sm font-semibold text-black active:scale-[0.99]"
              >
                Continuar
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                key="submit"
                type="submit"
                disabled={loading}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {loading ? "Enviando..." : "Enviar ficha"}
              </button>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}

/*
 * ============================================================
 * VALIDAÇÃO POR ETAPA
 * ============================================================
 */

function validateStep(step: number, form: FormState): string {
  if (step === 1) {
    if (!form.fullName.trim()) return "Informe seu nome completo.";

    if (onlyDigits(form.phone).length < 10)
      return "Informe seu telefone com DDD.";

    if (!onlyDigits(form.cpf) && !form.rg.trim())
      return "Informe pelo menos um documento: CPF ou RG.";

    if (form.cpf && onlyDigits(form.cpf).length !== 11)
      return "O CPF deve ter 11 números.";

    if (form.birthDate && !toIsoDate(form.birthDate))
      return "Data de nascimento inválida. Use o formato DD/MM/AAAA.";

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      return "Confira o e-mail informado.";
  }

  if (step === 2) {
    const anyCondition = Object.values(form.health).some(Boolean);

    if (!anyCondition && !form.noHealthConditions)
      return 'Marque as condições que se aplicam a você ou toque em "Não tenho nenhuma dessas condições".';
  }

  if (step === 4) {
    if (form.imageAuthorized === null)
      return "Informe se autoriza ou não o uso de imagem.";

    if (!form.acceptedTerms)
      return "Para enviar, confirme que leu e está de acordo com o termo.";

    if (!form.clientSignature.trim())
      return "Digite seu nome completo no campo de assinatura.";
  }

  return "";
}

/*
 * ============================================================
 * ETAPA 1 — DADOS
 * ============================================================
 */

type StepProps = {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

function PersonalDataStep({ form, update }: StepProps) {
  return (
    <div>
      <StepTitle
        title="Seus dados"
        description="Nome, telefone e pelo menos um documento (CPF ou RG) são obrigatórios."
      />

      <div className="mt-6 space-y-4">
        <Field
          label="Nome completo"
          required
          value={form.fullName}
          onChange={(value) => update("fullName", value)}
          autoComplete="name"
          autoCapitalize="words"
        />

        <Field
          label="Telefone / WhatsApp"
          required
          value={form.phone}
          onChange={(value) => update("phone", maskPhone(value))}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(13) 99999-9999"
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="CPF"
            value={form.cpf}
            onChange={(value) => update("cpf", maskCpf(value))}
            inputMode="numeric"
            placeholder="000.000.000-00"
          />

          <Field
            label="RG"
            value={form.rg}
            onChange={(value) => update("rg", value.slice(0, 20))}
            inputMode="text"
          />
        </div>

        <Field
          label="Data de nascimento"
          value={form.birthDate}
          onChange={(value) => update("birthDate", maskDate(value))}
          inputMode="numeric"
          autoComplete="bday"
          placeholder="DD/MM/AAAA"
        />

        <Field
          label="E-mail"
          value={form.email}
          onChange={(value) => update("email", value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
        />

        <fieldset className="rounded-2xl border border-black/10 p-4">
          <legend className="px-1 text-xs font-semibold text-black/45">
            Endereço (opcional)
          </legend>

          <div className="space-y-4">
            <Field
              label="CEP"
              value={form.cep}
              onChange={(value) => update("cep", maskCep(value))}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
            />

            <Field
              label="Endereço"
              value={form.address}
              onChange={(value) => update("address", value)}
              autoComplete="street-address"
              placeholder="Rua, número, complemento"
            />

            <Field
              label="Cidade"
              value={form.city}
              onChange={(value) => update("city", value)}
              autoComplete="address-level2"
            />
          </div>
        </fieldset>

        <Field
          label="Como nos conheceu?"
          value={form.howDidYouFindUs}
          onChange={(value) => update("howDidYouFindUs", value)}
          placeholder="Instagram, indicação, passando na rua..."
        />
      </div>
    </div>
  );
}

/*
 * ============================================================
 * ETAPA 2 — SAÚDE
 * ============================================================
 */

function HealthStep({
  form,
  update,
  toggleHealth,
  toggleNoHealthConditions,
}: StepProps & {
  toggleHealth: (key: keyof HealthAnswers) => void;
  toggleNoHealthConditions: () => void;
}) {
  return (
    <div>
      <StepTitle
        title="Histórico de saúde"
        description="Toque nas condições que se aplicam a você. Se nenhuma se aplicar, use o botão abaixo da lista."
      />

      <div className="mt-6 grid grid-cols-2 gap-2">
        {healthQuestions.map((question) => (
          <ChoiceChip
            key={question.key}
            active={form.health[question.key]}
            onClick={() => toggleHealth(question.key)}
          >
            {question.label}
          </ChoiceChip>
        ))}
      </div>

      <button
        type="button"
        onClick={toggleNoHealthConditions}
        aria-pressed={form.noHealthConditions}
        className={`mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
          form.noHealthConditions
            ? "border-green-600 bg-green-50 text-green-800"
            : "border-black/15 text-black/60"
        }`}
      >
        {form.noHealthConditions && <Check className="h-4 w-4" />}
        Não tenho nenhuma dessas condições
      </button>

      <label className="mt-6 block">
        <FieldLabel>
          {form.health.allergies || form.health.continuousMedication
            ? "Conte mais: quais alergias ou medicamentos?"
            : "Algum outro problema de saúde ou observação? (opcional)"}
        </FieldLabel>

        <textarea
          rows={3}
          value={form.otherHealthProblem}
          onChange={(event) =>
            update("otherHealthProblem", event.target.value)
          }
          className={`${inputClass} h-auto py-3`}
        />
      </label>
    </div>
  );
}

/*
 * ============================================================
 * ETAPA 3 — PROCEDIMENTO
 * ============================================================
 */

function ProcedureStep({ form, update }: StepProps) {
  return (
    <div>
      <StepTitle
        title="Procedimento"
        description="Selecione o procedimento relacionado a esta ficha."
      />

      <div className="mt-6 grid grid-cols-2 gap-3">
        {procedures.map((procedure) => (
          <ChoiceChip
            key={procedure.value}
            active={form.procedureType === procedure.value}
            onClick={() =>
              update(
                "procedureType",
                form.procedureType === procedure.value ? "" : procedure.value
              )
            }
            tall
          >
            {procedure.label}
          </ChoiceChip>
        ))}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * ETAPA 4 — TERMO
 * ============================================================
 */

function ConsentStep({ form, update }: StepProps) {
  return (
    <div>
      <StepTitle
        title="Termo de responsabilidade"
        description="Leia antes de finalizar sua ficha."
      />

      <div className="mt-6 rounded-2xl bg-[#FAFAF8] p-4 text-sm leading-6 text-black/60">
        Declaro que as informações fornecidas são verdadeiras. Estou
        ciente das orientações, cuidados e possíveis intercorrências do
        procedimento. Autorizo o registro fotográfico para
        acompanhamento e, quando autorizado abaixo, para divulgação.
      </div>

      <p className="mt-6 text-xs font-semibold text-[#111]">
        Uso de imagem para divulgação *
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <ChoiceChip
          active={form.imageAuthorized === true}
          onClick={() => update("imageAuthorized", true)}
        >
          Autorizo
        </ChoiceChip>

        <ChoiceChip
          active={form.imageAuthorized === false}
          onClick={() => update("imageAuthorized", false)}
        >
          Não autorizo
        </ChoiceChip>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 p-4">
        <input
          type="checkbox"
          checked={form.acceptedTerms}
          onChange={(event) => update("acceptedTerms", event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#C9A227]"
        />
        <span className="text-sm leading-6 text-black/70">
          Li as informações acima, confirmo que os dados fornecidos são
          verdadeiros e estou de acordo com o termo de responsabilidade.
        </span>
      </label>

      <div className="mt-6">
        <Field
          label="Assinatura da cliente"
          required
          value={form.clientSignature}
          onChange={(value) => update("clientSignature", value)}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="send"
          placeholder="Digite seu nome completo"
        />

        <p className="mt-2 text-xs text-black/40">
          Digitar seu nome completo vale como confirmação.
        </p>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * COMPONENTES DE APOIO
 * ============================================================
 */

function StepTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-[#111]">
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-black/50">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  inputMode,
  autoComplete,
  autoCapitalize,
  enterKeyHint = "next",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  autoCapitalize?: string;
  enterKeyHint?: "next" | "send" | "done";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>
        {label}
        {required && <span className="text-[#C9A227]"> *</span>}
      </FieldLabel>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        enterKeyHint={enterKeyHint}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold text-[#111]">
      {children}
    </span>
  );
}

function ChoiceChip({
  active,
  onClick,
  children,
  tall = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tall?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium leading-5 transition ${
        tall ? "min-h-16" : "min-h-12 py-2"
      } ${
        active
          ? "border-[#C9A227] bg-[#C9A227]/10 text-[#111]"
          : "border-black/10 text-black/60"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-[#C9A227] bg-[#C9A227] text-black" : "border-black/20"
        }`}
      >
        {active && <Check className="h-3 w-3" />}
      </span>
      {children}
    </button>
  );
}

/* text-base (16px) no celular evita o zoom automático do iPhone. */
const inputClass =
  "h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base text-[#111] outline-none transition placeholder:text-black/25 focus:border-[#C9A227]/60 focus:ring-2 focus:ring-[#C9A227]/10 sm:text-sm";

/*
 * ============================================================
 * UTILITÁRIOS
 * ============================================================
 */

function readDraft(key: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const draft = JSON.parse(raw) as Draft;

    if (
      !draft?.form ||
      typeof draft.savedAt !== "number" ||
      Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS
    ) {
      window.localStorage.removeItem(key);
      return null;
    }

    return {
      ...draft,
      step: Math.min(TOTAL_STEPS, Math.max(1, Number(draft.step) || 1)),
      form: {
        ...draft.form,
        health: { ...initialHealth, ...draft.form.health },
      },
    };
  } catch {
    return null;
  }
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

function maskPhone(value: string) {
  let d = onlyDigits(value);

  /* Remove o 55 de números salvos com DDI. */
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);

  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCep(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function maskDate(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/* DD/MM/AAAA -> AAAA-MM-DD; null se vazia ou inválida. */
function toIsoDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T12:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== iso ||
    Number(year) < 1900 ||
    date.getTime() > Date.now()
  ) {
    return null;
  }

  return iso;
}
