"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Database, ExternalLink, FlaskConical, Layers3, Library, SearchX, Settings2 } from "lucide-react";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { categoryById, displayValue, parameterById, parameters } from "@/lib/schema/registry";
import { defaultColumns, modeLabels } from "@/lib/search/presentation";
import type { ResultMode, SearchQuery, SearchResults, SearchRow } from "@/lib/types";

const modeIcons = { tests: FlaskConical, material_batches: Layers3, literature_sources: Library };

type Props = {
  query: SearchQuery; results: SearchResults; busy: boolean; onChange: (query: SearchQuery) => void;
  onOpen: (row: SearchRow) => void;
};

export function ResultsTable({ query, results, busy, onChange, onOpen }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [columnFilter, setColumnFilter] = useState("");
  const { mode } = query;
  const selection = results.rows.filter((row) => selected[row.entity.key]);
  const allSelected = results.rows.length > 0 && selection.length === results.rows.length;
  const pages = Math.max(1, Math.ceil(results.total / results.pageSize));
  const { column: sortColumn, direction } = query.sort ?? { column: "source", direction: "asc" };
  const sort = (column: string) => onChange({ ...query, page: 1, sort: { column, direction: sortColumn === column && direction === "asc" ? "desc" : "asc" } });
  const sortable = (id: string, label: string) => {
    const Icon = sortColumn === id ? direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
    return <button type="button" className="sort-button" disabled={busy} onClick={() => sort(id)}>{label}<Icon size={13} /></button>;
  };
  const columns: ColumnDef<SearchRow>[] = [
    {
      id: "selected", header: () => <input type="checkbox" aria-label="Select all results on page" checked={allSelected}
        disabled={!results.rows.length} onChange={(event) => {
          const checked = event.target.checked;
          setSelected((previous) => ({ ...previous, ...Object.fromEntries(results.rows.map((row) => [row.entity.key, checked])) }));
        }} />,
      cell: ({ row: { original } }) => <input type="checkbox" aria-label={`Select ${original.sourceId} ${original.entity.id}`}
        checked={!!selected[original.entity.key]} onChange={(event) => setSelected({ ...selected, [original.entity.key]: event.target.checked })} />,
    },
    { id: "source", header: () => sortable("source", "Source ID"), cell: ({ row }) => <span className="identifier">{row.original.sourceId}</span> },
    ...(mode === "literature_sources" ? [] : [{
      id: "record", header: () => sortable("record", mode === "tests" ? "Test ID" : "Batch ID"),
      cell: ({ row }: { row: { original: SearchRow } }) => <span className="identifier">{row.original.entity.id}</span>,
    }]),
    ...results.columns.map((id): ColumnDef<SearchRow> => {
      const field = parameterById.get(id)!;
      return {
        id, header: () => sortable(id, `${field.label}${field.unit ? ` (${field.unit})` : ""}`),
        cell: ({ row }) => {
          const values = row.original.values[id] ?? [];
          if (!values.length) return <span className="missing-value" aria-label="Missing">—</span>;
          return values.map((value) => field.dataType === "enum" || field.fieldName === "material_class" ? displayValue(value) : String(value)).join(" · ");
        },
      };
    }),
    {
      id: "open", header: () => <span className="sr-only">Details</span>,
      cell: ({ row }) => <Button type="button" variant="ghost" size="icon" title="Open dataset"
        aria-label={`Open dataset for ${row.original.sourceId} ${row.original.entity.id}`} onClick={() => onOpen(row.original)}><ExternalLink /></Button>,
    },
  ];
  const table = useReactTable({ data: results.rows, columns, getCoreRowModel: getCoreRowModel(), getRowId: (row) => row.entity.key });
  const columnTerm = columnFilter.trim().toLowerCase();
  const available = parameters.filter(({ label, fieldName, category }) => `${label} ${fieldName} ${categoryById.get(category)?.label}`.toLowerCase().includes(columnTerm));

  return <section className="panel results-panel" aria-labelledby="results-title" aria-busy={busy}>
    <div className="panel-heading results-heading">
      <div className="section-heading"><span className="section-icon"><Database size={17} /></span>
        <div><h2 id="results-title">Search results</h2><p>Explore matching records by result type</p></div>
      </div>
      <details className="column-picker">
        <summary className="control"><Settings2 size={15} /> Columns</summary>
        <div className="option-popover column-popover">
          <input className="control" type="search" aria-label="Find result columns" placeholder="Find columns…" value={columnFilter} onChange={(event) => setColumnFilter(event.target.value)} />
          <div className="column-choices">
            {available.map((field) => {
              const checked = results.columns.includes(field.id);
              return <label key={field.id}><input type="checkbox" checked={checked} disabled={busy || (!checked && results.columns.length >= 16)}
                onChange={() => onChange({ ...query, columns: checked ? results.columns.filter((id) => id !== field.id) : [...results.columns, field.id], page: 1 })} />
                <span>{field.label}<small>{categoryById.get(field.category)?.label}</small></span></label>;
            })}
            {!available.length && <p>No matching columns.</p>}
          </div>
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange({ ...query, columns: defaultColumns[mode], page: 1 })}>Restore default columns</Button>
        </div>
      </details>
    </div>
    <div className="results-toolbar">
      <div className="segmented result-modes" role="group" aria-label="Result type">
        {(Object.keys(modeLabels) as ResultMode[]).map((entry) => {
          const Icon = modeIcons[entry];
          return <button key={entry} type="button" aria-pressed={mode === entry} disabled={busy}
            onClick={() => {
              if (mode !== entry) onChange({ ...query, mode: entry, columns: undefined, sort: undefined, page: 1 });
            }}><Icon size={14} />{modeLabels[entry]}<span>{results.counts[entry]}</span></button>;
        })}
      </div>
      {selection.length > 0 && <span className="selection-count">{selection.length} selected on page
        {selection.length === 1 && <Button type="button" variant="ghost" size="sm" onClick={() => onOpen(selection[0])}>Open selected</Button>}</span>}
    </div>
    <div className="results-scroll" tabIndex={0} role="region" aria-label="Search results table">
      <table>
        <thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}
          scope="col" aria-sort={header.column.id === sortColumn ? direction === "asc" ? "ascending" : "descending" : undefined}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </th>)}</tr>)}</thead>
        <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} data-selected={selected[row.id] || undefined}>
          {row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    {!results.rows.length && <div className="no-results"><SearchX size={23} /><strong>No matching {modeLabels[mode].toLowerCase()}</strong>
      <p>Conditions must match records on a linked path. Try adjusting a condition or switching to a result type with matches.</p></div>}
    <div className="results-footer">
      <span aria-live="polite">{results.total ? `Showing ${(results.page - 1) * results.pageSize + 1}–${Math.min(results.page * results.pageSize, results.total)} of ${results.total}` : "Showing 0 records"}</span>
      <div className="pagination">
        <label>Rows <select className="control" aria-label="Rows per page" disabled={busy} value={results.pageSize}
          onChange={(event) => onChange({ ...query, pageSize: Number(event.target.value), page: 1 })}>
          {[...new Set([5, 10, 25, 50, results.pageSize])].sort((a, b) => a - b).map((size) => <option key={size}>{size}</option>)}
        </select></label>
        <Button type="button" variant="outline" size="icon" aria-label="Previous page" disabled={busy || results.page === 1}
          onClick={() => onChange({ ...query, page: results.page - 1 })}><ChevronLeft /></Button>
        <span>Page {results.page} of {pages}</span>
        <Button type="button" variant="outline" size="icon" aria-label="Next page" disabled={busy || results.page === pages}
          onClick={() => onChange({ ...query, page: results.page + 1 })}><ChevronRight /></Button>
      </div>
    </div>
  </section>;
}

