"use client";
import { useState } from "react";
import { Box, ChevronDown, Database, FlaskConical, Layers3, Library, Plus, Search, SlidersHorizontal, Tag } from "lucide-react";
import { categories, parameters } from "@/lib/schema/registry";
import { Button } from "@/components/ui/button";

const icons = {
  literature_sources: Library, keywords: Tag, material_batches: Layers3, geometries: Box,
  specimens: Box, tests: FlaskConical, data: Database,
};

export function ParameterBrowser({ onAdd, disabled }: { onAdd: (parameter: string) => void; disabled: boolean }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState(() => new Map<string, boolean>());
  const term = search.trim().toLowerCase();
  const sections = categories.filter(({ id }) => !category || id === category).map((entry) => ({
    ...entry, items: parameters.filter((parameter) => parameter.category === entry.id &&
      [parameter.label, parameter.fieldName, parameter.description ?? "", entry.label].some((value) => value.toLowerCase().includes(term))),
  })).filter(({ items }) => items.length);

  return <aside className="panel parameter-browser" aria-labelledby="parameters-title">
    <div className="browser-top">
      <div className="section-heading"><span className="section-icon"><SlidersHorizontal size={17} /></span>
        <div><h2 id="parameters-title">Parameter browser</h2><p>Browse by scientific category</p></div>
      </div>
      <label className="input-with-icon"><Search size={15} /><input type="search" aria-label="Find parameters" placeholder="Find parameters…" value={search} onChange={(event) => {
        setSearch(event.target.value);
        setExpanded(new Map());
      }} /></label>
      <label><span className="sr-only">Filter by category</span><select className="control category-filter" value={category} onChange={(event) => {
        setCategory(event.target.value);
        setExpanded(new Map());
      }}>
        <option value="">All categories</option>{categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      </select></label>
    </div>
    <div className="parameter-sections">
      {sections.map(({ id, label, description, items }) => {
        const Icon = icons[id as keyof typeof icons] ?? Layers3;
        const open = expanded.get(id) ?? Boolean(term || category);
        return <div className="parameter-section" key={id}>
          <button type="button" className="category-toggle" title={description} aria-expanded={open} onClick={() => {
            setExpanded((previous) => new Map(previous).set(id, !open));
          }}>
            <Icon size={15} /><span>{label}</span><span className="category-count">{items.length}</span><ChevronDown size={14} className={open ? "flip" : ""} />
          </button>
          {open && <ul className="parameter-list">{items.map((field) => <li key={field.id}>
            <div><strong>{field.label}</strong>
              {field.unit && <span className="field-unit">{field.unit}</span>}
              {["provisional", "derived"].includes(field.source.kind) && <span className="field-status">{field.source.kind === "derived" ? "Derived" : "Provisional"}</span>}
              {field.description && <p>{field.description}</p>}
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Add ${field.label} to query`} disabled={disabled} onClick={() => onAdd(field.id)}><Plus /></Button>
          </li>)}</ul>}
        </div>;
      })}
      {!sections.length && <p className="empty-parameters">No parameters match this filter.</p>}
    </div>
    <div className="browser-foot">{categories.length} categories <span>·</span> {parameters.length} searchable fields</div>
  </aside>;
}
