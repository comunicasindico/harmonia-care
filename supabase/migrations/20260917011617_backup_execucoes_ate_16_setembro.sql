-- Authorized checkpoint before resetting execution marks through 2026-09-16.
-- Backup tables are private; no patient data or credentials are in this migration.
create schema harmonia_backup_private;
revoke all on schema harmonia_backup_private from public,anon,authenticated;
create table harmonia_backup_private.batches(id uuid primary key default gen_random_uuid(),empresa_id uuid not null,cutoff date not null,created_at timestamptz not null default now(),status text not null default 'copiado',manifest jsonb not null default '{}',cleared_at timestamptz,unique(empresa_id,cutoff));
create table harmonia_backup_private.rows(batch_id uuid not null references harmonia_backup_private.batches(id),source text not null,record_id uuid not null,row_data jsonb not null,primary key(batch_id,source,record_id));
alter table harmonia_backup_private.batches enable row level security;
alter table harmonia_backup_private.rows enable row level security;
revoke all on all tables in schema harmonia_backup_private from public,anon,authenticated;
alter table public.rotinas_execucao add column lancamento_manual boolean not null default false;

lock table public.rotinas_execucao,public.medicacoes_execucao in share row exclusive mode;
do $copy$
declare company uuid:='d9f678e5-6c7a-485e-895c-cb4791db840e';bid uuid;expected_r bigint;expected_m bigint;
begin
 if not exists(select 1 from public.empresas where id=company) then raise exception 'Instituição não encontrada';end if;
 select count(*) into expected_r from public.rotinas_execucao r where r.data<='2026-09-16' and (r.empresa_id=company or (r.empresa_id is null and exists(select 1 from public.pacientes p where p.id=r.paciente_id and p.empresa_id=company)));
 select count(*) into expected_m from public.medicacoes_execucao where empresa_id=company and data<='2026-09-16';
 insert into harmonia_backup_private.batches(empresa_id,cutoff) values(company,'2026-09-16') returning id into bid;
 insert into harmonia_backup_private.rows select bid,'rotinas_execucao',r.id,to_jsonb(r) from public.rotinas_execucao r where r.data<='2026-09-16' and (r.empresa_id=company or (r.empresa_id is null and exists(select 1 from public.pacientes p where p.id=r.paciente_id and p.empresa_id=company)));
 insert into harmonia_backup_private.rows select bid,'medicacoes_execucao',r.id,to_jsonb(r) from public.medicacoes_execucao r where r.empresa_id=company and r.data<='2026-09-16';
 insert into harmonia_backup_private.rows select bid,'medicacoes',r.id,to_jsonb(r) from public.medicacoes r where r.empresa_id=company;
 insert into harmonia_backup_private.rows select bid,'pacientes',r.id,to_jsonb(r) from public.pacientes r where r.empresa_id=company;
 insert into harmonia_backup_private.rows select bid,'rotina_modelos',r.id,to_jsonb(r) from public.rotina_modelos r where r.empresa_id=company;
 if (select count(*) from harmonia_backup_private.rows where batch_id=bid and source='rotinas_execucao')<>expected_r or (select count(*) from harmonia_backup_private.rows where batch_id=bid and source='medicacoes_execucao')<>expected_m then raise exception 'Backup incompleto';end if;
 update harmonia_backup_private.batches set manifest=(select jsonb_object_agg(source,jsonb_build_object('count',n,'checksum',digest)) from (select source,count(*) n,md5(string_agg(md5(row_data::text),'' order by record_id)) digest from harmonia_backup_private.rows where batch_id=bid group by source)s) where id=bid;
end $copy$;

-- An old browser must not regenerate or replay the cleared period automatically.
-- A deliberate new retrospective entry is tagged by the updated interface.
create or replace function public.harmonia_execucao_reinicio_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.empresa_id='d9f678e5-6c7a-485e-895c-cb4791db840e' and new.data<='2026-09-16' and new.lancamento_manual is not true then
  if coalesce(new.status,'pendente') in ('pendente','automatico') then return null;end if;
  raise exception 'Período arquivado até 16/09/2026. Atualize o aplicativo e faça um novo lançamento manual.';
 end if;
 return new;
end $$;
create trigger harmonia_reinicio_guard before insert or update on public.rotinas_execucao for each row execute function public.harmonia_execucao_reinicio_guard();

create or replace function harmonia_med_private.backup_read(p_action text,p_token text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u public.usuarios%rowtype;bid uuid;result jsonb;
begin
 select users.* into u from harmonia_med_private.sessions s join public.usuarios users on users.id=s.usuario_id where s.token_hash=encode(sha256(convert_to(coalesce(p_token,''),'UTF8')),'hex') and s.expires_at>now() and users.ativo=true and users.hierarquia=1;
 if u.id is null then raise exception 'MED_AUTH: Backup disponível ao nível 1. Confirme seu acesso.' using errcode='42501';end if;
 if p_action='info' then return coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at desc) from harmonia_backup_private.batches b where b.empresa_id=u.empresa_id),'[]'::jsonb);end if;
 bid:=(p_payload->>'batch_id')::uuid;
 if not exists(select 1 from harmonia_backup_private.batches where id=bid and empresa_id=u.empresa_id) then raise exception 'Backup não encontrado.';end if;
 if p_action<>'export' then raise exception 'Ação inválida.';end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.source,q.record_id),'[]'::jsonb) into result from (select source,record_id,row_data from harmonia_backup_private.rows where batch_id=bid order by source,record_id limit 500 offset greatest(coalesce((p_payload->>'offset')::integer,0),0)) q;
 return result;
end $$;
revoke all on function harmonia_med_private.backup_read(text,text,jsonb) from public,anon,authenticated;
grant execute on function harmonia_med_private.backup_read(text,text,jsonb) to anon,authenticated;
create or replace function public.medicacao_backup(p_action text,p_token text default null,p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select harmonia_med_private.backup_read(p_action,p_token,p_payload) $$;
revoke all on function public.medicacao_backup(text,text,jsonb) from public;
grant execute on function public.medicacao_backup(text,text,jsonb) to anon,authenticated;
