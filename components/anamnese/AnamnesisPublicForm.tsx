"use client";

import {
  type FormEvent,
  useState,
} from "react";

import {
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

const initialHealth:
  HealthAnswers = {
    smoker:
      false,

    pregnant:
      false,

    breastfeeding:
      false,

    hypertension:
      false,

    diabetes:
      false,

    allergies:
      false,

    herpes:
      false,

    heartDisease:
      false,

    anemia:
      false,

    glaucoma:
      false,

    hepatitis:
      false,

    autoimmuneDisease:
      false,

    roaccutane:
      false,

    epilepsy:
      false,

    hiv:
      false,

    skinProblems:
      false,

    keloids:
      false,

    oncologicalHistory:
      false,

    continuousMedication:
      false,
  };

const healthQuestions: {
  key:
    keyof HealthAnswers;

  label:
    string;
}[] = [
  {
    key:
      "smoker",
    label:
      "Fuma?",
  },
  {
    key:
      "pregnant",
    label:
      "Gestante?",
  },
  {
    key:
      "breastfeeding",
    label:
      "Está amamentando?",
  },
  {
    key:
      "hypertension",
    label:
      "Possui hipertensão?",
  },
  {
    key:
      "diabetes",
    label:
      "Possui diabetes?",
  },
  {
    key:
      "allergies",
    label:
      "Possui alergias?",
  },
  {
    key:
      "herpes",
    label:
      "Possui herpes?",
  },
  {
    key:
      "heartDisease",
    label:
      "Possui cardiopatia?",
  },
  {
    key:
      "anemia",
    label:
      "Possui anemia?",
  },
  {
    key:
      "glaucoma",
    label:
      "Possui glaucoma?",
  },
  {
    key:
      "hepatitis",
    label:
      "Possui ou já teve hepatite?",
  },
  {
    key:
      "autoimmuneDisease",
    label:
      "Possui doença autoimune?",
  },
  {
    key:
      "roaccutane",
    label:
      "Faz uso de Roacutan?",
  },
  {
    key:
      "epilepsy",
    label:
      "Possui epilepsia?",
  },
  {
    key:
      "hiv",
    label:
      "Portador(a) de HIV?",
  },
  {
    key:
      "skinProblems",
    label:
      "Possui problemas de pele?",
  },
  {
    key:
      "keloids",
    label:
      "Possui tendência a queloides?",
  },
  {
    key:
      "oncologicalHistory",
    label:
      "Possui antecedentes oncológicos?",
  },
  {
    key:
      "continuousMedication",
    label:
      "Faz uso de medicamentos contínuos?",
  },
];

export default function AnamnesisPublicForm({
  token,
  initialClient,
}: AnamnesisPublicFormProps) {
  const [
    step,
    setStep,
  ] =
    useState(1);

  const [
    fullName,
    setFullName,
  ] =
    useState(
      initialClient.fullName
    );

  const [
    cpf,
    setCpf,
  ] =
    useState("");

  const [
    rg,
    setRg,
  ] =
    useState("");

  const [
    birthDate,
    setBirthDate,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState(
      initialClient.phone
    );

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    address,
    setAddress,
  ] =
    useState("");

  const [
    city,
    setCity,
  ] =
    useState("");

  const [
    cep,
    setCep,
  ] =
    useState("");

  const [
    howDidYouFindUs,
    setHowDidYouFindUs,
  ] =
    useState("");

  const [
    health,
    setHealth,
  ] =
    useState(
      initialHealth
    );

  const [
    otherHealthProblem,
    setOtherHealthProblem,
  ] =
    useState("");

  const [
    procedureType,
    setProcedureType,
  ] =
    useState("");

  const [
    imageAuthorized,
    setImageAuthorized,
  ] =
    useState<
      boolean | null
    >(null);

  const [
    acceptedTerms,
    setAcceptedTerms,
  ] =
    useState(false);

  /*
   * MVP:
   * assinatura por confirmação nominal.
   *
   * Na próxima evolução podemos trocar
   * pelo canvas desenhado.
   */
  const [
    clientSignature,
    setClientSignature,
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
    submitted,
    setSubmitted,
  ] =
    useState(false);

  function nextStep() {
    setError("");

    if (
      step === 1
    ) {
      if (
        !fullName.trim()
      ) {
        setError(
          "Informe seu nome completo."
        );

        return;
      }

      if (
        !phone.trim()
      ) {
        setError(
          "Informe seu telefone."
        );

        return;
      }
    }

    setStep(
      (
        current
      ) =>
        Math.min(
          4,
          current + 1
        )
    );

    window.scrollTo({
      top:
        0,
      behavior:
        "smooth",
    });
  }

  function previousStep() {
    setError("");

    setStep(
      (
        current
      ) =>
        Math.max(
          1,
          current - 1
        )
    );

    window.scrollTo({
      top:
        0,
      behavior:
        "smooth",
    });
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      !acceptedTerms
    ) {
      setError(
        "Você precisa aceitar o termo de responsabilidade."
      );

      return;
    }

    if (
      imageAuthorized ===
      null
    ) {
      setError(
        "Informe se autoriza ou não o uso de imagem."
      );

      return;
    }

    if (
      !clientSignature
        .trim()
    ) {
      setError(
        "Digite seu nome completo no campo de assinatura."
      );

      return;
    }

    setLoading(
      true
    );

    try {
      const response =
        await fetch(
          `/api/anamnese/${token}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                fullName,

                cpf,
                rg,
                birthDate:
                  birthDate ||
                  null,

                phone,
                email,

                address,
                city,
                cep,

                howDidYouFindUs,

                ...health,

                otherHealthProblem,

                procedureType,

                imageAuthorized,

                acceptedTerms,

                clientSignature,
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
            "Não foi possível enviar a ficha."
        );
      }

      setSubmitted(
        true
      );

      window.scrollTo({
        top:
          0,
        behavior:
          "smooth",
      });
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Não foi possível enviar a ficha."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  if (
    submitted
  ) {
    return (
      <main
        className="
          flex
          min-h-dvh
          items-center
          justify-center
          bg-[#F7F6F2]
          px-4
          py-10
        "
      >
        <div
          className="
            w-full
            max-w-lg
            rounded-3xl
            border
            border-black/10
            bg-white
            p-8
            text-center
            shadow-sm
          "
        >
          <CheckCircle2
            className="
              mx-auto
              h-14
              w-14
              text-green-600
            "
          />

          <h1
            className="
              mt-6
              font-serif
              text-3xl
              font-semibold
              text-[#111]
            "
          >
            Ficha enviada
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-black/50
            "
          >
            Obrigada! Suas informações
            foram enviadas com sucesso
            para o Studio Arrasou
            Sobrancelhas.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-dvh
        bg-[#F7F6F2]
        px-4
        py-6

        sm:py-10
      "
    >
      <form
        onSubmit={
          handleSubmit
        }
        className="
          mx-auto
          w-full
          max-w-2xl
          overflow-hidden
          rounded-3xl
          border
          border-black/10
          bg-white
          shadow-sm
        "
      >
        {/* HEADER */}

        <div
          className="
            border-b
            border-black/10
            p-6

            sm:p-8
          "
        >
          <p
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.25em]
              text-[#C9A227]
            "
          >
            Studio Arrasou
          </p>

          <h1
            className="
              mt-3
              font-serif
              text-3xl
              font-semibold
              text-[#111]

              sm:text-4xl
            "
          >
            Ficha de Anamnese
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-black/45
            "
          >
            Preencha com atenção. As
            informações são importantes
            para a segurança do seu
            procedimento.
          </p>

          <div
            className="
              mt-6
              h-1.5
              overflow-hidden
              rounded-full
              bg-black/[0.06]
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-[#C9A227]
                transition-all
              "
              style={{
                width:
                  `${
                    step *
                    25
                  }%`,
              }}
            />
          </div>

          <p
            className="
              mt-2
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              text-black/30
            "
          >
            Etapa {step} de 4
          </p>
        </div>

        <div
          className="
            p-5

            sm:p-8
          "
        >
          {step ===
            1 && (
            <PersonalDataStep
              fullName={
                fullName
              }
              setFullName={
                setFullName
              }
              cpf={
                cpf
              }
              setCpf={
                setCpf
              }
              rg={
                rg
              }
              setRg={
                setRg
              }
              birthDate={
                birthDate
              }
              setBirthDate={
                setBirthDate
              }
              phone={
                phone
              }
              setPhone={
                setPhone
              }
              email={
                email
              }
              setEmail={
                setEmail
              }
              address={
                address
              }
              setAddress={
                setAddress
              }
              city={
                city
              }
              setCity={
                setCity
              }
              cep={
                cep
              }
              setCep={
                setCep
              }
              howDidYouFindUs={
                howDidYouFindUs
              }
              setHowDidYouFindUs={
                setHowDidYouFindUs
              }
            />
          )}

          {step ===
            2 && (
            <HealthStep
              health={
                health
              }
              setHealth={
                setHealth
              }
              otherHealthProblem={
                otherHealthProblem
              }
              setOtherHealthProblem={
                setOtherHealthProblem
              }
            />
          )}

          {step ===
            3 && (
            <ProcedureStep
              procedureType={
                procedureType
              }
              setProcedureType={
                setProcedureType
              }
            />
          )}

          {step ===
            4 && (
            <ConsentStep
              imageAuthorized={
                imageAuthorized
              }
              setImageAuthorized={
                setImageAuthorized
              }
              acceptedTerms={
                acceptedTerms
              }
              setAcceptedTerms={
                setAcceptedTerms
              }
              clientSignature={
                clientSignature
              }
              setClientSignature={
                setClientSignature
              }
            />
          )}

          {error && (
            <div
              role="alert"
              className="
                mt-6
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
            gap-3
            border-t
            border-black/10
            p-5

            sm:p-6
          "
        >
          {step >
            1 && (
            <button
              type="button"
              onClick={
                previousStep
              }
              className="
                flex
                min-h-12
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-black/10
                px-5
                text-sm
                font-semibold
                text-black/55
              "
            >
              <ChevronLeft
                className="
                  h-4
                  w-4
                "
              />

              Voltar
            </button>
          )}

          {step <
          4 ? (
            <button
              type="button"
              onClick={
                nextStep
              }
              className="
                ml-auto
                flex
                min-h-12
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#C9A227]
                px-6
                text-sm
                font-semibold
                text-black

                sm:flex-none
              "
            >
              Continuar

              <ChevronRight
                className="
                  h-4
                  w-4
                "
              />
            </button>
          ) : (
            <button
              type="submit"
              disabled={
                loading
              }
              className="
                ml-auto
                flex
                min-h-12
                flex-1
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

                sm:flex-none
              "
            >
              {loading ? (
                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
                  "
                />
              ) : (
                <ShieldCheck
                  className="
                    h-4
                    w-4
                  "
                />
              )}

              Enviar ficha
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

/*
 * ============================================================
 * ETAPA 1
 * ============================================================
 */

function PersonalDataStep(
  props: {
    fullName: string;
    setFullName:
      (value: string) =>
        void;

    cpf: string;
    setCpf:
      (value: string) =>
        void;

    rg: string;
    setRg:
      (value: string) =>
        void;

    birthDate: string;
    setBirthDate:
      (value: string) =>
        void;

    phone: string;
    setPhone:
      (value: string) =>
        void;

    email: string;
    setEmail:
      (value: string) =>
        void;

    address: string;
    setAddress:
      (value: string) =>
        void;

    city: string;
    setCity:
      (value: string) =>
        void;

    cep: string;
    setCep:
      (value: string) =>
        void;

    howDidYouFindUs: string;

    setHowDidYouFindUs:
      (value: string) =>
        void;
  }
) {
  return (
    <div>
      <StepTitle
        title="Seus dados"
        description="Confira e complete suas informações."
      />

      <div className="mt-6 space-y-4">
        <Field
          label="Nome completo"
          value={
            props.fullName
          }
          onChange={
            props.setFullName
          }
          required
        />

        <div
          className="
            grid
            gap-4

            sm:grid-cols-2
          "
        >
          <Field
            label="CPF"
            value={
              props.cpf
            }
            onChange={
              props.setCpf
            }
          />

          <Field
            label="RG"
            value={
              props.rg
            }
            onChange={
              props.setRg
            }
          />
        </div>

        <label>
          <FieldLabel>
            Data de nascimento
          </FieldLabel>

          <input
            type="date"
            value={
              props.birthDate
            }
            onChange={(
              event
            ) =>
              props.setBirthDate(
                event.target.value
              )
            }
            className={inputClass}
          />
        </label>

        <div
          className="
            grid
            gap-4

            sm:grid-cols-2
          "
        >
          <Field
            label="Telefone / WhatsApp"
            value={
              props.phone
            }
            onChange={
              props.setPhone
            }
            required
          />

          <Field
            label="E-mail"
            type="email"
            value={
              props.email
            }
            onChange={
              props.setEmail
            }
          />
        </div>

        <Field
          label="Endereço"
          value={
            props.address
          }
          onChange={
            props.setAddress
          }
        />

        <div
          className="
            grid
            gap-4

            sm:grid-cols-2
          "
        >
          <Field
            label="Cidade"
            value={
              props.city
            }
            onChange={
              props.setCity
            }
          />

          <Field
            label="CEP"
            value={
              props.cep
            }
            onChange={
              props.setCep
            }
          />
        </div>

        <Field
          label="Como nos conheceu?"
          value={
            props.howDidYouFindUs
          }
          onChange={
            props.setHowDidYouFindUs
          }
        />
      </div>
    </div>
  );
}

/*
 * ============================================================
 * ETAPA 2
 * ============================================================
 */

function HealthStep({
  health,
  setHealth,
  otherHealthProblem,
  setOtherHealthProblem,
}: {
  health:
    HealthAnswers;

  setHealth:
    React.Dispatch<
      React.SetStateAction<HealthAnswers>
    >;

  otherHealthProblem:
    string;

  setOtherHealthProblem:
    (value: string) =>
      void;
}) {
  return (
    <div>
      <StepTitle
        title="Histórico de saúde"
        description="Marque Sim quando a condição se aplicar a você."
      />

      <div
        className="
          mt-6
          space-y-3
        "
      >
        {healthQuestions.map(
          (
            question
          ) => (
            <div
              key={
                question.key
              }
              className="
                flex
                items-center
                justify-between
                gap-4
                rounded-xl
                border
                border-black/[0.08]
                p-4
              "
            >
              <p
                className="
                  text-sm
                  font-medium
                  text-[#111]
                "
              >
                {
                  question.label
                }
              </p>

              <div
                className="
                  flex
                  shrink-0
                  gap-2
                "
              >
                <YesNoButton
                  active={
                    health[
                      question.key
                    ]
                  }
                  onClick={() =>
                    setHealth(
                      (
                        current
                      ) => ({
                        ...current,

                        [question.key]:
                          true,
                      })
                    )
                  }
                >
                  Sim
                </YesNoButton>

                <YesNoButton
                  active={
                    !health[
                      question.key
                    ]
                  }
                  onClick={() =>
                    setHealth(
                      (
                        current
                      ) => ({
                        ...current,

                        [question.key]:
                          false,
                      })
                    )
                  }
                >
                  Não
                </YesNoButton>
              </div>
            </div>
          )
        )}
      </div>

      <label
        className="
          mt-6
          block
        "
      >
        <FieldLabel>
          Possui algum problema de
          saúde não citado acima?
        </FieldLabel>

        <textarea
          rows={4}
          value={
            otherHealthProblem
          }
          onChange={(
            event
          ) =>
            setOtherHealthProblem(
              event.target.value
            )
          }
          className={`${inputClass} h-auto py-3`}
        />
      </label>
    </div>
  );
}

/*
 * ============================================================
 * ETAPA 3
 * ============================================================
 */

function ProcedureStep({
  procedureType,
  setProcedureType,
}: {
  procedureType:
    string;

  setProcedureType:
    (value: string) =>
      void;
}) {
  const procedures = [
    {
      value:
        "sobrancelhas",
      label:
        "Sobrancelhas",
    },
    {
      value:
        "labios",
      label:
        "Lábios",
    },
    {
      value:
        "olhos",
      label:
        "Olhos",
    },
    {
      value:
        "cilios",
      label:
        "Cílios",
    },
  ];

  return (
    <div>
      <StepTitle
        title="Procedimento"
        description="Selecione o procedimento relacionado à ficha."
      />

      <div
        className="
          mt-6
          grid
          gap-3

          sm:grid-cols-2
        "
      >
        {procedures.map(
          (
            procedure
          ) => (
            <button
              key={
                procedure.value
              }
              type="button"
              onClick={() =>
                setProcedureType(
                  procedure.value
                )
              }
              className={`
                min-h-14
                rounded-xl
                border
                px-4
                text-sm
                font-semibold
                transition-all

                ${
                  procedureType ===
                  procedure.value
                    ? "border-[#C9A227] bg-[#C9A227]/10 text-[#111]"
                    : "border-black/10 text-black/50"
                }
              `}
            >
              {
                procedure.label
              }
            </button>
          )
        )}
      </div>

      <div
        className="
          mt-6
          rounded-xl
          bg-[#FAFAF8]
          p-4
          text-xs
          leading-5
          text-black/45
        "
      >
        Técnica, pigmento,
        agulha/lâmina, fototipo e
        cor da pele serão preenchidos
        pela profissional no Studio.
      </div>
    </div>
  );
}

/*
 * ============================================================
 * ETAPA 4
 * ============================================================
 */

function ConsentStep({
  imageAuthorized,
  setImageAuthorized,
  acceptedTerms,
  setAcceptedTerms,
  clientSignature,
  setClientSignature,
}: {
  imageAuthorized:
    boolean | null;

  setImageAuthorized:
    (value: boolean) =>
      void;

  acceptedTerms:
    boolean;

  setAcceptedTerms:
    (value: boolean) =>
      void;

  clientSignature:
    string;

  setClientSignature:
    (value: string) =>
      void;
}) {
  return (
    <div>
      <StepTitle
        title="Termo de responsabilidade"
        description="Leia antes de finalizar sua ficha."
      />

      <div
        className="
          mt-6
          rounded-2xl
          bg-[#FAFAF8]
          p-5
          text-sm
          leading-7
          text-black/60
        "
      >
        Declaro que as informações
        fornecidas são verdadeiras.
        Estou ciente das orientações,
        cuidados e possíveis
        intercorrências do procedimento.
        Autorizo o registro fotográfico
        para acompanhamento e, quando
        autorizado abaixo, para
        divulgação.
      </div>

      <div
        className="
          mt-6
        "
      >
        <FieldLabel>
          Uso de imagem
        </FieldLabel>

        <div
          className="
            grid
            gap-3

            sm:grid-cols-2
          "
        >
          <button
            type="button"
            onClick={() =>
              setImageAuthorized(
                true
              )
            }
            className={`
              min-h-12
              rounded-xl
              border
              text-sm
              font-semibold

              ${
                imageAuthorized ===
                true
                  ? "border-[#C9A227] bg-[#C9A227]/10 text-[#111]"
                  : "border-black/10 text-black/50"
              }
            `}
          >
            Autorizo
          </button>

          <button
            type="button"
            onClick={() =>
              setImageAuthorized(
                false
              )
            }
            className={`
              min-h-12
              rounded-xl
              border
              text-sm
              font-semibold

              ${
                imageAuthorized ===
                false
                  ? "border-[#C9A227] bg-[#C9A227]/10 text-[#111]"
                  : "border-black/10 text-black/50"
              }
            `}
          >
            Não autorizo
          </button>
        </div>
      </div>

      <label
        className="
          mt-6
          flex
          items-start
          gap-3
          rounded-xl
          border
          border-black/10
          p-4
        "
      >
        <input
          type="checkbox"
          checked={
            acceptedTerms
          }
          onChange={(
            event
          ) =>
            setAcceptedTerms(
              event.target.checked
            )
          }
          className="
            mt-1
            h-4
            w-4
            accent-[#C9A227]
          "
        />

        <span
          className="
            text-sm
            leading-6
            text-black/60
          "
        >
          Li as informações acima,
          confirmo que os dados
          fornecidos são verdadeiros
          e estou de acordo com o
          termo de responsabilidade.
        </span>
      </label>

      <label
        className="
          mt-6
          block
        "
      >
        <FieldLabel>
          Assinatura da cliente
        </FieldLabel>

        <p
          className="
            mb-2
            text-xs
            text-black/35
          "
        >
          Digite seu nome completo
          como confirmação.
        </p>

        <input
          value={
            clientSignature
          }
          onChange={(
            event
          ) =>
            setClientSignature(
              event.target.value
            )
          }
          placeholder="Seu nome completo"
          className={inputClass}
        />
      </label>
    </div>
  );
}

/*
 * ============================================================
 * COMPONENTES
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
      <h2
        className="
          font-serif
          text-2xl
          font-semibold
          text-[#111]
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-1
          text-sm
          text-black/40
        "
      >
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;

  onChange:
    (value: string) =>
      void;

  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <FieldLabel>
        {label}
      </FieldLabel>

      <input
        type={
          type
        }
        value={
          value
        }
        required={
          required
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={inputClass}
      />
    </label>
  );
}

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      className="
        mb-2
        block
        text-xs
        font-semibold
        text-[#111]
      "
    >
      {children}
    </span>
  );
}

function YesNoButton({
  active,
  onClick,
  children,
}: {
  active: boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        min-h-10
        min-w-12
        rounded-lg
        border
        px-3
        text-xs
        font-semibold

        ${
          active
            ? "border-[#C9A227] bg-[#C9A227]/10 text-[#111]"
            : "border-black/10 text-black/35"
        }
      `}
    >
      {children}
    </button>
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
  transition
  focus:border-[#C9A227]/60
  focus:ring-2
  focus:ring-[#C9A227]/10
  sm:text-sm
`;