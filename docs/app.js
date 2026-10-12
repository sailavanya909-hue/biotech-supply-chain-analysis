"use strict";
const $=id=>document.getElementById(id);
const fmt=(v,d=0)=>v==null?'Not reported':new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
const colors={'5 mg':'#007d73','10 mg':'#8460bd','20 mg':'#ce603d','40 mg':'#3858a0'};
let data,cohort=[],tableRows=[],limit=12,selected=null;
function sum(rows,key){return rows.reduce((s,r)=>s+r[key],0)}
function stats(rows){const target=sum(rows,'size');return {n:rows.length,target,weighted:target?rows.reduce((s,r)=>s+r.size*r.yield,0)/target:null,average:rows.length?sum(rows,'yield')/rows.length:null,gap:sum(rows,'positive_gap')}}
function group(rows,key){const groups=new Map();rows.forEach(r=>{const value=r[key];if(!groups.has(value))groups.set(value,[]);groups.get(value).push(r)});return [...groups].map(([value,items])=>({value,items,...stats(items)}))}
function threshold(){const n=Number($('threshold').value);return $('threshold').value!==''&&Number.isFinite(n)?Math.min(105,Math.max(0,n)):95}
function option(value,text){const e=document.createElement('option');e.value=value;e.textContent=text;return e}
function reset(){['strength','product','search'].forEach(id=>$(id).value='');$('review').value='all';$('threshold').value=95;limit=12;render()}
function svg(content,description,w=600,h=270){return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${description}">${content}</svg>`}
function render(){
 if(!data)return;
 cohort=data.batches.filter(r=>(!$('strength').value||r.strength===$('strength').value)&&(!$('product').value||String(r.code)===$('product').value));
 $('cohort').textContent=`${fmt(cohort.length)} of ${fmt(data.batches.length)} source batches`;
 const s=stats(cohort),below=cohort.filter(r=>r.yield<threshold()).length;
 const kpis=[['Volume-weighted yield',s.weighted==null?'—':fmt(s.weighted,2)+'%','Weighted by target tablet quantity'],['Average batch yield',s.average==null?'—':fmt(s.average,2)+'%','Each production batch counts equally'],['Positive target-equivalent gap',fmt(s.gap/1e6,2)+'m','Derived tablets below target; not measured scrap'],['Batches below review yield',fmt(below),'Analyst threshold '+fmt(threshold(),1)+'%; not release status']];
 $('kpis').innerHTML=kpis.map(([label,value,note])=>`<article class="kpi"><h3>${label}</h3><p class="value">${value}</p><p>${note}</p></article>`).join('');
 const products=group(cohort,'code').sort((a,b)=>b.gap-a.gap),top=products.slice(0,5).reduce((t,p)=>t+p.gap,0),share=s.gap?top/s.gap*100:0;
 $('insights').innerHTML=[['Concentrate the investigation',`${fmt(share,1)}% of this cohort's positive target-equivalent gap sits in its top five product codes. High volume can dominate even when yield is relatively strong.`],['Check the weighting',`${fmt(s.weighted==null?0:s.weighted-s.average,2)} percentage-point difference between volume-weighted and batch-average yield. Avoid treating small and large batches as equivalent production volume.`],['Retain unusual records',`${cohort.filter(r=>r.yield>100).length} cohort batches report yield above 100%. They are preserved and reviewable; they are not capped or silently removed.`]].map(([title,body])=>`<article class="insight"><strong>${title}</strong><p>${body}</p></article>`).join('');
 drawTrend();drawPareto(products);drawScatter();renderTable();
}
function drawTrend(){
 const months=group(cohort,'month').sort((a,b)=>a.value.localeCompare(b.value));
 if(!months.length){$('trend').innerHTML='<p class="empty">No batches in this cohort.</p>';return}
 const w=600,h=290,L=45,R=15,T=20,B=48;const low=Math.floor(Math.min(...months.map(m=>m.weighted))-0.5),high=Math.ceil(Math.max(...months.map(m=>m.weighted))+0.5);
 const x=i=>L+i*(w-L-R)/Math.max(1,months.length-1),y=v=>T+(high-v)/(high-low)*(h-T-B);
 let c='';for(let i=0;i<5;i++){let v=low+(high-low)*i/4,yp=y(v);c+=`<line class="grid" x1="${L}" x2="${w-R}" y1="${yp}" y2="${yp}"/><text class="axis" x="${L-8}" y="${yp+4}" text-anchor="end">${fmt(v,1)}</text>`}
 c+=`<path class="trend-line" d="${months.map((m,i)=>(i?'L':'M')+x(i)+','+y(m.weighted)).join(' ')}"/>`;
 months.forEach((m,i)=>{c+=`<circle cx="${x(i)}" cy="${y(m.weighted)}" r="3.2" fill="#007d73"><title>${m.value}: ${fmt(m.weighted,2)}% weighted yield, ${m.n} batches</title></circle>`;if(i===0||i===months.length-1||i%6===0)c+=`<text class="axis" x="${x(i)}" y="${h-16}" text-anchor="middle">${m.value}</text>`});
 $('trend').innerHTML=svg(c,'Monthly target-volume weighted yield for the selected cohort',w,h);
}
function drawPareto(products){const top=products.slice(0,8),max=top[0]?.gap||1;$('pareto').innerHTML=top.length?top.map(p=>`<div class="bar-row"><span>Code ${p.value}<br><small>${p.n} batches</small></span><div class="bar-track"><div class="bar" style="width:${p.gap/max*100}%"></div></div><b>${fmt(p.gap/1e6,2)}m</b></div>`).join(''):'<p class="empty">No product records.</p>'}
function drawScatter(){
 if(!cohort.length){$('scatter').innerHTML='<p class="empty">No batches in this cohort.</p>';return}
 const w=1000,h=330,L=48,R=20,T=12,B=45;const xmin=Math.floor(Math.min(...cohort.map(r=>r.yield))-1),xmax=Math.ceil(Math.max(...cohort.map(r=>r.yield))+1),ymin=Math.floor(Math.min(...cohort.map(r=>r.dissolution))-2),ymax=Math.ceil(Math.max(...cohort.map(r=>r.dissolution))+2);
 const x=v=>L+(v-xmin)/(xmax-xmin)*(w-L-R),y=v=>T+(ymax-v)/(ymax-ymin)*(h-T-B);let c='';
 for(let i=0;i<6;i++){const xv=xmin+(xmax-xmin)*i/5,yv=ymin+(ymax-ymin)*i/5;c+=`<line class="grid" x1="${x(xv)}" x2="${x(xv)}" y1="${T}" y2="${h-B}"/><text class="axis" x="${x(xv)}" y="${h-B+20}" text-anchor="middle">${fmt(xv,1)}</text><line class="grid" x1="${L}" x2="${w-R}" y1="${y(yv)}" y2="${y(yv)}"/><text class="axis" x="${L-8}" y="${y(yv)+4}" text-anchor="end">${fmt(yv,0)}</text>`}
 c+=`<text class="axis" x="${w/2}" y="${h-3}" text-anchor="middle">Final batch yield (%)</text><text class="axis" transform="translate(11 ${h/2}) rotate(-90)" text-anchor="middle">Average drug release (%)</text>`;
 cohort.forEach(r=>c+=`<circle cx="${x(r.yield)}" cy="${y(r.dissolution)}" r="3.2" fill="${colors[r.strength]}" opacity=".6"><title>Batch ${r.batch} · code ${r.code} · ${r.strength}: yield ${fmt(r.yield,3)}%, drug release ${fmt(r.dissolution,2)}%</title></circle>`);
 $('scatter').innerHTML=svg(c,'Batch yield versus average drug release, colored by strength',w,h);
}
function renderTable(){
 if(!data)return;
 const query=$('search').value.trim().toLowerCase();const batchQuery=query.match(/^(?:batch\s*)?(\d+)$/);tableRows=cohort.filter(r=>(!query||(batchQuery?String(r.batch)===batchQuery[1]:r.api_lot.toLowerCase().includes(query)))&&($('review').value!=='low'||r.yield<threshold())&&($('review').value!=='above'||r.yield>100)).sort((a,b)=>b.positive_gap-a.positive_gap||a.batch-b.batch);
 $('result-count').textContent=`${fmt(tableRows.length)} matching batches · search affects this table only`;
 $('rows').innerHTML=tableRows.slice(0,limit).map(r=>`<tr><td><button data-batch="${r.batch}" aria-label="Inspect batch ${r.batch}">${r.batch}</button></td><td>${r.code}</td><td>${r.strength}</td><td>${r.month}</td><td>${fmt(r.yield,2)}%</td><td>${fmt(r.dissolution,2)}%</td><td><span class="tag ${r.yield<threshold()||r.yield>100?'review':''}">${r.yield>100?'Above 100%':r.yield<threshold()?'Review yield':'Within review range'}</span></td></tr>`).join('')||'<tr><td colspan="7" class="empty">No batches match these filters.</td></tr>';
 $('more').hidden=limit>=tableRows.length;$('export').disabled=!cohort.length;
 if(!tableRows.some(r=>r.batch===selected))selected=tableRows[0]?.batch;detail();
}
function detail(){const r=data.batches.find(r=>r.batch===selected);if(!r){$('detail').innerHTML='<h3>Select a batch</h3><p>No matching record.</p>';return}
 const linked=data.batches.filter(x=>x.api_lot===r.api_lot).length;
 $('detail').innerHTML=`<p class="eyebrow">BATCH TRACEABILITY</p><h3>Batch ${r.batch}</h3><span class="source-pill">Code ${r.code} · ${r.strength}</span><dl><dt>Recorded production month</dt><dd>${r.month}</dd><dt>Target quantity</dt><dd>${fmt(r.size)} tablets</dd><dt>Final batch yield / compression yield</dt><dd>${fmt(r.yield,3)}% / ${fmt(r.compression_yield,3)}%</dd><dt>Derived positive target-equivalent gap</dt><dd>${fmt(r.positive_gap)} tablets</dd><dt>Average drug release / total impurities</dt><dd>${fmt(r.dissolution,2)}% / ${fmt(r.impurities,2)}%</dd></dl><h4>Incoming material lineage</h4>${[['API code:lot',r.api_lot],['SMCC lot',r.smcc_lot],['Lactose lot',r.lactose_lot],['Starch lot',r.starch_lot]].map(([k,v])=>`<div class="lot-line"><span>${k}</span><span>${v}</span></div>`).join('')}<p class="note">${linked} batches in the full source share this API code:lot key. Codes are anonymized; they do not identify a supplier.</p>`;
}
function signals(){
 $('associations').innerHTML='<div class="association head"><span>Published feature</span><span>Raw r</span><span>Within-code r</span></div>'+data.associations.map(a=>`<div class="association"><b>${a.label}<small style="display:block;color:#657479;font-weight:400">n=${a.n} within-code pairs</small></b>${[a.raw_r,a.within_product_r].map((r,i)=>`<span class="coef" style="--r:${Math.abs(r||0)};--c:${i?'#007d73':'#b9b8b0'}"><i></i>${fmt(r,3)}</span>`).join('')}</div>`).join('');
 const speed=data.associations.find(a=>a.feature==='tbl_speed_mean');$('signal-story').textContent=`The published press-speed feature has a raw yield correlation of ${fmt(speed.raw_r,3)}, but ${fmt(speed.within_product_r,3)} after centering within product code. The sign changes. An aggregate association can hide differences between product configurations; this deserves investigation, not a causal conclusion.`;
 $('quality').innerHTML=`<ul><li>${data.meta.source_records} laboratory records + ${data.meta.process_records} process records → ${data.meta.joined_records} matched batches.</li><li>${data.meta.product_codes} product codes; ${data.meta.api_lot_identifiers} API lot identifiers and ${data.meta.api_lineage_keys} distinct API code:lot keys.</li><li>${data.meta.above_100} yields above 100% retained unchanged.</li><li>All three source files verified against publisher MD5 checksums.</li></ul><details><summary>Missing source measurements</summary><ul>${Object.entries(data.meta.missing_fields).map(([k,v])=>`<li>${k}: ${v} missing</li>`).join('')}</ul></details>`;
}
function download(){const fields=['batch','code','strength','month','size','yield','compression_yield','dissolution','positive_gap','api_lot','smcc_lot','lactose_lot','starch_lot'];const escape=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const content=[fields,...cohort.map(r=>fields.map(k=>r[k]))].map(row=>row.map(escape).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='manufacturing-cohort.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function start(){try{const response=await fetch('dashboard.json');if(!response.ok)throw Error('Data file unavailable');data=await response.json();if(data.batches.length!==data.meta.joined_records)throw Error('Record count mismatch');$('strength').append(...Object.keys(colors).map(s=>option(s,s)));$('product').append(...[...new Set(data.batches.map(r=>r.code))].sort((a,b)=>a-b).map(c=>option(String(c),'Code '+c)));$('load-state').hidden=true;signals();render()}catch(e){$('load-state').textContent='The dataset could not load. Serve this folder over HTTP, or review the repository data and findings.';console.error(e)}}
['strength','product','threshold'].forEach(id=>$(id).addEventListener('change',()=>{limit=12;render()}));['search','review'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{limit=12;renderTable()}));$('reset').addEventListener('click',reset);$('more').addEventListener('click',()=>{limit+=12;renderTable()});$('export').addEventListener('click',download);$('rows').addEventListener('click',e=>{const b=e.target.closest('button[data-batch]');if(b){selected=Number(b.dataset.batch);detail()}});start();
