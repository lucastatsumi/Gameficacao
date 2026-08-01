#!/usr/bin/env bash
#
# Gera um pacote de deploy AUTOSSUFICIENTE do backend em `dist-api/`.
#
# Por que existe: quando o deploy é feito por ferramentas que enviam um
# "file tree" (sem `git` nem `vercel` CLI locais), é fácil esquecer algum
# arquivo de `src/` — e a função serverless quebra em runtime com
# `ERR_MODULE_NOT_FOUND` (FUNCTION_INVOCATION_FAILED), sem erro de build.
# Isso já derrubou a API em produção. Bundlar todo o `src/` num único
# `api/index.js` elimina essa classe de bug: só 3 arquivos vão para o deploy.
#
# As dependências (express, cors, @supabase/supabase-js, dotenv) ficam
# EXTERNAS — a Vercel as instala a partir do package.json gerado.
#
# Uso:
#   bash scripts/build-api-bundle.sh
#   cd dist-api && vercel deploy --prod   # se tiver a CLI autenticada
#
# Saída (dist-api/):
#   api/index.js   -> todo o backend bundlado (deps externas)
#   package.json   -> só as deps de runtime + "type":"module"
#   vercel.json    -> rewrite de /(.*) para /api (idêntico ao backend/)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
OUT="$ROOT/dist-api"

echo "→ Limpando $OUT"
rm -rf "$OUT"
mkdir -p "$OUT/api"

echo "→ Bundlando backend/api/index.js (deps externas)"
cd "$BACKEND"
npx --yes esbuild api/index.js \
  --bundle \
  --platform=node \
  --format=esm \
  --packages=external \
  --minify \
  --outfile="$OUT/api/index.js"

echo "→ Gerando package.json de runtime"
cat > "$OUT/package.json" <<'JSON'
{
  "name": "gameficacao-api",
  "version": "1.0.0",
  "type": "module",
  "engines": { "node": ">=20" },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  }
}
JSON

echo "→ Copiando vercel.json"
cp "$BACKEND/vercel.json" "$OUT/vercel.json"

echo "✔ Pacote pronto em $OUT ($(du -sh "$OUT" | cut -f1))"
echo "  Variáveis de ambiente (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,"
echo "  SUPABASE_ANON_KEY, FRONTEND_URL) precisam já estar configuradas no"
echo "  projeto Vercel 'gameficacao-api' — o bundle NÃO as embute."
