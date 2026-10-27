import * as empresaService from '../services/empresaService.js';

export async function criar(req, res, next) {
  try {
    res.status(201).json(await empresaService.criarEmpresa(req.usuario, req.body?.nome));
  } catch (err) {
    next(err);
  }
}

export async function entrar(req, res, next) {
  try {
    res.json(await empresaService.entrarNaEmpresa(req.usuario, req.body?.codigo_convite));
  } catch (err) {
    next(err);
  }
}

export async function minha(req, res, next) {
  try {
    res.json(await empresaService.minhaEmpresa(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function membros(req, res, next) {
  try {
    res.json(await empresaService.listarMembros(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function definirPapel(req, res, next) {
  try {
    await empresaService.definirPapel(req.usuario, req.params.id, req.body?.papel);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
