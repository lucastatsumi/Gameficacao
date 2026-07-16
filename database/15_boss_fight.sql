-- ============================================================
-- 15_boss_fight.sql — "Vidas" em quizzes customizados: erra `vidas`
-- vezes e o desafio acaba ali (vira um "boss fight" relâmpago em vez
-- de um quiz normal). Mecânica de minigame do roadmap de engajamento.
--
-- Sem NENHUMA mudança na lógica de correção/XP/aprovação: `vidas` é
-- só metadado de configuração do quiz. Quem decide encerrar a
-- tentativa mais cedo é o FRONTEND, chamando /quiz/finalizar assim
-- que o número de erros atinge o limite — o backend já sabe lidar
-- com "menos respostas do que total_questoes" (finalizarQuiz calcula
-- acertos/aprovação sobre o que foi de fato respondido).
-- Aplicar via MCP como migration "15_boss_fight".
-- ============================================================

alter table quizzes_custom add column vidas int check (vidas is null or vidas > 0);
