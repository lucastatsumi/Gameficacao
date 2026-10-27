-- ============================================================
-- 47_lembretes_email.sql — Lembrete por e-mail (roadmap v2, "fora do
-- escopo" -> provedor Resend). Opt-out por usuário e controle de
-- frequência: no máximo 1 lembrete a cada 7 dias por pessoa.
-- Disparado por backend/src/services/lembreteService.js (rota de cron
-- protegida por CRON_SECRET). Sem RESEND_API_KEY nada é enviado.
-- ============================================================

alter table profiles add column if not exists lembretes_email boolean not null default true;
alter table profiles add column if not exists ultimo_lembrete_em timestamptz;
