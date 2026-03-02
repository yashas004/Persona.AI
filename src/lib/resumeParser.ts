// Lightweight PDF resume text extractor (client-side). Requires `pdfjs-dist`.
// Install: `npm install pdfjs-dist` if you want full PDF extraction.

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Helper to load pdfjs via several strategies
  async function loadPdfJs(): Promise<any> {
    // Try recommended legacy build import first
    const candidates = [
      'pdfjs-dist/legacy/build/pdf',
      'pdfjs-dist/build/pdf',
      'pdfjs-dist',
    ];

    for (const c of candidates) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod: any = await import(/* @vite-ignore */ c);
        if (mod) return mod;
      } catch (e) {
        // try next
      }
    }

    // Fallback: load pdf.js from CDN and use global `pdfjsLib`
    if (typeof (window as any).pdfjsLib !== 'undefined') return (window as any).pdfjsLib;

    await new Promise<void>((resolve, reject) => {
      const url = 'https://unpkg.com/pdfjs-dist@3.10.111/build/pdf.js';
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => {
        // wait a tick for global to be available
        setTimeout(() => resolve(), 50);
      };
      s.onerror = (ev) => reject(new Error('Failed to load pdfjs from CDN'));
      document.head.appendChild(s);
    });

    return (window as any).pdfjsLib;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs: any = await loadPdfJs();

    // Set workerSrc if available
    try {
      const version = (pdfjs && (pdfjs as any).version) || 'latest';
      // @ts-ignore
      if (pdfjs.GlobalWorkerOptions) {
        // prefer CDN worker matching the loaded library
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;
      }
    } catch {}

    const loading = pdfjs.getDocument({ data: arrayBuffer });
    const doc = await loading.promise;
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((it: any) => (it.str || '')).join(' ');
      fullText += '\n' + strings;
    }
    return fullText.trim();
  } catch (err) {
    console.warn('PDF extraction failed or pdfjs not installed:', err);
    return '';
  }
}

export default extractTextFromPdf;
