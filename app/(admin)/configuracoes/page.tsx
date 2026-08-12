import {
  redirect,
} from "next/navigation";

import {
  Settings,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import ProfessionalsManager from "@/components/configuracoes/ProfessionalsManager";

export type ProfessionalItem = {
  id: string;

  profile_id: string;

  display_name: string;

  phone: string | null;

  default_commission_percentage:
    | number
    | string;

  active: boolean;

  profiles:
    | {
        id: string;

        full_name: string;

        active: boolean;
      }[]
    | null;
};

export default async function ConfiguracoesPage() {
  const supabase =
    await createClient();

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (!userId) {
    redirect(
      "/login"
    );
  }

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

  if (
    !profile ||
    !profile.active ||
    profile.role !==
      "admin"
  ) {
    redirect(
      "/dashboard"
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "professionals"
      )
      .select(`
        id,
        profile_id,
        display_name,
        phone,
        default_commission_percentage,
        active,

        profiles (
          id,
          full_name,
          active
        )
      `)
      .order(
        "display_name"
      );

  if (error) {
    console.error(
      "Erro ao carregar profissionais:",
      error
    );
  }

  const professionals =
    (
      data ?? []
    ) as unknown as ProfessionalItem[];

  const active =
    professionals.filter(
      (
        professional
      ) =>
        professional.active
    ).length;

  return (
    <div>
      {/* HEADER */}

      <div>
        <p
          className="
            text-sm
            text-black/40
          "
        >
          Administração
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
          Configurações
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-black/45
          "
        >
          Gerencie profissionais e
          acessos ao Arrasou Admin.
        </p>
      </div>

      {/* CARDS */}

      <div
        className="
          mt-8
          grid
          gap-4

          sm:grid-cols-3
        "
      >
        <MetricCard
          icon={
            UsersRound
          }
          label="Profissionais"
          value={
            String(
              professionals.length
            )
          }
        />

        <MetricCard
          icon={
            UserRoundCheck
          }
          label="Ativas"
          value={
            String(
              active
            )
          }
        />

        <MetricCard
          icon={
            Settings
          }
          label="Inativas"
          value={
            String(
              professionals.length -
                active
            )
          }
        />
      </div>

      <div
        className="
          mt-8
        "
      >
        <ProfessionalsManager
          professionals={
            professionals
          }
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;

  label:
    string;

  value:
    string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-black/10
        bg-white
        p-5
      "
    >
      <Icon
        className="
          h-5
          w-5
          text-[#C9A227]
        "
      />

      <p
        className="
          mt-4
          text-xs
          text-black/40
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-2xl
          font-bold
          text-[#111]
        "
      >
        {value}
      </p>
    </div>
  );
}