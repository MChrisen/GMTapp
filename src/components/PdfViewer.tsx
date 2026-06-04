import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { getPdfSource } from '../data/pdfManifest';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

type PdfViewerProps = {
  sourceId: string;
  page: number;
  onClose: () => void;
};

export function PdfViewer({ sourceId, page, onClose }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(page);
  const [numPages, setNumPages] = useState(0);

  const source = getPdfSource(sourceId);
  const pdfUrl = source ? `/${encodeURI(source.path)}` : '';

  useEffect(() => {
    setCurrentPage(page);
  }, [page, sourceId]);

  useEffect(() => {
    if (!pdfUrl) {
      setStatus('error');
      setError('PDF ikke fundet');
      return;
    }

    let cancelled = false;
    const docTask = pdfjs.getDocument(pdfUrl);

    docTask.promise
      .then(async (pdf) => {
        if (cancelled) return;
        setNumPages(pdf.numPages);
        const safePage = Math.min(Math.max(1, currentPage), pdf.numPages);
        const pdfPage = await pdf.getPage(safePage);
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale: 1.35 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Kunne ikke indlæse PDF');
      });

    return () => {
      cancelled = true;
      void docTask.destroy();
    };
  }, [pdfUrl, currentPage]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pdf-viewer-overlay" role="dialog" aria-modal="true" aria-label="PDF-visning">
      <div className="pdf-viewer-panel card">
        <header className="pdf-viewer-head">
          <div>
            <p className="eyebrow">PDF i appen</p>
            <h2>{source?.title ?? sourceId}</h2>
            <p className="muted small">
              Side {currentPage}
              {numPages > 0 ? ` af ${numPages}` : ''} — korrekt side uden afhængighed af Acrobat/Chrome
            </p>
          </div>
          <div className="pdf-viewer-actions">
            <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
              Forrige
            </button>
            <button
              type="button"
              disabled={numPages > 0 && currentPage >= numPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Næste
            </button>
            <button type="button" className="primary" onClick={onClose}>
              Luk
            </button>
          </div>
        </header>
        <div className="pdf-viewer-body">
          {status === 'loading' && <p className="muted">Indlæser PDF …</p>}
          {status === 'error' && <p className="muted">{error}</p>}
          <canvas ref={canvasRef} className="pdf-viewer-canvas" />
        </div>
      </div>
    </div>
  );
}
