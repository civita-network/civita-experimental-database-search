# CIVITA - Concrete Database Search

CIVITA stands for Computational Infrastructure for Validation, Integration, Testing, and Assessment. This read-only research prototype supports the Grand Challenge on the Calibration, Validation, and Benchmarking of Concrete Computational Models. Researchers can search across linked scientific records, inspect the evidence for a match, and download the complete source JSON.

The CIVITA Network maintains the search application and the authoritative experimental schema in separate repositories. [Search application](https://github.com/civita-network/civita-concrete-database-search) · [Experimental schema](https://github.com/civita-network/civita-concrete-database-schema)

The separate CIVITA ingestion application prepares and publishes datasets. This workspace uses six synthetic experimental programs with 17 tests and 12 material batches, including a mix design with no associated test. The collection spans compression, three- and four-point bending, direct tension, fiber-reinforced concrete, reinforced members, and extrusion-printed mortar.

## Run locally

Use Node.js 22.12 or later. Run these commands from the application directory.

```bash
npm install
npm run dev
```

Open [the local search workspace](http://localhost:3000). For a production build, use `npm run build` followed by `npm start`. The scripts use Next.js App Router with Webpack, strict TypeScript, React, Tailwind CSS, shadcn/ui primitives, Lucide icons, TanStack Table, and Zod.

Local production builds and Vercel deployments use the committed `src/lib/schema/registry.generated.json` and the application's own synthetic data. The schema checkout is needed only for schema maintenance and verification. Regeneration is a manual development step.

## Search and inspect

1. Open a category or search for a parameter by name or description. Add a parameter from the browser, or choose a category and parameter in the query builder.
2. Choose an operator and value. Add nested groups to control which conditions must match together. The query summary shows the current expression.
3. Run the query and choose **Tests**, **Material batches**, or **Sources**. Sorting, page size, and columns are controlled in the results table. The result tabs show counts for the same expression across all three modes.
4. Open a result to see the full source and its related records. Records that satisfied conditions are marked **Query match**. **Inspect JSON** shows the source structure, and **Download JSON** retrieves the original file.
5. Reload the URL to reopen an applied search. **Copy link** can share a valid draft before execution. Queries whose encoded URL exceeds 7,500 characters still run through the search API.

The [search semantics](docs/search-semantics.md) define the linked paths, Boolean grouping, missing values, numeric comparisons, and how results are projected.

## Authoritative schema

The generated registry derives its category relationships and record fields from `database_hierarchy.json` and the experimental record schemas. The application adds provisional workbook-based fields and demo options in `src/lib/schema/provisional.ts`.

For schema maintenance and verification, clone the repositories side by side.

```text
Documents/CIVITA/
├── civita-concrete-database-search/
└── civita-concrete-database-schema/
```

Schema generation and verification use `--reference <path>` if supplied, then `CIVITA_SCHEMA_DIR`, then `../civita-concrete-database-schema` relative to the application root. Relative override paths are interpreted from the command's working directory. Unit tests use the same environment variable and sibling default.

Run `schema:check` to compare the committed registry and coverage report with the authoritative schemas without writing files. After an intentional schema or mapping change, run `schema:generate`, review both generated diffs, and run the check again.

```bash
npm run schema:check
npm run schema:generate
npm run schema:check -- --reference /path/to/civita-concrete-database-schema
```

Review the [schema analysis](docs/schema-analysis.md), [generated field inventory](docs/schema-coverage.generated.md), and [coverage issues](docs/schema-issues.md) before updating the mappings.

## Test

```bash
npm run test
npm run lint
npx playwright install chromium
npm run test:e2e
npm run build
```

Vitest covers the registry, evaluator, data adapter, and HTTP route handlers. The two schema-backed tests compare the generated files and validate the synthetic records. They are skipped when the default sibling directory is absent and no override is configured. Playwright starts a local server on port 3197 and exercises the browser workflow. To use an existing Microsoft Edge installation, set `PLAYWRIGHT_CHANNEL=msedge` in your shell before running the browser tests.

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
| `src/app` | Search page and read-only API routes |
| `src/components` | Parameter browser, query builder, results, and dataset viewer |
| `src/lib/schema` | Generated registry and explicitly provisional mappings |
| `src/lib/search` | Query validation, relationship indexing, evaluation, and projection |
| `src/lib/services` | Search contract and local JSON adapter |
| `mock-data` | One synthetic JSON file per experimental program |
| `scripts`, `docs`, `tests` | Registry generation, scientific and architecture notes, and automated verification |

The [architecture notes](docs/architecture.md) describe the future Supabase Storage and PostgreSQL adapter.

## License and Copyright

Original CIVITA search software is licensed under [MIT](LICENSE). Documentation, schema-derived material, synthetic data, and the CIVITA logo follow the [local license scope](LICENSING.md). Copyright in original software contributions remains with the respective contributors or other applicable rights holders.

See the [CIVITA licensing policy](https://github.com/civita-network/civita/blob/main/LICENSING.md), [authors and attribution](https://github.com/civita-network/civita/blob/main/AUTHORS.md), and [contribution guidelines](https://github.com/civita-network/civita/blob/main/CONTRIBUTING.md).

