'use strict';
// Explicit offline benchmark: use the same statistics and harness as the browser report.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const benchmark=require('../static/algorithm-benchmark.js'),engine=require('../static/local-engine.js');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../static',file))).digest('hex');
async function main(){
  const snapshot=await engine.request('/api/state');
  const cases=[{id:'demo',label:'Six-area demo',records:snapshot.areas,capacity:snapshot.capacity,target:3},...benchmark.representativeCases(42)];
  const environment={runtime:process.version,platform:`${process.platform} ${process.arch}`,cpu:os.cpus()[0]?.model,logical_processors:os.cpus().length,engine_sha256:hash('local-engine.js'),harness_sha256:hash('algorithm-benchmark.js')};
  const report=await benchmark.run({engine,cases,settings:{runs:31,warmups:10,trace:false,seed:42},environment});
  const traceCase=cases.find(c=>c.records.length===100&&c.capacity===5000);
  report.trace_study=await benchmark.run({engine,cases:[traceCase],settings:{runs:31,warmups:10,trace:true,seed:42},environment});
  if([...report.rows,...report.trace_study.rows].some(r=>r.errors.length))throw Error('A benchmark reported an error; inspect the engine before collecting results.');
  const directory=path.join(__dirname,'../performance-results');fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'results.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(directory,'results.csv'),benchmark.csv(report));
  const f=n=>n.toFixed(6);
  const lines=['# Measured algorithm performance', '',`Collected UTC: ${report.collected_at}. Runtime: ${environment.runtime}; ${environment.platform}; ${environment.cpu}.`, '',
    `31 measured runs and 10 warmups per task. Seed 42. Engine SHA-256: \`${environment.engine_sha256}\`; harness SHA-256: \`${environment.harness_sha256}\`.`, '',
    'These are Node.js measurements of the production JavaScript engine, not browser UI latency. Core measurements exclude Binary Search ID preparation. Complete compute calls include it. No storage, network, file access, validation or rendering occurs inside timed intervals. Units are milliseconds. P95 uses nearest rank. Trace is off in the main table.', '',
    '| Dataset | Algorithm | n / C | Runs | Min ms | Average ms | Median ms | Max ms | P95 ms | Preparation median ms | Complete call median ms | Operations |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...report.rows.map(r=>{const s=r.timings.core_ms;return `| ${r.case_label} | ${r.name} | ${r.n} / ${r.capacity} | ${r.completed_runs} | ${f(s.min)} | ${f(s.average)} | ${f(s.median)} | ${f(s.max)} | ${f(s.p95)} | ${f(r.timings.preparation_ms.median)} | ${f(r.timings.compute_call_ms.median)} | ${r.operations} |`;}),'',
    '## Same-input trace study', '', 'n=100, C=5,000. Both modes have 31 measured runs and 10 warmups. Separate sequential batches are vulnerable to JIT/GC/order effects; timing ratios are descriptive, not causal.', '',
    '| Algorithm | Trace-off median ms | Trace-on median ms | Trace-on P95 ms |', '|---|---:|---:|---:|',
    ...report.trace_study.rows.map(r=>`| ${r.name} | ${f(report.rows.find(a=>a.case_id===traceCase.id&&a.algorithm===r.algorithm).timings.core_ms.median)} | ${f(r.timings.core_ms.median)} | ${f(r.timings.core_ms.p95)} |`),'',
    '## Output checks for the six-area demo at 600 kW', '',
    ...report.rows.filter(r=>r.case_id==='demo').map(r=>`- ${r.name}: ${r.output.description}. ${r.output.optimality||r.output.accuracy||''}.`),'',
    '## Interpretation', '',
    (()=>{const slow=[...report.rows].sort((a,b)=>b.timings.core_ms.median-a.timings.core_ms.median)[0];return `The largest measured core median is ${slow.name}, ${slow.case_label}: ${f(slow.timings.core_ms.median)} ms. This is a statement about these sampled tasks and inputs, not an interchangeable-algorithm speed ranking.`;})(), '',
    'Knapsack visits n(C+1) states; raising capacity increases its transition count and matrix size. Binary Search core is logarithmic but every call includes a fresh O(n log n) ID sort outside the core timer. Reusing ID order could remove repeated preparation. Trace-enabled Greedy repeatedly copies selected-ID prefixes and can require quadratic time/storage. Those structural costs support investigating cached search preparation and compact delta traces; this experiment does not measure the performance of either proposed optimization.', '',
    'Allocation benefit, feasibility and ordering/lookup checks are recorded per row in the raw report. There is no predictive accuracy measure because no prediction model exists. No heap/process memory was measured. Timing minima and maxima reflect possible timer quantization, CPU contention, JIT and garbage collection. Browser results can differ.', '',
    'Full report: [inventory, complexity, scope and limitations](../../ALGORITHM_PERFORMANCE_REPORT.md). [Raw samples, input snapshots, statistics and environment](results.json). [CSV with all timing scopes, source functions, quality and complexity](results.csv).', ''];
  fs.writeFileSync(path.join(directory,'RESULTS.md'),lines.join('\n'));
  console.log(`Collected ${report.rows.length} task rows + ${report.trace_study.rows.length} trace rows in ${directory}`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
