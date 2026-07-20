import * as perfilService from '../services/perfilService.js';
import * as missaoService from '../services/missaoService.js';

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
