# Search semantics

A search request contains a version, a result mode, and a Boolean tree. A leaf identifies one registered parameter and a compatible operator. It matches a particular entity record and carries the identities of that record’s ancestors. The default group is AND. An empty root requests all records. Nested groups require at least one condition. The API permits up to five group levels and 40 nodes per tree.

## Linked paths and result modes

- **Tests.** Evaluate on a test’s own specimen, batch, geometry, optional printing variables and reinforcement layout, devices, loading histories, and data. A layout contributes its components and the materials linked through those components. Literature fields and keywords come from the source.
- **Material batches.** Project successful linked paths onto their batches, deduplicating by dataset and batch ID. A batch can match through a test on one of its specimens or through a specimen without tests. A batch without specimens can match its own, source, and keyword conditions.
- **Sources.** Project successful paths onto their literature source, deduplicating by dataset. Include paths for untested specimens, unused batches, and otherwise unattached source-owned records. Thus a source can match a source-level condition or an individual linked path.

Sharing a source, geometry, printing process, or layout does not merge separate tests or batches. Each test has its own evaluation scope. For example, a batch with 8 mm aggregate and a bending test can satisfy both conditions together. A different batch in the same source with 20 mm aggregate and a compression test cannot supply evidence for either condition on the bending test. A source-wide question requiring unrelated branches, such as finding a source with one bending test and another independent compression test, requires a future explicit cross-record operator. In the prototype that conjunction requires a single compatible path.

## Boolean evaluation

A witness binds one local record identity per category. An OR group preserves the witnesses for each successful child. An AND group combines child witnesses only when all shared identities agree, including ancestor IDs. This prevents one measurement row from providing its data type while another provides its reported quantity. It also makes `(A AND B) OR (C AND D)` independent of how the source arranges its records.

A device predicate paired with a data or loading predicate requires that record’s explicit device reference. Two data and loading records with explicit device references can join only if their device agrees. If one of those records lacks a device and neither condition selects a device, their shared test is sufficient. The same shared-identity rule pairs a reinforcement component with its own material. Source keywords are individual records. Multiple keyword conditions under AND must hold on one keyword row.

## Values, units, and negation

| Case | Evaluation |
| --- | --- |
| Missing field | Matches **Missing value** on an existing applicable record. Missing includes an absent or null field, an empty text value, an empty array, or no usable value. |
| Missing optional record | A category without records supplies no witness, including for **Missing value**. A separate OR branch can still match. |
| Multiple values in one record | Positive operators use any usable value. **Not equal** and **Is not one of** require at least one usable value and require every usable value on that record to differ. |
| Multiple linked records | A qualifying linked record supplies a witness. Two conditions on the same category in an AND must use the same record. A negative condition is a predicate on that linked record, with no assertion about other linked records. |
| Text and vocabulary | Text compares trimmed, case-insensitive strings. Enumeration terms compare exact registered values. The six yes/no schema fields expose true/false operators while preserving their raw strings. |
| Numbers and dates | Numeric and date intervals include both endpoints. Date inputs require calendar-valid ISO dates and compare in chronological order. Numeric input uses the displayed canonical unit. |

The fixed-unit fields encode their units in the field name or definition. The raw scalar mean and fiber fraction support presence checks because their values can use different unit systems. The provisional compressive-strength projection uses scalar rows whose reported quantity is `compressive_strength`. It converts Pa, kPa, MPa, GPa, and N/mm² to MPa and rounds conversion noise to 15 significant digits. A strength row with missing or incompatible units supplies no canonical numeric value. A curve row is outside the applicability of scalar and strength operators, including missing-value checks. Measurements stay on their own test, so the engine does not attribute a separate compression test’s strength to a bending test.

## Explanation and projection

Each result has a dataset identifier, local entity identifier, and the record references that satisfied leaves in successful witnesses. The dataset viewer marks those records and the selected result. Matches from every successful OR branch are included, while any leaf found only on a failed branch is excluded.

A result’s displayed fields summarize the selected result’s related records in successful scopes. Cells show all distinct values in those scopes, including related records that did not themselves satisfy a leaf. Refer to the marked records in the detail viewer for the query evidence. Numeric lists are sorted by value, other lists by natural text order. Row sorting compares the resulting lists lexicographically, places missing cells last in both directions, and breaks ties by the unique composite key. Sorting precedes pagination. Counts report distinct tests, batches, and sources projected from the same successful scopes.

