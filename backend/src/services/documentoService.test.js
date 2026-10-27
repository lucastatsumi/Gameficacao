import { describe, expect, it } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extrairTexto, detectarFormato, normalizarTexto, MAX_CARACTERES } from './documentoService.js';

const b64 = (buf) => Buffer.from(buf).toString('base64');

// --- fixtures reais, montadas em memória (sem arquivos binários no repo) ---

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (const byte of buf) {
    c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ZIP mínimo (método deflate) com os arquivos informados.
function zip(arquivos) {
  const locais = [];
  const centrais = [];
  let offset = 0;
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const dados = Buffer.from(conteudo);
    const comprimido = deflateRawSync(dados);
    const nomeBuf = Buffer.from(nome);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(dados), 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(nomeBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc32(dados), 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(dados.length, 24);
    central.writeUInt16LE(nomeBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locais.push(local, nomeBuf, comprimido);
    centrais.push(central, nomeBuf);
    offset += 30 + nomeBuf.length + comprimido.length;
  }
  const dirCentral = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(Object.keys(arquivos).length, 8);
  fim.writeUInt16LE(Object.keys(arquivos).length, 10);
  fim.writeUInt32LE(dirCentral.length, 12);
  fim.writeUInt32LE(offset, 16);
  return Buffer.concat([...locais, dirCentral, fim]);
}

function docxCom(paragrafos) {
  const corpo = paragrafos.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join('');
  return zip({
    '[Content_Types].xml':
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels':
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${corpo}</w:body></w:document>`,
  });
}

// PDF real do repositório (documentos do TCC). Um PDF mínimo montado à mão
// não é aceito pelo pdf.js, então usamos um arquivo de verdade; o teste é
// pulado se a pasta de docs não estiver no checkout.
const DIR_PDF = new URL('../../../docs/faculdade/', import.meta.url);
const PDF_REAL = existsSync(DIR_PDF) ? readdirSync(DIR_PDF).find((n) => n.endsWith('.pdf')) : null;

describe('detectarFormato', () => {
  it('decide pelo conteúdo, não pela extensão', () => {
    expect(detectarFormato(Buffer.from('%PDF-1.4 ...'))).toBe('pdf');
    expect(detectarFormato(Buffer.from('PK\u0003\u0004'))).toBe('docx');
    expect(detectarFormato(Buffer.from('texto simples'))).toBe('txt');
  });
});

describe('normalizarTexto', () => {
  it('colapsa espaços/linhas em excesso e trunca no teto', () => {
    expect(normalizarTexto('a   b\r\n\n\n\nc').texto).toBe('a b\n\nc');
    const r = normalizarTexto('x'.repeat(MAX_CARACTERES + 50));
    expect(r.texto).toHaveLength(MAX_CARACTERES);
    expect(r.truncado).toBe(true);
  });
});

describe('extrairTexto', () => {
  it('lê DOCX real', async () => {
    const r = await extrairTexto(b64(docxCom(['Política de segurança', 'Reporte em 24 horas'])));
    expect(r.formato).toBe('docx');
    expect(r.texto).toContain('Política de segurança');
    expect(r.texto).toContain('Reporte em 24 horas');
  });

  it.skipIf(!PDF_REAL)('lê PDF real', async () => {
    const r = await extrairTexto(b64(readFileSync(new URL(PDF_REAL, DIR_PDF))));
    expect(r.formato).toBe('pdf');
    expect(r.texto.length).toBeGreaterThan(100);
    expect(r.caracteres).toBe(r.texto.length);
  });

  it('lê texto puro', async () => {
    const r = await extrairTexto(b64('Manual de onboarding'));
    expect(r).toMatchObject({ formato: 'txt', texto: 'Manual de onboarding', truncado: false });
  });

  it('400 sem conteúdo, 413 acima do limite, 422 para arquivo ilegível ou sem texto', async () => {
    await expect(extrairTexto('')).rejects.toMatchObject({ status: 400 });
    await expect(extrairTexto(b64(Buffer.alloc(3 * 1024 * 1024 + 1, 97)))).rejects.toMatchObject({
      status: 413,
    });
    await expect(extrairTexto(b64('%PDF-1.4 lixo sem estrutura'))).rejects.toMatchObject({
      status: 422,
    });
    await expect(extrairTexto(b64('   \n  '))).rejects.toMatchObject({ status: 422 });
  });
});
