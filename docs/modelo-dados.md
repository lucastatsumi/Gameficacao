# Modelo de dados

Gerado a partir de `database/01_schema.sql`, `06_quiz_custom_dicas.sql` e
`07_quizzes_abertos.sql`. Para recriar o schema do zero, rode os scripts de
`database/` em ordem no SQL Editor do Supabase.

```mermaid
erDiagram
    profiles {
        uuid id PK "= auth.users.id"
        text nome
        text email
        user_role role "aluno | professor"
        int nivel
        int xp_total
    }
    turmas {
        uuid id PK
        text nome
        text codigo_acesso UK
        uuid professor_id FK
    }
    matriculas {
        uuid user_id PK_FK
        uuid turma_id PK_FK
    }
    fases {
        int id PK
        text nome
        int ordem UK
        int fase_requisito_id FK "null = fase inicial"
    }
    questoes {
        uuid id PK
        int fase_id FK
        text enunciado
        dificuldade_questao dificuldade
        int tempo_limite_seg
        int xp_valor
        text dica "opcional, quizzes custom"
        boolean ativa "soft-delete"
    }
    alternativas {
        uuid id PK
        uuid questao_id FK
        char letra "A-D"
        boolean correta
        text explicacao
    }
    tentativas {
        uuid id PK
        uuid user_id FK
        int fase_id FK "xor com quiz_custom_id"
        uuid quiz_custom_id FK "xor com fase_id"
        int acertos
        int xp_ganho
        boolean aprovada
    }
    respostas {
        uuid id PK
        uuid tentativa_id FK
        uuid questao_id FK
        uuid alternativa_id FK "null = tempo esgotado"
        boolean correta
        boolean usou_dica
        int tempo_resposta_ms
    }
    progresso_fase {
        uuid user_id PK_FK
        int fase_id PK_FK
        boolean concluida
        int melhor_pontuacao
        int num_tentativas
    }
    badges {
        int id PK
        text nome UK
        tipo_condicao_badge tipo_condicao
        jsonb parametro
    }
    usuario_badges {
        uuid user_id PK_FK
        int badge_id PK_FK
        timestamptz conquistado_em
    }
    quizzes_custom {
        uuid id PK
        uuid turma_id FK "opcional desde a migration 07"
        uuid criador_id FK "qualquer usuário, não só professor"
        text titulo
        int tempo_limite_seg "null = usa o da questão"
        boolean permitir_dicas
        boolean ativo
    }
    quiz_custom_questoes {
        uuid quiz_id PK_FK
        uuid questao_id PK_FK
        int ordem
    }
    dicas_usadas {
        uuid tentativa_id PK_FK
        uuid questao_id PK_FK
    }

    profiles ||--o{ turmas : leciona
    profiles ||--o{ matriculas : "se matricula"
    turmas   ||--o{ matriculas : tem
    fases    ||--o{ fases : "requisito de"
    fases    ||--o{ questoes : contem
    questoes ||--o{ alternativas : tem
    profiles ||--o{ tentativas : faz
    fases    ||--o{ tentativas : "origem (campanha)"
    tentativas ||--o{ respostas : contem
    questoes ||--o{ respostas : "respondida em"
    profiles ||--o{ progresso_fase : acompanha
    fases    ||--o{ progresso_fase : progresso
    profiles ||--o{ usuario_badges : conquista
    badges   ||--o{ usuario_badges : concedida
    profiles ||--o{ quizzes_custom : cria
    turmas   ||--o{ quizzes_custom : "opcional"
    quizzes_custom ||--o{ quiz_custom_questoes : contem
    questoes ||--o{ quiz_custom_questoes : "usada em"
    quizzes_custom ||--o{ tentativas : "origem (custom)"
    tentativas ||--o{ dicas_usadas : usa
    questoes   ||--o{ dicas_usadas : "dica de"
```

## Pontos que não são óbvios olhando só o diagrama

- **`tentativas` tem origem XOR**: exatamente um entre `fase_id` e
  `quiz_custom_id` é preenchido (constraint `tentativa_origem`). Uma tentativa
  nunca pertence às duas coisas.
- **`alternativas` garante no máximo uma correta por questão** via índice
  parcial único (`uma_correta_por_questao`), não por trigger.
- **`quizzes_custom.turma_id` é opcional** desde `07_quizzes_abertos.sql` —
  antes dessa migration, quizzes custom só existiam dentro de uma turma
  criados pelo professor (`professor_id`). Hoje qualquer usuário cria um quiz
  (`criador_id`) e ele fica disponível a todos, com ou sem turma associada.
  Código ou UI que assuma "quiz = pertence a uma turma" está desatualizado.
- **`questoes.ativa`** é soft-delete: desativar uma questão a tira dos novos
  quizzes mas preserva `respostas` já registradas (histórico não é apagado).
- **Nível e ranking não são armazenados como fonte de verdade separada** —
  `profiles.nivel`/`xp_total` são atualizados a cada `finalizar` de quiz, mas
  a _posição_ no ranking é sempre calculada on-the-fly pelas views
  `ranking_global` / `ranking_turma` / `ranking_fase` (`RANK() OVER`), nunca
  lida de uma coluna.
