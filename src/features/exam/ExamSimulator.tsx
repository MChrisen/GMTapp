import { useCallback, useEffect, useMemo, useState } from 'react';
import { pastExamQuestions } from '../../data/examAids';
import { patternById } from '../../data/examples';
import type { AppState } from '../../types/appState';

const EXAM_DURATION_MS = 4 * 60 * 60 * 1000;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ExamSimulator({ state }: { state: AppState }) {
  const [active, setActive] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [deck, setDeck] = useState(() => shuffle(pastExamQuestions).slice(0, 12));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = deck[index];
  const remainingMs = Math.max(0, EXAM_DURATION_MS - elapsedMs);

  useEffect(() => {
    if (!active || !startedAt) return;
    const tick = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => window.clearInterval(tick);
  }, [active, startedAt]);

  const start = useCallback(() => {
    setDeck(shuffle(pastExamQuestions).slice(0, 12));
    setIndex(0);
    setRevealed(false);
    setStartedAt(Date.now());
    setElapsedMs(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setStartedAt(null);
    setRevealed(false);
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressLabel = useMemo(() => {
    if (!active) return null;
    return `${index + 1} / ${deck.length}`;
  }, [active, deck.length, index]);

  if (!active) {
    return (
      <section className="card exam-simulator exam-simulator--idle">
        <div className="exam-simulator-idle-copy">
          <p className="eyebrow">Øvelse</p>
          <h2>Eksamenssimulator</h2>
          <p className="muted small">
            12 tilfældige opgaver, 4-timers ur og skjult hint indtil du afslører — som under den rigtige eksamen.
          </p>
        </div>
        <button type="button" className="primary" onClick={start}>
          Start simulation
        </button>
      </section>
    );
  }

  if (!current) {
    return (
      <section className="card exam-simulator">
        <h2>Simulation afsluttet</h2>
        <p className="muted">Du har gennemgået alle opgaver i bunken.</p>
        <button type="button" className="primary" onClick={stop}>
          Luk simulator
        </button>
      </section>
    );
  }

  return (
    <section className="card exam-simulator exam-simulator--active">
      <header className="exam-simulator-head">
        <div>
          <p className="eyebrow">Simulation · {progressLabel}</p>
          <h2>{current.year}: {current.title}</h2>
        </div>
        <div className="exam-simulator-timers">
          <span className="tag">Forløbet: {formatTime(elapsedMs)}</span>
          <span className={`tag${remainingMs < 30 * 60 * 1000 ? ' tag-warn' : ''}`}>Tilbage: {formatTime(remainingMs)}</span>
        </div>
      </header>

      <section className="subcard">
        <h3>Opgave-cue</h3>
        <p>{current.cue}</p>
      </section>

      {!revealed ? (
        <button type="button" className="primary" onClick={() => setRevealed(true)}>
          Vis første move og links
        </button>
      ) : (
        <section className="subcard">
          <h3>Første move</h3>
          <p>{current.firstMove}</p>
          <div className="pill-row">
            {current.patternIds.map((id) => (
              <button key={id} type="button" onClick={() => state.selectPattern(id)}>
                {patternById(id)?.title ?? id}
              </button>
            ))}
            <button type="button" onClick={() => state.selectExamQuestion(current.id)}>
              Åbn i Eksamen Navigator
            </button>
            <button type="button" onClick={() => state.openPdf(current.source.sourceId, current.source.page)}>
              Åbn PDF
            </button>
          </div>
        </section>
      )}

      <div className="pill-row exam-simulator-nav">
        <button
          type="button"
          disabled={index <= 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setRevealed(false);
          }}
        >
          Forrige
        </button>
        <button
          type="button"
          onClick={() => {
            if (index >= deck.length - 1) {
              setIndex(deck.length);
              return;
            }
            setIndex((i) => i + 1);
            setRevealed(false);
          }}
        >
          {index >= deck.length - 1 ? 'Afslut bunke' : 'Næste opgave'}
        </button>
        <button type="button" className="ghost" onClick={stop}>
          Stop simulation
        </button>
      </div>
    </section>
  );
}
