"use client";

import type { ElementType, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  Phone,
  RefreshCw,
  Pencil,
  Save,
  UserRound,
  UserX,
  WandSparkles,
  X,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import RescheduleAppointmentModal from "./RescheduleAppointmentModal";
import AppointmentAnamnesisCard from "./AppointmentAnamnesisCard";

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "canceled"
  | "no_show";

type PaymentMethod =
  | "pix"
  | "cash"
  | "credit_card"
  | "debit_card"
  | "other";

type AppointmentDetailsModalProps = {
  open: boolean;
  appointmentId: string | null;
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
};

type ClientRelation = {
  id: string;
  full_name: string;
  phone: string | null;
};

type ProfessionalRelation = {
  id: string;
  display_name: string;
};

type Professional = {
  id: string;
  display_name: string;
};

type Service = {
  id: string;
  name: string;
  price: number | string;
  duration_minutes: number;
  active: boolean;
};

type ProfessionalServiceQueryRow = {
  professional_id: string;
  service_id: string;
  commission_percentage: number | string | null;
  active: boolean;
  services: Service | Service[] | null;
};

type ProfessionalService = {
  professional_id: string;
  service_id: string;
  commission_percentage: number | string | null;
  active: boolean;
  service: Service;
};

type SupabaseRelation<T> =
  | T
  | T[]
  | null;

function getRelation<T>(
  relation: SupabaseRelation<T>
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

type AppointmentService = {
  id: string;
  service_id: string;
  service_name: string;
  unit_price: number | string;
  commission_percentage: number | string;
};

type AppointmentDetails = {
  id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  notes: string | null;
  payment_method: PaymentMethod | null;
  completed_at: string | null;
  clients: SupabaseRelation<ClientRelation>;
  professionals: SupabaseRelation<ProfessionalRelation>;
  appointment_services: AppointmentService[];
};

export default function AppointmentDetailsModal({
  open,
  appointmentId,
  onClose,
  onUpdated,
}: AppointmentDetailsModalProps) {
  const supabase = useMemo(() => createClient(), []);

  const [appointment, setAppointment] =
    useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalService[]>([]);
  const [editProfessionalId, setEditProfessionalId] = useState("");
  const [editServiceId, setEditServiceId] = useState("");

  const [
    showReschedule,
    setShowReschedule,
  ] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("pix");

  const loadAppointment = useCallback(async () => {
    if (!appointmentId) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: appointmentError } = await supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          end_at,
          status,
          notes,
          payment_method,
          completed_at,
          clients (
            id,
            full_name,
            phone
          ),
          professionals (
            id,
            display_name
          ),
          appointment_services (
            id,
            service_id,
            service_name,
            unit_price,
            commission_percentage
          )
        `)
        .eq("id", appointmentId)
        .single();

      if (appointmentError) {
        throw appointmentError;
      }

      const loaded = data as unknown as AppointmentDetails;
      setAppointment(loaded);

      const loadedProfessional = getRelation(loaded.professionals);
      setEditProfessionalId(loadedProfessional?.id ?? "");
      setEditServiceId(loaded.appointment_services?.[0]?.service_id ?? "");
    } catch (loadError) {
      console.error("Erro ao carregar atendimento:", loadError);
      setAppointment(null);
      setError("Não foi possível carregar o atendimento.");
    } finally {
      setLoading(false);
    }
  }, [appointmentId, supabase]);

  useEffect(() => {
    if (!open) return;
    void loadAppointment();
  }, [open, loadAppointment]);

  useEffect(() => {
    if (open) return;

    setAppointment(null);
    setError("");
    setSuccess("");
    setShowComplete(false);
    setShowEdit(false);
    setShowReschedule(false);
    setPaymentMethod("pix");
  }, [open]);


  const loadEditOptions = useCallback(async () => {
    try {
      const [professionalsResult, servicesResult] = await Promise.all([
        supabase
          .from("professionals")
          .select("id, display_name")
          .eq("active", true)
          .order("display_name"),
        supabase
          .from("professional_services")
          .select(`
            professional_id,
            service_id,
            commission_percentage,
            active,
            services (
              id,
              name,
              price,
              duration_minutes,
              active
            )
          `)
          .eq("active", true),
      ]);

      if (professionalsResult.error) throw professionalsResult.error;
      if (servicesResult.error) throw servicesResult.error;

      setProfessionals((professionalsResult.data ?? []) as Professional[]);

      const rows = (servicesResult.data ?? []) as unknown as ProfessionalServiceQueryRow[];
      const normalized = rows
        .map((row): ProfessionalService | null => {
          const service = Array.isArray(row.services) ? row.services[0] : row.services;
          if (!service) return null;
          return {
            professional_id: row.professional_id,
            service_id: row.service_id,
            commission_percentage: row.commission_percentage,
            active: row.active,
            service,
          };
        })
        .filter((row): row is ProfessionalService => row !== null);

      setProfessionalServices(normalized);
    } catch (loadError) {
      console.error("Erro ao carregar opções de edição:", loadError);
      setError("Não foi possível carregar profissionais e serviços para edição.");
    }
  }, [supabase]);

  useEffect(() => {
    if (!showEdit) return;
    void loadEditOptions();
  }, [showEdit, loadEditOptions]);

  const editAvailableServices = useMemo(() => {
    const byId = new Map<string, Service>();
    professionalServices
      .filter(
        (item) =>
          item.professional_id === editProfessionalId &&
          item.active &&
          item.service.active
      )
      .forEach((item) => byId.set(item.service.id, item.service));
    return Array.from(byId.values());
  }, [professionalServices, editProfessionalId]);

  function openEdit() {
    if (!appointment) return;
    const currentProfessional = getRelation(appointment.professionals);
    setEditProfessionalId(currentProfessional?.id ?? "");
    setEditServiceId(appointment.appointment_services?.[0]?.service_id ?? "");
    setError("");
    setSuccess("");
    setShowEdit(true);
  }

  function cancelEdit() {
    setShowEdit(false);
    setError("");
  }

  async function saveAppointmentEdit() {
    if (!appointment) return;

    if (!editProfessionalId || !editServiceId) {
      setError("Selecione a profissional e o serviço.");
      return;
    }

    const serviceAllowed = professionalServices.some(
      (item) =>
        item.professional_id === editProfessionalId &&
        item.service_id === editServiceId &&
        item.active &&
        item.service.active
    );

    if (!serviceAllowed) {
      setError("O serviço selecionado não está disponível para esta profissional.");
      return;
    }

    setEditLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: rpcError } = await supabase.rpc("update_appointment_details", {
        p_appointment_id: appointment.id,
        p_professional_id: editProfessionalId,
        p_service_id: editServiceId,
      });

      if (rpcError) {
        const message = rpcError.message.toLowerCase();
        if (
          message.includes("appointments_no_professional_overlap") ||
          message.includes("conflicting key value") ||
          message.includes("exclusion constraint")
        ) {
          setError("Essa profissional já possui um atendimento nesse horário.");
          return;
        }
        throw rpcError;
      }

      setShowEdit(false);
      setSuccess("Profissional e serviço atualizados com sucesso.");
      await loadAppointment();
      await onUpdated();
    } catch (saveError) {
      console.error("Erro ao editar agendamento:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível atualizar o agendamento."
      );
    } finally {
      setEditLoading(false);
    }
  }

  async function updateStatus(status: AppointmentStatus) {
    if (!appointment) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointment.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(getStatusSuccessMessage(status));
      await loadAppointment();
      await onUpdated();
    } catch (updateError) {
      console.error("Erro ao alterar status:", updateError);
      setError("Não foi possível atualizar o atendimento.");
    } finally {
      setActionLoading(false);
    }
  }

  async function completeAppointment() {
    if (!appointment) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: completeError } = await supabase.rpc(
        "complete_appointment",
        {
          p_appointment_id: appointment.id,
          p_payment_method: paymentMethod,
        }
      );

      if (completeError) {
        throw completeError;
      }

      setSuccess(
        "Atendimento concluído e faturamento registrado com sucesso."
      );
      setShowComplete(false);
      await loadAppointment();
      await onUpdated();
    } catch (completeError) {
      console.error("Erro ao concluir atendimento:", completeError);
      setError("Não foi possível concluir o atendimento.");
    } finally {
      setActionLoading(false);
    }
  }

  const client =
    appointment
      ? getRelation(
          appointment.clients
        )
      : null;

  const professional =
    appointment
      ? getRelation(
          appointment.professionals
        )
      : null;

  const grossTotal =
    appointment?.appointment_services.reduce(
      (total, service) => total + Number(service.unit_price),
      0
    ) ?? 0;

  const professionalTotal =
    appointment?.appointment_services.reduce(
      (total, service) =>
        total +
        Number(service.unit_price) *
          (Number(service.commission_percentage) / 100),
      0
    ) ?? 0;

  const studioTotal = grossTotal - professionalTotal;

  if (!open || !appointmentId) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[110] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => {
        if (!actionLoading) onClose();
      }}
    >
      <div
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C9A227]">
              Atendimento
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-[#111]">
              Detalhes do agendamento
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black/45 hover:bg-black/[0.03] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#C9A227]" />
            </div>
          ) : !appointment ? (
            <div className="py-12 text-center text-sm text-black/40">
              {error || "Atendimento não encontrado."}
            </div>
          ) : (
            <div className="space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAFAF8] p-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
                    Status
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={appointment.status} />
                  </div>
                </div>

                <p className="text-right text-xs text-black/40">
                  {formatDate(appointment.start_at)}
                </p>
              </div>

              <InfoSection title="Cliente" icon={UserRound}>
                <p className="text-sm font-semibold text-[#111]">
                  {client?.full_name ?? "Cliente"}
                </p>
                {client?.phone && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-black/45">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
              </InfoSection>

              <InfoSection title="Profissional" icon={UserRound}>
                {showEdit ? (
                  <select
                    value={editProfessionalId}
                    onChange={(event) => {
                      const nextProfessional = event.target.value;
                      setEditProfessionalId(nextProfessional);
                      const currentStillAllowed = professionalServices.some(
                        (item) =>
                          item.professional_id === nextProfessional &&
                          item.service_id === editServiceId &&
                          item.active &&
                          item.service.active
                      );
                      if (!currentStillAllowed) setEditServiceId("");
                    }}
                    disabled={editLoading}
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-[#111] outline-none focus:border-[#C9A227] disabled:opacity-60"
                  >
                    <option value="">Selecione a profissional</option>
                    {professionals.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.display_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-[#111]">
                    {professional?.display_name ?? "Profissional"}
                  </p>
                )}
              </InfoSection>

              {client && (
                <AppointmentAnamnesisCard
                  appointmentId={
                    appointment.id
                  }
                  clientId={
                    client.id
                  }
                  clientName={
                    client.full_name
                  }
                  clientPhone={
                    client.phone
                  }
                />
              )}

              <InfoSection title="Data e horário" icon={CalendarDays}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    label="Início"
                    value={formatTime(appointment.start_at)}
                  />
                  <InfoCard
                    label="Término"
                    value={formatTime(appointment.end_at)}
                  />
                </div>
              </InfoSection>

              <InfoSection title="Serviço" icon={WandSparkles}>
                {showEdit ? (
                  <div>
                    <select
                      value={editServiceId}
                      onChange={(event) => setEditServiceId(event.target.value)}
                      disabled={!editProfessionalId || editLoading}
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-[#111] outline-none focus:border-[#C9A227] disabled:opacity-60"
                    >
                      <option value="">Selecione o serviço</option>
                      {editAvailableServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} • {formatCurrency(Number(service.price))}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs leading-5 text-black/40">
                      Ao salvar, o valor, a comissão e a duração serão recalculados de acordo com o serviço selecionado.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointment.appointment_services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-black/10 p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#111]">
                            {service.service_name}
                          </p>
                          <p className="mt-1 text-xs text-black/40">
                            Comissão: {Number(service.commission_percentage)}%
                          </p>
                        </div>
                        <strong className="text-sm text-[#111]">
                          {formatCurrency(Number(service.unit_price))}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </InfoSection>

              <InfoSection
                title={
                  appointment.status === "completed"
                    ? "Financeiro"
                    : "Valores previstos"
                }
                icon={CircleDollarSign}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoCard label="Total" value={formatCurrency(grossTotal)} />
                  <InfoCard
                    label="Profissional"
                    value={formatCurrency(professionalTotal)}
                  />
                  <InfoCard
                    label="Studio"
                    value={formatCurrency(studioTotal)}
                    highlight
                  />
                </div>
              </InfoSection>

              {appointment.notes && (
                <InfoSection title="Observações" icon={Clock3}>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-black/55">
                    {appointment.notes}
                  </p>
                </InfoSection>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  {success}
                </div>
              )}

              {showComplete && appointment.status !== "completed" && (
                <div className="rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/5 p-5">
                  <p className="font-serif text-xl font-semibold text-[#111]">
                    Concluir atendimento
                  </p>
                  <p className="mt-2 text-xs leading-5 text-black/45">
                    Ao concluir, o atendimento será contabilizado no
                    faturamento e a comissão da profissional será calculada.
                  </p>

                  <label className="mt-5 block text-xs font-semibold text-black/55">
                    Forma de pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as PaymentMethod)
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-[#111] outline-none focus:border-[#C9A227]"
                  >
                    <option value="pix">PIX</option>
                    <option value="cash">Dinheiro</option>
                    <option value="credit_card">Cartão de crédito</option>
                    <option value="debit_card">Cartão de débito</option>
                    <option value="other">Outro</option>
                  </select>

                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowComplete(false)}
                      disabled={actionLoading}
                      className="h-11 rounded-xl border border-black/10 px-5 text-sm font-medium text-black/55 disabled:opacity-50"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={completeAppointment}
                      disabled={actionLoading}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-5 text-sm font-semibold text-black disabled:opacity-60"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Confirmar conclusão
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!loading && appointment && !showComplete && (
          <div className="shrink-0 border-t border-black/10 bg-white px-5 py-4 sm:px-6">
            {(appointment.status === "scheduled" || appointment.status === "confirmed") && (
              showEdit ? (
                <div className="mb-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={editLoading}
                    className="flex h-11 items-center justify-center rounded-xl border border-black/10 text-sm font-semibold text-black/55 disabled:opacity-50"
                  >
                    Cancelar edição
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveAppointmentEdit()}
                    disabled={editLoading || !editProfessionalId || !editServiceId}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar alterações
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openEdit}
                  disabled={actionLoading}
                  className="mb-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-semibold text-black/65 transition-all hover:bg-black/[0.03] disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4" />
                  Editar profissional e serviço
                </button>
              )
            )}

            {appointment.status !== "completed" && !showEdit && (
              <button
                type="button"
                onClick={() => setShowReschedule(true)}
                disabled={actionLoading}
                className="mb-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#C9A227]/40 bg-[#C9A227]/5 text-sm font-semibold text-[#8A6D0A] transition-all hover:bg-[#C9A227]/10 disabled:opacity-50"
              >
                <CalendarDays className="h-4 w-4" />
                Remarcar atendimento
              </button>
            )}

            {!showEdit &&
              appointment.status !== "completed" &&
              appointment.status !== "canceled" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {appointment.status === "scheduled" && (
                    <ActionButton
                      label="Confirmar"
                      icon={CheckCircle2}
                      onClick={() => void updateStatus("confirmed")}
                      disabled={actionLoading}
                    />
                  )}

                  <ActionButton
                    label="Concluir"
                    icon={Check}
                    gold
                    onClick={() => setShowComplete(true)}
                    disabled={actionLoading}
                  />

                  <ActionButton
                    label="Marcar falta"
                    icon={UserX}
                    onClick={() => void updateStatus("no_show")}
                    disabled={actionLoading}
                  />

                  <ActionButton
                    label="Cancelar"
                    icon={XCircle}
                    danger
                    onClick={() => void updateStatus("canceled")}
                    disabled={actionLoading}
                  />
                </div>
              )}

            {!showEdit && appointment.status === "canceled" && (
              <button
                type="button"
                onClick={() => void updateStatus("scheduled")}
                disabled={actionLoading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-semibold text-black/60 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Reativar agendamento
              </button>
            )}
          </div>
        )}
      </div>
    </div>

      <RescheduleAppointmentModal
        open={
          showReschedule
        }
        appointmentId={
          appointment?.id ??
          null
        }
        currentStartAt={
          appointment?.start_at ??
          null
        }
        currentEndAt={
          appointment?.end_at ??
          null
        }
        clientName={
          client?.full_name ??
          "Cliente"
        }
        serviceName={
          appointment
            ?.appointment_services?.[0]
            ?.service_name ??
          "Atendimento"
        }
        onClose={() =>
          setShowReschedule(
            false
          )
        }
        onUpdated={async () => {
          setSuccess(
            "Atendimento remarcado com sucesso."
          );

          await loadAppointment();

          await onUpdated();
        }}
      />
    </>
  );
}

function InfoSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#C9A227]" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function InfoCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-[#F8F1D9]" : "bg-[#FAFAF8]"}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-black/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#111]">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  gold = false,
  danger = false,
}: {
  label: string;
  icon: ElementType;
  onClick: () => void;
  disabled: boolean;
  gold?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
        gold
          ? "border-[#C9A227] bg-[#C9A227] text-black hover:bg-[#E0C56E]"
          : danger
            ? "border-red-200 text-red-600 hover:bg-red-50"
            : "border-black/10 text-black/60 hover:bg-black/[0.03]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = {
    scheduled: {
      label: "Agendado",
      className: "bg-[#F8F1D9] text-[#8A6D0A]",
    },
    confirmed: {
      label: "Confirmado",
      className: "bg-[#111] text-white",
    },
    completed: {
      label: "Concluído",
      className: "bg-green-100 text-green-700",
    },
    canceled: {
      label: "Cancelado",
      className: "bg-red-100 text-red-700",
    },
    no_show: {
      label: "Faltou",
      className: "bg-amber-100 text-amber-800",
    },
  }[status];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function getStatusSuccessMessage(status: AppointmentStatus) {
  switch (status) {
    case "confirmed":
      return "Atendimento confirmado.";
    case "canceled":
      return "Agendamento cancelado.";
    case "no_show":
      return "Atendimento marcado como falta.";
    case "scheduled":
      return "Agendamento reativado.";
    default:
      return "Atendimento atualizado.";
  }
}