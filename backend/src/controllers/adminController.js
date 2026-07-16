import * as turmaService from '../services/turmaService.js';
import * as questaoService from '../services/questaoService.js';
import * as relatorioService from '../services/relatorioService.js';

// ---------- Turmas ----------

export async function criarTurma(req, res, next) {
  try {
    const turma = await turmaService.criarTurma(req.usuario.id, req.body?.nome);
    res.status(201).json(turma);
  } catch (err) {
    next(err);
  }
}

export async function listarTurmas(req, res, next) {
  try {
    res.json(await turmaService.turmasDoProfessor(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function alunosDaTurma(req, res, next) {
  try {
    res.json(await turmaService.alunosDaTurma(req.usuario.id, req.params.turmaId));
  } catch (err) {
    next(err);
  }
}

// ---------- Questões ----------

export async function listarQuestoes(req, res, next) {
  try {
    const faseId = req.query.fase_id ? Number(req.query.fase_id) : null;
    res.json(await questaoService.listarQuestoes(faseId));
  } catch (err) {
    next(err);
  }
}

export async function criarQuestao(req, res, next) {
  try {
    const questao = await questaoService.criarQuestao(req.usuario.id, req.body);
    res.status(201).json(questao);
  } catch (err) {
    next(err);
  }
}

export async function atualizarQuestao(req, res, next) {
  try {
    res.json(await questaoService.atualizarQuestao(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function desativarQuestao(req, res, next) {
  try {
    await questaoService.desativarQuestao(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ---------- Relatórios ----------

export async function relatorioQuestoes(req, res, next) {
  try {
    const faseId = req.query.fase_id ? Number(req.query.fase_id) : null;
    res.json(await relatorioService.desempenhoPorQuestao(faseId));
  } catch (err) {
    next(err);
  }
}

export async function exportarCsvTurma(req, res, next) {
  try {
    const { nomeArquivo, conteudo } = await relatorioService.csvDesempenhoTurma(
      req.usuario.id,
      req.params.turmaId,
    );
    res
      .type('text/csv; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
      .send(conteudo);
  } catch (err) {
    next(err);
  }
}
