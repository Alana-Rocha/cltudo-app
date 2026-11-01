import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';

/** Arquivos maiores que isso não são um TRCT; evita travar o navegador com um PDF enorme. */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

/** Um pedaço de texto e onde ele está na página (pontos PDF; y cresce para cima). */
export type PdfTextItem = { text: string; x: number; y: number; width: number; page: number };

/** Lê os pedaços de texto de um documento já aberto, com a posição de cada um. */
export async function itemsFromDocument(pdf: PDFDocumentProxy): Promise<PdfTextItem[]> {
  const items: PdfTextItem[] = [];
  for (let page = 1; page <= pdf.numPages; page++) {
    const content = await (await pdf.getPage(page)).getTextContent();
    for (const item of content.items) {
      if (!('str' in item) || item.str.trim() === '') continue;
      items.push({ text: item.str, x: item.transform[4], y: item.transform[5], width: item.width, page });
    }
  }
  return items;
}

/**
 * Extrai o texto de um PDF no próprio navegador: o arquivo não sai do aparelho.
 * Só lê o texto (não desenha a página), então fontes e formulários XFA ficam desligados.
 */
export async function readPdfItems(data: ArrayBuffer): Promise<PdfTextItem[]> {
  // Build "legacy": o padrão usa APIs muito novas (Promise.try) e quebraria em celulares sem atualização.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({ data, disableFontFace: true, enableXfa: false });
  try {
    return await itemsFromDocument(await loadingTask.promise);
  } finally {
    await loadingTask.destroy();
  }
}
