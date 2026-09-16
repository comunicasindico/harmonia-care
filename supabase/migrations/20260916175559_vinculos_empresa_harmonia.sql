-- Completa a instituição dos vínculos legados a partir dos dois cadastros.
update public.pacientes_profissionais v set empresa_id=p.empresa_id
from public.pacientes p,public.usuarios u
where v.paciente_id=p.id and v.usuario_id=u.id and v.empresa_id is null and p.empresa_id=u.empresa_id;
create or replace function public.harmonia_vinculo_empresa()
returns trigger language plpgsql security invoker set search_path='' as $$
declare pe uuid;ue uuid;
begin
 select empresa_id into pe from public.pacientes where id=new.paciente_id;
 select empresa_id into ue from public.usuarios where id=new.usuario_id;
 if pe is null or ue is null or pe<>ue then raise exception 'Paciente e profissional devem pertencer à mesma instituição.';end if;
 if new.empresa_id is null then new.empresa_id:=pe;end if;
 if new.empresa_id<>pe then raise exception 'Instituição do vínculo inválida.';end if;
 return new;
end;$$;
revoke all on function public.harmonia_vinculo_empresa() from public;
create trigger harmonia_vinculo_empresa_before before insert or update on public.pacientes_profissionais for each row execute function public.harmonia_vinculo_empresa();
