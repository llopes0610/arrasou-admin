-- ============================================================
-- SINAL DO AGENDAMENTO
--
-- Registra que a cliente pagou um sinal (valor padrão R$ 20,
-- editável). Informativo: não altera financial_entries,
-- comissões nem fechamentos.
--
-- Quem registra: admin e recepção (mesma regra das políticas
-- *_andressa e de reception_create_appointment).
-- Quem visualiza: todos que já enxergam o agendamento.
--
-- Rodar no SQL Editor do Supabase ANTES do deploy do front-end.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Colunas
-- ------------------------------------------------------------

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deposit_recorded_by UUID
        REFERENCES public.profiles (id);

ALTER TABLE public.appointments
    DROP CONSTRAINT IF EXISTS appointments_deposit_amount_positive,
    ADD CONSTRAINT appointments_deposit_amount_positive
        CHECK (deposit_amount IS NULL OR deposit_amount > 0),
    DROP CONSTRAINT IF EXISTS appointments_deposit_consistent,
    ADD CONSTRAINT appointments_deposit_consistent
        CHECK ((deposit_amount IS NULL) = (deposit_paid_at IS NULL));


-- ------------------------------------------------------------
-- 2. Recepção
--
-- Mesma regra já usada em appointments_*_andressa e em
-- reception_create_appointment. Não altera essas políticas.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.is_reception()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT
        (SELECT auth.uid()) = 'e4a48918-8e8b-41a9-8dbc-4c28c7c3003d'::uuid
        AND EXISTS (
            SELECT 1
            FROM public.profiles AS p
            WHERE p.id = (SELECT auth.uid())
              AND p.active = TRUE
              AND p.role = 'professional'
              AND p.access_scope = 'agenda_only'
        );
$function$;

REVOKE ALL ON FUNCTION private.is_reception() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_reception() TO authenticated;


-- ------------------------------------------------------------
-- 3. Trava: só admin e recepção alteram o sinal
--
-- A política appointments_update deixa a profissional atualizar
-- os próprios agendamentos; esconder o botão não basta.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.guard_appointment_deposit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.deposit_amount IS NULL
           AND NEW.deposit_paid_at IS NULL
           AND NEW.deposit_recorded_by IS NULL THEN
            RETURN NEW;
        END IF;
    ELSIF NEW.deposit_amount IS NOT DISTINCT FROM OLD.deposit_amount
       AND NEW.deposit_paid_at IS NOT DISTINCT FROM OLD.deposit_paid_at
       AND NEW.deposit_recorded_by IS NOT DISTINCT FROM OLD.deposit_recorded_by THEN
        RETURN NEW;
    END IF;

    -- Execuções sem usuário (SQL Editor / service_role) passam.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT (private.is_admin() OR private.is_reception()) THEN
        RAISE EXCEPTION 'Sem permissão para alterar o sinal do agendamento.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS appointments_guard_deposit ON public.appointments;

CREATE TRIGGER appointments_guard_deposit
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION private.guard_appointment_deposit();


-- ------------------------------------------------------------
-- 4. Registrar / remover sinal
--
-- p_amount NULL remove o sinal.
-- SECURITY INVOKER: o UPDATE continua sujeito ao RLS.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_appointment_deposit(
    p_appointment_id uuid,
    p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT (private.is_admin() OR private.is_reception()) THEN
        RAISE EXCEPTION 'Sem permissão para alterar o sinal do agendamento.'
            USING ERRCODE = '42501';
    END IF;

    IF p_amount IS NOT NULL AND p_amount <= 0 THEN
        RAISE EXCEPTION 'Informe um valor de sinal maior que zero.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.appointments
    SET
        deposit_amount = ROUND(p_amount, 2),
        deposit_paid_at = CASE WHEN p_amount IS NULL THEN NULL ELSE now() END,
        deposit_recorded_by = CASE WHEN p_amount IS NULL THEN NULL ELSE auth.uid() END
    WHERE id = p_appointment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agendamento não encontrado.'
            USING ERRCODE = 'P0002';
    END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_appointment_deposit(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_appointment_deposit(uuid, numeric) TO authenticated, service_role;


-- ------------------------------------------------------------
-- 5. reception_create_appointment passa a devolver o id
--
-- Necessário para registrar o sinal logo após criar.
-- Corpo idêntico ao atual; só muda o retorno (void -> uuid).
-- O front-end atual ignora o retorno, então é compatível.
-- ------------------------------------------------------------

DROP FUNCTION public.reception_create_appointment(
    uuid, text, text, uuid, uuid, timestamp with time zone, text
);

CREATE FUNCTION public.reception_create_appointment(
    p_client_id uuid,
    p_client_name text,
    p_client_phone text,
    p_professional_id uuid,
    p_service_id uuid,
    p_start_at timestamp with time zone,
    p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog, public, pg_temp'
AS $function$
BEGIN
    IF auth.uid() IS DISTINCT FROM
        'e4a48918-8e8b-41a9-8dbc-4c28c7c3003d'::uuid
       OR NOT EXISTS (
            SELECT 1
            FROM public.profiles AS perfil
            WHERE perfil.id = auth.uid()
              AND perfil.active = TRUE
              AND perfil.role = 'professional'
              AND perfil.access_scope = 'agenda_only'
       )
    THEN
        RAISE EXCEPTION 'Sem permissão para agendar pela recepção.'
          USING ERRCODE = '42501';
    END IF;

    IF p_start_at IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.professional_services AS ps
        JOIN public.professionals AS p
          ON p.id = ps.professional_id
        JOIN public.services AS s
          ON s.id = ps.service_id
        WHERE ps.professional_id = p_professional_id
          AND ps.service_id = p_service_id
          AND ps.active = TRUE
          AND p.active = TRUE
          AND s.active = TRUE
          AND p.profile_id IS DISTINCT FROM auth.uid()
    ) THEN
        RAISE EXCEPTION 'Profissional ou serviço indisponível para agendamento.'
          USING ERRCODE = '22023';
    END IF;

    -- Mantém intactas as regras da função de criação já existente.
    RETURN public.create_appointment(
        p_client_id,
        p_client_name,
        p_client_phone,
        p_professional_id,
        p_service_id,
        p_start_at,
        p_notes
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.reception_create_appointment(
    uuid, text, text, uuid, uuid, timestamp with time zone, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.reception_create_appointment(
    uuid, text, text, uuid, uuid, timestamp with time zone, text
) TO authenticated, service_role;

COMMIT;
