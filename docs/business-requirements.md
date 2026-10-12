# Business requirements and acceptance checks

## Objective

Help production, planning, and quality stakeholders identify manufacturing configurations and batches that merit investigation, while preserving the evidence and the limits of public data.

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| BR01 | Preserve actual published records | All source CSVs match publisher checksums; no generated manufacturing observations |
| BR02 | Join at batch grain | Exactly 1,005 unique joined batches; duplicate or conflicting keys rejected |
| BR03 | Report volume-aware yield | Weighted yield uses target quantity; batch-average yield displayed separately |
| BR04 | Define derived gaps accurately | Positive gap formula disclosed; above-target yields preserved; no savings or actual-scrap claim |
| BR05 | Make cohort filters meaningful | Strength and product filters update counts, KPIs, trend, concentration, scatter, and batch records |
| BR06 | Separate batch-review flags from release status | Threshold is editable and explicitly analytical; no invented regulatory limits |
| BR07 | Trace material lineage | Selected batch shows original API/excipient keys and full-source shared-key batch count |
| BR08 | Compare associations consistently | Raw and within-code correlations use identical eligible complete pairs |
| BR09 | Make results auditable | Source manifest, methodology, SQL, joined CSV, and calculation tests included |
| BR10 | Handle missing/empty cohorts | Empty filters show no records and undefined yield rather than invented healthy values |

## Verification record

Automated calculation checks cover weighting, gap treatment, missing values, month conversion, duplicate detection, product-code centering, publisher checksums, and SQLite/dashboard reconciliation. These checks validate implementation, not acceptance by an actual manufacturing organization.

Browser checks completed on October 11, 2026: the 5 mg cohort contains 249 records; combining it with product 13 gives an empty cohort; the above-100% review filter returns two records; searching “batch 1” returns exactly that record and its lineage; pagination expands the table from 12 to 24 records. Desktop and 390-pixel mobile layouts were reviewed; the mobile page has no document-level horizontal overflow. Search/review filters affect the table only and remain distinct from cohort-level charts. Threshold changes and CSV export are included in the acceptance checklist below.

Remaining acceptance checklist for a stakeholder reviewer: confirm the analyst review threshold is appropriate for their question; validate a downloaded cohort against the joined data; assess interpretation and actionability with the original manufacturing context.

## Scope boundaries

The dataset has no operational stock, expiries, supplier delivery commitments, or cost accounting. The dashboard does not authorize batch release, quality disposition, supplier changes, or production-setting changes. Proposed actions require the responsible stakeholders and original operating context.
