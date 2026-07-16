export default function BotaoAlternativa({ alt, feedback, selecionada, desabilitado, aoClicar }) {
  let estilo = 'border-slate-800 bg-slate-900/60 hover:border-indigo-500/60 card-pixel';
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
    estilo = 'border-indigo-500 bg-indigo-500/10';
  }

  const explicacao = feedback?.explicacoes.find((e) => e.id === alt.id);
  const mostrarExplicacao =
    feedback && (selecionada === alt.id || feedback.alternativa_correta?.id === alt.id);

  return (
    <button
      onClick={aoClicar}
      disabled={desabilitado}
      className={`w-full border-2 p-4 text-left transition-colors disabled:cursor-default ${estilo} ${anim}`}
    >
      <div className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-slate-800 font-pixel text-[10px] text-indigo-300">
          {alt.letra}
        </span>
        <span className="text-sm text-slate-200">{alt.texto}</span>
      </div>
      {mostrarExplicacao && explicacao && (
        <p className="mt-2 pl-10 text-xs text-slate-400">{explicacao.explicacao}</p>
      )}
    </button>
  );
}
