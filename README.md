# CIVITA - Concrete Database Search

CIVITA stands for Computational Infrastructure for Validation, Integration, Testing, and Assessment. This read-only research prototype supports the Grand Challenge on the Calibration, Validation, and Benchmarking of Concrete Computational Models. Researchers can search across linked scientific records, inspect the evidence for a match, and download the complete source JSON.

The separate CIVITA ingestion application prepares and publishes datasets. This workspace uses six synthetic experimental programs with 17 tests and 12 material batches, including a mix design with no associated test. The collection spans compression, three- and four-point bending, direct tension, fiber-reinforced concrete, reinforced members, and extrusion-printed mortar.

## Run locally

Use Node.js 22.12 or later. Run these commands from the application directory.

```bash
npm install
npm run dev
```

Open [the local search workspace](http://localhost:3000). For a production build, use `npm run build` followed by `npm start`. The scripts use Next.js App Router with Webpack, strict TypeScript, React, Tailwind CSS, shadcn/ui primitives, Lucide icons, TanStack Table, and Zod.

## Search and inspect

1. Open a category or search for a parameter by name or description. Add a parameter from the browser, or choose a category and parameter in the query builder.
2. Choose an operator and value. Add nested groups to control which conditions must match together. The query summary shows the current expression.
3. Run the query and choose **Tests**, **Material batches**, or **Sources**. Sorting, page size, and columns are controlled in the results table. The result tabs show counts for the same expression across all three modes.
4. Open a result to see the full source and its related records. Records that satisfied conditions are marked **Query match**. **Inspect JSON** shows the source structure, and **Download JSON** retrieves the original file.
5. Reload the URL to reopen an applied search. **Copy link** can share a valid draft before execution. Queries whose encoded URL exceeds 7,500 characters still run through the search API.

The [search semantics](docs/search-semantics.md) define the linked paths, Boolean grouping, missing values, numeric comparisons, and how results are projected.

## Shared schema

The checked-in registry is derived from the shared JSON hierarchy and record schemas. The application and build use this registry directly. Regeneration and authoritative schema tests read the shared directory.

The default is `reference/`, a local junction on Windows and an ignored path in Git. From the search directory, create it if the path is absent.

```powershell
New-Item -ItemType Junction -Path reference -Target (Resolve-Path ../civita-concrete-database-schema).Path
```

Alternatively, pass a path to the shared directory, or set the environment variable `CIVITA_SCHEMA_DIR`.

```bash
npm run schema:generate -- --reference ../civita-concrete-database-schema
npm run schema:check -- --reference ../civita-concrete-database-schema
```

Review the [schema analysis](docs/schema-analysis.md), [generated field inventory](docs/schema-coverage.generated.md), and [coverage issues](docs/schema-issues.md) before updating the mappings.

## Test

```bash
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

Vitest covers the registry, evaluator, data adapter, and HTTP route handlers. The two tests that compare or validate against the authoritative JSON run when the shared schema directory is available. Playwright starts a local server on port 3197 and exercises the browser workflow. To use an existing Microsoft Edge installation, set `PLAYWRIGHT_CHANNEL=msedge` in your shell before running the browser tests.

## API

| Endpoint | Contract |
| --- | --- |
| `POST /api/search` | Version 1 query with mode, Boolean tree, optional sort, page, page size, and projected parameter IDs. Returns rows, match references, counts for all modes, and pagination. |
| `GET /api/parameters` | Version 1 category and parameter catalog with types, units, operators, and provenance. |
| `GET /api/datasets/:id` | Source envelope and linked records by dataset slug. Append `?download=1` to download the original bytes. |

```json
{
  "version": 1,
  "mode": "tests",
  "where": {
    "kind": "group",
    "logic": "and",
    "children": [
      {
        "kind": "condition",
        "parameter": "material_batches.max_aggregate_size_mm",
        "operator": "lte",
        "value": 10
      }
    ]
  }
}
```

## Project structure

| Path | Contents |
| --- | --- |
| `src/app` | Search and About pages, read-only API routes |
| `src/components` | Parameter browser, query builder, results, and dataset viewer |
| `src/lib/schema` | Generated registry and explicitly provisional mappings |
| `src/lib/search` | Query validation, relationship indexing, evaluation, and projection |
| `src/lib/services` | Search contract and local JSON adapter |
| `mock-data` | One synthetic JSON file per experimental program |
| `scripts`, `docs`, `tests` | Registry generation, scientific and architecture notes, and automated verification |

The [architecture notes](docs/architecture.md) describe the future Supabase Storage and PostgreSQL adapter.

## Create an independent GitHub repository

The present application directory is inside the parent Concrete Database worktree. To create an independent repository without changing the parent Git configuration, create an empty GitHub repository and clone it into a separate directory outside that worktree. Verify the top level with `git rev-parse --show-toplevel` in the new checkout.

Transfer the application source, configuration, lockfile, documentation, tests, generated registry, and synthetic data into that checkout. Exclude `reference/`, Git metadata, dependencies, and build or test output. Re-create the junction there or point `CIVITA_SCHEMA_DIR` to the original shared directory. Review `git status --short --ignored` before committing. Then commit and push from the independent checkout. If the parent project should also reference the new repository, make that a separate repository-maintainer decision.

