export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled";

export type Appointment = {
  id: string;

  client_id: string | null;
  professional_id: string;
  service_id: string;

  client_name: string;
  client_phone: string | null;

  start_at: string;
  end_at: string;

  status: AppointmentStatus;

  notes: string | null;

  price: number;

  commission_percentage: number;
  commission_amount: number;
  studio_amount: number;

  created_at: string;
  updated_at: string;
};