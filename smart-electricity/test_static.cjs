const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function load(storage=new Map()){const c={module:{exports:{}},performance,setTimeout,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'static/local-engine.js'),'utf8'),c);return c.module.exports;}
test('knapsack matches exhaustive selection; greedy fits; sort and search work',()=>{
 const g=load(),areas=Array.from({length:6},(_,i)=>({id:i+1,demand:(i*7)%11+1,priority:['Critical','High','Medium','Low'][i%4]}));
 for(let cap=0;cap<=25;cap++){let best=0;for(let mask=0;mask<64;mask++){let used=0,value=0;areas.forEach((a,i)=>{if(mask&(1<<i)){used+=a.demand;value+={Critical:100,High:70,Medium:40,Low:20}[a.priority];}});if(used<=cap)best=Math.max(best,value);}assert.equal(g.execute('knapsack',areas,cap).benefit,best);assert.ok(g.execute('greedy',areas,cap).allocated<=cap);}
 assert.equal(g.execute('binary',[],0,1).found,null);assert.equal(g.execute('binary',areas,0,4).found.id,4);
 const result=g.execute('merge',areas,0).records;for(let i=1;i<result.length;i++)assert.ok(result[i-1].demand<=result[i].demand);
});
test('persistence, report snapshots, comparison, validation and benchmarks',async()=>{
 const storage=new Map(),g=load(storage);await g.request('/api/capacity','PUT',{capacity:100});await g.request('/api/run/knapsack','POST',{target:3});
 await g.request('/api/compare','POST',{algorithms:['greedy','binary'],target:3});assert.equal((await g.request('/api/reports')).reports.length,1);
 await g.request('/api/areas','POST',{name:'New area',demand:10,priority:'High',type:'Residential'});assert.equal((await g.request('/api/state')).allocation,null);assert.equal((await load(storage).request('/api/state')).areas.length,7);assert.equal((await g.request('/api/reports')).reports[0].areas.length,6);assert.match(g.csv(1),/Allocated kW/);
 await assert.rejects(g.request('/api/areas','POST',{name:'New area',demand:10,priority:'High',type:'Residential'}));
 const b=await g.request('/api/benchmark','POST',{repeats:3,seed:42});assert.equal(b.generated.length,16);assert.equal(b.current.length,4);
});
test('built page references existing relative assets',()=>{const base=path.join(__dirname,'dist'),html=fs.readFileSync(path.join(base,'index.html'),'utf8');assert.match(html,/local-engine.js/);assert.doesNotMatch(html,/SQLite|perf_counter_ns|["']\/static\//);for(const m of html.matchAll(/(?:src|href)="(static\/[^"]+)"/g))assert.ok(fs.existsSync(path.join(base,m[1])));assert.equal(fs.existsSync(path.join(base,'app.py')),false);});
