// Card grande de opção da Batalha de Complexidade — mesma lógica de
// certo/errado/selecionada do BotaoAlternativa, layout "vs" em vez de lista.
export default function BotaoBatalha({ alt, feedback, selecionada, desabilitado, aoClicar }) {
  let estilo = 'border-slate-800 bg-slate-900/60 hover:border-fuchsia-500/60 card-pixel';
  let anim = '';
  if (feedback) {
    const ehCorreta = feedback.alternativa_correta?.id === alt.id;
    const foiEscolhida = selecionada === alt.id;
    if (ehCorreta) {
      estilo = 'border-emerald-500/60 bg-emerald-500/10';
      anim = 'anim-pop';
    } else if (foiEscolhida) {
      estilo = 'border-red-500/60 bg-red-500/10';
      anim = 'anim-tremer';
    } else estilo = 'border-slate-800 bg-slate-900/40 opacity-60';
  } else if (selecionada === alt.id) {
    estilo = 'border-fuchsia-500 bg-fuchsia-500/10';
  }

  const explicacao = feedback?.explicacoes.find((e) => e.id === alt.id);
  const mostrarExplicacao =
    feedback && (selecionada === alt.id || feedback.alternativa_correta?.id === alt.id);

  return (
    <button
      onClick={aoClicar}
      disabled={desabilitado}
      className={`flex w-full flex-col items-center gap-2 border-2 p-6 text-center transition-colors disabled:cursor-default ${estilo} ${anim}`}
    >
      <span className="flex h-8 w-8 items-center justify-center bg-slate-800 font-pixel text-xs text-fuchsia-300">
        {alt.letra}
      </span>
      <span className="font-mono text-sm text-slate-100">{alt.texto}</span>
      {mostrarExplicacao && explicacao && (
        <p className="mt-1 text-xs text-slate-400">{explicacao.explicacao}</p>
      )}
    </button>
  );
}
