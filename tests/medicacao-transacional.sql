-- All synthetic fixture data is rolled back. Never administer a real patient's dose in tests.
begin;
do $test$
declare company uuid;uid uuid:=gen_random_uuid();nurse uuid:=gen_random_uuid();pid uuid:=gen_random_uuid();other_pid uuid:=gen_random_uuid();tok text;ntok text;secret text:=gen_random_uuid()::text;login_name text:=gen_random_uuid()::text;payload jsonb;r jsonb;before_r jsonb;ex jsonb;again jsonb;bad boolean;today date:=(now() at time zone 'America/Sao_Paulo')::date;cnt integer;
begin
 select empresa_id into company from public.usuarios where ativo=true and hierarquia=1 and empresa_id is not null limit 1;
 insert into public.usuarios(id,empresa_id,nome,nome_completo,nome_apelido,email,perfil,hierarquia,ativo,senha_hash) values
 (uid,company,'QA Med fictício','QA Med fictício',login_name,login_name||'@example.invalid','administrador',1,true,secret),
 (nurse,company,'QA Med restrito','QA Med restrito',login_name||'n',(login_name||'n@example.invalid'),'medico',3,true,secret);
 insert into public.pacientes(id,empresa_id,nome_completo,ativo) values(pid,company,'QA Paciente fictício',true),(other_pid,gen_random_uuid(),'QA Outra instituição',true);
 tok:=public.medicacao_api('login',null,jsonb_build_object('login',login_name,'senha',secret))->>'token';
 ntok:=public.medicacao_api('login',null,jsonb_build_object('login',login_name||'n','senha',secret))->>'token';
 if tok is null or ntok is null then raise exception 'Login de teste falhou';end if;
 bad:=false;begin perform public.medicacao_api('workspace','invalid','{}');exception when insufficient_privilege then bad:=true;end;if not bad then raise exception 'Token inválido aceito';end if;
 if has_table_privilege('anon','public.medicacoes','UPDATE') or has_table_privilege('anon','public.medicacoes_execucao','INSERT') then raise exception 'Escrita direta indevida';end if;
 if jsonb_array_length(public.medicacao_api('workspace',ntok,'{}')->'patients')<>0 then raise exception 'Acesso sem vínculo';end if;
 payload:=jsonb_build_object('paciente_id',pid,'nome_medicamento','QUETIAPINA','dosagem','DOSE FICTÍCIA','horarios','07:00|19:00','duracao_tipo','temporario','data_inicio',today,'data_fim',today+6);
 bad:=false;begin perform public.medicacao_api('save',ntok,payload);exception when insufficient_privilege then bad:=true;end;if not bad then raise exception 'Perfil não gestor alterou prescrição';end if;
 bad:=false;begin perform public.medicacao_api('save',tok,payload||jsonb_build_object('paciente_id',other_pid));exception when others then bad:=true;end;if not bad then raise exception 'Paciente de outra empresa aceito';end if;
 bad:=false;begin perform public.medicacao_api('save',tok,payload||jsonb_build_object('data_fim',today-1));exception when others then bad:=true;end;if not bad then raise exception 'Datas invertidas aceitas';end if;
 bad:=false;begin perform public.medicacao_api('save',tok,payload||'{"horarios":"29:00"}');exception when others then bad:=true;end;if not bad then raise exception 'Hora inválida aceita';end if;
 r:=public.medicacao_api('save',tok,payload);if r->>'classificacao_medicamento'<>'controle_especial' or (r->>'dias_tratamento')::int<>7 then raise exception 'Classificação ou dias incorretos';end if;
 bad:=false;begin perform public.medicacao_api('administer',tok,jsonb_build_object('id',r->>'id','versao',r->>'versao','data',today+1,'horario','07:00'));exception when others then bad:=true;end;if not bad then raise exception 'Administração futura aceita';end if;
 ex:=public.medicacao_api('administer',tok,jsonb_build_object('id',r->>'id','versao',r->>'versao','data',today,'horario','07:00'));
 again:=public.medicacao_api('administer',tok,jsonb_build_object('id',r->>'id','versao',r->>'versao','data',today,'horario','07:00'));
 if ex->>'id' is distinct from again->>'id' then raise exception 'Administração não idempotente';end if;
 if ex->'prescricao_snapshot'->>'dosagem'<>'DOSE FICTÍCIA' then raise exception 'Snapshot ausente';end if;
 if (select count(*) from public.medicacoes_execucao where medicacao_id=(r->>'id')::uuid)<>1 then raise exception 'Duplicidade de administração';end if;
 before_r:=r;r:=public.medicacao_api('save',tok,payload||jsonb_build_object('id',r->>'id','versao',r->>'versao','dosagem','NOVA DOSE FICTÍCIA','motivo','Teste revertido'));
 if (select prescricao_snapshot->>'dosagem' from public.medicacoes_execucao where id=(ex->>'id')::uuid)<>'DOSE FICTÍCIA' then raise exception 'Dose histórica alterada';end if;
 bad:=false;begin perform public.medicacao_api('save',tok,before_r||'{"motivo":"Teste"}');exception when others then bad:=true;end;if not bad then raise exception 'Edição obsoleta aceita';end if;
 perform public.medicacao_api('void',tok,jsonb_build_object('id',r->>'id','execucao_id',ex->>'id','motivo','Teste de correção'));
 if (select status from public.medicacoes_execucao where id=(ex->>'id')::uuid)<>'anulado' then raise exception 'Correção falhou';end if;
 r:=public.medicacao_api('status',tok,jsonb_build_object('id',r->>'id','versao',r->>'versao','status','finalizado','motivo','Teste de arquivamento'));
 bad:=false;begin perform public.medicacao_api('administer',tok,jsonb_build_object('id',r->>'id','versao',r->>'versao','data',today,'horario','19:00'));exception when others then bad:=true;end;if not bad then raise exception 'Tratamento encerrado administrado';end if;
 if jsonb_array_length(public.medicacao_api('executions',tok,jsonb_build_object('from',today,'to',today,'paciente_id',pid)))<>1 then raise exception 'Histórico perdido ao encerrar';end if;
 if jsonb_array_length(public.medicacao_api('audit',tok,jsonb_build_object('id',r->>'id')))<5 then raise exception 'Auditoria incompleta';end if;
 perform set_config('harmonia.qa_token',tok,true);
end $test$;
set local role anon;
select jsonb_typeof(public.medicacao_api('workspace',current_setting('harmonia.qa_token'),'{}')->'prescriptions')='array' as rpc_anon_verified;
reset role;
rollback;
