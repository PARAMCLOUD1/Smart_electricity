'use strict';
// Database-free simulation engine. Kept independent of the DOM for verification.
const LocalGrid = (() => {
  const benefits={Critical:100,High:70,Medium:40,Low:20};
  const key='volt-grid-static-v1';
  const copy=x=>JSON.parse(JSON.stringify(x));
  const sample=[['City Hospital',120,'Critical','Hospital'],['Residential Area A',200,'High','Residential'],['Industrial Zone',300,'Medium','Industrial'],['Government School',80,'High','Educational'],['Shopping Complex',150,'Low','Commercial'],['Residential Area B',180,'Medium','Residential']];
  let data={capacity:600,nextId:7,nextReport:1,areas:sample.map(([name,demand,priority,type],i)=>({id:i+1,name,demand,priority,type})),reports:[],allocation:null};
  try { const saved=JSON.parse(localStorage.getItem(key)); if(saved && Array.isArray(saved.areas) && Array.isArray(saved.reports) && Number.isInteger(saved.capacity))data=saved; } catch {}
  function save(){try{localStorage.setItem(key,JSON.stringify(data));}catch{throw Error('Browser storage is unavailable or full. This change remains in memory; export reports before closing.');}}
  function integer(n,min,max){if(!Number.isInteger(n)||n<min||n>max)throw Error(`Enter an integer from ${min} to ${max}.`);return n;}
  function merge(items,key='demand',descending=false,trace=true){
    const steps=[];let comparisons=0,merges=0;
    function visit(a,depth=0){if(a.length<2)return a.slice();const mid=Math.floor(a.length/2);if(trace)steps.push({kind:'split',ids:a.map(x=>x.id),left:a.slice(0,mid).map(x=>x.id),right:a.slice(mid).map(x=>x.id),depth});const l=visit(a.slice(0,mid),depth+1),r=visit(a.slice(mid),depth+1),out=[];let i=0,j=0;while(i<l.length&&j<r.length){comparisons++;const before=l[i][key]===r[j][key]?l[i].id<=r[j].id:descending?l[i][key]>r[j][key]:l[i][key]<r[j][key];out.push(before?l[i++]:r[j++]);}out.push(...l.slice(i),...r.slice(j));merges++;if(trace)steps.push({kind:'merge',ids:out.map(x=>x.id),depth});return out;}
    return {records:visit(items),original:items.map(x=>x.id),steps,operations:comparisons,comparisons,merges};
  }
  function execute(name,records,capacity,target=1,descending=false,trace=true){
    let preparation_ns=0,preparation_ms=0,sorted;
    if(name==='binary'){const t=performance.now();sorted=merge(records,'id',false,false).records;preparation_ms=performance.now()-t;preparation_ns=Math.round(preparation_ms*1e6);}
    const start=performance.now();let result;
    if(name==='merge')result=merge(records,'demand',descending,trace);
    else if(name==='binary'){
      let low=0,high=sorted.length-1,found=null,operations=0;const steps=[];
      while(low<=high){const mid=Math.floor((low+high)/2),a=sorted[mid],relation=a.id===target?'equal':a.id<target?'lower':'higher';operations++;if(trace)steps.push({kind:'inspect',low,high,mid,id:a.id,relation});if(relation==='equal'){found=a;break;}if(relation==='lower')low=mid+1;else high=mid-1;}
      result={found,steps,operations,comparisons:operations,iterations:operations,target,records:sorted,preparation_ns};
    }else if(name==='greedy'||name==='knapsack'){
      let selected=[],remaining=capacity,operations=0;const steps=[];let extra={};
      if(name==='greedy'){
        const order=merge(records.map(a=>({...a,benefit:benefits[a.priority]})),'benefit',true,false);
        for(const a of order.records){const take=a.demand<=remaining;if(take){selected.push(a);remaining-=a.demand;}operations++;if(trace)steps.push({kind:take?'accept':'reject',id:a.id,remaining,selected:selected.map(x=>x.id)});}
        extra={decisions:operations,sort_comparisons:order.comparisons};
      }else{
        const dp=Array.from({length:records.length+1},()=>new Uint32Array(capacity+1));
        records.forEach((a,index)=>{const i=index+1;let updates=0;for(let c=0;c<=capacity;c++){operations++;dp[i][c]=dp[i-1][c];if(a.demand<=c&&dp[i-1][c-a.demand]+benefits[a.priority]>dp[i][c]){dp[i][c]=dp[i-1][c-a.demand]+benefits[a.priority];updates++;}}if(trace)steps.push({kind:'dp-row',id:a.id,row:i,updates,best_benefit:dp[i][capacity],states:i*(capacity+1)});});
        for(let i=records.length;i>0;i--){const take=dp[i][remaining]!==dp[i-1][remaining];if(take){selected.push(records[i-1]);remaining-=records[i-1].demand;}if(trace)steps.push({kind:'traceback',id:records[i-1].id,take,remaining});}selected.reverse();
        extra={dp_states:operations,table:trace&&records.length<=10&&capacity<=30?dp.map(a=>Array.from(a)):null,table_note:'Full table shown only for up to 10 areas and 30 kW. Each column is 1 kW.'};
      }
      const ids=new Set(selected.map(a=>a.id)),allocated=capacity-remaining;
      result={selected,rejected:records.filter(a=>!ids.has(a.id)),allocated,remaining,benefit:selected.reduce((s,a)=>s+benefits[a.priority],0),utilization:capacity?allocated/capacity*100:0,steps,operations,...extra};
    }else throw Error('Unknown algorithm.');
    result.time_ms=Math.max(0,performance.now()-start);result.preparation_ms=preparation_ms;
    result.time_ns=Math.round(result.time_ms*1e6);return result;
  }
  function snapshot(){const selected=new Set(data.allocation?.result.selected.map(a=>a.id)||[]);const areas=data.areas.map(a=>({...a,status:data.allocation?(selected.has(a.id)?'Supplied':'Unsupplied'):'Pending'}));const used=data.allocation?.result.allocated||0,supplied=selected.size;return {areas,capacity:data.capacity,allocation:copy(data.allocation),stats:{demand:areas.reduce((s,a)=>s+a.demand,0),allocated:used,remaining:data.capacity-used,total:areas.length,supplied,unsupplied:data.allocation?areas.length-supplied:0,pending:data.allocation?0:areas.length,utilization:data.capacity?used/data.capacity*100:0}};}
  async function request(path,method='GET',body={}){
    const s=snapshot(),records=s.areas,capacity=s.capacity;
    if(path==='/api/state')return s;
    if(path==='/api/reports')return {reports:copy(data.reports).reverse()};
    if(path==='/api/capacity'){data.capacity=integer(body.capacity,0,5000);data.allocation=null;save();return {ok:true};}
    if(path.startsWith('/api/areas')){
      const id=Number(path.split('/')[3]);const index=data.areas.findIndex(a=>a.id===id);
      if(method==='DELETE'){if(index<0)throw Error('Area not found.');data.areas.splice(index,1);}
      else{
        const name=String(body.name||'').trim();if(!name||name.length>70)throw Error('Area name must contain 1–70 characters.');
        if(data.areas.some(a=>a.id!==id&&a.name.toLowerCase()===name.toLowerCase()))throw Error('An area with this name already exists.');
        if(!Object.hasOwn(benefits,body.priority)||!['Hospital','Residential','Industrial','Commercial','Educational'].includes(body.type))throw Error('Choose a valid priority and area type.');
        const area={name,demand:integer(body.demand,1,1000000),priority:body.priority,type:body.type};
        if(method==='POST'){if(data.areas.length>=100)throw Error('Maximum 100 areas.');data.areas.push({...area,id:data.nextId++});}
        else {if(index<0)throw Error('Area not found.');data.areas[index]={...area,id};}
      }data.allocation=null;save();return {ok:true};
    }
    if(path.startsWith('/api/run/')){
      const name=path.split('/').pop(),result=execute(name,records,capacity,body.target,body.descending);let report_id=null;
      if(['greedy','knapsack'].includes(name)){report_id=data.nextReport++;const report={id:report_id,algorithm:name,created_at:new Date().toISOString(),capacity,demand:s.stats.demand,areas:copy(records),result:copy(result)};data.allocation=report;data.reports.push(report);data.reports=data.reports.slice(-100);save();}return {result,input:records,capacity,report_id};
    }
    if(path==='/api/compare'){const algorithms=body.algorithms;if(!Array.isArray(algorithms)||algorithms.length<2||algorithms.length>4||new Set(algorithms).size!==algorithms.length)throw Error('Select 2–4 distinct algorithms.');return {input:records,capacity,target:body.target,descending:body.descending,created_at:new Date().toISOString(),...Object.fromEntries(algorithms.map(n=>[n,execute(n,records,capacity,body.target,body.descending)]))};}
    if(path==='/api/benchmark'){
      const repeats=integer(body.repeats,3,15),seed=integer(body.seed,0,1000000);let rng=seed;
      const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
      const median=a=>a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
      const bench=(items,cap,dataset)=>Object.keys({greedy:0,knapsack:0,merge:0,binary:0}).map(algorithm=>{const runs=Array.from({length:repeats},()=>execute(algorithm,items,cap,items[Math.floor(items.length/2)]?.id||1,false,false));return {algorithm,size:items.length,capacity:cap,dataset,median_ns:median(runs.map(r=>r.time_ns)),samples_ns:runs.map(r=>r.time_ns),operations:runs[0].operations,preparation_median_ns:median(runs.map(r=>r.preparation_ns||0))};});
      const current=bench(records,capacity,'Current snapshot'),generated=[];
      for(const size of [8,16,32,64]){await new Promise(resolve=>setTimeout(resolve,0));const items=Array.from({length:size},(_,i)=>({id:i+1,name:`Benchmark ${i+1}`,demand:1+Math.floor(random()*80),priority:Object.keys(benefits)[Math.floor(random()*4)],type:'Residential',status:'Pending'}));generated.push(...bench(items,250,'Generated'));}
      return {current,generated,repeats,seed,note:'Median browser compute time using performance.now(); clock precision varies. Generated capacity is 250 kW. Benchmark data is not saved.'};
    }
    throw Error('Unknown local operation.');
  }
  function csv(id){const r=data.reports.find(r=>r.id===id);if(!r)throw Error('Report not found.');const ids=new Set(r.result.selected.map(a=>a.id));const rows=[['Algorithm',r.algorithm],['Created',r.created_at],['Capacity kW',r.capacity],['Allocated kW',r.result.allocated],['Benefit',r.result.benefit],['Browser compute time ns (estimated)',r.result.time_ns],[],['ID','Name','Demand kW','Priority','Type','Status'],...r.areas.map(a=>[a.id,a.name,a.demand,a.priority,a.type,ids.has(a.id)?'Supplied':'Unsupplied'])];return '\ufeff'+rows.map(row=>row.map(value=>{let s=String(value);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
  return {request,execute,csv};
})();
if(typeof module!=='undefined')module.exports=LocalGrid;
