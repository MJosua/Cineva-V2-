/**
 * Based on E-Order/src/components/media/PDFViewer/PdfViewer.jsx (2026-10-06).
 * Renders every page at the container's width. Requires optional peer `react-pdf`.
 * Changes: Tailwind instead of inline styles, configurable worker URL, ResizeObserver.
 */
import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '../lib/utils';

export interface PdfViewerProps {
  /** URL, File or { url, withCredentials } accepted by react-pdf. */
  file: string | File | { url: string; withCredentials?: boolean };
  /** PDF.js worker; defaults to the cdnjs build matching the installed pdfjs version. */
  workerSrc?: string;
  className?: string;
  /** Tailwind max-height class for the scroll area. */
  maxHeightClassName?: string;
}

export function PdfViewer({ file, workerSrc, className, maxHeightClassName = 'max-h-[70vh]' }: PdfViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = React.useState(0);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc ?? `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }, [workerSrc]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn('w-full overflow-y-auto overflow-x-hidden rounded-md border', maxHeightClassName, className)}>
      <Document file={file} onLoadSuccess={({ numPages: n }) => setNumPages(n)}>
        {Array.from({ length: numPages }, (_, i) => (
          <Page key={i + 1} pageNumber={i + 1} width={width || undefined} renderTextLayer={false} />
        ))}
      </Document>
    </div>
  );
}
