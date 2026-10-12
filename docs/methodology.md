# Methodology and data dictionary

## Grain and joins

One row represents one final product batch. `Laboratory.csv` and `Process.csv` each contain 1,005 unique batch IDs. The pipeline rejects duplicate keys, mismatched batch sets, and mismatched product codes before joining one-to-one. It does not invent additional observations.

Month labels are converted from the source's abbreviations (`maj`, `avg`, `okt` included) into `YYYY-MM`. No day-level dates are fabricated. Strength labels are displayed as 5, 10, 20, and 40 mg.

Blank and whitespace-only numeric measurements become null. Missing values are not imputed. Source numeric values remain unchanged; two final batch yields above 100% remain visible. The selected yield and drug-release endpoints have no missing values in this snapshot.

## Calculations

- **Batch-average yield:** mean of reported `batch_yield` percentages.
- **Target-volume weighted yield:** sum(`size × batch_yield`) / sum(`size`). This represents target-tablet volume, not active ingredient mass across strengths.
- **Positive target-equivalent gap:** for each batch, `size × max(0, 1 − batch_yield/100)`. Sum the positive deficits; above-target batches do not offset them. It estimates the gap relative to target quantity and is not measured scrap, a booked loss, or recoverable savings.
- **Review threshold:** user-selected yield percentage, initially 95%. Strictly lower yields are flagged for analytical review. The flag is not a compliance status or a rejection decision.
- **Pareto concentration:** top five product codes ranked by positive gap / total positive gap. Volume and yield both affect the ranking.
- **Associations:** Pearson correlation between each selected published feature and final batch yield. Retain complete pairs in product codes with at least five complete observations. Raw and within-code comparisons use the same eligible observations. For the within-code comparison, subtract the product-code mean from both variables before correlating the residuals.

Correlation is descriptive. Within-code centering does not adjust for time, shared raw-material lots, other process parameters, or operator effects. Repeated material lots create dependencies between batches. No p-values, causal effects, forecasting accuracy, or operating limits are claimed.

## Selected fields

| Analysis field | Source | Meaning |
| --- | --- | --- |
| batch / code | Laboratory.batch / code | Anonymized batch and product identifiers |
| strength / size | Laboratory.strength / size | Reported tablet strength and target tablet quantity |
| month | Laboratory.start | Recorded production month |
| yield / compression_yield | Laboratory.batch_yield / tbl_yield | Whole-batch / compression yield, percent |
| dissolution / dissolution_min | Laboratory.dissolution_av / dissolution_min | Average / minimum measured drug release, percent |
| impurities | Laboratory.impurities_total | Total impurities, percent |
| api_lot | Laboratory.api_code + api_batch | Composite traceability key; 260 keys from 238 source lot identifiers |
| smcc_lot / lactose_lot / starch_lot | Corresponding Laboratory batch fields | Anonymized incoming excipient lot identifiers |
| api_water / api_ps05 | Laboratory fields | API water content / median particle-size measurement |
| smcc_water / lactose_water / starch_water | Laboratory fields | Incoming excipient water-content measurements |
| tbl_speed_mean / main_CompForce_sd / tbl_speed_0_duration | Process fields | Published press-speed, force-variation, and stop-duration features |

Process fields are the publisher's extracted features. Their original normalization is retained; no new conversion into physical operating recommendations is performed. Consult the data descriptor for source measurement units and preprocessing.

## Reproducibility

Run `src/analyze.py` to rebuild joined CSVs, dashboard JSON, the local SQLite database, and site data. The README findings describe the included source snapshot. Site assets are copied to `docs/` for GitHub Pages. After changing site assets, refresh those copies before publishing.

Tests check weighted versus unweighted calculations, positive-gap treatment, missing values, month conversion, duplicate rejection, within-code centering, source-file checksums, complete joins, and SQL/JSON reconciliation. The database is generated locally and excluded from version control.
