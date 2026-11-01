/** Arquivos maiores que isso não são um TRCT; evita travar o navegador com um PDF enorme. */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

/**
 * Extrai o texto de um PDF no próprio navegador: o arquivo não sai do aparelho.
 * Só lê o texto (não desenha a página), então fontes e formulários XFA ficam desligados.
 * Os pedaços de texto são remontados em linhas pela posição na página, da esquerda para a direita.
 */
export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  // Build "legacy": o padrão usa APIs muito novas (Promise.try) e quebraria em celulares sem atualização.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({ data, disableFontFace: true, enableXfa: false });
  const lines: string[] = [];
  try {
    const pdf = await loadingTask.promise;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items
        .filter((item) => 'str' in item && item.str.trim() !== '')
        .map((item) => {
          const { str, transform } = item as { str: string; transform: number[] };
          return { text: str, x: transform[4]!, y: transform[5]! };
        })
        .sort((a, b) => b.y - a.y || a.x - b.x);

      let line: typeof items = [];
      for (const item of items) {
        // Mesma linha quando a altura difere menos que meio corpo de texto.
        if (line.length > 0 && Math.abs(line[0]!.y - item.y) > 3) {
          lines.push(line.sort((a, b) => a.x - b.x).map((piece) => piece.text).join(' '));
          line = [];
        }
        line.push(item);
      }
      if (line.length > 0) lines.push(line.sort((a, b) => a.x - b.x).map((piece) => piece.text).join(' '));
    }
  } finally {
    await loadingTask.destroy();
  }
  return lines.join('\n');
}
