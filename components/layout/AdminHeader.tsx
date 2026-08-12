"use client";

import { useRouter } from "next/navigation";

import {
  LogOut,
  Menu,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "professional";
  active: boolean;
};

type AdminHeaderProps = {
  profile: Profile;
};

export default function AdminHeader({
  profile,
}: AdminHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-[72px]
        items-center
        justify-between
        border-b
        border-black/10
        bg-white/90
        px-4
        backdrop-blur-xl

        sm:px-6
        lg:px-8
      "
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-black/10

            lg:hidden
          "
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-sm font-semibold text-[#111]">
            Olá, {profile.full_name}
          </p>

          <p className="mt-0.5 text-xs text-black/40">
            Studio Arrasou Sobrancelhas
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="
          flex
          items-center
          gap-2
          rounded-xl
          border
          border-black/10
          px-4
          py-2.5
          text-sm
          font-medium
          text-black/60
          transition-colors

          hover:border-red-200
          hover:bg-red-50
          hover:text-red-600
        "
      >
        <LogOut className="h-4 w-4" />

        <span className="hidden sm:inline">
          Sair
        </span>
      </button>
    </header>
  );
}