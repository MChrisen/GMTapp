import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Math as TexMath } from './Math';
import type { CanonicalVariableMeta, VariablePickerEntry } from '../utils/formulaFinder';
import { filterPickerEntries, filterVariablesForPicker } from '../utils/formulaFinder';

type VariablePickerProps = {
  label: string;
  hint?: string;
  entries: VariablePickerEntry[];
  /** Full symbol list for the chip grid (one per canonical key). */
  chipVariables: CanonicalVariableMeta[];
  selectedKeys: Set<string>;
  onToggle: (canonicalKey: string) => void;
  entryLabel: (canonicalKey: string) => string;
};

export function VariablePicker({
  label,
  hint,
  entries,
  chipVariables,
  selectedKeys,
  onToggle,
  entryLabel,
}: VariablePickerProps) {
  const listId = useId();
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const dropdownList = useMemo(() => filterPickerEntries(filter, entries), [filter, entries]);
  const chipList = useMemo(() => filterVariablesForPicker(filter, chipVariables), [filter, chipVariables]);

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
      <div className="variable-picker-label-row">
        <span className="variable-picker-label">{label}</span>
        <span className="variable-picker-count muted small">
          {chipVariables.length} symboler · {selectedKeys.size} valgt
        </span>
      </div>
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
          placeholder="Søg symbol eller størrelse (f.eks. temperatur, v₀, p, omega) …"
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
            {dropdownList.length === 0 ? (
              <li className="variable-picker-empty muted small">Ingen match — prøv et andet ord</li>
            ) : (
              dropdownList.map((entry) => {
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

      <div className="variable-picker-all" role="group" aria-label="Alle variable">
        {chipList.length === 0 ? (
          <p className="muted small">Ingen variable matcher søgningen.</p>
        ) : (
          chipList.map((meta) => (
            <button
              key={meta.key}
              type="button"
              className={`variable-chip${selectedKeys.has(meta.key) ? ' selected' : ''}`}
              onClick={() => onToggle(meta.key)}
              title={meta.nameHint}
            >
              <TexMath tex={meta.labelLaTeX} />
            </button>
          ))
        )}
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
