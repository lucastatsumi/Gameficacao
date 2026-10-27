import * as perfilService from '../services/perfilService.js';
import * as missaoService from '../services/missaoService.js';
import * as avaliacaoService from '../services/avaliacaoService.js';

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
