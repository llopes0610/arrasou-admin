"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorUp,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  Wallet,
  WalletCards,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type AdminShellProps = {
  children: React.ReactNode;

  userName: string;

  userRole:
    | "admin"
    | "professional";

    accessScope:
    | "full"
    | "agenda_only";
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
    adminOnly: false,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: UsersRound,
    adminOnly: false,
  },
  {
    label: "Serviços",
    href: "/servicos",
    icon: Sparkles,
    adminOnly: true,
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: WalletCards,
    adminOnly: false,
  },
  {
    label: "Movimentações",
    href: "/financeiro/movimentacoes",
    icon: MonitorUp,
    adminOnly: true,
  },
    {
    label: "Fechamento",
    href: "/financeiro/fechamento",
    icon: Wallet,
    adminOnly: true,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    adminOnly: true,
  },
];

export default function AdminShell({
  children,
  userName,
  userRole,
  accessScope,
}: AdminShellProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const supabase =
    createClient();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  /*
   * Fecha o menu ao trocar de rota.
   */
  useEffect(() => {
    setMobileMenuOpen(
      false
    );
  }, [
    pathname,
  ]);

  /*
   * Impede scroll da página
   * quando drawer mobile está aberto.
   */
  useEffect(() => {
    if (
      !mobileMenuOpen
    ) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    mobileMenuOpen,
  ]);

  async function handleLogout() {
    if (
      loggingOut
    ) {
      return;
    }

    setLoggingOut(
      true
    );

    try {
      await supabase.auth.signOut();

      router.replace(
        "/login"
      );

      router.refresh();
    } finally {
      setLoggingOut(
        false
      );
    }
  }

  const visibleNavigation =
  navigation.filter(
    (item) => {
      /*
       * Manicure:
       * somente Agenda.
       */
      if (
        accessScope ===
        "agenda_only"
      ) {
        return (
          item.href ===
          "/agenda"
        );
      }

      /*
       * Admin:
       * tudo.
       */
      if (
        userRole ===
        "admin"
      ) {
        return true;
      }

      /*
       * Profissional comum:
       * remove páginas administrativas.
       */
      return (
        !item.adminOnly
      );
    }
  );

  return (
    <div
      className="
        min-h-dvh
        bg-[#F7F7F5]
      "
    >
      {/* =====================================================
          SIDEBAR DESKTOP
      ====================================================== */}

      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-40
          hidden
          w-[240px]
          flex-col
          border-r
          border-white/10
          bg-[#050505]
          text-white

          lg:flex
        "
      >
        <SidebarContent
          pathname={
            pathname
          }
          navigation={
            visibleNavigation
          }
          userName={
            userName
          }
          userRole={
            userRole
          }
          loggingOut={
            loggingOut
          }
          onLogout={
            handleLogout
          }
        />
      </aside>

      {/* =====================================================
          HEADER MOBILE
      ====================================================== */}

      <header
        className="
          sticky
          top-0
          z-30
          flex
          min-h-[64px]
          items-center
          justify-between
          border-b
          border-black/[0.06]
          bg-white/95
          px-4
          backdrop-blur-xl

          lg:hidden
        "
        style={{
          paddingTop:
            "env(safe-area-inset-top)",
        }}
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            aria-label="Abrir menu"
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-black/[0.08]
              bg-white
              text-[#111]
              transition-colors

              active:bg-black/[0.04]
            "
          >
            <Menu
              className="
                h-5
                w-5
              "
            />
          </button>

          <div>
            <p
              className="
                font-serif
                text-base
                font-semibold
                leading-none
                text-[#111]
              "
            >
              Arrasou
            </p>

            <p
              className="
                mt-1
                text-[8px]
                font-bold
                uppercase
                tracking-[0.22em]
                text-[#C9A227]
              "
            >
              Administração
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            handleLogout
          }
          disabled={
            loggingOut
          }
          aria-label="Sair"
          className="
            flex
            h-11
            min-w-11
            items-center
            justify-center
            rounded-xl
            text-black/45

            active:bg-black/[0.04]

            disabled:opacity-50
          "
        >
          <LogOut
            className="
              h-[18px]
              w-[18px]
            "
          />
        </button>
      </header>

      {/* =====================================================
          DRAWER MOBILE
      ====================================================== */}

      {mobileMenuOpen && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            lg:hidden
          "
        >
          {/* OVERLAY */}

          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="
              absolute
              inset-0
              bg-black/55
              backdrop-blur-[2px]
            "
          />

          {/* DRAWER */}

          <aside
            className="
              absolute
              inset-y-0
              left-0
              flex
              w-[min(86vw,330px)]
              flex-col
              bg-[#050505]
              text-white
              shadow-2xl
            "
            style={{
              paddingTop:
                "env(safe-area-inset-top)",
              paddingBottom:
                "env(safe-area-inset-bottom)",
            }}
          >
            <div
              className="
                flex
                min-h-[64px]
                items-center
                justify-between
                border-b
                border-white/10
                px-4
              "
            >
              <div>
                <p
                  className="
                    font-serif
                    text-lg
                    font-semibold
                  "
                >
                  Arrasou
                </p>

                <p
                  className="
                    mt-1
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.22em]
                    text-[#C9A227]
                  "
                >
                  Administração
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                aria-label="Fechar menu"
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  text-white/60

                  active:bg-white/[0.06]
                "
              >
                <X
                  className="
                    h-5
                    w-5
                  "
                />
              </button>
            </div>

            <SidebarContent
              pathname={
                pathname
              }
              navigation={
                visibleNavigation
              }
              userName={
                userName
              }
              userRole={
                userRole
              }
              loggingOut={
                loggingOut
              }
              onLogout={
                handleLogout
              }
              mobile
            />
          </aside>
        </div>
      )}

      {/* =====================================================
          CONTEÚDO
      ====================================================== */}

      <div
        className="
          min-w-0

          lg:pl-[240px]
        "
      >
        {/* HEADER DESKTOP */}

        <header
          className="
            sticky
            top-0
            z-20
            hidden
            h-[64px]
            items-center
            justify-between
            border-b
            border-black/[0.06]
            bg-white/95
            px-8
            backdrop-blur-xl

            lg:flex
          "
        >
          <div>
            <p
              className="
                text-sm
                font-semibold
                text-[#111]
              "
            >
              Olá,{" "}
              {
                userName
              }
            </p>

            <p
              className="
                mt-0.5
                text-[11px]
                text-black/35
              "
            >
              Studio Arrasou
              Sobrancelhas
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            disabled={
              loggingOut
            }
            className="
              flex
              min-h-11
              items-center
              gap-2
              rounded-xl
              border
              border-black/[0.08]
              px-4
              text-sm
              font-medium
              text-black/50
              transition-colors

              hover:bg-black/[0.03]

              disabled:opacity-50
            "
          >
            <LogOut
              className="
                h-4
                w-4
              "
            />

            {loggingOut
              ? "Saindo..."
              : "Sair"}
          </button>
        </header>

        {/* PAGE */}

        <main
          className="
            w-full
            min-w-0
            px-4
            py-5

            sm:px-6
            sm:py-6

            lg:px-8
            lg:py-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly: boolean;
};

function SidebarContent({
  pathname,
  navigation,
  userName,
  userRole,
  loggingOut,
  onLogout,
  mobile = false,
}: {
  pathname: string;

  navigation:
    NavigationItem[];

  userName: string;

  userRole:
    | "admin"
    | "professional";

  loggingOut: boolean;

  onLogout:
    () => void;

  mobile?: boolean;
}) {
  return (
    <>
      {/* BRAND DESKTOP */}

      {!mobile && (
        <div
          className="
            flex
            h-[78px]
            shrink-0
            items-center
            border-b
            border-white/10
            px-5
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-11
                w-11
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
                  text-sm
                  font-semibold
                  text-[#C9A227]
                "
              >
                AS
              </span>
            </div>

            <div>
              <p
                className="
                  font-serif
                  text-lg
                  font-semibold
                  leading-none
                "
              >
                Arrasou
              </p>

              <p
                className="
                  mt-1.5
                  text-[8px]
                  font-bold
                  uppercase
                  tracking-[0.22em]
                  text-[#C9A227]
                "
              >
                Administração
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGAÇÃO */}

      <nav
        className="
          flex-1
          overflow-y-auto
          px-3
          py-5
        "
      >
        <div
          className="
            space-y-1
          "
        >
          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                pathname ===
                  item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={`
                    flex
                    min-h-11
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    text-sm
                    font-medium
                    transition-colors

                    ${
                      active
                        ? "bg-[#C9A227] text-black"
                        : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                    }
                  `}
                >
                  <Icon
                    className="
                      h-[18px]
                      w-[18px]
                      shrink-0
                    "
                  />

                  {
                    item.label
                  }
                </Link>
              );
            }
          )}
        </div>
      </nav>

      {/* USUÁRIO */}

      <div
        className="
          shrink-0
          border-t
          border-white/10
          p-4
        "
      >
        <div
          className="
            flex
            items-center
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
              rounded-full
              border
              border-[#C9A227]/30
              bg-white/[0.03]
            "
          >
            <UserRound
              className="
                h-4
                w-4
                text-[#C9A227]
              "
            />
          </div>

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <p
              className="
                truncate
                text-xs
                font-semibold
                text-white
              "
            >
              {userName}
            </p>

            <p
              className="
                mt-1
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-white/30
              "
            >
              {userRole ===
              "admin"
                ? "Administrador"
                : "Profissional"}
            </p>
          </div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={
              onLogout
            }
            disabled={
              loggingOut
            }
            className="
              mt-4
              flex
              min-h-11
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-white/10
              text-sm
              font-medium
              text-white/55

              active:bg-white/[0.05]

              disabled:opacity-50
            "
          >
            <LogOut
              className="
                h-4
                w-4
              "
            />

            {loggingOut
              ? "Saindo..."
              : "Sair"}
          </button>
        )}
      </div>
    </>
  );
}