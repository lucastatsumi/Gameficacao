import * as torneioService from '../services/torneioService.js';

export async function criar(req, res, next) {
  try {
    res.status(201).json(await torneioService.criarTorneio(req.usuario.id, req.body ?? {}));
  } catch (err) {
    next(err);
  }
}

export async function listar(req, res, next) {
  try {
    res.json(await torneioService.listarTorneios(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function placar(req, res, next) {
  try {
    const { torneio, placar: linhas } = await torneioService.placarDoTorneio(req.params.id);
    res.json({
      torneio: { id: torneio.id, nome: torneio.nome, status: torneio.status },
      placar: linhas.map(({ membros_ids: _ids, ...resto }) => resto),
    });
  } catch (err) {
    next(err);
  }
}

export async function encerrar(req, res, next) {
  try {
    res.json(await torneioService.encerrarTorneio(req.usuario.id, req.params.id));
  } catch (err) {
    next(err);
  }
}
