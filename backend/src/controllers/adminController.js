import * as evolucaoService from '../services/evolucaoService.js';
import * as turmaService from '../services/turmaService.js';
import * as questaoService from '../services/questaoService.js';
import * as relatorioService from '../services/relatorioService.js';
import * as importacaoService from '../services/importacaoService.js';
import * as eventoService from '../services/eventoService.js';
import * as temporadaService from '../services/temporadaService.js';

// ---------- Turmas ----------

export async function criarTurma(req, res, next) {
  try {
    const turma = await turmaService.criarTurma(req.usuario.id, req.body?.nome, req.usuario.empresa_id);
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

export async function relatorioFases(req, res, next) {
  try {
    res.json(await relatorioService.desempenhoPorFase());
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

// ---------- Eventos temporários ----------

export async function criarEvento(req, res, next) {
  try {
    res.status(201).json(await eventoService.criarEvento(req.body, req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
}

export async function listarEventos(req, res, next) {
  try {
    res.json(await eventoService.listarEventos(req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
}

export async function removerEvento(req, res, next) {
  try {
    await eventoService.removerEvento(req.params.id, req.usuario.empresa_id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ---------- Temporadas ----------

export async function criarTemporada(req, res, next) {
  try {
    res.status(201).json(await temporadaService.criarTemporada(req.body));
  } catch (err) {
    next(err);
  }
}

export async function listarTemporadas(req, res, next) {
  try {
    res.json(await temporadaService.listarTemporadas());
  } catch (err) {
    next(err);
  }
}

export async function definirTrilhaTemporada(req, res, next) {
  try {
    res.json(await temporadaService.definirTrilha(req.params.temporadaId, req.body?.degraus));
  } catch (err) {
    next(err);
  }
}

export async function evolucaoDaTurma(req, res, next) {
  try {
    res.json(
      await evolucaoService.evolucaoDaTurma(
        req.usuario.id,
        req.params.turmaId,
        req.query.semanas ?? 8
      )
    );
  } catch (err) {
    next(err);
  }
}

export async function importarColaboradores(req, res, next) {
  try {
    res.json(await importacaoService.importarColaboradores(req.usuario, req.body?.csv));
  } catch (err) {
    next(err);
  }
}
