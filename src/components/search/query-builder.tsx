"use client";
import { Braces, Clipboard, Filter, GitBranch, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, categoryById, displayValue, operatorLabels, parameterById, parameters, unaryOperators } from "@/lib/schema/registry";
import { maxDepth } from "@/lib/search/query";
import type { SearchOperator } from "@/lib/types";
import { type DraftCondition, type DraftGroup, type DraftNode, newCondition, summarize } from "./draft";

function ValueInput({ condition, onChange }: { condition: DraftCondition; onChange: (value: DraftCondition["value"]) => void }) {
  const field = parameterById.get(condition.parameter);
  if (!field || unaryOperators.has(condition.operator)) return <div className="no-value">{field ? "No value needed" : "Choose a parameter"}</div>;
  const { value, operator } = condition;
  if (operator === "between") {
    const parts = Array.isArray(value) ? value : ["", ""];
    return <div className="range-input">{["Lower value", "Upper value"].map((label, index) => <input
      className="control" aria-label={label} key={label} type={field.dataType === "date" ? "date" : "number"} step="any"
      placeholder={index === 0 ? "Min" : "Max"} value={parts[index] ?? ""} onChange={(event) => {
        const next = [parts[0] ?? "", parts[1] ?? ""];
        next[index] = event.target.value;
        onChange(next);
      }}
    />)}</div>;
  }
  if (operator === "in" || operator === "notIn") {
    const selected = Array.isArray(value) ? value : [];
    return <details className="enum-options"><summary className="control">{selected.length ? `${selected.length} selected` : "Choose values"}</summary>
      <div className="option-popover">{field.options?.map((option) => <label key={option}>
        <input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((entry) => entry !== option))} />{displayValue(option)}
      </label>)}</div></details>;
  }
  const scalar = typeof value === "string" ? value : "";
  if (field.dataType === "enum") return <select className="control" aria-label="Value" value={scalar} onChange={(event) => onChange(event.target.value)}>
    <option value="">Choose value</option>{field.options?.map((option) => <option key={option} value={option}>{displayValue(option)}</option>)}
  </select>;
  return <input className="control" aria-label="Value" type={field.dataType === "number" ? "number" : field.dataType === "date" ? "date" : "text"}
    step={field.dataType === "number" ? "any" : undefined} placeholder={field.unit ?? "Enter value"} maxLength={200}
    value={scalar} onChange={(event) => onChange(event.target.value)} />;
}

function ConditionEditor({ condition, onChange, onRemove }: { condition: DraftCondition; onChange: (condition: DraftCondition) => void; onRemove: () => void }) {
  const field = parameterById.get(condition.parameter);
  const fieldOptions = parameters.filter((entry) => entry.category === condition.category);
  return <div className="condition-card">
    <div className="condition-grid">
      <label><span>Category</span><select className="control" value={condition.category} onChange={(event) => onChange({ ...newCondition(condition.id), category: event.target.value })}>
        <option value="">Choose category</option>{categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <label><span>Parameter</span><select className="control" disabled={!fieldOptions.length} value={condition.parameter}
        onChange={(event) => onChange(event.target.value ? newCondition(condition.id, event.target.value) : { ...newCondition(condition.id), category: condition.category })}>
        <option value="">Choose parameter</option>{fieldOptions.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <label><span>Operator</span><select className="control" value={field ? condition.operator : ""} disabled={!field}
        onChange={(event) => onChange({ ...condition, operator: event.target.value as SearchOperator, value: "" })}>
        {!field && <option value="">Choose operator</option>}{field?.operators.map((operator) => <option key={operator} value={operator}>{operatorLabels[operator]}</option>)}
      </select></label>
      <div className="value-field"><span>Value {field?.unit && <small>({field.unit})</small>}</span>
        <ValueInput condition={condition} onChange={(value) => onChange({ ...condition, value })} /></div>
      <Button type="button" variant="ghost" size="icon" aria-label="Remove condition" onClick={onRemove}><Trash2 /></Button>
    </div>
    {field && <p className="condition-provenance">
      <code>{field.fieldName}</code>
      {field.source.kind === "provisional" && <span className="field-status">Provisional field</span>}
      {field.source.kind === "derived" && <span className="field-status">Derived field</span>}
      {field.description && <span>{field.description}</span>}
    </p>}
  </div>;
}

const examples = [
  { label: "Bending & aggregate size", parameters: ["tests.test_type", "material_batches.max_aggregate_size_mm"] },
  { label: "Compressive strength", parameters: ["data.compressive_strength_mpa"] },
  { label: "Printed specimens", parameters: ["specimens.printed_specimen"] },
];

export function exampleConditions(index: number, id: () => string): DraftCondition[] {
  const nodes = examples[index].parameters.map((parameter) => newCondition(id(), parameter));
  if (index === 0) {
    nodes[0].value = "three_point_bending_test";
    nodes[1].operator = "lte";
    nodes[1].value = "10";
  } else if (index === 1) {
    nodes[0].operator = "between";
    nodes[0].value = ["30", "60"];
  }
  return nodes;
}

type GroupProps = {
  group: DraftGroup;
  depth: number;
  atLimit: boolean;
  onChange: (group: DraftGroup) => void;
  onRemove?: () => void;
  makeId: () => string;
  onExample: (index: number) => void;
};

function GroupEditor({ group, depth, atLimit, onChange, onRemove, makeId, onExample }: GroupProps) {
  const update = (index: number, node?: DraftNode) => onChange({
    ...group, children: node ? group.children.map((child, i) => i === index ? node : child) : group.children.filter((_, i) => i !== index),
  });
  const add = (node: DraftNode) => onChange({ ...group, children: [...group.children, node] });
  return <div className={depth === 1 ? "root-group" : "nested-group"}>
    <div className="group-header">
      <span className="group-name">{depth > 1 && <GitBranch size={14} />}{depth === 1 ? "Match conditions" : "Nested group"}</span>
      <div className="segmented logic-toggle" role="group" aria-label={depth === 1 ? "Root logic" : "Nested group logic"}>
        {(["and", "or"] as const).map((logic) => <button key={logic} type="button" aria-pressed={group.logic === logic} onClick={() => onChange({ ...group, logic })}>{logic.toUpperCase()}</button>)}
      </div>
      {onRemove && <Button type="button" size="icon" variant="ghost" className="ml-auto" aria-label="Remove group" onClick={onRemove}><Trash2 /></Button>}
    </div>
    <div className="group-body">
      {depth === 1 && !group.children.length && <div className="query-empty">
        <div className="empty-icon"><Filter size={19} /></div><strong>Start with a search condition</strong>
        <p>Add a parameter from the browser, or try an example query.</p>
        <div className="example-buttons">{examples.map(({ label }, index) => <Button type="button" variant="outline" size="sm" key={label} onClick={() => onExample(index)}>{label}</Button>)}</div>
      </div>}
      {group.children.map((child, index) => <div key={child.id} className="query-node">
        {index > 0 && <span className="logic-connector">{group.logic.toUpperCase()}</span>}
        {child.kind === "condition" ? <ConditionEditor condition={child} onChange={(node) => update(index, node)} onRemove={() => update(index)} />
          : <GroupEditor group={child} depth={depth + 1} atLimit={atLimit} onChange={(node) => update(index, node)} onRemove={() => update(index)} makeId={makeId} onExample={onExample} />}
      </div>)}
    </div>
    <div className="add-actions">
      <Button type="button" variant="outline" size="sm" disabled={atLimit} onClick={() => add(newCondition(makeId()))}><Plus /> Add condition</Button>
      {depth < maxDepth && <Button type="button" variant="ghost" size="sm" disabled={atLimit} onClick={() => add({ kind: "group", id: makeId(), logic: "and", children: [] })}><GitBranch /> Add group</Button>}
    </div>
  </div>;
}

export function QueryBuilder(props: Omit<GroupProps, "depth" | "onRemove"> & {
  onSearch: () => void; onReset: () => void; onShare: () => void; busy: boolean; dirty: boolean;
}) {
  return <section className="panel query-panel" aria-labelledby="query-title">
    <div className="panel-heading">
      <div className="section-heading"><span className="section-icon"><Braces size={18} /></span>
        <div><h2 id="query-title">Query builder</h2><p>Combine conditions across linked records</p></div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={props.onReset}><RotateCcw /> Reset</Button>
    </div>
    <div className="query-content"><GroupEditor {...props} depth={1} /></div>
    <div className="query-summary"><strong>QUERY SUMMARY</strong><span>{summarize(props.group)}</span></div>
    <div className="query-actions">
      <span className="query-hint">{props.atLimit ? "Query limit reached" : props.dirty ? "Unapplied changes" : "Searches follow dataset relationships"}</span>
      <Button type="button" variant="outline" onClick={props.onShare} disabled={props.busy}><Clipboard /> Copy link</Button>
      <Button type="button" onClick={props.onSearch} disabled={props.busy}><Search /> {props.busy ? "Searching…" : "Run search"}</Button>
    </div>
  </section>;
}

