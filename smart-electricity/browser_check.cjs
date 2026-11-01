// Optional UI integration check. Requires an isolated Chrome CDP port at 9223.
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const tabs=await (await fetch('http://127.0.0.1:9223/json')).json();
  const tab=tabs.find(t=>t.type==='page');
  const socket=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let serial=0;const pending=new Map(),errors=[];
  socket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.id){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result);}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);});
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
  async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
  async function wait(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout: '+expression);}
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:5000'});
  await wait("document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");
  assert.equal(await evaluate("Object.keys(charts).length"),4);
  await wait("Boolean(document.querySelector('#theme-toggle'))");
  await evaluate("localStorage.setItem('electricity-theme','light');location.reload()");
  await wait("document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'light');
  fs.writeFileSync('browser-light.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await evaluate("document.querySelector('#theme-toggle').click()");
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  assert.equal(await evaluate("localStorage.getItem('electricity-theme')"),'dark');
  await evaluate('location.reload()');
  await wait("document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  fs.writeFileSync('browser-dark.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await evaluate("document.querySelector('#theme-toggle').click()");
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'light');
  assert.equal(await evaluate("document.querySelectorAll('#palette-select option').length"),8);
  for(const palette of ['celadon','blossom','ocean','lavender']){
    await evaluate(`document.querySelector('#palette-select').value='light:${palette}';document.querySelector('#palette-select').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate('document.documentElement.dataset.palette'),palette);
    assert.equal(await evaluate("localStorage.getItem('electricity-palette')"),palette);
    await evaluate("document.querySelector('#theme-toggle').click()");
    assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
    assert.equal(await evaluate("document.querySelector('#palette-select').value"),`dark:${palette}`);
    await evaluate("document.querySelector('#theme-toggle').click()");
  }
  await evaluate('location.reload()');
  await wait("document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");
  assert.equal(await evaluate('document.documentElement.dataset.palette'),'lavender');
  for(const name of ['greedy','knapsack','merge','binary']){
    await evaluate(`location.hash='${name}'`);
    await evaluate(`document.querySelector('[data-run="${name}"]').click()`);
    await wait(`Boolean(cache['${name}']) && !document.querySelector('[data-run="${name}"]').disabled`);
    assert.ok(await evaluate(`cache['${name}'].result.time_ns>=0`));
    await evaluate(`document.querySelector('[data-step="${name}"]').click()`);
    await wait(`!document.querySelector('[data-step="${name}"]').disabled`);
  }
  assert.equal(await evaluate('cache.greedy.result.allocated'),580);
  assert.equal(await evaluate('cache.binary.result.found.id'),3);
  await evaluate("location.hash='performance';document.querySelector('#compare').click()");
  await wait("document.querySelectorAll('.compare-card').length===4 && !document.querySelector('#compare').disabled");
  assert.ok(await evaluate("Boolean(charts['comparison-time'])"));
  for(const pair of [['greedy','knapsack'],['greedy','merge'],['greedy','binary'],['knapsack','merge'],['knapsack','binary'],['merge','binary']]){
    await evaluate(`document.querySelectorAll('[name="compare-algorithm"]').forEach(e=>e.checked=${JSON.stringify(pair)}.includes(e.value));document.querySelector('#compare-form').requestSubmit()`);
    await wait(`document.querySelectorAll('.compare-card').length===2 && document.querySelector('[data-comparison="${pair[0]}"]') && document.querySelector('[data-comparison="${pair[1]}"]') && !document.querySelector('#compare').disabled`);
  }
  await evaluate("document.querySelector('#compare-target').value='999';document.querySelector('#compare-form').requestSubmit()");
  await wait("document.querySelector('[data-comparison=\"binary\"]').textContent.includes('Record not found') && !document.querySelector('#compare').disabled");
  await evaluate("document.querySelector('#repeats').value='3';document.querySelector('#benchmark-form').requestSubmit()");
  await wait("Boolean(benchmark) && document.querySelectorAll('.benchmark-chart canvas').length===4 && !document.querySelector('#compare').disabled");
  await evaluate("location.hash='reports';document.querySelector('[data-report]').click()");
  assert.ok(await evaluate("document.querySelectorAll('#report-detail .report-stats div').length===8"));
  await evaluate("location.hash='manage';document.querySelector('#add-area').click()");
  await evaluate("document.querySelector('#name').value='UI Test Clinic';document.querySelector('#demand').value='7';document.querySelector('#area-form').requestSubmit()");
  await wait("state.areas.length===7 && !document.querySelector('#add-area').disabled");
  const id=await evaluate("state.areas.find(a=>a.name==='UI Test Clinic').id");
  await evaluate(`document.querySelector('[data-edit="${id}"]').click();document.querySelector('#demand').value='9';document.querySelector('#area-form').requestSubmit()`);
  await wait(`state.areas.find(a=>a.id===${id}).demand===9 && !document.querySelector('#add-area').disabled`);
  await evaluate(`document.querySelector('[data-delete="${id}"]').click()`);
  await wait("state.areas.length===6 && !document.querySelector('#add-area').disabled");
  await evaluate("location.hash='dashboard'");
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await new Promise(r=>setTimeout(r,300));
  assert.ok(await evaluate('document.documentElement.scrollWidth<=390 && window.innerWidth===390'),'Mobile page must not overflow horizontally');
  const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  fs.writeFileSync('browser-mobile.png',Buffer.from(screenshot.data,'base64'));
  assert.deepEqual(errors,[]);
  console.log('PASS: 4 light + 4 dark themes, saved theme, charts, algorithms, all comparison pairs, missing search, benchmarks, reports, CRUD, mobile; no JS exceptions.');
  socket.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
