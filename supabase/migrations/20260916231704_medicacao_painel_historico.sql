-- Medication workspace: prescribed dates, individual administration and durable history.
-- No prescribed dose, time, patient or treatment duration is inferred from the catalog.
create schema if not exists harmonia_med_private;
revoke all on schema harmonia_med_private from public;
create table harmonia_med_private.sessions(token_hash text primary key,usuario_id uuid not null references public.usuarios(id),expires_at timestamptz not null);
create table harmonia_med_private.attempts(login text primary key,failures integer not null default 0,since_at timestamptz not null default now());
create table harmonia_med_private.catalogo(chave text primary key,info jsonb not null);
create table harmonia_med_private.audit(id bigint generated always as identity primary key,medicacao_id uuid,empresa_id uuid,usuario_id uuid,acao text not null,motivo text,antes jsonb,depois jsonb,created_at timestamptz not null default now());
alter table harmonia_med_private.sessions enable row level security;
alter table harmonia_med_private.attempts enable row level security;
alter table harmonia_med_private.catalogo enable row level security;
alter table harmonia_med_private.audit enable row level security;
revoke all on all tables in schema harmonia_med_private from public,anon,authenticated;
create index med_audit_patient_history on harmonia_med_private.audit(empresa_id,medicacao_id,created_at);
create index med_sessions_expiry on harmonia_med_private.sessions(expires_at);
alter table public.medicacoes add column if not exists versao integer not null default 1;
alter table public.medicacoes add column if not exists updated_at timestamptz not null default now();
alter table public.medicacoes add column if not exists classificacao_info jsonb not null default '{"lista":"revisar"}';
alter table public.medicacoes_execucao add column if not exists prescricao_snapshot jsonb;
alter table public.medicacoes_execucao add column if not exists registrado_em timestamptz;
alter table public.medicacoes_execucao add column if not exists motivo_correcao text;
create index if not exists med_exec_empresa_data on public.medicacoes_execucao(empresa_id,data,medicacao_id);
create index if not exists med_empresa_paciente on public.medicacoes(empresa_id,paciente_id);

create or replace function harmonia_med_private.norm(p_text text) returns text language sql immutable set search_path='' as $$
 select regexp_replace(trim(translate(upper(coalesce(p_text,'')),'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','AAAAAEEEEIIIIOOOOOUUUUC')),'\s+',' ','g')
$$;
create or replace function public.atualizar_nome_paciente() returns trigger language plpgsql set search_path='' as $$
begin select nome_completo into new.nome_paciente from public.pacientes where id=new.paciente_id;return new;end $$;
create or replace function public.sync_medicacoes_modelo() returns trigger language plpgsql set search_path='' as $$
begin insert into public.medicacoes_modelo(nome_medicamento) select new.nome_medicamento where not exists(select 1 from public.medicacoes_modelo where nome_medicamento=new.nome_medicamento);return new;end $$;

create or replace function harmonia_med_private.audit_prescricao() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then new.versao:=old.versao+1;new.updated_at:=now();end if;
 insert into harmonia_med_private.audit(medicacao_id,empresa_id,usuario_id,acao,motivo,antes,depois)
 values(new.id,new.empresa_id,nullif(current_setting('harmonia.med_actor',true),'')::uuid,case when tg_op='INSERT' then 'prescricao_incluida' else 'prescricao_alterada' end,current_setting('harmonia.med_reason',true),case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 return new;
end $$;
create trigger med_prescricao_history before insert or update on public.medicacoes for each row execute function harmonia_med_private.audit_prescricao();

insert into harmonia_med_private.catalogo(chave,info) select value->>'chave',value from jsonb_array_elements($catalog$[
  {
    "chave": "AAS",
    "nome": "AAS",
    "principio_ativo": "ACIDO ACETILSALICILICO",
    "classe_terapeutica": "ANALGÉSICOS NÃO NARCÓTICOS E ANTIPIRÉTICOS ISENTOS DE PRESCRIÇÃO",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "AAS INFANTIL",
    "nome": "AAS INFANTIL",
    "principio_ativo": "ACIDO ACETILSALICILICO",
    "classe_terapeutica": "ANALGÉSICOS NÃO NARCÓTICOS E ANTIPIRÉTICOS ISENTOS DE PRESCRIÇÃO",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ACETILCISTEINA",
    "nome": "ACETILCISTEINA",
    "principio_ativo": "ACETILCISTEÍNA",
    "classe_terapeutica": "EXPECTORANTES",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ALMEIDA PRADO (COMPLEXO HOMEOPATICO)",
    "nome": "ALMEIDA PRADO (COMPLEXO HOMEOPATICO)",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "ALPRAZOLAM",
    "nome": "ALPRAZOLAM",
    "principio_ativo": "ALPRAZOLAM",
    "classe_terapeutica": "TRANQUILIZANTES",
    "lista": "B1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "AMITRIPTILINA",
    "nome": "AMITRIPTILINA",
    "principio_ativo": "CLORIDRATO DE AMITRIPTILINA",
    "classe_terapeutica": "ANTIDEPRESSIVOS TODOS OS OUTROS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "AMPLICTIL",
    "nome": "AMPLICTIL",
    "principio_ativo": "CLORIDRATO DE CLORPROMAZINA",
    "classe_terapeutica": "ANTIPSICÓTICOS ATÍPICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ANLODIPINO",
    "nome": "ANLODIPINO",
    "principio_ativo": "BESILATO DE ANLODIPINO",
    "classe_terapeutica": "ANTAGONISTAS DO CÁLCIO PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ARIPIPRAZOL",
    "nome": "ARIPIPRAZOL",
    "principio_ativo": "ARIPIPRAZOL",
    "classe_terapeutica": "ANTIPSICÓTICOS ATÍPICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ASPIRINA",
    "nome": "ASPIRINA",
    "principio_ativo": "ÁCIDO ACETILSALICÍLICO",
    "classe_terapeutica": "ANALGÉSICOS NÃO NARCÓTICOS E ANTIPIRÉTICOS ISENTOS DE PRESCRIÇÃO",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ATENALOL",
    "nome": "ATENALOL",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "ATENOLOL",
    "nome": "ATENOLOL",
    "principio_ativo": "ATENOLOL",
    "classe_terapeutica": "BETABLOQUEADORES PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "AZUKON",
    "nome": "AZUKON",
    "principio_ativo": "GLICAZIDA / GLICLAZIDA",
    "classe_terapeutica": "ANTIDIABÉTICOS SULFONILOURÉIAS PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "BEMOVE",
    "nome": "BEMOVE",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "BETAISTINA",
    "nome": "BETAISTINA",
    "principio_ativo": "CLORIDRATO DE BETAISTINA / DICLORIDRATO DE BETAISTINA",
    "classe_terapeutica": "ANTIVERTIGINOSOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "BISOPROLOL 5",
    "nome": "BISOPROLOL 5",
    "principio_ativo": "HEMIFUMARATO DE BISOPROLOL",
    "classe_terapeutica": "BETABLOQUEADORES ASSOCIADOS COM ANTIHIPERTENSIVOS E/OU DIURÉTICOS / BETABLOQUEADORES PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "BROMOPRIDA",
    "nome": "BROMOPRIDA",
    "principio_ativo": "BROMOPRIDA",
    "classe_terapeutica": "GASTROPROCINÉTICOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "CALCIO",
    "nome": "CALCIO",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "CARVEDILOL",
    "nome": "CARVEDILOL",
    "principio_ativo": "CARVEDILOL",
    "classe_terapeutica": "BETABLOQUEADORES PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "CECLOR",
    "nome": "CECLOR",
    "principio_ativo": "CEFACLOR / CEFACLOR MONOIDRATADO",
    "classe_terapeutica": "CEFALOSPORINAS ORAIS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "CENTRUM",
    "nome": "CENTRUM",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "CLONAZEPAM",
    "nome": "CLONAZEPAM",
    "principio_ativo": "CLONAZEPAM",
    "classe_terapeutica": "ANTIEPILÉPTICOS / ANTIPSICÓTICOS CONVENCIONAIS",
    "lista": "B1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "CLOR.",
    "nome": "CLOR.",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "CLORID.",
    "nome": "CLORID.",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "CLORTALIDONA",
    "nome": "CLORTALIDONA",
    "principio_ativo": "CLORTALIDONA",
    "classe_terapeutica": "DIURÉTICOS TIAZIDAS E ANÁLOGOS PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "COBAVITAL",
    "nome": "COBAVITAL",
    "principio_ativo": "CLORIDRATO DE CIPROEPTADINA;COBAMAMIDA",
    "classe_terapeutica": "OREXÍGENOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "COGLIVE",
    "nome": "COGLIVE",
    "principio_ativo": "BROMIDRATO DE GALANTAMINA",
    "classe_terapeutica": "PRODUTOS ANTIALZHEIMER, INIBIDORES DA COLINESTERASE",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "COGMAX",
    "nome": "COGMAX",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "COLIRIO",
    "nome": "COLIRIO",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "COMBODART",
    "nome": "COMBODART",
    "principio_ativo": "DUTASTERIDA;CLORIDRATO DE TANSULOSINA",
    "classe_terapeutica": "BPH COMBINAÇÕES DE ALFA-ANTAGONISTAS E INIBIDORES DA 5-ALFA TESTOSTERONA REDUTASE",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "CRISAPINA",
    "nome": "CRISAPINA",
    "principio_ativo": "OLANZAPINA",
    "classe_terapeutica": "ANTIPSICÓTICOS ATÍPICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "DAPAGLIFLOZINA",
    "nome": "DAPAGLIFLOZINA",
    "principio_ativo": "DAPAGLIFLOZINA",
    "classe_terapeutica": "ANTIDIABÉTICOS INIBIDORES DE SGLT2, PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "DEPAKENE",
    "nome": "DEPAKENE",
    "principio_ativo": "VALPROATO DE SÓDIO / ÁCIDO VALPRÓICO",
    "classe_terapeutica": "ANTIEPILÉPTICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "DESUPRE",
    "nome": "DESUPRE",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "DESVENLAFAXINA",
    "nome": "DESVENLAFAXINA",
    "principio_ativo": "SUCCINATO DE DESVENLAFAXINA MONOIDRATADO",
    "classe_terapeutica": "ANTIDEPRESSIVOS SNRI",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "DICLORD.",
    "nome": "DICLORD.",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "DIOSMIN",
    "nome": "DIOSMIN",
    "principio_ativo": "FLAVONÓIDES EXPRESSOS EM HESPERIDINA;DIOSMINA / HESPERIDINA;DIOSMINA",
    "classe_terapeutica": "VASOPROTETORES SISTÊMICOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "DIPIRONA",
    "nome": "DIPIRONA",
    "principio_ativo": "DIPIRONA / DIPIRONA MONOIDRATADA",
    "classe_terapeutica": "ANALGÉSICOS NÃO NARCÓTICOS E ANTIPIRÉTICOS ISENTOS DE PRESCRIÇÃO / ANALGÉSICOS NÃO NARCÓTICOS E ANTIPIRÉTICOS SOB PRESCRIÇÃO",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "DIVALPROATO",
    "nome": "DIVALPROATO",
    "principio_ativo": "DIVALPROATO DE SÓDIO",
    "classe_terapeutica": "ANTIEPILÉPTICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "DOBEVEN",
    "nome": "DOBEVEN",
    "principio_ativo": "DOBESILATO DE CÁLCIO",
    "classe_terapeutica": "VASOPROTETORES SISTÊMICOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "DOMPERIDONA",
    "nome": "DOMPERIDONA",
    "principio_ativo": "DOMPERIDONA",
    "classe_terapeutica": "GASTROPROCINÉTICOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "DONAREN",
    "nome": "DONAREN",
    "principio_ativo": "CLORIDRATO DE TRAZODONA",
    "classe_terapeutica": "ANTIDEPRESSIVOS TODOS OS OUTROS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "DONEPEZILA",
    "nome": "DONEPEZILA",
    "principio_ativo": "CLORIDRATO DE DONEPEZILA",
    "classe_terapeutica": "PRODUTOS ANTIALZHEIMER, INIBIDORES DA COLINESTERASE",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "DONILA",
    "nome": "DONILA",
    "principio_ativo": "CLORIDRATO DE DONEPEZILA",
    "classe_terapeutica": "PRODUTOS ANTIALZHEIMER, INIBIDORES DA COLINESTERASE",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "DULOXETINA",
    "nome": "DULOXETINA",
    "principio_ativo": "CLORIDRATO DE DULOXETINA",
    "classe_terapeutica": "ANTIDEPRESSIVOS SNRI",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ENALAPRIL",
    "nome": "ENALAPRIL",
    "principio_ativo": "MALEATO DE ENALAPRIL",
    "classe_terapeutica": "INIBIDORES DA ECA PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ENALAPRIL 10",
    "nome": "ENALAPRIL 10",
    "principio_ativo": "MALEATO DE ENALAPRIL",
    "classe_terapeutica": "INIBIDORES DA ECA PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ESC",
    "nome": "ESC",
    "principio_ativo": "OXALATO DE ESCITALOPRAM",
    "classe_terapeutica": "ANTIDEPRESSIVOS SSRI",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ESCITALOPRAM",
    "nome": "ESCITALOPRAM",
    "principio_ativo": "OXALATO DE ESCITALOPRAM",
    "classe_terapeutica": "ANTIDEPRESSIVOS SSRI",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ESPIRONOLAC-TONA 25",
    "nome": "ESPIRONOLAC-TONA 25",
    "principio_ativo": "ESPIRONOLACTONA",
    "classe_terapeutica": "AGENTES DIURÉTICOS POUPADORES POTÁSSIO PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ESPIRONOLACTONA",
    "nome": "ESPIRONOLACTONA",
    "principio_ativo": "ESPIRONOLACTONA",
    "classe_terapeutica": "AGENTES DIURÉTICOS POUPADORES POTÁSSIO PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ETIRA",
    "nome": "ETIRA",
    "principio_ativo": "LEVETIRACETAM",
    "classe_terapeutica": "ANTIEPILÉPTICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "EZETIMIBA",
    "nome": "EZETIMIBA",
    "principio_ativo": "EZETIMIBA",
    "classe_terapeutica": "PRODUTOS REGULADORES DE LÍPIDIOS, OUTROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "FLAVONID",
    "nome": "FLAVONID",
    "principio_ativo": "FLAVONÓIDES EXPRESSOS EM HESPERIDINA;DIOSMINA",
    "classe_terapeutica": "VASOPROTETORES SISTÊMICOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "FONT",
    "nome": "FONT",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "FORTICE",
    "nome": "FORTICE",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "FORXIGA",
    "nome": "FORXIGA",
    "principio_ativo": "DAPAGLIFLOZINA",
    "classe_terapeutica": "ANTIDIABÉTICOS INIBIDORES DE SGLT2, PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "FUROSEMIDA",
    "nome": "FUROSEMIDA",
    "principio_ativo": "FUROSEMIDA",
    "classe_terapeutica": "DIURÉTICOS DE ALÇA PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "FUROSEMIDA 40",
    "nome": "FUROSEMIDA 40",
    "principio_ativo": "FUROSEMIDA",
    "classe_terapeutica": "DIURÉTICOS DE ALÇA PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "GALANTAMINA",
    "nome": "GALANTAMINA",
    "principio_ativo": "BROMIDRATO DE GALANTAMINA",
    "classe_terapeutica": "PRODUTOS ANTIALZHEIMER, INIBIDORES DA COLINESTERASE",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "GLICAZIDA",
    "nome": "GLICAZIDA",
    "principio_ativo": "GLICAZIDA",
    "classe_terapeutica": "ANTIDIABÉTICOS SULFONILOURÉIAS PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "GLIFAGE",
    "nome": "GLIFAGE",
    "principio_ativo": "CLORIDRATO DE METFORMINA",
    "classe_terapeutica": "ANTIDIABÉTICOS BIGUANIDAS PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "GRANBRERRY",
    "nome": "GRANBRERRY",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "HALDOL",
    "nome": "HALDOL",
    "principio_ativo": "HALOPERIDOL",
    "classe_terapeutica": "ANTIPSICÓTICOS CONVENCIONAIS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "HEMIF.",
    "nome": "HEMIF.",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "HIDROCLORO-",
    "nome": "HIDROCLORO-",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "HIDROCLORO-TIAZIDA",
    "nome": "HIDROCLORO-TIAZIDA",
    "principio_ativo": "HIDROCLOROTIAZIDA",
    "classe_terapeutica": "DIURÉTICOS TIAZIDAS E ANÁLOGOS PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "HIDROCLOROTIAZIDA",
    "nome": "HIDROCLOROTIAZIDA",
    "principio_ativo": "HIDROCLOROTIAZIDA",
    "classe_terapeutica": "DIURÉTICOS TIAZIDAS E ANÁLOGOS PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "INSULINA",
    "nome": "INSULINA",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "INSULINA NPH",
    "nome": "INSULINA NPH",
    "principio_ativo": "INSULINA HUMANA",
    "classe_terapeutica": "Insulinas humanas e análogos, ação intermediária",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "INSULINA REGULAR",
    "nome": "INSULINA REGULAR",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "KEPPRA",
    "nome": "KEPPRA",
    "principio_ativo": "LEVETIRACETAM",
    "classe_terapeutica": "ANTIEPILÉPTICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "LACRIFILM",
    "nome": "LACRIFILM",
    "principio_ativo": "CARBOXIMETILCELULOSE SÓDICA / CARMELOSE SÓDICA",
    "classe_terapeutica": "LÁGRIMAS ARTIFICIAIS E LUBRIFICANTES OFTAMOLÓGICOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "LATANAPROSTA",
    "nome": "LATANAPROSTA",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "LAVITAN",
    "nome": "LAVITAN",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "LITIO",
    "nome": "LITIO",
    "principio_ativo": "CARBONATO DE LÍTIO",
    "classe_terapeutica": "ESTABILIZADORES DO HUMOR",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "LOSARTANA",
    "nome": "LOSARTANA",
    "principio_ativo": "LOSARTANA POTÁSSICA",
    "classe_terapeutica": "ANTAGONISTAS DA ANGIOTENSINA II PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "LUFTAL",
    "nome": "LUFTAL",
    "principio_ativo": "SIMETICONA",
    "classe_terapeutica": "Antiflatulentos Puros e Carminativos",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "LUVIS",
    "nome": "LUVIS",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "MACRODANTINA",
    "nome": "MACRODANTINA",
    "principio_ativo": "NITROFURANTOÍNA",
    "classe_terapeutica": "OUTROS ANTI-SÉPTCOS URINÁRIOS / OUTROS ANTI-SÉPTICOS URINÁRIOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "MANTIDAN",
    "nome": "MANTIDAN",
    "principio_ativo": "CLORIDRATO DE AMANTADINA",
    "classe_terapeutica": "ANTIPARKINSONIANOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "MELATONINA",
    "nome": "MELATONINA",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "MEMANTINA",
    "nome": "MEMANTINA",
    "principio_ativo": "CLORIDRATO DE MEMANTINA",
    "classe_terapeutica": "TODOS OS OUTROS PRODUTOS ANTIALZHEIMER",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "METFORMINA",
    "nome": "METFORMINA",
    "principio_ativo": "CLORIDRATO DE METFORMINA",
    "classe_terapeutica": "ANTIDIABÉTICOS BIGUANIDAS PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "MIRTAZAPINA",
    "nome": "MIRTAZAPINA",
    "principio_ativo": "MIRTAZAPINA",
    "classe_terapeutica": "ANTIDEPRESSIVOS TODOS OS OUTROS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "MYRAFER",
    "nome": "MYRAFER",
    "principio_ativo": "FERRIPOLIMALTOSE",
    "classe_terapeutica": "FERRO PURO",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "NATZ",
    "nome": "NATZ",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "NEOZINE",
    "nome": "NEOZINE",
    "principio_ativo": "CLORIDRATO DE LEVOMEPROMAZINA / MALEATO DE LEVOMEPROMAZINA",
    "classe_terapeutica": "ANTIPSICÓTICOS CONVENCIONAIS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "NITROFURANTOINA100",
    "nome": "NITROFURANTOINA100",
    "principio_ativo": "NITROFURANTOÍNA",
    "classe_terapeutica": "OUTROS ANTI-SÉPTICOS URINÁRIOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "OLANZAPINA",
    "nome": "OLANZAPINA",
    "principio_ativo": "OLANZAPINA",
    "classe_terapeutica": "ANTIPSICÓTICOS ATÍPICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "OLMESARTANA",
    "nome": "OLMESARTANA",
    "principio_ativo": "OLMESARTANA MEDOXOMILA",
    "classe_terapeutica": "ANTAGONISTAS DA ANGIOTENSINA II PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "OMEPRAZOL",
    "nome": "OMEPRAZOL",
    "principio_ativo": "OMEPRAZOL",
    "classe_terapeutica": "INIBIDORES DA BOMBA DE PRÓTONS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "OXALATO",
    "nome": "OXALATO",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "PANTOPRAZOL",
    "nome": "PANTOPRAZOL",
    "principio_ativo": "PANTOPRAZOL SÓDICO SESQUI-HIDRATADO",
    "classe_terapeutica": "INIBIDORES DA BOMBA DE PRÓTONS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "PAROXETINA",
    "nome": "PAROXETINA",
    "principio_ativo": "CLORIDRATO DE PAROXETINA / CLORIDRATO DE PAROXETINA HEMI-HIDRATADO",
    "classe_terapeutica": "ANTIDEPRESSIVOS SSRI",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "PISA",
    "nome": "PISA",
    "principio_ativo": "DICLORIDRATO DE PRAMIPEXOL",
    "classe_terapeutica": "ANTIPARKINSONIANOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "PRAMIPEXOL",
    "nome": "PRAMIPEXOL",
    "principio_ativo": "DICLORIDRATO DE PRAMIPEXOL / DICLORIDRATO DE PRAMIPEXOL MONOIDRATADO",
    "classe_terapeutica": "ANTIPARKINSONIANOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "PREGABALINA",
    "nome": "PREGABALINA",
    "principio_ativo": "PREGABALINA",
    "classe_terapeutica": "ANTIEPILÉPTICOS / GABAPENTINOIDES",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "PREGABALINA 75",
    "nome": "PREGABALINA 75",
    "principio_ativo": "PREGABALINA",
    "classe_terapeutica": "ANTIEPILÉPTICOS / GABAPENTINOIDES",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "PROLOPA",
    "nome": "PROLOPA",
    "principio_ativo": "LEVODOPA;CLORIDRATO DE BENSERAZIDA",
    "classe_terapeutica": "ANTIPARKINSONIANOS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "PURAN",
    "nome": "PURAN",
    "principio_ativo": "LEVOTIROXINA SÓDICA",
    "classe_terapeutica": "PREPARAÇÕES PARA TIREOIDE",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "QUEPSIA",
    "nome": "QUEPSIA",
    "principio_ativo": "HEMIFUMARATO DE QUETIAPINA",
    "classe_terapeutica": "ANTIPSICÓTICOS ATÍPICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "QUETIAPINA",
    "nome": "QUETIAPINA",
    "principio_ativo": "HEMIFUMARATO DE QUETIAPINA",
    "classe_terapeutica": "ANTIPSICÓTICOS ATÍPICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "RAZAPINA",
    "nome": "RAZAPINA",
    "principio_ativo": "MIRTAZAPINA",
    "classe_terapeutica": "ANTIDEPRESSIVOS TODOS OS OUTROS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "RISEDRONATO",
    "nome": "RISEDRONATO",
    "principio_ativo": "RISEDRONATO SÓDICO",
    "classe_terapeutica": "BISFOSFONATOS PARA OSTEOPOROSE E ALTERAÇÕES RELACIONADAS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "RISPERIDONA",
    "nome": "RISPERIDONA",
    "principio_ativo": "RISPERIDONA",
    "classe_terapeutica": "ANTIPSICÓTICOS ATÍPICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "RIVAROXABANA",
    "nome": "RIVAROXABANA",
    "principio_ativo": "RIVAROXABANA",
    "classe_terapeutica": "INIBIDORES DIRETOS DO FATOR XA",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "RIVOTRIL",
    "nome": "RIVOTRIL",
    "principio_ativo": "CLONAZEPAM",
    "classe_terapeutica": "ANTIEPILÉPTICOS / ANTIPSICÓTICOS CONVENCIONAIS",
    "lista": "B1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ROSUVASTA- TINA 20",
    "nome": "ROSUVASTA- TINA 20",
    "principio_ativo": "ROSUVASTATINA CÁLCICA",
    "classe_terapeutica": "ESTATINAS, INIBIDORES DA REDUTASE HMG-CoA",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "ROSUVASTATINA",
    "nome": "ROSUVASTATINA",
    "principio_ativo": "ROSUVASTATINA CÁLCICA",
    "classe_terapeutica": "ESTATINAS, INIBIDORES DA REDUTASE HMG-CoA",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "SANDY",
    "nome": "SANDY",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "SELOZOK",
    "nome": "SELOZOK",
    "principio_ativo": "SUCCINATO DE METOPROLOL",
    "classe_terapeutica": "BETABLOQUEADORES PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "SENE",
    "nome": "SENE",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "SERTRALINA",
    "nome": "SERTRALINA",
    "principio_ativo": "CLORIDRATO DE SERTRALINA",
    "classe_terapeutica": "ANTIDEPRESSIVOS SSRI",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "SIMETICONA",
    "nome": "SIMETICONA",
    "principio_ativo": "SIMETICONA",
    "classe_terapeutica": "Antiflatulentos Puros e Carminativos",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "SINVASTATINA",
    "nome": "SINVASTATINA",
    "principio_ativo": "SINVASTATINA",
    "classe_terapeutica": "ESTATINAS, INIBIDORES DA REDUTASE HMG-CoA",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "SIVASTATINA",
    "nome": "SIVASTATINA",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "SULFATO",
    "nome": "SULFATO",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "TIMOLOL",
    "nome": "TIMOLOL",
    "principio_ativo": "MALEATO DE TIMOLOL / MALEATO ÁCIDO DE TIMOLOL",
    "classe_terapeutica": "PREPARAÇÕES ANTIGLAUCOMAS E MIÓTICAS TÓPICAS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "TRAZODONA",
    "nome": "TRAZODONA",
    "principio_ativo": "CLORIDRATO DE TRAZODONA",
    "classe_terapeutica": "ANTIDEPRESSIVOS TODOS OS OUTROS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "VALPROATO",
    "nome": "VALPROATO",
    "principio_ativo": "VALPROATO DE SÓDIO",
    "classe_terapeutica": "ANTIEPILÉPTICOS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "VASOGARD",
    "nome": "VASOGARD",
    "principio_ativo": "CILOSTAZOL",
    "classe_terapeutica": "INIBIDORES DA AGREGAÇÃO PLAQUETÁRIA, REALÇADORES DO AMP CÍCLICO",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "VENLAFAXINA",
    "nome": "VENLAFAXINA",
    "principio_ativo": "CLORIDRATO DE VENLAFAXINA",
    "classe_terapeutica": "ANTIDEPRESSIVOS SNRI",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "VERAPAMIL",
    "nome": "VERAPAMIL",
    "principio_ativo": "CLORIDRATO DE VERAPAMIL",
    "classe_terapeutica": "ANTAGONISTAS DO CÁLCIO PUROS",
    "lista": "fora_344",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual."
  },
  {
    "chave": "VITAFER",
    "nome": "VITAFER",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "VITAMINA",
    "nome": "VITAMINA",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "VITAVAN",
    "nome": "VITAVAN",
    "principio_ativo": "",
    "classe_terapeutica": "A conferir",
    "lista": "revisar",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Nome incompleto, composição ou apresentação não confirmada. Confira a embalagem/prescrição e informe o nome completo."
  },
  {
    "chave": "VIVENCIA",
    "nome": "VIVENCIA",
    "principio_ativo": "HIDROGENOTARTARATO DE RIVASTIGMINA",
    "classe_terapeutica": "PRODUTOS ANTIALZHEIMER, INIBIDORES DA COLINESTERASE",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ZETRON",
    "nome": "ZETRON",
    "principio_ativo": "CLORIDRATO DE BUPROPIONA",
    "classe_terapeutica": "ANTIDEPRESSIVOS TODOS OS OUTROS",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ZIDER",
    "nome": "ZIDER",
    "principio_ativo": "CLORIDRATO DE MEMANTINA",
    "classe_terapeutica": "TODOS OS OUTROS PRODUTOS ANTIALZHEIMER",
    "lista": "C1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  },
  {
    "chave": "ZOLPIDEM",
    "nome": "ZOLPIDEM",
    "principio_ativo": "HEMITARTARATO DE ZOLPIDEM",
    "classe_terapeutica": "HIPNÓTICOS E SEDATIVOS NÃO BARBITÚRICOS PUROS",
    "lista": "B1",
    "verificado_em": "2026-09-16",
    "fonte": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos",
    "nota": "Classificação por princípio ativo. Dose, apresentação e duração dependem da prescrição individual.",
    "fonte_controle": "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias"
  }
]
$catalog$::jsonb);

select set_config('harmonia.med_reason','Classificação regulatória: CMED 09/09/2026 e RDC Anvisa 1.036/2026. Prescrição preservada.',true);
update public.medicacoes m set classificacao_info=c.info,
 classificacao_medicamento=case c.info->>'lista' when 'B1' then 'controlado' when 'C1' then 'controle_especial' else m.classificacao_medicamento end
from harmonia_med_private.catalogo c where harmonia_med_private.norm(m.nome_medicamento)=c.chave;

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
   'catalog',coalesce((select jsonb_agg(info order by chave) from harmonia_med_private.catalogo),'[]'::jsonb));
 end if;
 if p_action='executions' then
  from_day:=nullif(p_payload->>'from','')::date;to_day:=nullif(p_payload->>'to','')::date;
  if from_day is null or to_day is null or to_day<from_day then raise exception 'Informe um período válido.';end if;
  patient:=nullif(p_payload->>'paciente_id','')::uuid;off:=greatest(coalesce((p_payload->>'offset')::integer,0),0);
  select coalesce(jsonb_agg(to_jsonb(q) order by q.data,q.nome_paciente,q.horario,q.id),'[]'::jsonb) into out_json from (
   select e.*,p.nome_completo as nome_paciente from public.medicacoes_execucao e join public.pacientes p on p.id=e.paciente_id and p.empresa_id=u.empresa_id
   where e.empresa_id=u.empresa_id and e.data between from_day and to_day and (patient is null or e.paciente_id=patient)
   and (u.hierarquia in (1,2) or exists(select 1 from public.pacientes_profissionais v where v.paciente_id=p.id and v.usuario_id=u.id and v.empresa_id=u.empresa_id and v.ativo=true))
   order by e.data,p.nome_completo,e.horario,e.id limit 500 offset off
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
create or replace function public.medicacao_api(p_action text,p_token text default null,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select harmonia_med_private.api(p_action,p_token,p_payload)$$;
revoke all on all functions in schema harmonia_med_private from public,anon,authenticated;
grant usage on schema harmonia_med_private to anon,authenticated;
grant execute on function harmonia_med_private.api(text,text,jsonb) to anon,authenticated;
revoke all on function public.medicacao_api(text,text,jsonb) from public;
grant execute on function public.medicacao_api(text,text,jsonb) to anon,authenticated;
-- New panel writes only through the validated endpoint. Keep existing read grants unchanged.
revoke insert,update,delete,truncate,references,trigger on public.medicacoes,public.medicacoes_execucao from anon,authenticated;
