(function(root){
  'use strict';
  const algorithms={
    greedy:{name:'Greedy allocation',purpose:'Accept whole loads in priority order',source:'static/local-engine.js',function:'LocalGrid.execute → greedy branch; merge',time:'O(n log n) without trace; O(n²) worst-case with trace',space:'O(n) without trace; O(n²) retained trace IDs',assumptions:'Includes manual benefit sorting; priority ties use ascending ID. Not a globally optimal allocator.'},
    knapsack:{name:'0/1 Knapsack',purpose:'Maximize total priority benefit under capacity',source:'static/local-engine.js',function:'LocalGrid.execute → knapsack branch',time:'O(n(C+1))',space:'O((n+1)(C+1)) DP cells + O(n) output/trace',assumptions:'Integer capacity C; indivisible loads; full Uint32 DP matrix. Raw cells are an estimate, not measured memory.'},
    merge:{name:'Merge Sort',purpose:'Rank areas by ascending demand and ID',source:'static/local-engine.js',function:'LocalGrid.execute → merge → visit',time:'O(n log n)',space:'O(n) workspace; O(n log n) IDs with trace',assumptions:'Comparison model; recursive splitting and merging; equal demands use ascending ID.'},
    binary:{name:'Binary Search',purpose:'Find an area by ID',source:'static/local-engine.js',function:'LocalGrid.execute → binary branch',time:'O(log n) core; O(n log n) including ID preparation',space:'O(1) core; O(n) prepared copy; O(log n) trace',assumptions:'Fresh manual ID sort before each lookup. Core timer excludes this preparation.'}
  };
  const benefits={Critical:100,High:70,Medium:40,Low:20};
  function stats(values){
    if(!values.length)return null;
    if(values.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid timing sample.');
    const sorted=[...values].sort((a,b)=>a-b),n=sorted.length,m=Math.floor(n/2);
    return {runs:n,min:sorted[0],average:values.reduce((s,v)=>s+v,0)/n,median:n%2?sorted[m]:(sorted[m-1]+sorted[m])/2,max:sorted[n-1],p95:sorted[Math.ceil(n*.95)-1]};
  }
  function representativeCases(seed=42){
    let state=seed>>>0;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const cases=[{id:'empty',label:'Empty grid',records:[],capacity:0,target:1}];
    for(const [n,capacity] of [[8,250],[32,250],[64,250],[100,250],[100,1000],[100,5000]]){
      const records=Array.from({length:n},(_,i)=>({id:i+1,name:`Generated area ${i+1}`,demand:1+Math.floor(random()*80),priority:Object.keys(benefits)[Math.floor(random()*4)],type:'Residential',status:'Pending'}));
      for(let i=n-1;i>0;i--){const j=Math.floor(random()*(i+1));[records[i],records[j]]=[records[j],records[i]];}
      cases.push({id:`n${n}-c${capacity}`,label:`Generated n=${n}, C=${capacity}`,records,capacity,target:Math.ceil(n/2)});
    }
    cases.push({id:'oversized-miss',label:'Oversized loads / missing ID',capacity:10,target:99,records:[{id:1,name:'Hospital',demand:20,priority:'Critical',type:'Hospital'},{id:2,name:'Homes',demand:10,priority:'High',type:'Residential'}]});
    return cases;
  }
  function checkInput(c){
    if(!Array.isArray(c.records)||c.records.length>100||!Number.isInteger(c.capacity)||c.capacity<0||c.capacity>5000)throw Error('Benchmarks support up to 100 areas and capacity 0–5,000.');
    if(!Number.isSafeInteger(c.target)||c.target<1)throw Error('Search ID must be a positive safe integer.');
    const ids=new Set();for(const a of c.records){if(!Number.isSafeInteger(a.id)||a.id<1||ids.has(a.id)||!Number.isSafeInteger(a.demand)||a.demand<1||!Object.hasOwn(benefits,a.priority))throw Error('Invalid or duplicate area record.');ids.add(a.id);}
  }
  function quality(name,r,c){
    const fail=()=>{throw Error('Output validation failed.');};
    if(name==='greedy'||name==='knapsack'){
      const byId=new Map(c.records.map(a=>[a.id,a])),seen=new Set();let demand=0,value=0;
      for(const a of r.selected){const input=byId.get(a.id);if(!input||seen.has(a.id)||a.demand!==input.demand||a.priority!==input.priority)fail();seen.add(a.id);demand+=a.demand;value+=benefits[a.priority];}
      if(demand>c.capacity||r.allocated!==demand||r.benefit!==value||r.remaining!==c.capacity-demand||r.rejected.length+seen.size!==c.records.length)fail();
      const rejected=new Set(r.rejected.map(a=>a.id));if(rejected.size!==r.rejected.length||c.records.some(a=>seen.has(a.id)===rejected.has(a.id)))fail();
      return {verified:true,description:`Feasible; benefit ${value}; ${demand}/${c.capacity} kW; ${seen.size}/${c.records.length} areas`,benefit:value,allocated:demand,selected:seen.size,utilization:r.utilization,optimality:name==='knapsack'?'DP optimum for the stated model; independent oracle tests cover small cases':'Priority heuristic; optimality not guaranteed'};
    }
    if(name==='merge'){
      const expected=[...c.records].sort((a,b)=>a.demand-b.demand||a.id-b.id);
      if(r.records.length!==expected.length||r.records.some((a,i)=>a.id!==expected[i].id))fail();
      return {verified:true,description:`${expected.length} records match independent demand/ID order`,accuracy:'Exact order checked against numeric comparator'};
    }
    const expected=c.records.find(a=>a.id===c.target)||null;if((r.found?.id??null)!==(expected?.id??null))fail();
    return {verified:true,description:`ID ${c.target}: ${expected?'found, matches linear lookup':'absent, matches linear lookup'}`,accuracy:'Exact hit/miss checked against linear scan'};
  }
  function options(input={}){
    const o={runs:21,warmups:5,trace:false,seed:42,...input};
    if(!Number.isInteger(o.runs)||o.runs<3||o.runs>101||!Number.isInteger(o.warmups)||o.warmups<0||o.warmups>20||typeof o.trace!=='boolean'||!Number.isInteger(o.seed)||o.seed<0||o.seed>1000000)throw Error('Use 3–101 runs, 0–20 warmups and seed 0–1,000,000.');
    return o;
  }
  async function run({engine,cases,settings={},environment={},onProgress=()=>{},signal,clock=()=>performance.now(),yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0))}){
    const config=options(settings);if(!engine?.execute)throw Error('Algorithm engine is unavailable.');
    if(!Array.isArray(cases)||!cases.length||cases.length>12)throw Error('Choose 1–12 benchmark cases.');
    // Freeze a detached snapshot: edits during a run cannot change benchmark inputs.
    const inputs=JSON.parse(JSON.stringify(cases));inputs.forEach(checkInput);
    const started_at=new Date().toISOString(),start=clock(),rows=[];
    const cancelled=()=>{if(signal?.aborted){const e=Error('Benchmark cancelled. Previous report is retained.');e.name='AbortError';throw e;}};
    const count=inputs.length*4;let done=0;
    for(const c of inputs)for(const [algorithm,metadata] of Object.entries(algorithms)){
      cancelled();onProgress({done,total:count,label:`${c.label} / ${metadata.name}`});await yieldTask();cancelled();
      const samples=[],errors=[];let output=null,operations=null;
      try{
        for(let i=0;i<config.warmups;i++){cancelled();engine.execute(algorithm,c.records,c.capacity,c.target,false,config.trace);if(i%5===4)await yieldTask();}
        for(let i=0;i<config.runs;i++){
          cancelled();const t=clock(),r=engine.execute(algorithm,c.records,c.capacity,c.target,false,config.trace),elapsed=clock()-t;
          const core=r.time_ms,preparation=r.preparation_ms||0;
          if(![core,preparation,elapsed].every(v=>Number.isFinite(v)&&v>=0))throw Error('Engine returned an invalid timing.');
          // Validation is deliberately outside the measured core/complete-call intervals.
          output=quality(algorithm,r,c);operations=r.operations;
          samples.push({core_ms:core,preparation_ms:preparation,compute_call_ms:elapsed});
          if(i%5===4)await yieldTask();
        }
      }catch(e){if(e.name==='AbortError')throw e;errors.push(String(e.message||e));}
      const timings=Object.fromEntries(['core_ms','preparation_ms','compute_call_ms'].map(key=>[key,stats(samples.map(s=>s[key]))]));
      rows.push({algorithm,...metadata,case_id:c.id,case_label:c.label,n:c.records.length,capacity:c.capacity,target:c.target,descending:false,trace:config.trace,requested_runs:config.runs,warmups:config.warmups,completed_runs:samples.length,operations,timings,output,errors,samples});
      onProgress({done:++done,total:count,label:`${c.label} / ${metadata.name}`});
    }
    for(const c of inputs){const same=rows.filter(r=>r.case_id===c.id),g=same.find(r=>r.algorithm==='greedy'),k=same.find(r=>r.algorithm==='knapsack');if(g?.output&&k?.output){g.output.benefit_gap_to_knapsack=k.output.benefit-g.output.benefit;k.output.benefit_gain_over_greedy=k.output.benefit-g.output.benefit;}}
    return {schema_version:1,started_at,collected_at:new Date().toISOString(),environment:{timer:'performance.now()',...environment},settings:config,inputs,rows,report_wall_ms:clock()-start,
      methodology:{core:'Production execute() timer; includes trace collection when enabled and Greedy sorting; excludes Binary Search ID preparation.',preparation:'Fresh Binary Search ID Merge Sort, timed separately.',compute_call:'External timer around execute(); includes preparation and dispatch, excludes validation, storage, rendering and export.',wall:'Complete benchmark batch including warmups, validation, progress callbacks and event-loop yields; excludes report rendering/export.',p95:'Nearest rank: sorted sample ceil(0.95 × runs); median averages the middle pair for even counts.'},
      limitations:['Different algorithms solve different tasks; timings do not form a universal ranking.','No database/network/file access occurs inside timed calls. Browser UI latency and storage latency are not measured.','Warmups reduce but do not remove JIT, GC, CPU contention, timer quantization or background-tab effects.','Memory complexity is theoretical; no heap or process-memory measurement was taken.','Feasibility checks are not real-grid validation; no prediction accuracy applies.','Sequential trace-mode batches do not establish causal timing ratios.']};
  }
  function csv(report){
    const rows=[['Collected UTC',report.collected_at],['Environment',JSON.stringify(report.environment)],['Settings',JSON.stringify(report.settings)],['Batch wall ms',report.report_wall_ms],['Methodology',JSON.stringify(report.methodology)],[],['Algorithm','Purpose','Source','Function','Dataset','n','Capacity','Target','Trace','Warmups','Requested runs','Completed runs','Timing scope','Min ms','Average ms','Median ms','Max ms','P95 ms','Time complexity','Space complexity','Assumptions','Output quality','Errors']];
    for(const r of report.rows)for(const scope of ['core_ms','preparation_ms','compute_call_ms']){const s=r.timings[scope];rows.push([r.name,r.purpose,r.source,r.function,r.case_label,r.n,r.capacity,r.target,r.trace,r.warmups,r.requested_runs,r.completed_runs,scope,s?.min??'',s?.average??'',s?.median??'',s?.max??'',s?.p95??'',r.time,r.space,r.assumptions,JSON.stringify(r.output),r.errors.join('; ')]);}
    return '\ufeff'+rows.map(row=>row.map(value=>{let s=String(value);if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
  }
  const api={algorithms,stats,representativeCases,quality,run,csv};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AlgorithmBenchmark=api;
})(globalThis);
