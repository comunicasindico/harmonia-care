-- Nível ausente não autoriza gestão de cuidadores.
create or replace function harmonia_nutri_private.api(p_action text,p_token text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u public.usuarios%rowtype; r public.nutricao_avaliacoes%rowtype; old_r public.nutricao_avaliacoes%rowtype;
 t text; login_value text; n integer; result jsonb; patient uuid; assessment date; item jsonb; target_user public.usuarios%rowtype; signature text;
begin
 if p_action='login' then
  login_value:=lower(trim(coalesce(p_payload->>'login','')));
  if login_value='' or coalesce(p_payload->>'senha','')='' then return jsonb_build_object('error','Informe usuário e senha.'); end if;
  insert into harmonia_nutri_private.attempts(login) values(login_value) on conflict do nothing;
  update harmonia_nutri_private.attempts set failures=0,since_at=now() where login=login_value and since_at<now()-interval '15 minutes';
  select failures into n from harmonia_nutri_private.attempts where login=login_value for update;
  if n>=8 then return jsonb_build_object('error','Muitas tentativas. Aguarde 15 minutos.'); end if;
  select * into u from public.usuarios where ativo=true and (lower(nome_apelido)=login_value or lower(email)=login_value or lower(nome_completo)=login_value)
   and senha_hash::text=p_payload->>'senha' and (perfil='nutricionista' or hierarquia=1) limit 1;
  if u.id is null then
   update harmonia_nutri_private.attempts set failures=failures+1 where login=login_value;
   return jsonb_build_object('error','Credenciais inválidas ou usuário sem acesso à Nutrição.');
  end if;
  update harmonia_nutri_private.attempts set failures=0 where login=login_value;
  t:=gen_random_uuid()::text||gen_random_uuid()::text;
  delete from harmonia_nutri_private.sessions where expires_at<now();
  insert into harmonia_nutri_private.sessions values(encode(sha256(convert_to(t,'UTF8')),'hex'),u.id,now()+interval '8 hours');
  return jsonb_build_object('token',t,'usuario_id',u.id,'empresa_id',u.empresa_id,'nome',u.nome_completo,'expires_at',now()+interval '8 hours');
 end if;
 select users.* into u from harmonia_nutri_private.sessions s join public.usuarios users on users.id=s.usuario_id
  where s.token_hash=encode(sha256(convert_to(coalesce(p_token,''),'UTF8')),'hex') and s.expires_at>now()
  and users.ativo=true and (users.perfil='nutricionista' or users.hierarquia=1);
 if u.id is null then raise exception 'NUTRI_AUTH: Confirme seu acesso à Nutrição.' using errcode='42501'; end if;
 if p_action='logout' then delete from harmonia_nutri_private.sessions where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');return jsonb_build_object('ok',true);end if;
 if p_action='patients' then
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'empresa_id',empresa_id,'nome_completo',nome_completo,'nome_apelido',nome_apelido,'data_nascimento',data_nascimento,'ativo',ativo) order by nome_completo),'[]') into result from public.pacientes where empresa_id=u.empresa_id;
  return result;
 end if;
 if p_action='list' then
  select coalesce(jsonb_agg(to_jsonb(a) order by a.data_avaliacao desc,a.created_at desc,a.id),'[]') into result from public.nutricao_avaliacoes a
   where a.empresa_id=u.empresa_id and a.excluido_em is null
   and (nullif(p_payload->>'paciente_id','') is null or a.paciente_id=(p_payload->>'paciente_id')::uuid)
   and (nullif(p_payload->>'from','') is null or a.data_avaliacao>=(p_payload->>'from')::date)
   and (nullif(p_payload->>'to','') is null or a.data_avaliacao<=(p_payload->>'to')::date);
  return result;
 end if;

 if p_action in ('team_list','team_save') then
  if u.hierarquia is distinct from 1 then raise exception 'A gestão de vínculos está disponível ao nível 1.' using errcode='42501';end if;
  if p_action='team_list' then
   select jsonb_build_object(
    'users',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'nome_completo',c.nome_completo,'nome_apelido',c.nome_apelido,'email',c.email,'telefone',c.telefone,'ativo',c.ativo,'perfil',c.perfil,'hierarquia',c.hierarquia,
    'signature',md5(jsonb_build_object('nome',c.nome_completo,'apelido',c.nome_apelido,'email',c.email,'telefone',c.telefone,'ativo',c.ativo,'links',coalesce((select jsonb_agg(jsonb_build_object('paciente_id',v.paciente_id,'turno',v.turno) order by v.paciente_id,v.turno) from public.pacientes_profissionais v where v.usuario_id=c.id and v.empresa_id=u.empresa_id and v.ativo=true),'[]'))::text)) order by c.nome_completo)
    from public.usuarios c where c.empresa_id=u.empresa_id and c.perfil='cuidador'),'[]'),
    'patients',coalesce((select jsonb_agg(jsonb_build_object('id',id,'nome_completo',nome_completo,'ativo',ativo) order by nome_completo) from public.pacientes where empresa_id=u.empresa_id),'[]'),
    'links',coalesce((select jsonb_agg(jsonb_build_object('usuario_id',usuario_id,'paciente_id',paciente_id,'turno',turno)) from public.pacientes_profissionais where empresa_id=u.empresa_id and ativo=true),'[]')
   ) into result;
   return result;
  end if;
  select * into target_user from public.usuarios where id=(p_payload->>'id')::uuid and empresa_id=u.empresa_id and perfil='cuidador' for update;
  if target_user.id is null then raise exception 'Cuidador não encontrado.';end if;
  select md5(jsonb_build_object('nome',target_user.nome_completo,'apelido',target_user.nome_apelido,'email',target_user.email,'telefone',target_user.telefone,'ativo',target_user.ativo,'links',coalesce((select jsonb_agg(jsonb_build_object('paciente_id',v.paciente_id,'turno',v.turno) order by v.paciente_id,v.turno) from public.pacientes_profissionais v where v.usuario_id=target_user.id and v.empresa_id=u.empresa_id and v.ativo=true),'[]'))::text) into signature;
  if signature is distinct from p_payload->>'signature' then raise exception 'O cadastro ou os vínculos mudaram. Atualize antes de salvar.';end if;
  if coalesce(trim(p_payload->>'nome_completo'),'')='' or coalesce(trim(p_payload->>'nome_apelido'),'')='' or coalesce(trim(p_payload->>'email'),'')='' then raise exception 'Preencha nome, usuário e e-mail.';end if;
  if jsonb_typeof(p_payload->'links') is distinct from 'array' then raise exception 'Vínculos inválidos.';end if;
  for item in select value from jsonb_array_elements(p_payload->'links') loop
   if item->>'turno' not in ('manha','tarde','noite') or item->>'turno' is null or not exists(select 1 from public.pacientes where id=(item->>'paciente_id')::uuid and empresa_id=u.empresa_id) then raise exception 'Paciente ou turno inválido.';end if;
  end loop;
  update public.usuarios set nome_completo=trim(p_payload->>'nome_completo'),nome=trim(p_payload->>'nome_completo'),nome_apelido=trim(p_payload->>'nome_apelido'),email=trim(p_payload->>'email'),telefone=nullif(trim(p_payload->>'telefone'),''),ativo=coalesce((p_payload->>'ativo')::boolean,true) where id=target_user.id;
  update public.pacientes_profissionais set ativo=false where usuario_id=target_user.id and empresa_id=u.empresa_id and ativo=true and not exists(select 1 from jsonb_array_elements(p_payload->'links') e where (e->>'paciente_id')::uuid=pacientes_profissionais.paciente_id and e->>'turno'=pacientes_profissionais.turno);
  insert into public.pacientes_profissionais(empresa_id,usuario_id,paciente_id,turno,ativo)
  select distinct u.empresa_id,target_user.id,(e->>'paciente_id')::uuid,e->>'turno',true from jsonb_array_elements(p_payload->'links') e
  on conflict(usuario_id,paciente_id,turno) do update set ativo=true,empresa_id=excluded.empresa_id;
  insert into harmonia_nutri_private.audit(avaliacao_id,usuario_id,acao,antes,depois) values(target_user.id,u.id,'cuidador_vinculos',jsonb_build_object('nome',target_user.nome_completo,'signature',signature),p_payload-'signature');
  return jsonb_build_object('ok',true);
 end if;

 if p_action not in ('save','delete') then raise exception 'Ação inválida';end if;
 if nullif(p_payload->>'id','') is not null then
  select * into old_r from public.nutricao_avaliacoes where id=(p_payload->>'id')::uuid and empresa_id=u.empresa_id and excluido_em is null for update;
  if old_r.id is null or old_r.versao<>coalesce((p_payload->>'versao')::integer,0) then raise exception 'O registro mudou. Atualize o painel antes de continuar.';end if;
 end if;
 if p_action='delete' then
  if old_r.id is null or length(trim(coalesce(p_payload->>'motivo','')))=0 then raise exception 'Informe o registro e o motivo da exclusão.';end if;
  update public.nutricao_avaliacoes set excluido_em=now(),motivo_exclusao=p_payload->>'motivo',updated_at=now(),atualizado_por=u.id,versao=versao+1 where id=old_r.id returning * into r;
 else
  patient:=(p_payload->>'paciente_id')::uuid;assessment:=(p_payload->>'data_avaliacao')::date;
  if not exists(select 1 from public.pacientes where id=patient and empresa_id=u.empresa_id) then raise exception 'Paciente inválido para esta instituição.';end if;
  if old_r.id is not null and old_r.paciente_id<>patient then raise exception 'Não é permitido trocar o paciente de uma avaliação.';end if;
  if assessment is null or assessment>(now() at time zone 'America/Sao_Paulo')::date then raise exception 'Data da avaliação inválida.';end if;
  if jsonb_typeof(coalesce(p_payload->'medidas_extras','[]'))<>'array' then raise exception 'Medidas adicionais inválidas.';end if;
  for item in select value from jsonb_array_elements(coalesce(p_payload->'medidas_extras','[]')) loop
   if coalesce(trim(item->>'nome'),'')='' or coalesce(trim(item->>'unidade'),'')='' or jsonb_typeof(item->'valor')<>'number' or (item->>'valor')::numeric<0 then raise exception 'Confira as medidas adicionais.';end if;
  end loop;
  r:=jsonb_populate_record(null::public.nutricao_avaliacoes,p_payload-'imc');
  if old_r.id is null then
   insert into public.nutricao_avaliacoes(empresa_id,paciente_id,data_avaliacao,profissional_nome,crn,proxima_avaliacao,peso_kg,altura_cm,cp_cm,cb_cm,cc_cm,dct_mm,quadril_cm,altura_joelho_cm,ficha,medidas_extras,criado_por,atualizado_por)
   values(u.empresa_id,patient,assessment,r.profissional_nome,r.crn,r.proxima_avaliacao,r.peso_kg,r.altura_cm,r.cp_cm,r.cb_cm,r.cc_cm,r.dct_mm,r.quadril_cm,r.altura_joelho_cm,coalesce(r.ficha,'{}'),coalesce(r.medidas_extras,'[]'),u.id,u.id) returning * into r;
  else
   update public.nutricao_avaliacoes set data_avaliacao=assessment,profissional_nome=r.profissional_nome,crn=r.crn,proxima_avaliacao=r.proxima_avaliacao,peso_kg=r.peso_kg,altura_cm=r.altura_cm,cp_cm=r.cp_cm,cb_cm=r.cb_cm,cc_cm=r.cc_cm,dct_mm=r.dct_mm,quadril_cm=r.quadril_cm,altura_joelho_cm=r.altura_joelho_cm,ficha=coalesce(r.ficha,'{}'),medidas_extras=coalesce(r.medidas_extras,'[]'),atualizado_por=u.id,updated_at=now(),versao=old_r.versao+1 where id=old_r.id returning * into r;
  end if;
 end if;
 insert into harmonia_nutri_private.audit(avaliacao_id,usuario_id,acao,antes,depois) values(r.id,u.id,case when p_action='delete' then 'exclusao' when old_r.id is null then 'inclusao' else 'edicao' end,case when old_r.id is null then null else to_jsonb(old_r) end,to_jsonb(r));
 return jsonb_build_object('id',r.id,'versao',r.versao);
end;
$$;
