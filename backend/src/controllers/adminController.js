import * as turmaService from '../services/turmaService.js';
import * as questaoService from '../services/questaoService.js';
import * as relatorioService from '../services/relatorioService.js';
import * as eventoService from '../services/eventoService.js';
import * as temporadaService from '../services/temporadaService.js';
import * as temaService from '../services/temaService.js';
import * as empresaService from '../services/empresaService.js';
import * as avaliacaoService from '../services/avaliacaoService.js';
import * as iaService from '../services/iaService.js';
import * as respostaAbertaService from '../services/respostaAbertaService.js';

// ---------- Turmas ----------

export async function criarTurma(req, res, next) {
  try {
    const turma = await turmaService.criarTurma(
      req.usuario.id,
      req.body?.nome,
      req.usuario.empresa_id,
    );
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
    const temaIds = await temaService.idsTemasVisiveis(req.usuario);
    res.json(await questaoService.listarQuestoes(faseId, temaIds));
  } catch (err) {
    next(err);
  }
}

export async function criarQuestao(req, res, next) {
  try {
    await questaoService.exigirFaseEditavel(req.usuario, req.body?.fase_id);
    const questao = await questaoService.criarQuestao(req.usuario.id, req.body);
    res.status(201).json(questao);
  } catch (err) {
    next(err);
  }
}

export async function atualizarQuestao(req, res, next) {
  try {
    await questaoService.exigirQuestaoEditavel(req.usuario, req.params.id);
    if (req.body?.fase_id) await questaoService.exigirFaseEditavel(req.usuario, req.body.fase_id);
    res.json(await questaoService.atualizarQuestao(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function desativarQuestao(req, res, next) {
  try {
    await questaoService.exigirQuestaoEditavel(req.usuario, req.params.id);
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
    res.json(await relatorioService.desempenhoPorQuestao(faseId, req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
}

export async function relatorioFases(req, res, next) {
  try {
    res.json(await relatorioService.desempenhoPorFase(req.usuario.empresa_id));
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
    res.status(201).json(await temporadaService.criarTemporada(req.body, req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
}

export async function listarTemporadas(req, res, next) {
  try {
    res.json(await temporadaService.listarTemporadas(new Date(), req.usuario.empresa_id));
  } catch (err) {
    next(err);
  }
}

export async function definirTrilhaTemporada(req, res, next) {
  try {
    res.json(
      await temporadaService.definirTrilha(
        req.params.temporadaId,
        req.body?.degraus,
        req.usuario.empresa_id,
      ),
    );
  } catch (err) {
    next(err);
  }
}

// ---------- Temas, módulos e competências (Horizonte 1) ----------

export async function listarTemas(req, res, next) {
  try {
    res.json(await temaService.temasDoGestor(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function criarTema(req, res, next) {
  try {
    res.status(201).json(await temaService.criarTema(req.usuario, req.body));
  } catch (err) {
    next(err);
  }
}

export async function criarModulo(req, res, next) {
  try {
    res.status(201).json(await temaService.criarModulo(req.usuario, req.params.temaId, req.body));
  } catch (err) {
    next(err);
  }
}

export async function criarCompetencia(req, res, next) {
  try {
    res
      .status(201)
      .json(await temaService.criarCompetencia(req.usuario, req.params.temaId, req.body));
  } catch (err) {
    next(err);
  }
}

export async function temasDaTurma(req, res, next) {
  try {
    res.json(await temaService.temasDaTurma(req.usuario, req.params.turmaId));
  } catch (err) {
    next(err);
  }
}

export async function definirTemasDaTurma(req, res, next) {
  try {
    res.json(
      await temaService.definirTemasDaTurma(req.usuario, req.params.turmaId, req.body?.tema_ids),
    );
  } catch (err) {
    next(err);
  }
}

// ---------- Empresa: membros, papéis e temas ativos (dono) ----------

export async function membros(req, res, next) {
  try {
    res.json(await empresaService.membros(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function definirPapel(req, res, next) {
  try {
    res.json(await empresaService.definirPapel(req.usuario, req.params.userId, req.body?.papel));
  } catch (err) {
    next(err);
  }
}

export async function definirTemasAtivos(req, res, next) {
  try {
    res.json(await empresaService.definirTemasAtivos(req.usuario, req.body?.tema_ids));
  } catch (err) {
    next(err);
  }
}

// ---------- Matriz de competências da equipe (Horizonte 3) ----------

export async function matrizDaEquipe(req, res, next) {
  try {
    res.json(await avaliacaoService.matrizDaEquipe(req.usuario, req.params.turmaId));
  } catch (err) {
    next(err);
  }
}

// ---------- IA: geração, auditoria e revisão (Horizonte 2) ----------

export async function gerarQuestoesIa(req, res, next) {
  try {
    res.status(201).json(await iaService.gerarQuestoes(req.usuario, req.body));
  } catch (err) {
    next(err);
  }
}

export async function gerarDeDocumentoIa(req, res, next) {
  try {
    res.status(201).json(await iaService.gerarDeDocumento(req.usuario, req.body));
  } catch (err) {
    next(err);
  }
}

export async function auditarTemaIa(req, res, next) {
  try {
    res.json(await iaService.auditarTema(req.usuario, req.params.temaId));
  } catch (err) {
    next(err);
  }
}

export async function listarRascunhosIa(req, res, next) {
  try {
    const temas = await temaService.temasDoGestor(req.usuario);
    const editaveis = temas.filter((t) => t.editavel).map((t) => t.id);
    res.json(await iaService.listarRascunhos(req.usuario, editaveis));
  } catch (err) {
    next(err);
  }
}

export async function aprovarRascunho(req, res, next) {
  try {
    await questaoService.exigirQuestaoEditavel(req.usuario, req.params.id);
    res.json(await questaoService.aprovarRascunho(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function descartarRascunho(req, res, next) {
  try {
    await questaoService.exigirQuestaoEditavel(req.usuario, req.params.id);
    res.json(await questaoService.descartarRascunho(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function custosIa(req, res, next) {
  try {
    res.json(await iaService.custosRecentes(req.usuario));
  } catch (err) {
    next(err);
  }
}

// ---------- Respostas abertas: revisão do gestor (Horizonte 3) ----------

export async function listarAvaliacoesAbertas(req, res, next) {
  try {
    res.json(await respostaAbertaService.listarAvaliacoes(req.usuario, { status: req.query.status ?? null }));
  } catch (err) {
    next(err);
  }
}

export async function revisarAvaliacaoAberta(req, res, next) {
  try {
    res.json(await respostaAbertaService.revisarAvaliacao(req.usuario, req.params.respostaId, req.body));
  } catch (err) {
    next(err);
  }
}
