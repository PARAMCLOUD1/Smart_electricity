'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  const section=document.createElement('section');section.id='algorithm-report';section.className='page';section.hidden=true;
  section.innerHTML=`<article class="panel"><div class="panel-title"><div><div class="eyebrow">MEASURE. UNDERSTAND. IMPROVE.</div><h2>Algorithm performance report</h2><p>Run repeated measurements on an isolated input snapshot. Your saved allocations and records stay intact.</p></div><span class="badge">ON-DEMAND ONLY</span></div>
  <form id="algorithm-report-form" class="report-controls"><label>Inputs<select id="algorithm-report-input"><option value="both">Current grid + representative cases</option><option value="current">Current grid only</option><option value="representative">Representative cases only</option></select></label><label>Measured runs<input id="algorithm-report-runs" type="number" min="3" max="101" step="1" value="21" required></label><label>Warmups<input id="algorithm-report-warmups" type="number" min="0" max="20" step="1" value="5" required></label><label>Seed<input id="algorithm-report-seed" type="number" min="0" max="1000000" step="1" value="42" required></label><label>Trace collection<select id="algorithm-report-trace"><option value="off">Off — benchmark core</option><option value="on">On — include replay recording</option></select></label><div class="report-buttons"><button class="primary" id="algorithm-report-run">Run benchmarks</button><button type="button" id="algorithm-report-cancel" hidden>Cancel</button></div></form>
  <p class="report-method-note">Core time uses <code>performance.now()</code> in milliseconds. Binary Search preparation is separate. Complete compute-call time includes preparation; no database, network, file, storage or rendering work is timed. The batch duration also includes warmups, verification and UI yields. No benchmarks run automatically.</p>
  <div id="algorithm-report-status" role="status" aria-live="polite">No results yet. Choose inputs and run benchmarks.</div><progress id="algorithm-report-progress" max="100" value="0" hidden aria-label="Benchmark progress"></progress><p id="algorithm-report-error" role="alert" hidden></p></article>
  <div id="algorithm-report-results" hidden><article class="panel"><div class="panel-title"><div><h2>Measurement snapshot</h2><p id="algorithm-report-collected"></p></div><div class="report-buttons"><button id="algorithm-report-csv" type="button">Export CSV</button><button id="algorithm-report-json" type="button">Export JSON + raw samples</button></div></div><div id="algorithm-report-environment"></div><details><summary>Timing scopes, environment and limitations</summary><div id="algorithm-report-methodology"></div></details></article>
  <article class="panel"><div class="panel-title"><div><h2>Runtime comparison</h2><p>Median and 95th percentile for one input case. These algorithms perform different tasks.</p></div><div class="report-controls"><label>Dataset<select id="algorithm-report-case"></select></label><label>Timing scope<select id="algorithm-report-scope"><option value="core_ms">Core execution</option><option value="compute_call_ms">Complete compute call</option><option value="preparation_ms">ID-sort preparation</option></select></label></div></div><div class="report-runtime-chart"><canvas id="algorithm-report-chart" role="img" aria-label="Median and 95th percentile algorithm runtime comparison"></canvas></div><p id="algorithm-report-chart-note"></p></article>
  <article class="panel"><h2>All measured results <small>milliseconds · selected timing scope</small></h2><div id="algorithm-report-table"></div></article><article class="panel"><h2>What the measurements tell us</h2><div id="algorithm-report-findings"></div></article><article class="panel"><h2>Algorithms and assumptions</h2><div id="algorithm-report-inventory"></div><p>Supporting procedures include linear lookups, demand aggregation, Set membership, seeded benchmark generation, statistical sorting and snapshot serialization. No prediction model or electricity time-slot scheduler is implemented. The older desktop and browser apps use an essential-first Greedy → optional Knapsack hybrid; this app runs them independently.</p></article></div>`;
  document.querySelector('main footer').before(section);
  const nav=document.createElement('a');nav.href='#algorithm-report';nav.innerHTML='<span class="nav-glyph">↗</span><span class="nav-label">Algorithm Report</span>';
  document.querySelector('#nav a[href="#reports"]').before(nav);
  const el=id=>document.getElementById('algorithm-report-'+id),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format=value=>Number.isFinite(value)?value.toFixed(6):'—';
  let report=null,chart=null,controller=null;
  const scopeName={core_ms:'Core execution',preparation_ms:'ID preparation',compute_call_ms:'Complete compute call'};
  function drawChart(){
    if(!report)return;
    const scope=el('scope').value,rows=report.rows.filter(r=>r.case_id===el('case').value);
    if(chart){chart.destroy();chart=null;}
    el('chart-note').textContent=scope==='preparation_ms'?'Only Binary Search prepares an ID-sorted copy. Zero for other tasks means not applicable.':'Times exclude rendering and I/O. P95 uses nearest-rank selection; it is not a confidence interval.';
    if(typeof Chart==='undefined'){el('chart-note').textContent='Chart.js is unavailable. All measurements remain available in the table and exports.';return;}
    try{
      const style=getComputedStyle(document.documentElement),color=n=>style.getPropertyValue(n).trim();
      chart=new Chart(el('chart'),{
        type:'bar',
        data:{labels:rows.map(r=>r.name),datasets:[
          {label:'Median (ms)',data:rows.map(r=>r.timings[scope]?.median??null),backgroundColor:color('--chart-ink'),borderRadius:4},
          {label:'95th percentile (ms)',data:rows.map(r=>r.timings[scope]?.p95??null),backgroundColor:color('--chart-second'),borderRadius:4}
        ]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{labels:{color:color('--chart-text')}}},
          scales:{
            x:{ticks:{color:color('--chart-text')},grid:{color:color('--chart-grid')}},
            y:{beginAtZero:true,title:{display:true,text:scopeName[scope]+' (ms)',color:color('--chart-text')},ticks:{color:color('--chart-text')},grid:{color:color('--chart-grid')}}
          }
        }
      });
    }catch(error){el('chart-note').textContent='Chart could not render: '+error.message+'. Table and exports are available.';}
  }
  function drawTable(){
    const scope=el('scope').value;
    const headings=['Algorithm / purpose','Source / function','Input / parameters','Completed / requested runs','Warmups','Min ms','Average ms','Median ms','Max ms','P95 ms','Time complexity','Space complexity','Output checks','Errors'];
    el('table').innerHTML=`<p>${esc(scopeName[scope])}. Trace collection: ${report.settings.trace?'on':'off'}. Inputs are snapshots collected for this run.</p><div class="table-wrap"><table><thead><tr>${headings.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${report.rows.map(r=>{const s=r.timings[scope];return `<tr><td><b>${esc(r.name)}</b><small>${esc(r.purpose)}</small></td><td><code>${esc(r.source)}</code><small>${esc(r.function)}</small></td><td>${esc(r.case_label)}<small>n=${r.n}; C=${r.capacity}; target=${r.target}; demand ascending; trace=${r.trace}</small></td><td>${r.completed_runs} / ${r.requested_runs}</td><td>${r.warmups}</td>${['min','average','median','max','p95'].map(k=>`<td class="time">${format(s?.[k])}</td>`).join('')}<td>${esc(r.time)}</td><td>${esc(r.space)}</td><td>${esc(r.output?.description||'Not verified')}<small>${esc(r.output?.optimality||r.output?.accuracy||'')}${r.output?.benefit_gap_to_knapsack!==undefined?'; benefit gap to Knapsack: '+r.output.benefit_gap_to_knapsack:''}</small></td><td>${esc(r.errors.join('; ')||'None')}</td></tr>`;}).join('')}</tbody></table></div>`;
  }
  function drawFindings(){
    const good=report.rows.filter(r=>r.timings.core_ms&&!r.errors.length),slow=[...good].sort((a,b)=>b.timings.core_ms.median-a.timings.core_ms.median)[0];
    const same=report.rows.filter(r=>r.case_id===el('case').value),greedy=same.find(r=>r.algorithm==='greedy'),knapsack=same.find(r=>r.algorithm==='knapsack'),binary=same.find(r=>r.algorithm==='binary');
    const text=[];
    if(slow)text.push(`The largest measured core median in this report is ${slow.name} on ${slow.case_label}: ${format(slow.timings.core_ms.median)} ms. This describes the sampled tasks and inputs, not an overall ranking of algorithms.`);
    text.push('Knapsack visits n × (C + 1) states and stores a full DP matrix. Increasing capacity or the number of areas increases its work. A rolling-score representation with a carefully verified selection reconstruction could reduce storage; no memory use was measured here.');
    const knapsacks=good.filter(r=>r.algorithm==='knapsack'&&r.n===100).sort((a,b)=>a.capacity-b.capacity);
    if(knapsacks.length>1){const a=knapsacks[0],b=knapsacks[knapsacks.length-1];text.push(`At n=100, C=${a.capacity} visited ${a.operations} states with median ${format(a.timings.core_ms.median)} ms; C=${b.capacity} visited ${b.operations} states with median ${format(b.timings.core_ms.median)} ms. These generated records differ, so treat the timing change as descriptive; state counts directly show capacity scaling.`);}
    if(binary?.timings.core_ms)text.push(`For the selected case, Binary Search core median is ${format(binary.timings.core_ms.median)} ms; ID preparation median is ${format(binary.timings.preparation_ms.median)} ms. Reusing a valid ID-sorted index could avoid preparation for repeated lookups. Medians of parts need not sum to the complete-call median.`);
    if(greedy?.output&&knapsack?.output)text.push(`For this case, Greedy benefit is ${greedy.output.benefit}; Knapsack benefit is ${knapsack.output.benefit}, a gap of ${greedy.output.benefit_gap_to_knapsack}. Both are capacity-feasible. Higher benefit does not imply higher utilization; Greedy is a heuristic and Knapsack optimizes the stated benefit model.`);
    text.push(report.settings.trace?'Trace collection is included. Greedy copies its accepted-ID list at each step, giving quadratic worst-case trace work. Delta traces could reduce this cost; compare a separately run trace-off report before attributing a measured difference to it.':'Trace collection is disabled. Normal execution labs record traces, so their runtimes can differ. Greedy trace copying can be quadratic; Merge Sort retains split/merge ID arrays.');
    text.push('Sorting produces an order; searching finds one ID; allocation selects loads. Compare Greedy and Knapsack only with the same inputs and their output benefit, not time alone. No prediction accuracy is applicable. Check min/max and P95 for runtime variability; warmups cannot eliminate clock quantization, garbage collection or CPU contention.');
    el('findings').innerHTML=text.map(t=>`<p>${esc(t)}</p>`).join('');
  }
  function display(){
    el('results').hidden=false;
    el('collected').textContent=`Collected ${new Date(report.collected_at).toLocaleString()} (${report.collected_at}). ${report.settings.runs} measured runs, ${report.settings.warmups} warmups per task. This snapshot does not update when records change.`;
    el('environment').innerHTML=`<p>High-resolution timer: ${esc(report.environment.timer)}. Runtime: ${esc(report.environment.runtime)}. Batch wall time: <strong>${format(report.report_wall_ms)} ms</strong>. Input snapshot preparation: ${format(report.snapshot_ms)} ms. Memory figures below are theoretical complexity only.</p>`;
    el('methodology').innerHTML=`<pre>${esc(JSON.stringify({environment:report.environment,methodology:report.methodology},null,2))}</pre><ul>${report.limitations.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
    el('case').innerHTML=report.inputs.map(c=>`<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('');
    el('inventory').innerHTML=Object.values(AlgorithmBenchmark.algorithms).map(a=>`<details><summary>${esc(a.name)} — ${esc(a.purpose)}</summary><p><code>${esc(a.source)} / ${esc(a.function)}</code></p><p>Time: ${esc(a.time)}. Space: ${esc(a.space)}.</p><p>${esc(a.assumptions)}</p></details>`).join('');
    drawTable();drawChart();drawFindings();
  }
  function busy(value){
    el('form').querySelectorAll('input,select,button').forEach(control=>control.disabled=value);
    el('cancel').disabled=false;el('cancel').hidden=!value;el('progress').hidden=!value;section.setAttribute('aria-busy',String(value));
    el('csv').disabled=value;el('json').disabled=value;
  }
  el('form').addEventListener('submit',async event=>{
    event.preventDefault();if(controller)return;
    controller=new AbortController();busy(true);el('error').hidden=true;el('progress').value=0;el('status').textContent='Preparing an isolated input snapshot…';
    let background=document.visibilityState==='hidden';const visibility=()=>{if(document.visibilityState==='hidden')background=true;};document.addEventListener('visibilitychange',visibility);
    try{
      const t=performance.now(),snapshot=await LocalGrid.request('/api/state'),snapshot_ms=performance.now()-t;
      const settings={runs:Number(el('runs').value),warmups:Number(el('warmups').value),seed:Number(el('seed').value),trace:el('trace').value==='on'};
      const choice=el('input').value,cases=[];
      if(choice!=='representative')cases.push({id:'current',label:'Current grid snapshot',records:snapshot.areas,capacity:snapshot.capacity,target:snapshot.areas[Math.floor(snapshot.areas.length/2)]?.id||1});
      if(choice!=='current')cases.push(...AlgorithmBenchmark.representativeCases(settings.seed));
      const next=await AlgorithmBenchmark.run({engine:LocalGrid,cases,settings,signal:controller.signal,environment:{runtime:navigator.userAgent,platform:navigator.platform,logical_processors:navigator.hardwareConcurrency??null,language:navigator.language,time_origin:performance.timeOrigin,cross_origin_isolated:globalThis.crossOriginIsolated===true},onProgress:p=>{el('status').textContent=`Benchmarking ${p.done}/${p.total}: ${p.label}`;el('progress').value=p.done/p.total*100;}});
      next.snapshot_ms=snapshot_ms;next.environment.background_tab_observed=background;if(background)next.limitations.push('The page was hidden during this run; background throttling may affect these results.');
      report=next;display();const errors=report.rows.filter(r=>r.errors.length).length;el('status').textContent=`Collected ${report.rows.length} task results. ${errors?errors+' task(s) reported errors; see the table.':'All output checks passed.'}`;
    }catch(error){el('error').textContent=error.message+(report?' Previous results remain visible.':' No report was collected.');el('error').hidden=false;el('status').textContent=error.name==='AbortError'?'Benchmark cancelled.':'Benchmark failed. You can adjust the inputs and retry.';}
    finally{document.removeEventListener('visibilitychange',visibility);controller=null;busy(false);}
  });
  el('cancel').addEventListener('click',()=>controller?.abort());
  el('scope').addEventListener('change',()=>{if(report){drawTable();drawChart();}});
  el('case').addEventListener('change',()=>{if(report){drawChart();drawFindings();}});
  function download(extension,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=`algorithm-report-${report.collected_at.replace(/[:.]/g,'-')}.${extension}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportReport(type){if(!report)return;try{if(type==='csv')download('csv',AlgorithmBenchmark.csv(report),'text/csv;charset=utf-8');else download('json',JSON.stringify(report,null,2),'application/json');}catch(error){el('error').hidden=false;el('error').textContent='Export failed: '+error.message;}}
  el('csv').addEventListener('click',()=>exportReport('csv'));el('json').addEventListener('click',()=>exportReport('json'));
  window.addEventListener('themechange',()=>{if(report)drawChart();});
  function reportRoute(){if(location.hash==='#algorithm-report'){document.getElementById('page-label').textContent='Algorithm Report';document.getElementById('page-description').textContent='Measure real execution. Compare inputs, timing scopes and output quality.';if(chart)requestAnimationFrame(()=>chart?.resize());}}
  window.addEventListener('hashchange',reportRoute);
  route();reportRoute();
});
