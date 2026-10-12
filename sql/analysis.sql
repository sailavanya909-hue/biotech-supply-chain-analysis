-- One row is one final product batch. Weight yield by its target tablet quantity.
SELECT COUNT(*) AS batches, SUM(size) AS target_tablets,
       SUM(size * yield) / SUM(size) AS weighted_yield,
       AVG(yield) AS batch_average_yield,
       SUM(positive_gap) AS positive_target_equivalent_gap
FROM batches;

-- Product-level concentration: this is target-equivalent shortfall, not actual scrap.
SELECT code, strength, COUNT(*) AS batches,
       SUM(size * yield) / SUM(size) AS weighted_yield,
       SUM(positive_gap) AS positive_target_equivalent_gap
FROM batches GROUP BY code, strength
ORDER BY positive_target_equivalent_gap DESC;

-- Trace repeated API material lots; do not treat batch counts as independent lot counts.
SELECT api_lot, COUNT(*) AS linked_batches, COUNT(DISTINCT code) AS linked_product_codes,
       AVG(yield) AS average_batch_yield
FROM batches GROUP BY api_lot ORDER BY linked_batches DESC;
