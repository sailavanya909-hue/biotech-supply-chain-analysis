# Manufacturing decision brief

## Where to start

Review product codes **13, 23, 17, 15, and 14** first for target-equivalent gap concentration. They account for **67.16%** of the total positive gap. This is an investigation priority, not evidence that these codes have the worst process performance: a high-volume product can dominate the absolute gap despite a relatively strong yield.

The full dataset contains 1,005 production batches across 25 product codes. Volume-weighted final yield is **98.436%**; batch-average yield is **98.256%**. Their **0.180 percentage-point** difference shows why unequal target batch quantities matter.

## Compare configurations before interpreting process signals

On the same 987 eligible batches, the published press-speed feature has a raw final-yield correlation of **+0.057**, but **−0.234** after product-code centering. Press-stop duration has a within-code association of **−0.290**, and compression-force variation **−0.257**.

These patterns support a focused review of interruption and stability records within a product configuration. They do not establish that changing a press setting will improve yield. Material-lot reuse, month effects, and other operating factors require further investigation.

## Data issues change what can be concluded

Two final yields exceed 100% and remain in all applicable views. The source includes whitespace-only missing measurements: API impurity fields in particular have substantial missingness. The pipeline exposes missing counts and excludes only incomplete pairs in each association calculation; it does not impute a favorable result.

The batch explorer displays incoming API and excipient lineage. There are 238 API lot identifiers and 260 distinct API code:lot keys. Shared raw-material keys mean final batches must not be interpreted as independent supplier or raw-lot experiments.

## Recommended business follow-up

1. **Production and planning:** compare target-volume weighted yield and absolute gap by product code; inspect the highest-contributing batches and confirm target-quantity definitions.
2. **Process engineering:** review stop-duration and force-variation patterns within the same configuration, including timing and operator context.
3. **Quality and material teams:** verify unusual yields and missing measurements against source systems, and assess patterns across repeated material lots.
4. **Business analyst:** specify the missing inputs required to estimate commercial impact: actual rejected quantities, rework, disposal, production schedules, costs, and approved quality specifications.

The current data support descriptive manufacturing analysis. They do not support actual inventory depletion, supplier on-time delivery, expiry exposure, Boston-site performance, or realized financial savings.

## How to read the interactive views

The dashboard separates three different questions that can be blurred by one headline number:

- **How much production is represented?** The timeline compares target-volume weighted yield, the equal-weight batch average, and a fixed product-mix view. The fixed-mix series uses each product code’s overall target-volume share in the selected cohort; monthly coverage shows which share has a batch that month. It is descriptive and does not control for every operating condition.
- **Where is the absolute planning gap concentrated?** The ranked chart pairs each code’s positive target-equivalent gap with its cumulative share of the cohort total. A code can lead in gap because of volume while another has a lower yield percentage.
- **How consistent are batches within a configuration?** The distribution chart shows each batch, the median and middle 50%, and the 10th–90th percentile range. Changing the ranking exposes low median, high spread, high volume, and high gap priorities. These percentiles are not quality specifications or control limits.

The charts are linked: selecting a product code filters the dashboard, while selecting a batch opens its recorded incoming-material lineage. This gives an analyst a reproducible path from portfolio-level prioritization to a source batch record.
