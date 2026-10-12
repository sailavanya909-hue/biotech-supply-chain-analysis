"""Build auditable manufacturing metrics from the published laboratory/process records."""
import csv
import json
import math
import sqlite3
import statistics as st
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MONTHS = dict(zip(['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'],range(1,13)))
FEATURES = {'tbl_speed_mean':'Tablet press speed', 'main_CompForce_sd':'Compression force variation',
    'tbl_speed_0_duration':'Press stop duration', 'api_water':'API water content',
    'api_ps05':'API median particle size', 'smcc_water':'SMCC water content',
    'lactose_water':'Lactose water content', 'starch_water':'Starch water content'}

def number(value):
    if isinstance(value,str): value=value.strip()
    if value in ('', "''", 'NA', 'NaN', None): return None
    x = float(value)
    if not math.isfinite(x): raise ValueError('Nonfinite measurement')
    return x

def month(value):
    name, year = value.split('.')
    return f'{2000+int(year):04d}-{MONTHS[name]:02d}'

def keyed(rows):
    result = {}
    for row in rows:
        key = int(row['batch'])
        if key in result: raise ValueError(f'Duplicate batch {key}')
        result[key] = row
    return result

def correlation(pairs):
    pairs = [(x,y) for x,y in pairs if x is not None and y is not None]
    if len(pairs)<3: return None
    xs,ys = zip(*pairs); mx,my=st.mean(xs),st.mean(ys)
    denom=math.sqrt(sum((x-mx)**2 for x in xs)*sum((y-my)**2 for y in ys))
    return sum((x-mx)*(y-my) for x,y in pairs)/denom if denom else None

def centered_pairs(rows, feature, outcome='yield'):
    groups=defaultdict(list)
    for row in rows:
        if row.get(feature) is not None and row.get(outcome) is not None: groups[row['code']].append(row)
    pairs=[]
    for group in groups.values():
        if len(group)<5: continue
        mx=st.mean(r[feature] for r in group); my=st.mean(r[outcome] for r in group)
        pairs.extend((r[feature]-mx,r[outcome]-my) for r in group)
    return pairs

def summarize(rows):
    if not rows: return {'n':0,'weighted_yield':None,'average_yield':None,'target_tablets':0,'positive_gap':0,'above_100':0}
    total=sum(r['size'] for r in rows)
    return {'n':len(rows),'weighted_yield':sum(r['size']*r['yield'] for r in rows)/total,
        'average_yield':st.mean(r['yield'] for r in rows),'target_tablets':total,
        'positive_gap':sum(r['positive_gap'] for r in rows),'above_100':sum(r['yield']>100 for r in rows),
        'average_dissolution':st.mean(r['dissolution'] for r in rows)}

def build():
    raw=ROOT/'data/raw'; output=ROOT/'data/processed'; output.mkdir(parents=True,exist_ok=True)
    def read(name):
        with (raw/name).open(encoding='utf-8-sig',newline='') as f: return list(csv.DictReader(f,delimiter=';'))
    labs=read('Laboratory.csv'); processes=read('Process.csv')
    laboratory=keyed(labs); process=keyed(processes)
    if laboratory.keys()!=process.keys(): raise ValueError('Laboratory/process keys must match exactly')
    missing={key:sum(r[key].strip() in ('','NA','NaN') for r in labs) for key in labs[0]}
    missing={k:v for k,v in missing.items() if v}
    rows=[]
    for key, lab in sorted(laboratory.items()):
        proc=process[key]
        if lab['code']!=proc['code']: raise ValueError(f'Product code mismatch for batch {key}')
        y=number(lab['batch_yield']); size=int(lab['size'])
        if y is None or y<0 or size<=0: raise ValueError('Missing/invalid yield or target size')
        row={'batch':key,'code':int(lab['code']),'strength':{'20M':'20 mg','10M':'10 mg','40M':'40 mg','5MG':'5 mg'}[lab['strength']],
            'month':month(lab['start']),'size':size,'yield':y,'compression_yield':number(lab['tbl_yield']),
            'dissolution':number(lab['dissolution_av']),'dissolution_min':number(lab['dissolution_min']),
            'impurities':number(lab['impurities_total']),'weight_rsd':number(lab['fct_rsd_weight']),
            'positive_gap':size*max(0,100-y)/100,
            'api_lot':f"{lab['api_code']}:{lab['api_batch']}",'smcc_lot':lab['smcc_batch'],
            'lactose_lot':lab['lactose_batch'],'starch_lot':lab['starch_batch']}
        for feature in FEATURES: row[feature]=number(lab[feature] if feature in lab else proc[feature])
        rows.append(row)
    products=[]
    for code in sorted({r['code'] for r in rows}):
        group=[r for r in rows if r['code']==code]
        products.append({'code':code,'strength':group[0]['strength'],**summarize(group)})
    products.sort(key=lambda r:r['positive_gap'],reverse=True)
    associations=[]
    for feature,label in FEATURES.items():
        pairs=centered_pairs(rows,feature)
        counts=defaultdict(int)
        for r in rows:
            if r[feature] is not None: counts[r['code']]+=1
        eligible=[r for r in rows if r[feature] is not None and counts[r['code']]>=5]
        associations.append({'feature':feature,'label':label,'raw_r':correlation([(r[feature],r['yield']) for r in eligible]),
            'within_product_r':correlation(pairs),'n':len(pairs)})
    associations.sort(key=lambda r:abs(r['within_product_r'] or 0),reverse=True)
    months=[{'month':m,**summarize([r for r in rows if r['month']==m])} for m in sorted({r['month'] for r in rows})]
    summary=summarize(rows); gap=summary['positive_gap']
    meta={'title':'Manufacturing Performance Observatory','source':'Žagar & Mihelič · actual pharmaceutical production batches',
        'collection_doi':'10.6084/m9.figshare.c.5645578','paper_doi':'10.1038/s41597-022-01203-x',
        'start':min(r['month'] for r in rows),'end':max(r['month'] for r in rows),'source_records':len(labs),
        'process_records':len(processes),'joined_records':len(rows),'product_codes':len(products),
        'api_lot_identifiers':len({r['api_batch'].strip() for r in labs}),
        'api_lineage_keys':len({r['api_lot'] for r in rows}),'license':'CC BY 4.0','missing_fields':missing,
        'above_100':summary['above_100'],'top5_gap_share':sum(p['positive_gap'] for p in products[:5])/gap*100}
    report={'meta':meta,'summary':summary,'products':products,'months':months,'associations':associations,'batches':rows}
    (output/'dashboard.json').write_text(json.dumps(report,separators=(',',':'),allow_nan=False)+'\n')
    (ROOT/'site/dashboard.json').write_text((output/'dashboard.json').read_text())
    with (output/'batches.csv').open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
    db=sqlite3.connect(output/'manufacturing.sqlite3'); db.execute('DROP TABLE IF EXISTS batches')
    columns=list(rows[0]); integer={'batch','code','size'}; text={'strength','month','api_lot','smcc_lot','lactose_lot','starch_lot'}
    db.execute('CREATE TABLE batches ('+','.join(f'"{c}" '+('INTEGER' if c in integer else 'TEXT' if c in text else 'REAL') for c in columns)+', PRIMARY KEY(batch))')
    db.executemany('INSERT INTO batches VALUES ('+','.join('?' for c in columns)+')',[[r[c] for c in columns] for r in rows]);db.commit();db.close()
    print(json.dumps({'meta':meta,'summary':summary,'products':products[:5],'associations':associations},indent=2))
    return report

if __name__=='__main__': build()
