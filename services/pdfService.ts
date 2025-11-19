import { PdfPage } from '../types';

// Global declaration for pdfjsLib injected via CDN
declare const pdfjsLib: any;

export const renderPdfToImages = async (file: File): Promise<PdfPage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const pages: PdfPage[] = [];
  const maxPages = Math.min(pdf.numPages, 20); // Limit to 20 pages for demo performance

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 1.5; // Good quality thumbnail
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      pages.push({
        pageNumber: i,
        thumbnailDataUrl: canvas.toDataURL('image/jpeg', 0.8),
        selected: false,
      });
    }
  }

  return pages;
};