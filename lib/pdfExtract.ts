const PDFJS_MODULE_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.mjs";
const PDFJS_WORKER_URL =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs";

export type PageText = { pageNumber: number; text: string };

let pdfjsPromise: Promise<any> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjsLib: any = await import(/* webpackIgnore: true */ PDFJS_MODULE_URL);
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return pdfjsLib;
    })();
  }
  return pdfjsPromise;
}

/** Extracts the raw text of every page in a PDF file, entirely client-side. */
export async function extractPdfPagesText(file: File): Promise<PageText[]> {
  const pdfjsLib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: PageText[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: { str?: string }) => item.str ?? "").join(" ");
    pages.push({ pageNumber: i, text: text.trim() });
  }
  return pages;
}
