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
    'nav.ligas': 'Liga',
    'nav.temporada': 'Temporada',
    'nav.perfil': 'Perfil',
    'nav.loja': 'Loja',
    'nav.admin': 'Admin',
    'nav.empresa': 'Empresa',
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
      'Aprenda a cultura, os processos e as políticas da empresa jogando: resolva cenários reais do dia a dia, ganhe XP, desbloqueie módulos e dispute o ranking com a sua equipe.',
    'login.feature1': 'Trilhas de onboarding, LGPD, atendimento e liderança',
    'login.feature2': 'Quiz com timer e feedback',
    'login.feature3': 'XP, níveis e 12 conquistas',
    'login.insertCoin': '▼ INSERT COIN ▼',
    'login.contaCriada':
      'Conta criada! Se a confirmação por e-mail estiver ativa no projeto, confirme antes de entrar.',
    'login.nomeObrigatorio': 'Informe seu nome',

    'mapa.titulo': 'Trilhas de Treinamento',
    'mapa.subtitulo': 'Acerte pelo menos 70% do quiz para concluir o módulo e desbloquear o próximo.',
    'mapa.carregando': 'Carregando o mapa...',
    'mapa.fase': 'MÓDULO',
    'mapa.concluida': 'Concluída',
    'mapa.melhor': 'Melhor',
    'mapa.tentativas': 'Tentativas',
    'mapa.bloqueada': 'Conclua o módulo anterior para desbloquear',
    'mapa.jogar': 'JOGAR',
    'mapa.rejogar': 'REJOGAR',
    'mapa.desafiar': 'Desafiar um colega',
    'mapa.linkCopiado': 'Link copiado!',
    'mapa.erroDesafio': 'Não foi possível gerar o desafio',
    'mapa.pendentePrefixo': 'Você deixou',
    'mapa.pendenteSufixo': 'pela metade — toque para retomar (começa um quiz novo desse módulo).',
    'mapa.copieOLink': 'Copie o link do desafio:',
  },
  en: {
    'nav.mapa': 'Map',
    'nav.quizzes': 'Quizzes',
    'nav.ranking': 'Leaderboard',
    'nav.ligas': 'League',
    'nav.temporada': 'Season',
    'nav.perfil': 'Profile',
    'nav.loja': 'Shop',
    'nav.admin': 'Admin',
    'nav.empresa': 'Company',
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
      'Learn your company culture, processes, and policies by playing: solve real day-to-day scenarios, earn XP, unlock modules, and compete on the leaderboard with your team.',
    'login.feature1': 'Onboarding, privacy, customer service and leadership tracks',
    'login.feature2': 'Timed quizzes with feedback',
    'login.feature3': 'XP, levels, and 12 achievements',
    'login.insertCoin': '▼ INSERT COIN ▼',
    'login.contaCriada':
      'Account created! If email confirmation is enabled on this project, confirm it before logging in.',
    'login.nomeObrigatorio': 'Please enter your name',

    'mapa.titulo': 'Training Tracks',
    'mapa.subtitulo': 'Score at least 70% on the quiz to complete the module and unlock the next one.',
    'mapa.carregando': 'Loading the map...',
    'mapa.fase': 'MODULE',
    'mapa.concluida': 'Completed',
    'mapa.melhor': 'Best',
    'mapa.tentativas': 'Attempts',
    'mapa.bloqueada': 'Complete the previous module to unlock',
    'mapa.jogar': 'PLAY',
    'mapa.rejogar': 'REPLAY',
    'mapa.desafiar': 'Challenge a friend',
    'mapa.linkCopiado': 'Link copied!',
    'mapa.erroDesafio': 'Could not create the challenge',
    'mapa.pendentePrefixo': 'You left',
    'mapa.pendenteSufixo': 'half-finished — tap to resume (starts a new quiz for that module).',
    'mapa.copieOLink': 'Copy the challenge link:',
  },
};

export const IDIOMAS_DISPONIVEIS = Object.keys(traducoes);
