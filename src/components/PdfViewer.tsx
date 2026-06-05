import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { getPdfSource } from '../data/pdfManifest';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

type PdfViewerProps = {
  sourceId: string;
  page: number;
  onClose: () => void;
  docked?: boolean;
};

export function PdfViewer({ sourceId, page, onClose, docked = false }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(page);
  const [pageInput, setPageInput] = useState(String(page));
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);

  const source = getPdfSource(sourceId);
  const pdfUrl = source ? `/${encodeURI(source.path)}` : '';

  useEffect(() => {
    setCurrentPage(page);
    setPageInput(String(page));
  }, [page, sourceId]);

  const renderPage = useCallback(async () => {
    if (!pdfUrl) {
      setStatus('error');
      setError('PDF ikke fundet');
      return () => {};
    }

    let cancelled = false;
    const docTask = pdfjs.getDocument(pdfUrl);

    try {
      const pdf = await docTask.promise;
      if (cancelled) return () => { void docTask.destroy(); };
      setNumPages(pdf.numPages);
      const safePage = Math.min(Math.max(1, currentPage), pdf.numPages);
      const pdfPage = await pdf.getPage(safePage);
      if (cancelled) return () => { void docTask.destroy(); };

      const containerWidth = bodyRef.current?.clientWidth ?? (docked ? 460 : 760);
      const base = pdfPage.getViewport({ scale: 1 });
      const targetWidth = Math.max(240, (containerWidth - 24)) * zoom;
      const fitScale = targetWidth / base.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pdfPage.getViewport({ scale: fitScale });

      const canvas = canvasRef.current;
      if (!canvas) return () => { void docTask.destroy(); };
      const ctx = canvas.getContext('2d');
      if (!ctx) return () => { void docTask.destroy(); };

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      if (!cancelled) setStatus('ready');
    } catch (err: unknown) {
      if (!cancelled) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Kunne ikke indlæse PDF');
      }
    }

    return () => {
      cancelled = true;
      void docTask.destroy();
    };
  }, [pdfUrl, currentPage, docked, zoom]);

  useEffect(() => {
    setStatus('loading');
    let cleanup: (() => void) | undefined;
    let active = true;
    void renderPage().then((fn) => {
      if (active) cleanup = fn;
      else fn?.();
    });
    return () => {
      active = false;
      cleanup?.();
    };
  }, [renderPage]);

  // Re-fit when the dock container resizes.
  useLayoutEffect(() => {
    const node = bodyRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let last = node.clientWidth;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      const next = node.clientWidth;
      if (Math.abs(next - last) < 16) return;
      last = next;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void renderPage(), 120);
    });
    ro.observe(node);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, [renderPage]);

  useEffect(() => {
    if (docked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [docked, onClose]);

  const jumpToPage = () => {
    const parsed = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(parsed)) return;
    const safe = Math.min(Math.max(1, parsed), numPages || parsed);
    setCurrentPage(safe);
    setPageInput(String(safe));
  };

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1));

  const panel = (
    <div className={`pdf-viewer-panel card${docked ? ' pdf-viewer-panel--docked' : ''}`}>
      <header className="pdf-viewer-head">
        <div className="pdf-viewer-title">
          <p className="eyebrow">PDF</p>
          <h2 title={source?.title ?? sourceId}>{source?.title ?? sourceId}</h2>
          <p className="muted small">
            Side {currentPage}
            {numPages > 0 ? ` af ${numPages}` : ''}
          </p>
        </div>
        <div className="pdf-viewer-actions">
          <div className="pdf-nav-group" role="group" aria-label="Sidenavigation">
            <button type="button" disabled={currentPage <= 1} onClick={goPrev} aria-label="Forrige side">
              ‹
            </button>
            <label className="pdf-page-jump">
              <span className="sr-only">Gå til side</span>
              <input
                type="number"
                min={1}
                max={numPages || undefined}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onBlur={jumpToPage}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') jumpToPage();
                }}
              />
            </label>
            <button
              type="button"
              disabled={numPages > 0 && currentPage >= numPages}
              onClick={goNext}
              aria-label="Næste side"
            >
              ›
            </button>
          </div>
          <div className="pdf-nav-group" role="group" aria-label="Zoom">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))} aria-label="Zoom ud">
              −
            </button>
            <button type="button" onClick={() => setZoom(1)} aria-label="Tilpas bredde" title="Tilpas bredde">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))} aria-label="Zoom ind">
              +
            </button>
          </div>
          <button type="button" className="primary" onClick={onClose}>
            Luk
          </button>
        </div>
      </header>
      <div className="pdf-viewer-body" ref={bodyRef}>
        {status === 'loading' && <p className="muted pdf-status">Indlæser PDF …</p>}
        {status === 'error' && <p className="muted pdf-status">{error}</p>}
        <canvas ref={canvasRef} className="pdf-viewer-canvas" hidden={status !== 'ready'} />
      </div>
    </div>
  );

  if (docked) {
    return (
      <aside className="pdf-dock-panel" aria-label="PDF ved siden af indhold">
        {panel}
      </aside>
    );
  }

  return (
    <div className="pdf-viewer-overlay" role="dialog" aria-modal="true" aria-label="PDF-visning">
      {panel}
    </div>
  );
}
