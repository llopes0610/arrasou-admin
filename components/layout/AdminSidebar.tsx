"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  Settings,
  UsersRound,
  WalletCards,
  WandSparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "professional";
  active: boolean;
};

type AdminSidebarProps = {
  profile: Profile;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: UsersRound,
  },
  {
    label: "Serviços",
    href: "/servicos",
    icon: WandSparkles,
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: WalletCards,
  },
];

export default function AdminSidebar({
  profile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed
        bottom-0
        left-0
        top-0
        z-40
        hidden
        w-[260px]
        border-r
        border-white/10
        bg-[#080808]
        text-white

        lg:flex
        lg:flex-col
      "
    >
      {/* LOGO */}

      <div className="border-b border-white/10 px-6 py-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div
            className="
              flex
              h-10
              w-10
              rotate-45
              items-center
              justify-center
              border
              border-[#C9A227]/60
            "
          >
            <span
              className="
                -rotate-45
                font-serif
                italic
                text-[#C9A227]
              "
            >
              AS
            </span>
          </div>

          <div>
            <p className="font-serif text-lg">
              Arrasou
            </p>

            <p
              className="
                text-[8px]
                uppercase
                tracking-[0.28em]
                text-[#C9A227]
              "
            >
              Administração
            </p>
          </div>
        </Link>
      </div>

      {/* MENU */}

      <nav className="flex-1 space-y-1 px-3 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(
              `${item.href}/`
            );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                `
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  transition-all
                `,
                active
                  ? "bg-[#C9A227] font-semibold text-black"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />

              {item.label}
            </Link>
          );
        })}

        {profile.role === "admin" && (
          <>
            <div className="px-4 pb-2 pt-6">
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.24em]
                  text-white/20
                "
              >
                Administração
              </p>
            </div>

            <Link
              href="/configuracoes"
              className={cn(
                `
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  transition-all
                `,
                pathname.startsWith(
                  "/configuracoes"
                )
                  ? "bg-[#C9A227] font-semibold text-black"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              <Settings className="h-4 w-4" />

              Configurações
            </Link>
          </>
        )}
      </nav>

      {/* USUÁRIO */}

      <div className="border-t border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#C9A227]/10
              text-sm
              font-semibold
              text-[#C9A227]
            "
          >
            {profile.full_name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {profile.full_name}
            </p>

            <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
              {profile.role === "admin"
                ? "Administrador"
                : "Profissional"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}