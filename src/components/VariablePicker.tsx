import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Math as TexMath } from './Math';
import type { VariablePickerEntry } from '../utils/formulaFinder';
import { filterPickerEntries } from '../utils/formulaFinder';

type VariablePickerProps = {
  label: string;
  hint?: string;
  entries: VariablePickerEntry[];
  selectedKeys: Set<string>;
  onToggle: (canonicalKey: string) => void;
  /** Map canonical key → display label for selected chips */
  entryLabel: (canonicalKey: string) => string;
};

export function VariablePicker({
  label,
  hint,
  entries,
  selectedKeys,
  onToggle,
  entryLabel,
}: VariablePickerProps) {
  const listId = useId();
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterPickerEntries(filter, entries), [filter, entries]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (entry: VariablePickerEntry) => {
    onToggle(entry.canonicalKey);
    setFilter('');
    setOpen(false);
  };

  return (
    <div className="variable-picker-field" ref={wrapRef}>
      <span className="muted small">{label}</span>
      {hint ? <p className="muted small variable-picker-hint">{hint}</p> : null}

      {selectedKeys.size > 0 && (
        <div className="variable-chip-row selected-row" aria-label="Valgte variable">
          {[...selectedKeys].map((key) => (
            <button
              key={key}
              type="button"
              className="variable-chip selected"
              onClick={() => onToggle(key)}
              title="Klik for at fjerne"
            >
              <TexMath tex={entryLabel(key)} />
              <span className="chip-remove" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="variable-picker-combo">
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Søg symbol eller størrelse (f.eks. temperatur, v₀, p) …"
          autoComplete="off"
        />
        <button
          type="button"
          className="variable-picker-toggle"
          aria-label="Vis variabel-liste"
          onClick={() => setOpen((v) => !v)}
        >
          ▾
        </button>
        {open && (
          <ul id={listId} className="variable-picker-dropdown" role="listbox">
            {filtered.length === 0 ? (
              <li className="variable-picker-empty muted small">Ingen match — prøv et andet ord</li>
            ) : (
              filtered.slice(0, 80).map((entry) => {
                const selected = selectedKeys.has(entry.canonicalKey);
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={selected ? 'is-selected' : undefined}
                      onClick={() => pick(entry)}
                    >
                      <span className="variable-picker-symbol">
                        <TexMath tex={entry.labelLaTeX} />
                      </span>
                      <span className="variable-picker-meta">
                        {entry.disambiguation ? `${entry.disambiguation} · ` : ''}
                        {entry.nameHint}
                        {entry.unitHint ? ` · ${entry.unitHint}` : ''}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      <div className="variable-picker-quick" role="group" aria-label="Hurtigvalg">
        {entries.slice(0, 24).map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`variable-chip${selectedKeys.has(entry.canonicalKey) ? ' selected' : ''}`}
            onClick={() => onToggle(entry.canonicalKey)}
            title={entry.disambiguation ? `${entry.nameHint} (${entry.disambiguation})` : entry.nameHint}
          >
            <TexMath tex={entry.labelLaTeX} />
            {entry.disambiguation ? <span className="chip-disambig">{entry.disambiguation.slice(0, 3)}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function pickerEntryLabel(entries: VariablePickerEntry[], canonicalKey: string): string {
  const match = entries.find((e) => e.canonicalKey === canonicalKey);
  if (!match) return canonicalKey;
  if (match.disambiguation) return `${match.labelLaTeX}\\;(${match.disambiguation})`;
  return match.labelLaTeX;
}
