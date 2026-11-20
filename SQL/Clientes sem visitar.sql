with visitas as (
  select
    a.client_id,
    count(distinct a.id)                                   as atendimentos,
    max(a.start_at)                                        as ultima_visita,
    sum(aps.unit_price)                                    as total_gasto
  from appointments a
  left join appointment_services aps on aps.appointment_id = a.id
  where a.status = 'completed'
  group by a.client_id
),
ultimo_atendimento as (
  select distinct on (a.client_id)
    a.client_id,
    pr.display_name                                        as ultima_profissional,
    (select string_agg(aps.service_name, ' + ')
       from appointment_services aps
      where aps.appointment_id = a.id)                     as ultimo_servico
  from appointments a
  left join professionals pr on pr.id = a.professional_id
  where a.status = 'completed'
  order by a.client_id, a.start_at desc
),
proximos as (
  select client_id, min(start_at) as proximo_agendamento
  from appointments
  where status in ('scheduled', 'confirmed')
    and start_at >= now()
  group by client_id
)
select
  c.full_name                                                       as cliente,
  c.phone                                                           as telefone,
  (v.ultima_visita at time zone 'America/Sao_Paulo')::date          as ultima_visita,
  (current_date - (v.ultima_visita at time zone 'America/Sao_Paulo')::date) as dias_sem_visitar,
  v.atendimentos,
  v.total_gasto,
  u.ultimo_servico,
  u.ultima_profissional
from clients c
join visitas v              on v.client_id = c.id
left join ultimo_atendimento u on u.client_id = c.id
left join proximos p        on p.client_id = c.id
where p.proximo_agendamento is null                                  -- sem horário marcado
  and v.ultima_visita < now() - interval '30 days'                   -- tempo sem visitar
order by dias_sem_visitar desc;