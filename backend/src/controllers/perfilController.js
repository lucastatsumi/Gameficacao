import * as perfilService from '../services/perfilService.js';
import * as missaoService from '../services/missaoService.js';
import * as avaliacaoService from '../services/avaliacaoService.js';
import * as cartaService from '../services/cartaService.js';
import * as prestigioService from '../services/prestigioService.js';
import * as campanhaService from '../services/campanhaService.js';
import * as torneioService from '../services/torneioService.js';

export async function perfil(req, res, next) {
  try {
    res.json(await perfilService.obterPerfil(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function badges(req, res, next) {
  try {
    res.json(await perfilService.listarBadges(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function historico(req, res, next) {
  try {
    res.json(await perfilService.historicoDeTentativas(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function revisao(req, res, next) {
  try {
    res.json(await perfilService.errosRecentes(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function pendente(req, res, next) {
  try {
    res.json(await perfilService.tentativaAbertaPendente(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function missoes(req, res, next) {
  try {
    res.json(await missaoService.missoesDoDia(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function missoesSemana(req, res, next) {
  try {
    res.json(await missaoService.missoesDaSemana(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function competencias(req, res, next) {
  try {
    res.json(await avaliacaoService.minhasCompetencias(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function proficiencia(req, res, next) {
  try {
    res.json(await avaliacaoService.proficiencia(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function certificado(req, res, next) {
  try {
    res.json(await avaliacaoService.certificado(req.usuario, req.params.temaId));
  } catch (err) {
    next(err);
  }
}

export async function cartas(req, res, next) {
  try {
    res.json(await cartaService.album(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function prestigios(req, res, next) {
  try {
    res.json(await prestigioService.meusPrestigios(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function prestigiar(req, res, next) {
  try {
    res.status(201).json(await prestigioService.prestigiar(req.usuario, req.params.temaId));
  } catch (err) {
    next(err);
  }
}

export async function campanhas(req, res, next) {
  try {
    res.json(await campanhaService.campanhasDoJogador(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function rankingCampanha(req, res, next) {
  try {
    res.json(await campanhaService.rankingDaCampanha(req.usuario, req.params.campanhaId));
  } catch (err) {
    next(err);
  }
}

export async function torneios(req, res, next) {
  try {
    res.json(await torneioService.torneiosDoTenant(req.usuario));
  } catch (err) {
    next(err);
  }
}
