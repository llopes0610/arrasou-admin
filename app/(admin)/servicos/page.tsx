import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ServicesManager from "@/components/servicos/ServicesManager";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  duration_minutes: number;
  category: string | null;
  active: boolean;
};

type ProfessionalRow = {
  id: string;
  display_name: string;
  active: boolean;
};

type ProfessionalServiceRow = {
  id: string;
  professional_id: string;
  service_id: string;
  commission_percentage: number | string;
  active: boolean;
};

export default async function ServicosPage() {
  const supabase =
    await createClient();

  /*
   * ==========================================================
   * USUÁRIO
   * ==========================================================
   */

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  /*
   * ==========================================================
   * PERFIL
   * ==========================================================
   */

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        role,
        active
      `)
      .eq(
        "id",
        userId
      )
      .single();

  /*
   * Gestão de serviços será exclusiva
   * do administrador.
   */
  if (
    !profile ||
    !profile.active ||
    profile.role !== "admin"
  ) {
    redirect("/dashboard");
  }

  /*
   * ==========================================================
   * DADOS
   * ==========================================================
   */

  const [
    servicesResult,
    professionalsResult,
    linksResult,
  ] =
    await Promise.all([
      supabase
        .from("services")
        .select(`
          id,
          name,
          description,
          price,
          duration_minutes,
          category,
          active
        `)
        .order(
          "name",
          {
            ascending: true,
          }
        ),

      supabase
        .from("professionals")
        .select(`
          id,
          display_name,
          active
        `)
        .eq(
          "active",
          true
        )
        .order(
          "display_name",
          {
            ascending: true,
          }
        ),

      supabase
        .from(
          "professional_services"
        )
        .select(`
          id,
          professional_id,
          service_id,
          commission_percentage,
          active
        `),
    ]);

  if (
    servicesResult.error
  ) {
    console.error(
      "Erro ao carregar serviços:",
      servicesResult.error
    );
  }

  if (
    professionalsResult.error
  ) {
    console.error(
      "Erro ao carregar profissionais:",
      professionalsResult.error
    );
  }

  if (
    linksResult.error
  ) {
    console.error(
      "Erro ao carregar vínculos:",
      linksResult.error
    );
  }

  const services =
    (
      servicesResult.data ??
      []
    ) as unknown as ServiceRow[];

  const professionals =
    (
      professionalsResult.data ??
      []
    ) as unknown as ProfessionalRow[];

  const links =
    (
      linksResult.data ??
      []
    ) as unknown as ProfessionalServiceRow[];

  /*
   * ==========================================================
   * MÉTRICAS
   * ==========================================================
   */

  const activeServices =
    services.filter(
      (service) =>
        service.active
    ).length;

  const inactiveServices =
    services.length -
    activeServices;

  const activeLinks =
    links.filter(
      (link) =>
        link.active
    ).length;

  return (
    <div>
      <div>
        <p
          className="
            text-sm
            text-black/40
          "
        >
          Configuração operacional
        </p>

        <h1
          className="
            mt-1
            font-serif
            text-3xl
            font-semibold
            text-[#111]

            sm:text-4xl
          "
        >
          Serviços
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-black/45
          "
        >
          Configure procedimentos,
          valores, duração e comissão
          das profissionais.
        </p>
      </div>

      {/* MÉTRICAS */}

      <div
        className="
          mt-8
          grid
          gap-4

          sm:grid-cols-3
        "
      >
        <MetricCard
          label="Serviços ativos"
          value={
            String(
              activeServices
            )
          }
        />

        <MetricCard
          label="Serviços inativos"
          value={
            String(
              inactiveServices
            )
          }
        />

        <MetricCard
          label="Vínculos profissionais"
          value={
            String(
              activeLinks
            )
          }
          highlight
        />
      </div>

      {/* GERENCIADOR */}

      <div className="mt-8">
        <ServicesManager
          initialServices={
            services
          }
          professionals={
            professionals
          }
          initialLinks={
            links
          }
        />
      </div>
    </div>
  );
}

/* ============================================================
   CARD
============================================================ */

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        p-5

        ${
          highlight
            ? "border-[#C9A227]/20 bg-[#111] text-white"
            : "border-black/10 bg-white text-[#111]"
        }
      `}
    >
      <p
        className={`
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.14em]

          ${
            highlight
              ? "text-white/40"
              : "text-black/35"
          }
        `}
      >
        {label}
      </p>

      <p
        className={`
          mt-3
          text-3xl
          font-bold

          ${
            highlight
              ? "text-[#C9A227]"
              : "text-[#111]"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}