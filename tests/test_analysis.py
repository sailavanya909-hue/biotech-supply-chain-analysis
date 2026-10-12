import hashlib
import json
import sqlite3
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src'))
from analyze import summarize, keyed, number, month, centered_pairs, correlation

class ManufacturingTests(unittest.TestCase):
    def test_weighting_and_positive_gap_are_distinct(self):
        rows=[{'size':100,'yield':90,'positive_gap':10,'dissolution':95},
              {'size':300,'yield':102,'positive_gap':0,'dissolution':90}]
        s=summarize(rows)
        self.assertEqual(s['weighted_yield'],99)
        self.assertEqual(s['average_yield'],96)
        self.assertEqual(s['positive_gap'],10)
        self.assertEqual(s['above_100'],1)

    def test_missing_and_nonfinite_measurements(self):
        self.assertIsNone(number('  '))
        self.assertIsNone(number('NA'))
        self.assertEqual(number(' 98.2 '),98.2)
        with self.assertRaises(ValueError): number('inf')

    def test_month_labels_preserve_month_grain(self):
        self.assertEqual(month('avg.19'),'2019-08')
        self.assertEqual(month('maj.20'),'2020-05')
        self.assertEqual(month('okt.19'),'2019-10')

    def test_duplicate_batch_is_rejected(self):
        with self.assertRaises(ValueError): keyed([{'batch':'1'},{'batch':'1'}])

    def test_centering_removes_between_code_offsets(self):
        rows=[{'code':code,'x':code*100+i,'yield':code*200-i} for code in [1,2] for i in range(5)]
        self.assertGreater(correlation([(r['x'],r['yield']) for r in rows]),0)
        self.assertAlmostEqual(correlation(centered_pairs(rows,'x')),-1)
        self.assertIsNone(correlation([(1,2),(1,3),(1,4)]))

    def test_publisher_files_match_checksums(self):
        for item in json.loads((ROOT/'data/raw/source-manifest.json').read_text()):
            content=(ROOT/'data/raw'/item['name']).read_bytes()
            self.assertEqual(hashlib.md5(content).hexdigest(),item['md5'])
            self.assertEqual(hashlib.sha256(content).hexdigest(),item['sha256'])

    def test_complete_join_and_sql_reconciliation(self):
        d=json.loads((ROOT/'data/processed/dashboard.json').read_text())
        self.assertEqual(d['meta']['joined_records'],1005)
        self.assertEqual(len({r['batch'] for r in d['batches']}),1005)
        self.assertEqual(d['meta']['above_100'],2)
        with sqlite3.connect(ROOT/'data/processed/manufacturing.sqlite3') as db:
            n,target,weighted,average,gap=db.execute('SELECT COUNT(*),SUM(size),SUM(size*yield)/SUM(size),AVG(yield),SUM(positive_gap) FROM batches').fetchone()
        self.assertEqual(n,d['summary']['n']);self.assertEqual(target,d['summary']['target_tablets'])
        self.assertAlmostEqual(weighted,d['summary']['weighted_yield'],places=9)
        self.assertAlmostEqual(average,d['summary']['average_yield'],places=9)
        self.assertAlmostEqual(gap,d['summary']['positive_gap'],places=5)

if __name__=='__main__':unittest.main()
