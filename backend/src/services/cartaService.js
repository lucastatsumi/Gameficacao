import { db } from '../config/supabase.js';
import { competenciaDominada } from '../utils/proficiencia.js';
import { verificarBadges } from './badgeService.js';
import { temasVisiveis } from './temaService.js';

// Cartas colecionáveis de conhecimento (roadmap 4.9): colecionismo que É
// revisão de conteúdo. 1 carta por competência; dominar a competência
// revela a carta, cujo verso (competencias.resumo) vira material de
// consulta. Completar o álbum de um tema rende a badge "Álbum: <tema>".

async function competenciasDosTemas(temaIds) {
  if (!temaIds.length) return [];
  const { data, error } = await db
    .from('competencias')
    .select('id, nome, descricao, resumo, tema_id')
    .in('tema_id', temaIds)
    .order('id');
  if (error) throw error;
  return data;
}

async function reveladas(userId) {
  const { data, error } = await db
    .from('cartas_do_jogador')
    .select('competencia_id, revelada_em')
    .eq('user_id', userId);
  if (error) throw error;
  return new Map(data.map((c) => [c.competencia_id, c.revelada_em]));
}

// Hook chamado após finalizarQuiz: revela as cartas recém-dominadas e
// concede a badge dos álbuns que ficaram completos.
export async function revelarCartas(usuario) {
  const { data: desempenho, error } = await db
    .from('desempenho_competencias')
    .select('competencia_id, total, acertos')
    .eq('user_id', usuario.id);
  if (error) throw error;

  const jaReveladas = await reveladas(usuario.id);
  const novasIds = desempenho
    .filter((d) => competenciaDominada(d) && !jaReveladas.has(d.competencia_id))
    .map((d) => d.competencia_id);
  if (!novasIds.length) return { cartas_novas: [], badges_novas: [] };

  const { error: erroInsert } = await db
    .from('cartas_do_jogador')
    .upsert(
      novasIds.map((competencia_id) => ({ user_id: usuario.id, competencia_id })),
      { onConflict: 'user_id,competencia_id', ignoreDuplicates: true }
    );
  if (erroInsert) throw erroInsert;

  const temas = await temasVisiveis(usuario);
  const competencias = await competenciasDosTemas(temas.map((t) => t.id));
  const todasReveladas = new Set([...jaReveladas.keys(), ...novasIds]);
  const albunsCompletos = temas
    .map((t) => t.id)
    .filter((temaId) => {
      const doTema = competencias.filter((c) => c.tema_id === temaId);
      return doTema.length > 0 && doTema.every((c) => todasReveladas.has(c.id));
    });

  const badgesNovas = albunsCompletos.length
    ? await verificarBadges(usuario.id, { albunsCompletos })
    : [];

  return {
    cartas_novas: competencias
      .filter((c) => novasIds.includes(c.id))
      .map((c) => ({ id: c.id, nome: c.nome, tema_id: c.tema_id })),
    badges_novas: badgesNovas,
  };
}

// Álbum por tema: cartas não reveladas mostram só o nome (o verso fica
// escondido até a competência ser dominada).
export async function album(usuario) {
  const temas = await temasVisiveis(usuario);
  const [competencias, jaReveladas] = await Promise.all([
    competenciasDosTemas(temas.map((t) => t.id)),
    reveladas(usuario.id),
  ]);

  return temas.map((t) => {
    const cartas = competencias
      .filter((c) => c.tema_id === t.id)
      .map((c) => {
        const reveladaEm = jaReveladas.get(c.id) ?? null;
        return {
          id: c.id,
          nome: c.nome,
          revelada: Boolean(reveladaEm),
          revelada_em: reveladaEm,
          descricao: reveladaEm ? c.descricao : null,
          resumo: reveladaEm ? c.resumo : null,
        };
      });
    return {
      tema_id: t.id,
      tema: t.nome,
      total: cartas.length,
      reveladas: cartas.filter((c) => c.revelada).length,
      completo: cartas.length > 0 && cartas.every((c) => c.revelada),
      cartas,
    };
  });
}
