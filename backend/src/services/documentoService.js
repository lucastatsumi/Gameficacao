import mammoth from 'mammoth';
// Import direto do arquivo: o index do pdf-parse@1 tenta ler um PDF de teste
// do disco quando carregado fora de um "module.parent".
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { HttpError } from '../utils/httpError.js';

// Extrai texto de documentos internos (PDF/DOCX/TXT) para alimentar a geração
// de questões ancoradas no material da empresa. O arquivo é processado em
// memória e DESCARTADO — nada é armazenado (por isso não depende de storage).

export const MAX_BYTES = 3 * 1024 * 1024; // abaixo do limite de corpo da Vercel (4,5 MB)
export const MAX_CARACTERES = 12000; // mesmo teto do material colado (iaService)

const ASSINATURA_PDF = '%PDF-';
const ASSINATURA_ZIP = 'PK'; // DOCX é um zip

// Lógica pura: normaliza espaços e aplica o teto de caracteres.
export function normalizarTexto(texto) {
  const limpo = String(texto ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { texto: limpo.slice(0, MAX_CARACTERES), truncado: limpo.length > MAX_CARACTERES };
}

// O formato é decidido pelo CONTEÚDO (assinatura), não pela extensão enviada.
export function detectarFormato(buffer) {
  const cabecalho = buffer.subarray(0, 5).toString('latin1');
  if (cabecalho.startsWith(ASSINATURA_PDF)) return 'pdf';
  if (cabecalho.startsWith(ASSINATURA_ZIP)) return 'docx';
  return 'txt';
}

export async function extrairTexto(conteudoBase64) {
  if (typeof conteudoBase64 !== 'string' || !conteudoBase64) {
    throw new HttpError(400, 'conteudo_base64 é obrigatório');
  }
  const buffer = Buffer.from(conteudoBase64, 'base64');
  if (!buffer.length) throw new HttpError(400, 'Arquivo vazio ou base64 inválido');
  if (buffer.length > MAX_BYTES) {
    throw new HttpError(413, `O arquivo deve ter no máximo ${MAX_BYTES / 1024 / 1024} MB`);
  }

  const formato = detectarFormato(buffer);
  let bruto;
  try {
    if (formato === 'pdf') bruto = (await pdfParse(buffer)).text;
    else if (formato === 'docx') bruto = (await mammoth.extractRawText({ buffer })).value;
    else bruto = buffer.toString('utf8');
  } catch {
    throw new HttpError(422, 'Não foi possível ler o arquivo — confira se não está corrompido');
  }

  const { texto, truncado } = normalizarTexto(bruto);
  if (!texto) {
    throw new HttpError(422, 'O arquivo não tem texto extraível (PDF escaneado ou vazio?)');
  }
  return { formato, texto, caracteres: texto.length, truncado };
}
