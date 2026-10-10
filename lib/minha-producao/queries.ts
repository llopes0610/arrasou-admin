import { createClient } from "@/lib/supabase/server";

export type ProductionEntry = {
  id: string;
  appointmentId: string | null;
  date: string;
  service: string;
  gross: number;
  percentage: number;
  commission: number;
  settlementId: string | null;
  settlementStatus: string | null;
};

export type ProductionSettlement = {
  id: string;
  periodStart: string;
  periodEnd: string;
  commission: number;
  gross: number;
  status: string;
  paidAt: string | null;
  itemCount: number;
};

async function fetchAll<T>(
  getPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const result: T[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await getPage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    result.push(...page);
    if (page.length < pageSize) break;
  }
  return result;
}

export async function getMyProduction(professionalId: string) {
  // Executar apenas após requireProfessionalAccess(). O RLS aplica o mesmo vínculo no banco.
  const supabase = await createClient();

  const [entries, settlements] = await Promise.all([
    fetchAll((from, to) =>
      supabase.from("financial_entries")
        .select("id, appointment_id, service_name, gross_amount, commission_percentage, professional_amount, created_at")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    ),
    fetchAll((from, to) =>
      supabase.from("commission_settlements")
        .select("id, period_start, period_end, gross_amount, commission_amount, status, paid_at")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    ),
  ]);

  const entryIds = entries.map((e) => e.id);
  const settlementIds = settlements.map((s) => s.id);

  // Evita URLs de consulta excessivamente grandes no PostgREST.
  const items: Array<{ settlement_id: string; financial_entry_id: string }> = [];
  for (let i = 0; i < settlementIds.length; i += 100) {
    const ids = settlementIds.slice(i, i + 100);
    const chunk = await fetchAll((from, to) =>
      supabase.from("commission_settlement_items")
        .select("settlement_id, financial_entry_id")
        .in("settlement_id", ids)
        .order("financial_entry_id", { ascending: true })
        .range(from, to),
    );
    items.push(...chunk);
  }

  // Data do atendimento vem de appointments.start_at, não de financial_entries.created_at.
  const appointmentIds = [...new Set(entries.map((e) => e.appointment_id).filter((id): id is string => Boolean(id)))];
  const appointments: Array<{ id: string; start_at: string }> = [];
  for (let i = 0; i < appointmentIds.length; i += 100) {
    const ids = appointmentIds.slice(i, i + 100);
    const chunk = await fetchAll((from, to) =>
      supabase.from("appointments")
        .select("id, start_at")
        .in("id", ids)
        .range(from, to),
    );
    appointments.push(...chunk);
  }

  const appointmentDates = new Map(appointments.map((a) => [a.id, a.start_at]));
  const settlementMap = new Map(settlements.map((s) => [s.id, s]));
  const entrySettlement = new Map<string, string>();
  const settlementCount = new Map<string, number>();
  for (const item of items) {
    if (entrySettlement.has(item.financial_entry_id)) {
      throw new Error("Lançamento financeiro associado a mais de um fechamento.");
    }
    entrySettlement.set(item.financial_entry_id, item.settlement_id);
    settlementCount.set(item.settlement_id, (settlementCount.get(item.settlement_id) ?? 0) + 1);
  }

  const productionEntries: ProductionEntry[] = entries.map((entry) => {
    const settlementId = entrySettlement.get(entry.id) ?? null;
    const settlement = settlementId ? settlementMap.get(settlementId) : null;
    return {
      id: entry.id,
      appointmentId: entry.appointment_id,
      date: (entry.appointment_id && appointmentDates.get(entry.appointment_id)) || entry.created_at,
      service: entry.service_name,
      gross: Number(entry.gross_amount ?? 0),
      percentage: Number(entry.commission_percentage ?? 0),
      commission: Number(entry.professional_amount ?? 0),
      settlementId,
      settlementStatus: settlement?.status ?? null,
    };
  });

  const productionSettlements: ProductionSettlement[] = settlements.map((s) => ({
    id: s.id,
    periodStart: s.period_start,
    periodEnd: s.period_end,
    gross: Number(s.gross_amount ?? 0),
    commission: Number(s.commission_amount ?? 0),
    status: s.status,
    paidAt: s.paid_at,
    itemCount: settlementCount.get(s.id) ?? 0,
  }));

  return { entries: productionEntries, settlements: productionSettlements };
}
