// Optional integration check. Start isolated Chrome with CDP port 9224 and serve the app on port 5000.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
async function main(){
  const tabs=await (await fetch('http://127.0.0.1:9224/json')).json(),tab=tabs.find(t=>t.type==='page');
  const socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  const pending=new Map(),errors=[];let serial=0;
  socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  async function wait(expression){for(let i=0;i<200;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,50));}throw Error('Timeout: '+expression);}
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'volt-report-ui-'));
  try{
    await send('Runtime.enable');await send('Page.enable');await send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:directory});
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:'http://127.0.0.1:5000/#algorithm-report'});
    await wait("document.querySelector('#algorithm-report-form') && document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");
    assert.equal(await evaluate("document.querySelector('#algorithm-report').hidden"),false);
    assert.equal(await evaluate("document.querySelector('#algorithm-report-results').hidden"),true);
    assert.equal(await evaluate("document.querySelector('#algorithm-report-status').textContent.includes('No results yet')"),true);
    await evaluate("(async()=>{window.__before=JSON.stringify(await LocalGrid.request('/api/state'));window.__originalExecute=LocalGrid.execute;window.__calls=0;LocalGrid.execute=(...args)=>{window.__calls++;return window.__originalExecute(...args)}})()");
    await new Promise(r=>setTimeout(r,150));assert.equal(await evaluate('window.__calls'),0);
    await evaluate("document.querySelector('#algorithm-report-input').value='current';document.querySelector('#algorithm-report-runs').value=3;document.querySelector('#algorithm-report-warmups').value=1");
    assert.equal(await evaluate("document.querySelector('#algorithm-report-form').requestSubmit();document.querySelector('#algorithm-report').getAttribute('aria-busy')"),'true');
    await wait("document.querySelector('#algorithm-report-status').textContent.startsWith('Collected')");
    assert.equal(await evaluate('window.__calls'),16);
    assert.equal(await evaluate("document.querySelectorAll('#algorithm-report-table tbody tr').length"),4);
    assert.equal(await evaluate("Chart.getChart(document.querySelector('#algorithm-report-chart')).data.datasets.length"),2);
    assert.equal(await evaluate("(async()=>JSON.stringify(await LocalGrid.request('/api/state'))===window.__before)()"),true);
    await evaluate("document.querySelector('#algorithm-report-csv').click();document.querySelector('#algorithm-report-json').click()");
    for(let i=0;i<100;i++){const downloads=fs.readdirSync(directory);if(downloads.some(x=>x.endsWith('.json'))&&downloads.some(x=>x.endsWith('.csv')))break;await new Promise(r=>setTimeout(r,50));}
    const files=fs.readdirSync(directory);assert.ok(files.some(x=>x.endsWith('.csv')));const json=JSON.parse(fs.readFileSync(path.join(directory,files.find(x=>x.endsWith('.json'))),'utf8'));assert.equal(json.rows.length,4);assert.equal(json.settings.runs,3);assert.equal(json.rows[0].samples.length,3);
    const themes=await evaluate("[...document.querySelector('#palette-select').options].map(o=>o.value)");assert.equal(themes.length,8);assert.equal(themes.filter(x=>x.startsWith('dark:')).length,4);assert.equal(themes.filter(x=>x.startsWith('light:')).length,4);
    const backgrounds=[];
    for(const theme of themes){await evaluate(`document.querySelector('#palette-select').value=${JSON.stringify(theme)};document.querySelector('#palette-select').dispatchEvent(new Event('change'))`);backgrounds.push(await evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()"));assert.equal(await evaluate("Chart.getChart(document.querySelector('#algorithm-report-chart')).data.datasets[0].backgroundColor===getComputedStyle(document.documentElement).getPropertyValue('--chart-ink').trim()"),true);}
    assert.equal(new Set(backgrounds).size,8);
    fs.writeFileSync(path.join(directory,'report-light.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    await evaluate("document.querySelector('#theme-toggle').click()");assert.equal(await evaluate("document.documentElement.dataset.theme"),'dark');assert.equal(await evaluate("document.documentElement.dataset.palette"),'ember');
    fs.writeFileSync(path.join(directory,'report-dark.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    assert.equal(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),true);
    fs.writeFileSync(path.join(directory,'report-mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    await evaluate("document.querySelector('#algorithm-report-input').value='representative';document.querySelector('#algorithm-report-runs').value=101;document.querySelector('#algorithm-report-form').requestSubmit();document.querySelector('#algorithm-report-cancel').click()");
    await wait("document.querySelector('#algorithm-report-status').textContent==='Benchmark cancelled.'");assert.equal(await evaluate("document.querySelector('#algorithm-report-results').hidden"),false);
    await evaluate("LocalGrid.execute=(name,...args)=>{if(name==='binary')throw Error('Injected UI check failure');return window.__originalExecute(name,...args)};document.querySelector('#algorithm-report-input').value='current';document.querySelector('#algorithm-report-runs').value=3;document.querySelector('#algorithm-report-form').requestSubmit()");
    await wait("document.querySelector('#algorithm-report-status').textContent.includes('task(s) reported errors')");assert.equal(await evaluate("document.querySelector('#algorithm-report-table').textContent.includes('Injected UI check failure')"),true);
    await evaluate('LocalGrid.execute=window.__originalExecute');
    await send('Page.reload');await wait("document.querySelector('#palette-select') && document.querySelector('#algorithm-report-form')");
    assert.equal(await evaluate("document.querySelector('#palette-select').value"),'dark:ember');assert.equal(await evaluate("document.querySelector('#algorithm-report-results').hidden"),true);
    await evaluate("location.hash='dashboard'");await wait("!document.querySelector('#dashboard').hidden");assert.equal(await evaluate("document.querySelectorAll('.stat').length"),8);
    assert.deepEqual(errors,[]);console.log('PASS: routing, no autorun, loading, measurements, chart, CSV/JSON downloads, unchanged records, 8 themes, chart colors, persistence, mobile width, cancellation, task errors and dashboard.');console.log('Screenshots and exports:',directory);
  }finally{socket.close();}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
