"use client";
import { useRef, useState } from "react";
import { AlertCircle, FlaskConical } from "lucide-react";
import { DatasetViewer } from "@/components/dataset/dataset-viewer";
import { ResultsTable } from "@/components/results/results-table";
import { emptyQuery, maxNodes, querySchema, serializeQuery } from "@/lib/search/query";
import type { SearchQuery, SearchResults, SearchRow } from "@/lib/types";
import { draftCount, newCondition, toDraft, toGroup } from "./draft";
import { ParameterBrowser } from "./parameter-browser";
import { exampleConditions, QueryBuilder } from "./query-builder";

export function SearchWorkspace({ query, results, invalidLink }: { query: SearchQuery; results: SearchResults; invalidLink: boolean }) {
  const [draft, setDraft] = useState(() => toDraft(query.where));
  const [applied, setApplied] = useState(query);
  const [display, setDisplay] = useState(results);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(invalidLink ? "This search link contains an invalid or unsupported query. Showing all tests." : "");
  const [notice, setNotice] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [selected, setSelected] = useState<SearchRow>();
  const sequence = useRef(0);
  const activeRequest = useRef<AbortController | undefined>(undefined);
  const makeId = () => `new-${++sequence.current}`;
  const atLimit = draftCount(draft) >= maxNodes;
  const dirty = JSON.stringify(toGroup(draft)) !== JSON.stringify(applied.where);

  function validate(candidate: SearchQuery) {
    const result = querySchema.safeParse(candidate);
    setError(result.success ? "" : result.error.issues[0]?.message ?? "Check the query.");
    return result.success ? result.data : undefined;
  }

  async function run(candidate: SearchQuery) {
    const checked = validate(candidate);
    if (!checked) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setNotice("");
    setManualLink("");
    try {
      const response = await fetch("/api/search", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(checked), signal: controller.signal,
      });
      if (!response.ok) throw new Error("The search service could not complete this request.");
      const next = await response.json() as SearchResults;
      if (controller.signal.aborted) return;
      const normalized = { ...checked, page: next.page };
      setApplied(normalized);
      setDisplay(next);
      const serialized = serializeQuery(normalized);
      if (serialized.length <= 7_500) window.history.replaceState(null, "", `?${serialized}`);
      else {
        window.history.replaceState(null, "", window.location.pathname);
        setNotice("This query is too long for a shareable URL.");
      }
    } catch {
      if (!controller.signal.aborted) setError("The search service could not complete this request. Try again.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const candidate = () => ({ ...applied, where: toGroup(draft), page: 1 });
  async function share() {
    const checked = validate(candidate());
    if (!checked) return;
    const serialized = serializeQuery(checked);
    if (serialized.length > 7_500) {
      setNotice("This query is too long for a shareable URL.");
      return;
    }
    const url = new URL(window.location.pathname, window.location.origin);
    url.search = serialized;
    try {
      await navigator.clipboard.writeText(url.href);
      setManualLink("");
      setNotice("Search link copied.");
    } catch {
      setManualLink(url.href);
      setNotice("Select and copy the search link.");
    }
  }

  return <>
    <div className="workspace">
      <ParameterBrowser disabled={atLimit} onAdd={(parameter) => setDraft((previous) => ({
        ...previous, children: [...previous.children, newCondition(makeId(), parameter)],
      }))} />
      <div className="workspace-main">
        <QueryBuilder group={draft} atLimit={atLimit} onChange={setDraft} makeId={makeId} busy={busy} dirty={dirty}
          onExample={(index) => setDraft({ ...draft, logic: "and", children: exampleConditions(index, makeId) })}
          onSearch={() => void run(candidate())} onShare={() => void share()} onReset={() => {
            const reset = { ...emptyQuery(), mode: applied.mode };
            setDraft(toDraft(reset.where));
            void run(reset);
          }} />
        {error && <p className="search-message error-message" role="alert"><AlertCircle size={16} />{error}</p>}
        {notice && <div className="search-message" role="status">{notice}
          {manualLink && <input className="control" aria-label="Search link" readOnly value={manualLink} onFocus={(event) => event.target.select()} />}</div>}
        <ResultsTable query={applied} results={display} busy={busy} onChange={(next) => void run(next)} onOpen={setSelected} />
      </div>
    </div>
    <div className="demo-note"><FlaskConical size={15} /><span>All datasets shown here are synthetic and provided for demonstration.</span></div>
    {selected && <DatasetViewer row={selected} onClose={() => setSelected(undefined)} />}
  </>;
}

