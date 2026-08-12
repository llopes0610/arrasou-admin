import AgendaCalendar from "@/components/agenda/AgendaCalendar";

import { createClient } from "@/lib/supabase/server";

export default async function AgendaPage() {
  const supabase = await createClient();

  const { data: claimsData } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (!userId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role,
      active
    `)
    .eq("id", userId)
    .single();

  return (
    <div>
      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <p className="text-sm text-black/40">
            Gestão de atendimentos
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
            Agenda
          </h1>

          <p className="mt-2 text-sm text-black/45">
            Visualize e gerencie os horários do Studio Arrasou.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AgendaCalendar
          currentUserRole={
            profile?.role ?? "professional"
          }
        />
      </div>
    </div>
  );
}