// Dicionário de i18n — infraestrutura pronta pra qualquer página consumir
// via useI18n().t('chave'). Cobertura ATUAL é deliberadamente parcial
// (navegação + tela de login, como padrão de referência), não o app
// inteiro — ver docs/ROADMAP.md para o que falta e por quê.
//
// AVISO: a tradução para 'en' foi feita pelo próprio agente (sem revisor
// nativo). Pode ter escolhas de fraseado estranhas a um falante nativo de
// inglês — revisar antes de usar em produção com público internacional.
export const traducoes = {
  pt: {
    'nav.mapa': 'Mapa',
    'nav.quizzes': 'Quizzes',
    'nav.ranking': 'Ranking',
    'nav.perfil': 'Perfil',
    'nav.loja': 'Loja',
    'nav.admin': 'Admin',
    'nav.sair': 'Sair',
    'nav.nivel': 'Nv.',

    'login.entrar': 'Entrar',
    'login.criarConta': 'Criar conta',
    'login.nome': 'Seu nome',
    'login.email': 'E-mail',
    'login.senha': 'Senha (mín. 6 caracteres)',
    'login.aguarde': 'AGUARDE...',
    'login.pressStart': 'PRESS START',
    'login.newGame': 'NEW GAME',
    'login.subtitulo':
      'Domine Estruturas de Dados jogando: resolva cenários reais de programação, ganhe XP, desbloqueie fases e dispute o ranking com a sua turma.',
    'login.feature1': '6 fases: de Listas a Estruturas Avançadas',
    'login.feature2': 'Quiz com timer e feedback',
    'login.feature3': 'XP, níveis e 12 conquistas',
    'login.insertCoin': '▼ INSERT COIN ▼',
    'login.contaCriada':
      'Conta criada! Se a confirmação por e-mail estiver ativa no projeto, confirme antes de entrar.',
    'login.nomeObrigatorio': 'Informe seu nome',

    'mapa.titulo': 'Mapa de Fases',
    'mapa.subtitulo': 'Acerte pelo menos 70% do quiz para concluir a fase e desbloquear a próxima.',
    'mapa.carregando': 'Carregando o mapa...',
    'mapa.fase': 'FASE',
    'mapa.concluida': 'Concluída',
    'mapa.melhor': 'Melhor',
    'mapa.tentativas': 'Tentativas',
    'mapa.bloqueada': 'Conclua a fase anterior para desbloquear',
    'mapa.jogar': 'JOGAR',
    'mapa.rejogar': 'REJOGAR',
    'mapa.desafiar': 'Desafiar um colega',
    'mapa.linkCopiado': 'Link copiado!',
    'mapa.erroDesafio': 'Não foi possível gerar o desafio',
    'mapa.pendentePrefixo': 'Você deixou',
    'mapa.pendenteSufixo': 'pela metade — toque para retomar (começa um quiz novo dessa fase).',
    'mapa.copieOLink': 'Copie o link do desafio:',
  },
  en: {
    'nav.mapa': 'Map',
    'nav.quizzes': 'Quizzes',
    'nav.ranking': 'Leaderboard',
    'nav.perfil': 'Profile',
    'nav.loja': 'Shop',
    'nav.admin': 'Admin',
    'nav.sair': 'Log out',
    'nav.nivel': 'Lv.',

    'login.entrar': 'Log in',
    'login.criarConta': 'Sign up',
    'login.nome': 'Your name',
    'login.email': 'Email',
    'login.senha': 'Password (min. 6 characters)',
    'login.aguarde': 'PLEASE WAIT...',
    'login.pressStart': 'PRESS START',
    'login.newGame': 'NEW GAME',
    'login.subtitulo':
      'Master Data Structures by playing: solve real programming scenarios, earn XP, unlock stages, and compete on the leaderboard with your class.',
    'login.feature1': '6 stages: from Lists to Advanced Structures',
    'login.feature2': 'Timed quizzes with feedback',
    'login.feature3': 'XP, levels, and 12 achievements',
    'login.insertCoin': '▼ INSERT COIN ▼',
    'login.contaCriada':
      'Account created! If email confirmation is enabled on this project, confirm it before logging in.',
    'login.nomeObrigatorio': 'Please enter your name',

    'mapa.titulo': 'Stage Map',
    'mapa.subtitulo': 'Score at least 70% on the quiz to complete the stage and unlock the next one.',
    'mapa.carregando': 'Loading the map...',
    'mapa.fase': 'STAGE',
    'mapa.concluida': 'Completed',
    'mapa.melhor': 'Best',
    'mapa.tentativas': 'Attempts',
    'mapa.bloqueada': 'Complete the previous stage to unlock',
    'mapa.jogar': 'PLAY',
    'mapa.rejogar': 'REPLAY',
    'mapa.desafiar': 'Challenge a friend',
    'mapa.linkCopiado': 'Link copied!',
    'mapa.erroDesafio': 'Could not create the challenge',
    'mapa.pendentePrefixo': 'You left',
    'mapa.pendenteSufixo': 'half-finished — tap to resume (starts a new quiz for that stage).',
    'mapa.copieOLink': 'Copy the challenge link:',
  },
};

export const IDIOMAS_DISPONIVEIS = Object.keys(traducoes);
