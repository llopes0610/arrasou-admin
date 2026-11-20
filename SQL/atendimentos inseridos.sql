select
  coalesce(p.full_name, '(sem usuário registrado)')                     as inserido_por,
  count(*)                                                              as agendamentos_inseridos,
  count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date) as dias_com_insercao,
  round(count(*)::numeric
        / count(distinct (a.created_at at time zone 'America/Sao_Paulo')::date), 1) as media_por_dia,
  min(a.created_at at time zone 'America/Sao_Paulo')                    as primeira_insercao,
  max(a.created_at at time zone 'America/Sao_Paulo')                    as ultima_insercao
from appointments a
left join profiles p on p.id = a.created_by
where a.created_at >= '2026-11-01 00:00:00-03'
  and a.created_at <  '2026-12-01 00:00:00-03'
group by 1
order by 2 desc;