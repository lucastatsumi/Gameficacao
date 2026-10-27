-- ============================================================
-- 38_ia_questoes_abertas.sql — Horizonte 2 (montagem de quiz com IA)
-- + Horizonte 3 (questão aberta corrigida por IA com rubrica).
--
-- Regra inegociável: nenhuma questão gerada por IA entra em produção sem
-- aprovação humana. Rascunhos nascem com ativa = false e
-- status_revisao = 'pendente_revisao'; só a aprovação do gestor liga a
-- questão. A auditoria por IA não edita a questão original: cria um
-- rascunho que a SUBSTITUI quando aprovado (substitui_questao_id).
--
-- Questão aberta (formato 'resposta_aberta'): o gestor escreve a
-- pergunta e a rubrica (critérios + pesos); o colaborador responde em
-- texto livre; a IA dá nota 0–100 + feedback por critério. A avaliação é
-- PERSISTIDA uma única vez por resposta (PK = resposta_id) — nunca é
-- recalculada — e o gestor pode revisar e sobrescrever a nota.
-- ============================================================

alter table questoes add column status_revisao text not null default 'aprovada'
  check (status_revisao in ('aprovada', 'pendente_revisao', 'descartada'));
alter table questoes add column origem text not null default 'manual'
  check (origem in ('manual', 'ia_geracao', 'ia_documento', 'ia_auditoria'));
alter table questoes add column fonte_trecho text;          -- trecho do documento citado (ia_documento)
alter table questoes add column nota_ia text;               -- por que a IA sugeriu (auditoria)
alter table questoes add column substitui_questao_id uuid references questoes(id);
alter table questoes add column rubrica jsonb;              -- resposta_aberta: {criterios: [{criterio, peso}], referencia}

alter table questoes drop constraint questoes_formato_check;
alter table questoes add constraint questoes_formato_check
  check (formato in ('padrao', 'batalha_complexidade', 'reordenar_algoritmo', 'resposta_aberta'));

-- Rascunho nunca pode estar ativo (defesa em profundidade além do backend)
alter table questoes add constraint rascunho_inativo
  check (status_revisao = 'aprovada' or not ativa);

create index idx_questoes_pendentes on questoes (status_revisao) where status_revisao = 'pendente_revisao';

alter table respostas add column texto_resposta text;

create table avaliacoes_abertas (
  resposta_id   uuid primary key references respostas(id) on delete cascade,
  status        text not null default 'avaliada' check (status in ('avaliada', 'pendente')),
  nota_ia       int check (nota_ia between 0 and 100),
  feedback      jsonb not null default '[]',   -- [{criterio, nota, comentario}]
  justificativa text,
  modelo        text,
  nota_gestor   int check (nota_gestor between 0 and 100),
  comentario_gestor text,
  revisada_por  uuid references profiles(id),
  revisada_em   timestamptz,
  created_at    timestamptz not null default now()
);

-- Custo de cada chamada à IA, visível ao gestor
create table geracoes_ia (
  id            bigserial primary key,
  empresa_id    uuid references empresas(id) on delete cascade,
  gestor_id     uuid references profiles(id) on delete set null,
  tipo          text not null check (tipo in ('geracao', 'documento', 'auditoria', 'correcao')),
  modelo        text not null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  custo_usd     numeric(10, 4) not null default 0,
  itens         int not null default 0,
  created_at    timestamptz not null default now()
);

create index idx_geracoes_ia_empresa on geracoes_ia (empresa_id, created_at desc);

alter table avaliacoes_abertas enable row level security;
alter table geracoes_ia        enable row level security;
