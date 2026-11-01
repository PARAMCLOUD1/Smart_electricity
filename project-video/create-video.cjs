'use strict';
// Capture isolated real UI states and prepare the narrated presentation assets.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assets=path.join(os.tmpdir(),'SmartElectricityVideoAssets'),outputDirectory=__dirname;
const scenes=JSON.parse(fs.readFileSync(path.join(__dirname,'storyboard.json'),'utf8'));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function waveDuration(file){const b=fs.readFileSync(file);let rate=0,size=0;for(let i=12;i+8<=b.length;){const tag=b.toString('ascii',i,i+4),length=b.readUInt32LE(i+4);if(tag==='fmt ')rate=b.readUInt32LE(i+16);if(tag==='data'){size=length;break;}i+=8+length+(length%2);}if(!rate||!size)throw Error('Invalid narration WAV: '+file);return size/rate;}
async function main(){
  for(const scene of scenes)scene.duration=waveDuration(path.join(assets,scene.id+'.wav'))+1;
  const tabs=await (await fetch('http://127.0.0.1:9230/json')).json(),tab=tabs.find(t=>t.type==='page');if(!tab)throw Error('Start isolated Chrome with debugging port 9230 first.');
  const socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));let serial=0;const pending=new Map(),errors=[];
  socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  async function wait(expression){for(let i=0;i<300;i++){if(await evaluate(expression))return;await pause(100);}throw Error('Timed out: '+expression);}
  async function route(name,selector){await evaluate(`location.hash=${JSON.stringify(name)}`);await pause(150);if(selector)await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})`);await pause(350);}
  async function screenshot(id,alternate=false){await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>fs.writeFileSync(path.join(assets,id+(alternate?'-alternate':'')+'.png'),Buffer.from(r.data,'base64')));console.log('Captured:',id+(alternate?' alternate':''));}
  async function run(name){await route(name);await evaluate(`document.querySelector('[data-run="${name}"]').click()`);await wait(`Boolean(cache.${name}) && !document.querySelector('[data-run="${name}"]').disabled`);await evaluate(`clearInterval(timer);drawStep('${name}',cache.${name}.result.steps.length-1)`);await evaluate(`document.querySelector('#${name} .lab-grid').scrollIntoView({block:'start'})`);await pause(300);}

  try{
    await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:800,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:'http://127.0.0.1:5000/'});await wait("document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");
    await evaluate("localStorage.clear();localStorage.setItem('electricity-theme','dark');localStorage.setItem('electricity-palette','volt');location.reload()");await wait("document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");
    await pause(400);await screenshot('intro');await route('dashboard','#stats');await screenshot('dashboard');
    await route('manage','#manage');await screenshot('registry');await evaluate("document.querySelector('#add-area').click();document.querySelector('#name').value='Demo Clinic';document.querySelector('#demand').value=50;document.querySelector('#priority').value='Critical';document.querySelector('#type').value='Hospital'");await pause(200);await screenshot('form');await evaluate("document.querySelector('#close-dialog').click()");
    await run('greedy');await screenshot('greedy');await run('knapsack');await screenshot('knapsack');await route('dashboard','#stats');await screenshot('example');
    await route('merge');await evaluate("document.querySelector('#sort-direction').value='desc'");await run('merge');await screenshot('merge');
    await route('binary');await evaluate("document.querySelector('#target-id').value=3");await run('binary');await screenshot('binary');
    await route('performance','#comparison-panel');await evaluate("document.querySelector('#compare').click()");await wait("document.querySelectorAll('.compare-card').length===4 && !document.querySelector('#compare').disabled");await evaluate("document.querySelector('#comparison').scrollIntoView({block:'start'})");await pause(400);await screenshot('comparison');
    await route('algorithm-report','#algorithm-report');await evaluate("document.querySelector('#algorithm-report-input').value='current';document.querySelector('#algorithm-report-runs').value=21;document.querySelector('#algorithm-report-warmups').value=5;document.querySelector('#algorithm-report-form').requestSubmit()");await wait("document.querySelector('#algorithm-report-status').textContent.startsWith('Collected')");await evaluate("document.querySelector('#algorithm-report').scrollIntoView({block:'start'})");await screenshot('algorithm-report');await evaluate("document.querySelector('.report-runtime-chart').closest('.panel').scrollIntoView({block:'start'})");await pause(400);await screenshot('timing-chart');
    await route('reports','#reports');await evaluate("document.querySelector('[data-report]').click();document.querySelector('#report-detail').scrollIntoView({block:'start'})");await pause(200);await screenshot('reports');
    await route('dashboard');await evaluate("window.scrollTo(0,0)");await screenshot('themes');await evaluate("document.querySelector('#palette-select').value='light:ocean';document.querySelector('#palette-select').dispatchEvent(new Event('change'))");await pause(300);await screenshot('themes',true);scenes.find(s=>s.id==='themes').hasAlternate=true;
    // Persist the spoken transcript and approximate sentence-group captions as companion artifacts.
    const stamp=t=>{const ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
    let offset=0,number=0;const subtitles=[];for(const scene of scenes){const words=scene.narration.split(/\s+/),chunks=[];for(let i=0;i<words.length;i+=19)chunks.push(words.slice(i,i+19).join(' '));const span=(scene.duration-1)/chunks.length;chunks.forEach((chunk,i)=>subtitles.push(`${++number}\n${stamp(offset+.4+i*span)} --> ${stamp(offset+.4+(i+1)*span)}\n${chunk}\n`));offset+=scene.duration;}
    fs.writeFileSync(path.join(__dirname,'walkthrough.srt'),subtitles.join('\n'));
    fs.writeFileSync(path.join(__dirname,'NARRATION.md'),'# Project walkthrough narration\n\nEnglish, generated with Microsoft David Desktop. Screen captures show the current app; the architecture and desktop comparison chapters use explanatory graphics. Caption group timings are approximate.\n\n'+scenes.map((s,i)=>`## ${i+1}. ${s.title}\n\n${s.narration}`).join('\n\n')+'\n');
    const manifest={scenes,total_seconds:offset,viewport:{width:1440,height:800}};
    fs.writeFileSync(path.join(assets,'manifest.json'),JSON.stringify(manifest,null,2));
    console.log('Captures, transcript, captions and manifest ready. Run node project-video/render-video.cjs next.');
  }finally{socket.close();}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
