import * as avaliacaoService from '../services/avaliacaoService.js';

export async function proficiencia(req, res, next) {
  try {
    res.json(await avaliacaoService.proficienciaDoUsuario(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function competencias(req, res, next) {
  try {
    res.json(await avaliacaoService.matrizDeCompetencias(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function certificado(req, res, next) {
  try {
    res.json(await avaliacaoService.certificadoDoTema(req.usuario, req.params.temaId));
  } catch (err) {
    next(err);
  }
}
