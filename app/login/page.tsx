import type {
  Metadata,
} from "next";

import Image from "next/image";

import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title:
    "Login | Arrasou Administração",

  description:
    "Acesso administrativo do Studio Arrasou Sobrancelhas.",
};

export default function LoginPage() {
  return (
    <main
      className="
        min-h-dvh
        bg-[#050505]
      "
    >
      <div
        className="
          grid
          min-h-dvh

          lg:grid-cols-[minmax(0,1.05fr)_minmax(520px,0.95fr)]
        "
      >
        {/* ==================================================
            ÁREA INSTITUCIONAL
        =================================================== */}

        <section
          className="
            relative
            hidden
            overflow-hidden
            border-r
            border-white/10
            bg-[#050505]

            lg:flex
            lg:min-h-dvh
            lg:flex-col
            lg:justify-between
            lg:p-12

            xl:p-16
          "
        >
          {/* EFEITO DOURADO */}

          <div
            className="
              pointer-events-none
              absolute
              left-[-180px]
              top-[-180px]
              h-[520px]
              w-[520px]
              rounded-full
              bg-[#C9A227]/10
              blur-[120px]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              bottom-[-250px]
              right-[-180px]
              h-[520px]
              w-[520px]
              rounded-full
              bg-[#C9A227]/10
              blur-[140px]
            "
          />

          {/* TOPO */}

          <div
            className="
              relative
              z-10
            "
          >
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.38em]
                text-[#C9A227]
              "
            >
              Studio Arrasou
            </p>
          </div>

          {/* CENTRO */}

          <div
            className="
              relative
              z-10
              max-w-xl
            "
          >
            <div
              className="
                flex
                w-fit
                items-center
                justify-center
                rounded-[2rem]
                bg-white
                p-6
                shadow-2xl
              "
            >
              <Image
                src="/images/logo/arrasou-logo.png"
                alt="Studio Arrasou Sobrancelhas"
                width={420}
                height={420}
                priority
                className="
                  h-auto
                  w-[280px]
                  object-contain

                  xl:w-[340px]
                "
              />
            </div>

            <div
              className="
                mt-10
                max-w-lg
              "
            >
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.28em]
                  text-[#C9A227]
                "
              >
                Administração
              </p>

              <h1
                className="
                  mt-4
                  font-serif
                  text-4xl
                  leading-[1.08]
                  text-white

                  xl:text-5xl
                "
              >
                Gestão do Studio
                com simplicidade
                e precisão.
              </h1>

              <p
                className="
                  mt-5
                  max-w-md
                  text-sm
                  leading-7
                  text-white/45
                "
              >
                Agenda, clientes,
                serviços, profissionais
                e resultados em um único
                ambiente.
              </p>
            </div>
          </div>

          {/* RODAPÉ */}

          <div
            className="
              relative
              z-10
              flex
              items-center
              justify-between
              border-t
              border-white/10
              pt-6
            "
          >
            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.2em]
                text-white/25
              "
            >
              Arrasou Administração
            </p>

            <p
              className="
                text-[10px]
                text-[#C9A227]/70
              "
            >
              Praia Grande — SP
            </p>
          </div>
        </section>

        {/* ==================================================
            LOGIN
        =================================================== */}

        <section
          className="
            relative
            flex
            min-h-dvh
            items-center
            justify-center
            bg-[#F7F7F5]
            px-5
            py-8

            sm:px-8

            lg:px-12
          "
        >
          {/* MOBILE DECORATION */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-[-130px]
              h-[300px]
              w-[300px]
              -translate-x-1/2
              rounded-full
              bg-[#C9A227]/10
              blur-[90px]

              lg:hidden
            "
          />

          <div
            className="
              relative
              z-10
              w-full
              max-w-[440px]
            "
          >
            {/* ==================================================
                LOGO MOBILE
            =================================================== */}

            <div
              className="
                mb-8
                flex
                justify-center

                lg:hidden
              "
            >
              <div
                className="
                  flex
                  h-[150px]
                  w-[150px]
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-[2rem]
                  bg-white
                  p-3
                  shadow-sm
                  ring-1
                  ring-black/[0.04]

                  sm:h-[180px]
                  sm:w-[180px]
                "
              >
                <Image
                  src="/images/logo/arrasou-logo.png"
                  alt="Studio Arrasou Sobrancelhas"
                  width={260}
                  height={260}
                  priority
                  className="
                    h-full
                    w-full
                    object-contain
                  "
                />
              </div>
            </div>

            {/* CABEÇALHO */}

            <div
              className="
                text-center

                lg:text-left
              "
            >
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.28em]
                  text-[#B28D16]
                "
              >
                Área administrativa
              </p>

              <h2
                className="
                  mt-3
                  font-serif
                  text-3xl
                  font-semibold
                  tracking-[-0.02em]
                  text-[#111]

                  sm:text-4xl
                "
              >
                Bem-vinda.
              </h2>

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-sm
                  text-sm
                  leading-6
                  text-black/45

                  lg:mx-0
                "
              >
                Entre com seus dados para
                acessar o Arrasou Admin.
              </p>
            </div>

            {/* FORM */}

            <div
              className="
                mt-8
                rounded-[1.5rem]
                border
                border-black/[0.06]
                bg-white
                p-5
                shadow-[0_20px_60px_rgba(0,0,0,0.06)]

                sm:p-7
              "
            >
              <LoginForm />
            </div>

            <p
              className="
                mt-7
                text-center
                text-[10px]
                leading-5
                text-black/30
              "
            >
              Acesso exclusivo para
              profissionais autorizadas
              do Studio Arrasou Sobrancelhas.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}