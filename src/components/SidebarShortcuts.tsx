import { formulaById } from '../data/formulas';
import { exampleById } from '../data/examples';
import type { AppState } from '../types/appState';

type Props = {
  state: AppState;
  recentFormulas: string[];
  recentExamples: string[];
  bookmarks: Set<string>;
};

export function SidebarShortcuts({ state, recentFormulas, recentExamples, bookmarks }: Props) {
  const bookmarkedFormulaIds = [...bookmarks].filter((id) => !id.startsWith('example:'));
  const bookmarkedExampleIds = [...bookmarks]
    .filter((id) => id.startsWith('example:'))
    .map((id) => id.replace(/^example:/, ''));

  const hasRecents = recentFormulas.length > 0 || recentExamples.length > 0;
  const hasBookmarks = bookmarkedFormulaIds.length > 0 || bookmarkedExampleIds.length > 0;

  if (!hasRecents && !hasBookmarks) return null;

  return (
    <div className="nav-shortcuts" aria-label="Genveje">
      {hasRecents && (
        <section className="nav-shortcut-block">
          <h3 className="nav-shortcut-title">Senest åbnet</h3>
          <ul className="nav-shortcut-list">
            {recentFormulas.slice(0, 4).map((id) => {
              const formula = formulaById(id);
              if (!formula) return null;
              return (
                <li key={`rf-${id}`}>
                  <button type="button" onClick={() => state.selectFormula(id)}>
                    {formula.name}
                  </button>
                </li>
              );
            })}
            {recentExamples.slice(0, 2).map((id) => {
              const example = exampleById(id);
              if (!example) return null;
              return (
                <li key={`re-${id}`}>
                  <button type="button" onClick={() => state.selectExample(id)}>
                    {example.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {hasBookmarks && (
        <section className="nav-shortcut-block">
          <h3 className="nav-shortcut-title">Bogmærker</h3>
          <ul className="nav-shortcut-list">
            {bookmarkedFormulaIds.slice(0, 4).map((id) => {
              const formula = formulaById(id);
              if (!formula) return null;
              return (
                <li key={`bf-${id}`}>
                  <button type="button" onClick={() => state.selectFormula(id)}>
                    {formula.name}
                  </button>
                </li>
              );
            })}
            {bookmarkedExampleIds.slice(0, 2).map((id) => {
              const example = exampleById(id);
              if (!example) return null;
              return (
                <li key={`be-${id}`}>
                  <button type="button" onClick={() => state.selectExample(id)}>
                    {example.title}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="nav-shortcut-all"
            onClick={() => {
              state.setShowBookmarksOnly(true);
              state.setFormulasMode('cards');
              state.setView('formulas');
            }}
          >
            Vis alle bogmærker →
          </button>
        </section>
      )}
    </div>
  );
}
