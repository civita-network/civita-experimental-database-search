# Architecture

The Next.js App Router renders the initial search server-side and restores a versioned query from its URL. The interactive query builder sends typed requests to `POST /api/search`. The results table delegates search, ordering, column projection, and pagination to the server. The detail viewer requests one source at a time.

The query parser checks shape, allowed operators, enum membership, and date/range validity with Zod. The API bounds request length, nesting, node count, column count, and page size. The mock adapter reads the source files from `mock-data/`, indexes them by dataset slug, and resolves the hierarchy within each file. It caches the immutable index for the life of the process.

The build and runtime import the committed search registry. During development, `npm run schema:check` compares the registry and coverage report with the authoritative JSON. The schema-backed unit tests also validate the mock records when a sibling checkout or an explicit override supplies the schemas. [Schema setup](../README.md#authoritative-schema)

The frontend consumes the query and response contracts defined in `src/lib/types.ts`. It shares the generated catalog for its controls. The server pages and routes depend on the `SearchService` interface. The service composition in `src/lib/services/index.ts` currently supplies the mock adapter. A new adapter can preserve the same routes and payloads.

## Supabase integration

1. Store immutable, versioned source JSON objects in Supabase Storage. Keep a stable source key, object version or hash, and publication/access status in PostgreSQL. The dataset endpoint can read the authorized object and stream the original bytes for downloads.
2. Build a reproducible metadata index from each stored object. A possible model uses `sources`, `entities`, `entity_links`, `parameters`, and `parameter_values`. Store entity keys by source version, category, and local ID, with indexed typed values and units. Preserve the original raw value and provenance when creating a normalized value.
3. Implement version 1 query evaluation in a server-only `SearchService` adapter. Use parameterized SQL or a narrowly scoped PostgreSQL function. Evaluate AND by joining compatible entity bindings on typed source and ancestor keys. Evaluate OR as a union of witnesses. Keep the same applicability, null, and multi-value rules. Apply projection, counts, sorting, and pagination in the database.
4. Enforce publication status and read policies across Storage and the derived index. Keep service credentials on the server. Switch the service composition after running the relationship regression cases and API contract tests against the replacement adapter.
5. Agree on a versioned dataset envelope and machine-readable definitions for the uncovered categories before production. The independent ingestion and publication system can build or refresh the derived index as it publishes each new source version.

