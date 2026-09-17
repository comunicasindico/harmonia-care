-- Authorized one-time reset. Only byte-equivalent rows in the verified private backup are removed.
-- No prescription, patient, assignment or routine template is deleted.
begin;
lock table public.rotinas_execucao,public.medicacoes_execucao in share row exclusive mode;
do $reset$
declare b harmonia_backup_private.batches%rowtype;n bigint;
begin
 select * into b from harmonia_backup_private.batches where empresa_id='d9f678e5-6c7a-485e-895c-cb4791db840e' and cutoff='2026-09-16' for update;
 if b.id is null or b.status<>'copiado' then raise exception 'Backup validado não encontrado ou limpeza já realizada';end if;
 if exists(select 1 from harmonia_backup_private.rows a left join public.rotinas_execucao r on r.id=a.record_id where a.batch_id=b.id and a.source='rotinas_execucao' and (r.id is null or to_jsonb(r)<>a.row_data)) then raise exception 'Rotinas mudaram após a cópia. Limpeza cancelada';end if;
 if exists(select 1 from harmonia_backup_private.rows a left join public.medicacoes_execucao r on r.id=a.record_id where a.batch_id=b.id and a.source='medicacoes_execucao' and (r.id is null or to_jsonb(r)<>a.row_data)) then raise exception 'Aplicações mudaram após a cópia. Limpeza cancelada';end if;
 if (select count(*) from harmonia_backup_private.rows where batch_id=b.id and source='rotinas_execucao')<>(b.manifest->'rotinas_execucao'->>'count')::bigint then raise exception 'Backup de rotinas incompleto';end if;
 if (select count(*) from harmonia_backup_private.rows where batch_id=b.id and source='medicacoes_execucao')<>(b.manifest->'medicacoes_execucao'->>'count')::bigint then raise exception 'Backup de aplicações incompleto';end if;
 delete from public.rotinas_execucao r using harmonia_backup_private.rows a where a.batch_id=b.id and a.source='rotinas_execucao' and r.id=a.record_id and r.data<=b.cutoff and to_jsonb(r)=a.row_data;
 get diagnostics n=row_count;if n<>(b.manifest->'rotinas_execucao'->>'count')::bigint then raise exception 'Contagem de rotinas divergente';end if;
 delete from public.medicacoes_execucao r using harmonia_backup_private.rows a where a.batch_id=b.id and a.source='medicacoes_execucao' and r.id=a.record_id and r.data<=b.cutoff and r.empresa_id=b.empresa_id and to_jsonb(r)=a.row_data;
 get diagnostics n=row_count;if n<>(b.manifest->'medicacoes_execucao'->>'count')::bigint then raise exception 'Contagem de aplicações divergente';end if;
 update harmonia_backup_private.batches set status='limpo',cleared_at=now() where id=b.id;
end $reset$;
commit;
