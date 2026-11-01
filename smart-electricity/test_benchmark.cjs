const test=require('node:test'),assert=require('node:assert/strict');
const benchmark=require('./static/algorithm-benchmark.js'),engine=require('./static/local-engine.js');
const immediate=async()=>{};
test('statistics use averaged even median and nearest-rank p95; invalid samples rejected',()=>{
 const s=benchmark.stats([4,1,3,2]);assert.deepEqual(s,{runs:4,min:1,average:2.5,median:2.5,max:4,p95:4});
 assert.equal(benchmark.stats(Array.from({length:100},(_,i)=>i+1)).p95,95);assert.equal(benchmark.stats([]),null);assert.throws(()=>benchmark.stats([NaN]));
});
test('representative cases are deterministic, include empty, miss, scaling, and bounds',()=>{
 assert.deepEqual(benchmark.representativeCases(42),benchmark.representativeCases(42));assert.notDeepEqual(benchmark.representativeCases(42),benchmark.representativeCases(43));
 const cases=benchmark.representativeCases();assert.equal(cases[0].records.length,0);assert.ok(cases.some(c=>c.records.length===100&&c.capacity===5000));assert.equal(cases.at(-1).target,99);
});
test('real production measurements provide all scopes/statistics and leave saved state untouched',async()=>{
 const before=await engine.request('/api/state');
 const report=await benchmark.run({engine,cases:[{id:'current',label:'Current',records:before.areas,capacity:before.capacity,target:3}],settings:{runs:4,warmups:2},yieldTask:immediate});
 assert.equal(report.rows.length,4);assert.deepEqual(await engine.request('/api/state'),before);
 for(const row of report.rows){assert.equal(row.completed_runs,4);assert.equal(row.errors.length,0);assert.ok(row.output.verified);for(const scope of ['core_ms','compute_call_ms','preparation_ms']){const s=row.timings[scope];assert.equal(s.runs,4);assert.ok(s.min<=s.median&&s.median<=s.max);assert.ok(s.min<=s.average&&s.average<=s.max);assert.ok(s.p95<=s.max);}}
 assert.match(benchmark.csv(report),/Average ms/);assert.match(benchmark.csv(report),/compute_call_ms/);assert.doesNotThrow(()=>JSON.parse(JSON.stringify(report)));
});
test('warmups are excluded, preparation is separate, trace option propagated',async()=>{
 let calls=0,tick=0;const fake={execute(name,records,c,target,desc,trace){calls++;assert.equal(trace,true);const result=engine.execute(name,records,c,target,desc,trace);result.time_ms=2;result.preparation_ms=name==='binary'?3:0;return result;}};
 const report=await benchmark.run({engine:fake,cases:[benchmark.representativeCases()[0]],settings:{runs:3,warmups:2,trace:true},clock:()=>tick++,yieldTask:immediate});
 assert.equal(calls,20);assert.equal(report.rows[3].timings.preparation_ms.median,3);assert.equal(report.rows[0].timings.core_ms.average,2);assert.equal(report.rows[0].timings.compute_call_ms.median,1);
});
test('per-task failures are recorded, cancellation and invalid bounds reject',async()=>{
 const broken={execute(name,...args){if(name==='knapsack')throw Error('Deliberate failure');return engine.execute(name,...args);}};
 const report=await benchmark.run({engine:broken,cases:[benchmark.representativeCases()[0]],settings:{runs:3,warmups:0},yieldTask:immediate});
 assert.equal(report.rows[1].completed_runs,0);assert.match(report.rows[1].errors[0],/Deliberate/);assert.equal(report.rows[1].timings.core_ms,null);assert.equal(report.rows[2].completed_runs,3);
 await assert.rejects(benchmark.run({engine,cases:benchmark.representativeCases(),settings:{runs:0}}),/3–101/);
 const controller=new AbortController();controller.abort();await assert.rejects(benchmark.run({engine,cases:benchmark.representativeCases(),signal:controller.signal}),{name:'AbortError'});
});
test('output checks catch wrong allocations, order and search results',()=>{
 const c=benchmark.representativeCases().at(-1);
 assert.throws(()=>benchmark.quality('greedy',{selected:c.records,rejected:[],allocated:30,remaining:-20,benefit:170},c),/validation/);
 assert.throws(()=>benchmark.quality('binary',{found:c.records[0]},c),/validation/);
 assert.throws(()=>benchmark.quality('merge',{records:c.records},c),/validation/);
});
