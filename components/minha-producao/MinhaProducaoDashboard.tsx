"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, HandCoins, Wallet } from "lucide-react";
import type { ProductionEntry, ProductionSettlement } from "@/lib/minha-producao/queries";

type Period = "week" | "month" | "all";
const zone = "America/Sao_Paulo";
const money = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: zone, day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: zone, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
function localDay(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const part = (key: string) => parts.find((p) => p.type === key)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function weekStart(today: string) {
  const date = new Date(`${today}T12:00:00Z`);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
  return date.toISOString().slice(0, 10);
}
function matchesPeriod(day: string, period: Period, today: string) {
  if (period === "all") return true;
  if (period === "month") return day.slice(0, 7) === today.slice(0, 7);
  return day >= weekStart(today) && day <= today;
}
function status(entry: ProductionEntry) {
  if (!entry.settlementId) return { text: "A receber", className: "bg-amber-50 text-amber-800" };
  if (entry.settlementStatus === "paid") return { text: "Pago", className: "bg-emerald-50 text-emerald-800" };
  return { text: "Em fechamento", className: "bg-slate-100 text-slate-700" };
}
function settlementStatus(value: string) {
  return value === "paid" ? "Pago" : value === "pending" ? "Pendente" : value === "canceled" ? "Cancelado" : value;
}

export default function MinhaProducaoDashboard({ professionalName, entries, settlements }: {
  professionalName: string;
  entries: ProductionEntry[];
  settlements: ProductionSettlement[];
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [tab, setTab] = useState<"services" | "settlements">("services");
  const [today] = useState(() => localDay(new Date().toISOString()));
  const filteredEntries = useMemo(() => entries.filter((e) => matchesPeriod(localDay(e.date), period, today)), [entries, period, today]);
  const filteredSettlements = useMemo(() => settlements.filter((s) => matchesPeriod(s.periodEnd, period, today)), [settlements, period, today]);
  const totals = useMemo(() => filteredEntries.reduce((acc, e) => {
    acc.gross += e.gross;
    acc.commission += e.commission;
    if (!e.settlementId) acc.pending += e.commission;
    else if (e.settlementStatus === "paid") acc.paid += e.commission;
    else acc.inSettlement += e.commission;
    return acc;
  }, { gross: 0, commission: 0, pending: 0, paid: 0, inSettlement: 0 }), [filteredEntries]);
  const sortedEntries = useMemo(() => [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date)), [filteredEntries]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A78325]">Área da profissional</p>
        <h1 className="font-serif text-3xl font-semibold text-[#171717]">Minha Produção</h1>
        <p className="text-sm text-neutral-500">Olá, {professionalName}. Acompanhe seus serviços e comissões.</p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtrar período">
        {([ ["week", "Esta semana"], ["month", "Este mês"], ["all", "Todo o histórico"] ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setPeriod(value)}
            className={`min-h-11 rounded-xl border px-4 text-sm font-medium transition-colors ${period === value ? "border-[#C9A227] bg-[#C9A227] text-black" : "border-neutral-200 bg-white text-neutral-600"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={CalendarDays} label="Produção" value={money(totals.gross)} />
        <Metric icon={HandCoins} label="Comissões geradas" value={money(totals.commission)} />
        <Metric icon={Clock3} label="A receber" value={money(totals.pending + totals.inSettlement)} subtitle={totals.inSettlement > 0 ? `${money(totals.inSettlement)} em fechamento` : undefined} />
        <Metric icon={CheckCircle2} label="Registrado como pago" value={money(totals.paid)} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex gap-1 border-b border-neutral-100 p-3">
          <button type="button" onClick={() => setTab("services")} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold ${tab === "services" ? "bg-[#111] text-white" : "text-neutral-500"}`}>Atendimentos ({filteredEntries.length})</button>
          <button type="button" onClick={() => setTab("settlements")} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold ${tab === "settlements" ? "bg-[#111] text-white" : "text-neutral-500"}`}>Fechamentos ({filteredSettlements.length})</button>
        </div>
        {tab === "services" ? (
          <div className="divide-y divide-neutral-100">
            {sortedEntries.length === 0 && <Empty text="Nenhum atendimento neste período." />}
            {sortedEntries.map((entry) => {
              const s = status(entry);
              return <div key={entry.id} className="flex items-start justify-between gap-3 p-4 sm:px-6">
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-sm font-semibold text-neutral-900">{entry.service}</p>
                  <p className="text-xs text-neutral-500">{dateTimeFormat.format(new Date(entry.date))} · Serviço: {money(entry.gross)} · {entry.percentage}%</p>
                  <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${s.className}`}>{s.text}</span>
                </div>
                <div className="shrink-0 text-right"><p className="text-sm font-bold text-neutral-900">{money(entry.commission)}</p><p className="text-[11px] text-neutral-400">Comissão</p></div>
              </div>;
            })}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredSettlements.length === 0 && <Empty text="Nenhum fechamento com término neste período." />}
            {filteredSettlements.map((s) => <div key={s.id} className="space-y-2 p-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-semibold text-neutral-900">{s.periodStart.split("-").reverse().join("/")} a {s.periodEnd.split("-").reverse().join("/")}</p>
                  <p className="mt-1 text-xs text-neutral-500">{s.itemCount} serviços · Produção {money(s.gross)}</p></div>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${s.status === "paid" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{settlementStatus(s.status)}</span>
              </div>
              <div className="flex items-end justify-between gap-2"><div className="text-xs text-neutral-500">{s.paidAt ? `Pagamento registrado: ${dateFormat.format(new Date(s.paidAt))}` : "Sem pagamento registrado"}</div><div className="text-base font-bold text-neutral-900">{money(s.commission)}</div></div>
            </div>)}
          </div>
        )}
      </div>
      <p className="flex items-start gap-2 text-xs leading-5 text-neutral-500"><Wallet className="mt-0.5 h-4 w-4 shrink-0" /> Os valores são calculados pelos lançamentos financeiros registrados. O filtro dos atendimentos usa a data do serviço; o de fechamentos usa o fim do período. “Pago” indica o status registrado pela administração.</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, subtitle }: { icon: typeof Wallet; label: string; value: string; subtitle?: string }) {
  return <div className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#C9A227]/10 text-[#9D7B1C]"><Icon className="h-4 w-4" /></div>
    <p className="text-xs text-neutral-500">{label}</p><p className="mt-1 break-words text-lg font-bold tracking-tight text-neutral-900 sm:text-2xl">{value}</p>
    {subtitle && <p className="mt-1 text-[11px] text-neutral-500">{subtitle}</p>}
  </div>;
}
function Empty({ text }: { text: string }) { return <p className="p-8 text-center text-sm text-neutral-500">{text}</p>; }
