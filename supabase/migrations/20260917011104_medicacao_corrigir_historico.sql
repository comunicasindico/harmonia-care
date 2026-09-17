create or replace function harmonia_med_private.api(p_action text,p_token text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 u public.usuarios%rowtype;r public.medicacoes%rowtype;old_r public.medicacoes%rowtype;
 e public.medicacoes_execucao%rowtype;old_e public.medicacoes_execucao%rowtype;
 t text;login_value text;n integer;out_json jsonb;patient uuid;info jsonb;day_value date;
 from_day date;to_day date;hour_value text;reason text;off integer;
 today date:=(now() at time zone 'America/Sao_Paulo')::date;
begin
 p_payload:=coalesce(p_payload,'{}');
 if p_action='login' then
  login_value:=lower(trim(coalesce(p_payload->>'login','')));
  if login_value='' or coalesce(p_payload->>'senha','')='' then return jsonb_build_object('error','Informe usuário e senha.');end if;
  insert into harmonia_med_private.attempts(login) values(login_value) on conflict do nothing;
  update harmonia_med_private.attempts set failures=0,since_at=now() where login=login_value and since_at<now()-interval '15 minutes';
  select failures into n from harmonia_med_private.attempts where login=login_value for update;
  if n>=8 then return jsonb_build_object('error','Muitas tentativas. Aguarde 15 minutos.');end if;
  select * into u from public.usuarios where ativo=true and empresa_id is not null and
   (lower(nome_apelido)=login_value or lower(email)=login_value or lower(nome_completo)=login_value)
   and senha_hash::text=p_payload->>'senha' and (hierarquia=1 or lower(perfil) in ('administrador','enfermeiro','medico')) limit 1;
  if u.id is null then update harmonia_med_private.attempts set failures=failures+1 where login=login_value;
   return jsonb_build_object('error','Credenciais inválidas ou usuário sem acesso à Medicação.');end if;
  update harmonia_med_private.attempts set failures=0 where login=login_value;
  t:=gen_random_uuid()::text||gen_random_uuid()::text;
  delete from harmonia_med_private.sessions where expires_at<now();
  insert into harmonia_med_private.sessions values(encode(sha256(convert_to(t,'UTF8')),'hex'),u.id,now()+interval '8 hours');
  return jsonb_build_object('token',t,'usuario_id',u.id,'empresa_id',u.empresa_id,'nome',u.nome_completo,'gestor',u.hierarquia=1);
 end if;
 select users.* into u from harmonia_med_private.sessions s join public.usuarios users on users.id=s.usuario_id
 where s.token_hash=encode(sha256(convert_to(coalesce(p_token,''),'UTF8')),'hex') and s.expires_at>now() and users.ativo=true
 and (users.hierarquia=1 or lower(users.perfil) in ('administrador','enfermeiro','medico'));
 if u.id is null then raise exception 'MED_AUTH: Confirme seu acesso à Medicação.' using errcode='42501';end if;
 if p_action='logout' then delete from harmonia_med_private.sessions where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');return '{"ok":true}'::jsonb;end if;
 perform set_config('harmonia.med_actor',u.id::text,true);
 reason:=nullif(trim(p_payload->>'motivo'),'');
 perform set_config('harmonia.med_reason',coalesce(reason,''),true);
 if p_action='workspace' then
  return jsonb_build_object('hoje',today,'usuario_id',u.id,'nome',u.nome_completo,'gestor',u.hierarquia=1,
   'patients',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome_completo',p.nome_completo,'ativo',p.ativo) order by p.nome_completo) from public.pacientes p where p.empresa_id=u.empresa_id and
    (u.hierarquia in (1,2) or exists(select 1 from public.pacientes_profissionais v where v.paciente_id=p.id and v.usuario_id=u.id and v.empresa_id=u.empresa_id and v.ativo=true))),'[]'::jsonb),
   'prescriptions',coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('nome_paciente',p.nome_completo,'paciente_ativo',p.ativo) order by p.nome_completo,m.nome_medicamento,m.id) from public.medicacoes m join public.pacientes p on p.id=m.paciente_id and p.empresa_id=u.empresa_id where m.empresa_id=u.empresa_id and
    (u.hierarquia in (1,2) or exists(select 1 from public.pacientes_profissionais v where v.paciente_id=p.id and v.usuario_id=u.id and v.empresa_id=u.empresa_id and v.ativo=true))),'[]'::jsonb),
   'catalog',coalesce((select jsonb_agg(c.info order by c.chave) from harmonia_med_private.catalogo c),'[]'::jsonb));
 end if;
 if p_action='executions' then
  from_day:=nullif(p_payload->>'from','')::date;to_day:=nullif(p_payload->>'to','')::date;
  if from_day is null or to_day is null or to_day<from_day then raise exception 'Informe um período válido.';end if;
  patient:=nullif(p_payload->>'paciente_id','')::uuid;off:=greatest(coalesce((p_payload->>'offset')::integer,0),0);
  select coalesce(jsonb_agg(to_jsonb(q) order by q.data,q.nome_paciente,q.horario,q.id),'[]'::jsonb) into out_json from (
   select ev.*,p.nome_completo as nome_paciente from public.medicacoes_execucao ev join public.pacientes p on p.id=ev.paciente_id and p.empresa_id=u.empresa_id
   where ev.empresa_id=u.empresa_id and ev.data between from_day and to_day and (patient is null or ev.paciente_id=patient)
   and (u.hierarquia in (1,2) or exists(select 1 from public.pacientes_profissionais v where v.paciente_id=p.id and v.usuario_id=u.id and v.empresa_id=u.empresa_id and v.ativo=true))
   order by ev.data,p.nome_completo,ev.horario,ev.id limit 500 offset off
  ) q;
  return out_json;
 end if;
 if p_action not in ('save','status','administer','void','audit') then raise exception 'Ação inválida.';end if;
 if nullif(p_payload->>'id','') is not null then
  select m.* into old_r from public.medicacoes m join public.pacientes p on p.id=m.paciente_id and p.empresa_id=u.empresa_id
  where m.id=(p_payload->>'id')::uuid and m.empresa_id=u.empresa_id
   and (u.hierarquia in (1,2) or exists(select 1 from public.pacientes_profissionais v where v.paciente_id=p.id and v.usuario_id=u.id and v.empresa_id=u.empresa_id and v.ativo=true)) for update of m;
  if old_r.id is null then raise exception 'Prescrição não encontrada ou paciente sem vínculo.';end if;
 elsif p_action<>'save' then raise exception 'Selecione uma prescrição.';end if;
 if p_action='audit' then
  return coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc,a.id desc) from harmonia_med_private.audit a where a.medicacao_id=old_r.id and a.empresa_id=u.empresa_id),'[]'::jsonb);
 end if;
 if old_r.id is not null and p_action<>'void' and old_r.versao<>coalesce((p_payload->>'versao')::integer,0) then raise exception 'A prescrição mudou. Atualize o painel antes de continuar.';end if;
 if p_action='administer' then
  day_value:=(p_payload->>'data')::date;hour_value:=p_payload->>'horario';
  if day_value is distinct from today then raise exception 'O registro de administração deve corresponder ao dia de hoje.';end if;
  if old_r.ativo is not true or coalesce(old_r.status_tratamento,'ativo')<>'ativo' or old_r.data_inicio>today or old_r.data_fim<today
   or not exists(select 1 from public.pacientes where id=old_r.paciente_id and ativo=true) then raise exception 'Esta prescrição não está vigente para administração.';end if;
  if hour_value is null or hour_value !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or not (hour_value=any(string_to_array(old_r.horarios,'|'))) then raise exception 'Horário não previsto na prescrição.';end if;
  select * into old_e from public.medicacoes_execucao where medicacao_id=old_r.id and data=day_value and horario=hour_value and empresa_id=u.empresa_id for update;
  if old_e.id is not null and old_e.status='executado' then return to_jsonb(old_e);end if;
  if old_e.id is not null and old_e.status not in ('anulado') then raise exception 'Já há um registro para este horário. Solicite conferência ao nível 1.';end if;
  insert into public.medicacoes_execucao(medicacao_id,paciente_id,data,horario,status,usuario_id,usuario_nome,horario_administrado,empresa_id,prescricao_snapshot,registrado_em)
  values(old_r.id,old_r.paciente_id,day_value,hour_value,'executado',u.id,u.nome_completo,now() at time zone 'America/Sao_Paulo',u.empresa_id,to_jsonb(old_r),now())
  on conflict(medicacao_id,data,horario,empresa_id) do update set status='executado',usuario_id=excluded.usuario_id,usuario_nome=excluded.usuario_nome,horario_administrado=excluded.horario_administrado,prescricao_snapshot=excluded.prescricao_snapshot,registrado_em=excluded.registrado_em,motivo_correcao=null
  where medicacoes_execucao.status='anulado' returning * into e;
  insert into harmonia_med_private.audit(medicacao_id,empresa_id,usuario_id,acao,antes,depois) values(old_r.id,u.empresa_id,u.id,'administracao',case when old_e.id is null then null else to_jsonb(old_e) end,to_jsonb(e));
  return to_jsonb(e);
 end if;
 if u.hierarquia is distinct from 1 then raise exception 'Alterações de prescrição são permitidas ao nível 1.' using errcode='42501';end if;
 if p_action='void' then
  if reason is null then raise exception 'Informe o motivo da correção.';end if;
  select * into old_e from public.medicacoes_execucao where id=(p_payload->>'execucao_id')::uuid and medicacao_id=old_r.id and empresa_id=u.empresa_id for update;
  if old_e.id is null or old_e.status='anulado' then raise exception 'Registro não encontrado ou já anulado.';end if;
  update public.medicacoes_execucao set status='anulado',motivo_correcao=reason where id=old_e.id returning * into e;
  insert into harmonia_med_private.audit(medicacao_id,empresa_id,usuario_id,acao,motivo,antes,depois) values(old_r.id,u.empresa_id,u.id,'administracao_anulada',reason,to_jsonb(old_e),to_jsonb(e));
  return to_jsonb(e);
 end if;
 if p_action='status' then
  if reason is null or coalesce(p_payload->>'status','') not in ('ativo','suspenso','finalizado') then raise exception 'Informe o estado e o motivo da alteração.';end if;
  update public.medicacoes set status_tratamento=p_payload->>'status',ativo=(p_payload->>'status'<>'finalizado'),suspenso_em=case when p_payload->>'status'='suspenso' then now() else suspenso_em end,finalizado_em=case when p_payload->>'status'='finalizado' then now() else finalizado_em end,
   historico_status=coalesce(historico_status,'[]')||jsonb_build_array(jsonb_build_object('status',p_payload->>'status','em',now(),'por',u.id,'motivo',reason)) where id=old_r.id returning * into r;
  return to_jsonb(r);
 end if;
 r:=jsonb_populate_record(null::public.medicacoes,p_payload);
 if nullif(trim(r.nome_medicamento),'') is null or nullif(trim(r.dosagem),'') is null then raise exception 'Informe medicamento e dose conforme a prescrição.';end if;
 if r.horarios is null or r.horarios !~ '^([01][0-9]|2[0-3]):[0-5][0-9](\|([01][0-9]|2[0-3]):[0-5][0-9])*$' then raise exception 'Informe horários válidos, como 07:00|19:00.';end if;
 if (select count(*)<>count(distinct h) from unnest(string_to_array(r.horarios,'|')) h) then raise exception 'Não repita horários.';end if;
 if r.duracao_tipo is null or r.duracao_tipo not in ('continuo','temporario') then raise exception 'Informe a duração do tratamento.';end if;
 if r.duracao_tipo='temporario' and (r.data_inicio is null or r.data_fim is null or r.data_fim<r.data_inicio) then raise exception 'Tratamento temporário exige início e fim válidos.';end if;
 if r.duracao_tipo='continuo' and r.data_fim is not null then raise exception 'Para informar término, selecione uso temporário.';end if;
 if old_r.id is null and r.data_inicio is null then raise exception 'Informe a data de início.';end if;
 if not exists(select 1 from public.pacientes where id=r.paciente_id and empresa_id=u.empresa_id and ativo=true) then raise exception 'Selecione um paciente ativo desta instituição.';end if;
 if old_r.id is not null and old_r.paciente_id<>r.paciente_id then raise exception 'Não é permitido trocar o paciente de uma prescrição. Encerre e cadastre outra.';end if;
 if old_r.id is not null and reason is null then raise exception 'Informe o motivo da alteração da prescrição.';end if;
 select c.info into info from harmonia_med_private.catalogo c where c.chave=harmonia_med_private.norm(r.nome_medicamento);
 info:=coalesce(info,jsonb_build_object('lista','revisar','nota','Confira o nome completo e o princípio ativo na prescrição.'));
 r.classificacao_medicamento:=case info->>'lista' when 'B1' then 'controlado' when 'C1' then 'controle_especial' else 'comum' end;
 r.dias_tratamento:=case when r.duracao_tipo='temporario' then r.data_fim-r.data_inicio+1 else null end;
 if old_r.id is null then
  insert into public.medicacoes(empresa_id,paciente_id,nome_medicamento,dosagem,horarios,obrigatorio,ativo,status_tratamento,duracao_tipo,data_inicio,data_fim,dias_tratamento,via_administracao,frequencia,observacoes,prescritor,prescricao_numero,prescricao_validade,classificacao_medicamento,classificacao_info)
  values(u.empresa_id,r.paciente_id,trim(r.nome_medicamento),trim(r.dosagem),r.horarios,coalesce(r.obrigatorio,true),true,'ativo',r.duracao_tipo,r.data_inicio,r.data_fim,r.dias_tratamento,r.via_administracao,r.frequencia,r.observacoes,r.prescritor,r.prescricao_numero,r.prescricao_validade,r.classificacao_medicamento,info) returning * into r;
 else
  update public.medicacoes set nome_medicamento=trim(r.nome_medicamento),dosagem=trim(r.dosagem),horarios=r.horarios,obrigatorio=coalesce(r.obrigatorio,true),duracao_tipo=r.duracao_tipo,data_inicio=r.data_inicio,data_fim=r.data_fim,dias_tratamento=r.dias_tratamento,via_administracao=r.via_administracao,frequencia=r.frequencia,observacoes=r.observacoes,prescritor=r.prescritor,prescricao_numero=r.prescricao_numero,prescricao_validade=r.prescricao_validade,classificacao_medicamento=r.classificacao_medicamento,classificacao_info=info where id=old_r.id returning * into r;
 end if;
 return to_jsonb(r);
end $$;
