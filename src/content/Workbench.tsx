/**
 * Content Workbench (#64): development-only surface to browse, edit, validate and preview authored content.
 * It edits an in-memory development copy and exports JSON plus a structured diff. It never writes source files.
 */
import React, { useMemo, useState } from 'react';
import { liveRegistry, type ContentRegistry } from './registry';
import { validateRegistry, type ContentIssue } from './validate';
import { structuredDiff, diffToText } from './diff';
import { EVENT_FIXTURES, SYNERGY_FIXTURES, explainBriefGenre, explainEvent, explainSynergy } from './preview';
import { CONTENT_FAMILIES, type ContentFamily } from './schemas';
import { DIRECTOR_EVENTS } from '@/narrative/directorEvents';

const BRIEF_ID = 'brief-templates';
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const entriesOf = (reg: ContentRegistry, f: ContentFamily): { id: string; tags: string; value: any }[] =>
  f === 'synergies' ? reg.synergies.map((s) => ({ id: s.id, tags: `${s.category} ${s.name}`, value: s }))
    : f === 'events' ? reg.events.map((e) => ({ id: e.id, tags: `${e.family} ${e.title}`, value: e }))
      : [{ id: BRIEF_ID, tags: 'services directions approaches', value: reg.briefs }];

const withEntry = (reg: ContentRegistry, f: ContentFamily, id: string, value: any): ContentRegistry =>
  f === 'synergies' ? { ...reg, synergies: reg.synergies.map((s) => (s.id === id ? value : s)) }
    : f === 'events' ? { ...reg, events: reg.events.map((e) => (e.id === id ? value : e)) }
      : { ...reg, briefs: value };

const Workbench: React.FC = () => {
  const shipped = useMemo(() => liveRegistry(), []);
  const [strings, setStrings] = useState<Record<string, string> | undefined>();
  React.useEffect(() => { fetch('/locales/en/events.json').then((r) => r.json()).then(setStrings).catch(() => undefined); }, []);
  const [family, setFamily] = useState<ContentFamily>('synergies');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string>(shipped.synergies[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fixture, setFixture] = useState(0);
  const [genre, setGenre] = useState('Rock');

  const draftKey = `${family}:${selected}`;
  const original = entriesOf(shipped, family).find((e) => e.id === selected)?.value;
  const text = drafts[draftKey] ?? JSON.stringify(original, null, 2);
  let parsed: any; let parseError = '';
  try { parsed = JSON.parse(text); } catch (e) { parseError = (e as Error).message; }

  // Validate the whole registry with every draft applied, so cross references and duplicates see the edits.
  const edited = useMemo(() => {
    let reg = shipped;
    for (const [k, v] of Object.entries(drafts)) {
      const [f, ...rest] = k.split(':');
      try { reg = withEntry(reg, f as ContentFamily, rest.join(':'), JSON.parse(v)); } catch { /* shown per entry */ }
    }
    return reg;
  }, [drafts, shipped]);
  const issues: ContentIssue[] = useMemo(() => validateRegistry(edited, strings), [edited, strings]);
  const mine = issues.filter((i) => i.family === family && i.id === selected);
  const countFor = (id: string) => issues.filter((i) => i.family === family && i.id === id);
  const list = entriesOf(edited, family).filter((e) => `${e.id} ${e.tags}`.toLowerCase().includes(query.toLowerCase()));
  const diff = parsed ? structuredDiff(original, parsed) : [];
  const dirty = Object.keys(drafts).length;
  const errors = issues.filter((i) => i.severity === 'error').length;

  const pickFamily = (f: ContentFamily) => { setFamily(f); setSelected(entriesOf(shipped, f)[0].id); setQuery(''); };

  return (
    <div data-testid="content-workbench" className="fixed inset-0 z-[200] overflow-auto bg-stone-950 p-4 text-xs text-stone-200">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-bold">Content Workbench <span className="font-normal text-stone-500">(dev only, edits a copy, never writes source)</span></h2>
        <span data-testid="wb-summary" className={errors ? 'text-red-400' : 'text-emerald-400'}>{errors} error(s), {issues.length - errors} warning(s), {dirty} edited</span>
        <button type="button" className="ml-auto rounded border border-stone-600 px-2 py-1" onClick={() => { const u = new URL(window.location.href); u.searchParams.delete('contentWorkbench'); window.location.href = u.toString(); }}>Close</button>
      </div>
      <div className="mb-3 flex gap-2">
        {CONTENT_FAMILIES.map((f) => (
          <button key={f} type="button" data-testid={`wb-tab-${f}`} onClick={() => pickFamily(f)} className={`rounded border px-3 py-1 ${f === family ? 'border-amber-400 text-amber-300' : 'border-stone-600'}`}>{f}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
        <div>
          <input data-testid="wb-search" placeholder="Search id, title, tag" className="mb-2 w-full rounded bg-stone-900 p-1" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="max-h-[70vh] overflow-y-auto">
            {list.map((e) => {
              const c = countFor(e.id);
              return (
                <li key={e.id}>
                  <button type="button" data-testid="wb-item" onClick={() => setSelected(e.id)} className={`flex w-full items-center justify-between px-2 py-1 text-left ${e.id === selected ? 'bg-stone-800' : ''}`}>
                    <span className="truncate">{e.id}{drafts[`${family}:${e.id}`] !== undefined && ' ✎'}</span>
                    {c.length > 0 && <span className={c.some((i) => i.severity === 'error') ? 'text-red-400' : 'text-amber-400'}>{c.length}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-stone-600 px-2 py-1" onClick={() => navigator.clipboard?.writeText(text)}>Copy JSON</button>
            <button type="button" className="rounded border border-stone-600 px-2 py-1" onClick={() => download(`${selected}.json`, text)}>Download JSON</button>
            <button type="button" className="rounded border border-stone-600 px-2 py-1" onClick={() => download(`${family}-diff.txt`, diffToText(diff))}>Download diff</button>
            <button type="button" className="rounded border border-stone-600 px-2 py-1" onClick={() => setDrafts(({ [draftKey]: _x, ...rest }) => rest)}>Revert</button>
          </div>
          <textarea data-testid="wb-editor" spellCheck={false} className="h-72 w-full rounded bg-stone-900 p-2 font-mono" value={text} onChange={(e) => setDrafts((d) => ({ ...d, [draftKey]: e.target.value }))} />
          {parseError && <p className="text-red-400">JSON error: {parseError}</p>}
          <section>
            <h3 className="font-bold">Validation</h3>
            {mine.length === 0 && !parseError ? <p data-testid="wb-clean" className="text-emerald-400">No issues for this entry.</p> : (
              <ul data-testid="wb-issues">{mine.map((i, k) => <li key={k} className={i.severity === 'error' ? 'text-red-400' : 'text-amber-400'}>{i.severity} · {i.rule}: {i.message}</li>)}</ul>
            )}
          </section>
          <section>
            <h3 className="font-bold">Changes vs shipped</h3>
            <pre data-testid="wb-diff" className="whitespace-pre-wrap text-stone-400">{diff.length ? diffToText(diff) : 'No changes.'}</pre>
          </section>
          <section data-testid="wb-preview">
            <h3 className="font-bold">Preview</h3>
            {family === 'synergies' && parsed && (
              <>
                <select className="mb-2 rounded bg-stone-900 p-1" value={fixture} onChange={(e) => setFixture(Number(e.target.value))}>{SYNERGY_FIXTURES.map((f, i) => <option key={f.name} value={i}>{f.name}</option>)}</select>
                {(() => { const r = explainSynergy(parsed, SYNERGY_FIXTURES[fixture]); return (
                  <div><p className={r.matches ? 'text-emerald-400' : 'text-amber-400'}>{r.matches ? 'Matches this fixture' : 'Does not match this fixture'}</p>
                    <ul>{r.checks.map((c) => <li key={c.label} className={c.pass ? 'text-emerald-400' : 'text-red-400'}>{c.pass ? '✓' : '✗'} {c.label}: {c.detail}</li>)}</ul></div>); })()}
              </>
            )}
            {family === 'events' && (() => {
              const def = DIRECTOR_EVENTS.find((d) => d.id === selected);
              if (!def) return <p>New event ids have no engine code yet, so there is nothing to preview.</p>;
              return (
                <>
                  <select className="mb-2 rounded bg-stone-900 p-1" value={fixture} onChange={(e) => setFixture(Number(e.target.value))}>{EVENT_FIXTURES.map((f, i) => <option key={f.name} value={i}>{f.name}</option>)}</select>
                  {(() => { const r = explainEvent(EVENT_FIXTURES[fixture].state, def); return <p className={r.eligible ? 'text-emerald-400' : 'text-amber-400'}>{r.eligible ? 'Eligible' : 'Blocked'}: {r.reason}{r.weight ? ` (weight ${r.weight})` : ''}</p>; })()}
                  <p className="text-stone-500">Eligibility and subject rules are code, so this checks the shipped definition against the fixture.</p>
                </>
              );
            })()}
            {family === 'briefs' && parsed && (() => {
              const r = explainBriefGenre(parsed, genre);
              return (
                <div>
                  <select className="mb-2 rounded bg-stone-900 p-1" value={genre} onChange={(e) => setGenre(e.target.value)}>{[...Object.keys(parsed.genreDirections ?? {}), 'Zydeco'].map((g) => <option key={g}>{g}</option>)}</select>
                  <p>Directions: {r.directions.join(', ')}{r.usesDefault ? ' (default list)' : ''}</p>
                  <ul>{r.services.map((s) => <li key={s}>{s}</li>)}</ul>
                  <p className="mt-1 text-stone-400">Sample briefs: {r.samples.map((b) => `${b.serviceType}/${b.direction}/${b.priority}`).join(' · ')}</p>
                </div>
              );
            })()}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Workbench;
