import { useEffect, useState } from 'react';

export function HotkeyHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="hotkey-overlay" role="dialog" aria-modal="true" aria-label="Tastaturgenveje">
      <div className="hotkey-panel card">
        <header className="hotkey-head">
          <h2>Tastaturgenveje</h2>
          <button type="button" className="primary" onClick={() => setOpen(false)}>
            Luk
          </button>
        </header>
        <dl className="hotkey-list">
          <div>
            <dt>
              <kbd>⌘K</kbd> / <kbd>/</kbd>
            </dt>
            <dd>Fokus på søgning</dd>
          </div>
          <div>
            <dt>
              <kbd>Esc</kbd>
            </dt>
            <dd>Ryd søgning eller luk denne dialog</dd>
          </div>
          <div>
            <dt>
              <kbd>Alt</kbd>+<kbd>1</kbd>…<kbd>3</kbd>
            </dt>
            <dd>Skift hovedside (Formler / Problemer / Konstanter)</dd>
          </div>
          <div>
            <dt>
              <kbd>Alt</kbd>+<kbd>←</kbd>
            </dt>
            <dd>Tilbage i navigationshistorik</dd>
          </div>
          <div>
            <dt>
              <kbd>?</kbd>
            </dt>
            <dd>Vis denne oversigt</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
