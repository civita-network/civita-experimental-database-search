"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, Braces, CircleCheck, Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, categoryById, parameterById } from "@/lib/schema/registry";
import type { DatasetDetail, SearchRow } from "@/lib/types";

export function DatasetViewer({ row, onClose }: { row: SearchRow; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<DatasetDetail>();
  const [error, setError] = useState("");
  const [showJson, setShowJson] = useState(false);
  const matched = new Set(row.matches.map((entity) => entity.key));
  const endpoint = `/api/datasets/${encodeURIComponent(row.datasetId)}`;

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Could not load this dataset.");
      setDetail(await response.json() as DatasetDetail);
    }).catch(() => {
      if (!controller.signal.aborted) setError("Could not load this dataset.");
    });
    return () => {
      controller.abort();
      element.close();
    };
  }, [endpoint]);

  function focusRecord(key: string) {
    const target = document.getElementById(`entity-${key}`);
    target?.scrollIntoView({ block: "nearest" });
    target?.focus({ preventScroll: true });
  }

  return <dialog className="dataset-dialog" ref={dialog} aria-labelledby="dataset-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="dialog-header">
      <div className="section-heading"><span className="section-icon"><Database size={18} /></span><div>
        <h2 id="dataset-title">Source dataset {row.sourceId}</h2><p>Synthetic dataset · {row.entity.id}</p>
      </div></div>
      <Button type="button" variant="ghost" size="icon" aria-label="Close dataset" onClick={onClose}><X /></Button>
    </div>
    <div className="dialog-tools">
      <Button type="button" variant="outline" size="sm" aria-pressed={showJson} disabled={!detail} onClick={() => setShowJson(!showJson)}><Braces />{showJson ? "View records" : "Inspect JSON"}</Button>
      <Button asChild size="sm"><a href={`${endpoint}?download=1`} download><ArrowDownToLine /> Download JSON</a></Button>
    </div>
    <div className="dialog-body">
      {error && <p role="alert">{error}</p>}
      {!detail && !error && <p role="status">Loading dataset…</p>}
      {detail && (showJson ? <pre className="json-view">{JSON.stringify(detail.dataset, null, 2)}</pre>
        : categories.map((category) => {
          const records = detail.entities.filter((entity) => entity.category === category.id);
          if (!records.length) return null;
          return <section className="entity-section" key={category.id}>
            <h3>{category.label} <span>{records.length}</span></h3>
            {records.map((entity) => <article className="entity-card" data-matched={matched.has(entity.key) || undefined}
              tabIndex={-1} id={`entity-${entity.key}`} key={entity.key}>
              <div className="entity-heading"><strong>{entity.id}</strong>
                {entity.key === row.entity.key && <span className="field-status">Selected result</span>}
                {matched.has(entity.key) && <span className="match-tag"><CircleCheck size={13} /> Query match</span>}
              </div>
              <dl>{Object.entries(entity.fields).map(([key, value]) => <div key={key}>
                <dt title={key}>{parameterById.get(`${category.id}.${key}`)?.label ?? key.replaceAll("_", " ")}</dt>
                <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
              </div>)}</dl>
              {entity.related.length > 0 && <div className="related-links"><strong>Related records</strong>{entity.related.map((related) => <button
                type="button" key={related.key} title={categoryById.get(related.category)?.label} onClick={() => focusRecord(related.key)}>{related.id}</button>)}</div>}
            </article>)}
          </section>;
        }))}
    </div>
  </dialog>;
}

