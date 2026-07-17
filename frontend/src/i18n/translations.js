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
    'login.feature1': '5 fases: de Listas a Ordenação',
    'login.feature2': 'Quiz com timer e feedback',
    'login.feature3': 'XP, níveis e 10 conquistas',
    'login.insertCoin': '▼ INSERT COIN ▼',
    'login.contaCriada':
      'Conta criada! Se a confirmação por e-mail estiver ativa no projeto, confirme antes de entrar.',
    'login.nomeObrigatorio': 'Informe seu nome',
  },
  en: {
    'nav.mapa': 'Map',
    'nav.quizzes': 'Quizzes',
    'nav.ranking': 'Leaderboard',
    'nav.perfil': 'Profile',
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
    'login.feature1': '5 stages: from Lists to Sorting',
    'login.feature2': 'Timed quizzes with feedback',
    'login.feature3': 'XP, levels, and 10 achievements',
    'login.insertCoin': '▼ INSERT COIN ▼',
    'login.contaCriada':
      'Account created! If email confirmation is enabled on this project, confirm it before logging in.',
    'login.nomeObrigatorio': 'Please enter your name',
  },
};

export const IDIOMAS_DISPONIVEIS = Object.keys(traducoes);
