-- Harmonia Care 2026 - migração aditiva e não destrutiva
-- Classificação regulatória e duração terapêutica são conceitos separados.

alter table if exists public.medicacoes
  add column if not exists classificacao_medicamento text default 'comum',
  add column if not exists duracao_tipo text default 'continuo',
  add column if not exists data_inicio date,
  add column if not exists data_fim date,
  add column if not exists dias_tratamento integer,
  add column if not exists via_administracao text,
  add column if not exists frequencia text,
  add column if not exists observacoes text,
  add column if not exists prescritor text,
  add column if not exists prescricao_numero text,
  add column if not exists prescricao_validade date,
  add column if not exists suspenso_em timestamptz,
  add column if not exists finalizado_em timestamptz,
  add column if not exists status_tratamento text default 'ativo',
  add column if not exists historico_status jsonb default '[]'::jsonb;

alter table if exists public.medicacoes_modelo
  add column if not exists classificacao_medicamento text default 'comum',
  add column if not exists duracao_tipo text default 'continuo',
  add column if not exists via_administracao text,
  add column if not exists frequencia text,
  add column if not exists observacoes text;

-- Valores aceitos sem bloquear cadastros antigos.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='medicacoes') then
    if not exists (select 1 from pg_constraint where conname='medicacoes_classificacao_ck') then
      alter table public.medicacoes add constraint medicacoes_classificacao_ck
        check (classificacao_medicamento in ('comum','controlado','controle_especial')) not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname='medicacoes_duracao_ck') then
      alter table public.medicacoes add constraint medicacoes_duracao_ck
        check (duracao_tipo in ('continuo','temporario')) not valid;
    end if;
    if not exists (select 1 from pg_constraint where conname='medicacoes_status_tratamento_ck') then
      alter table public.medicacoes add constraint medicacoes_status_tratamento_ck
        check (status_tratamento in ('ativo','suspenso','finalizado')) not valid;
    end if;
  end if;
end $$;

create index if not exists idx_medicacoes_paciente_status_periodo
  on public.medicacoes (paciente_id, ativo, status_tratamento, data_inicio, data_fim);

create index if not exists idx_pacientes_profissionais_usuario_ativo
  on public.pacientes_profissionais (usuario_id, ativo);

comment on column public.medicacoes.classificacao_medicamento is 'Classificação: comum, controlado ou controle_especial';
comment on column public.medicacoes.duracao_tipo is 'Duração terapêutica: continuo ou temporario';
comment on column public.medicacoes.data_fim is 'Medicamento temporário deixa de aparecer nas rotinas após esta data, preservando o histórico';
