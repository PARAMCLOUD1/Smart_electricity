'use strict';
// A continuous screencast of the public website, driven through real browser input events.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {spawn,spawnSync}=require('node:child_process');
const site='https://paramsmartelectricitysystem.onrender.com/';
const directory=path.join(os.tmpdir(),'SmartElectricityLiveDemo');
const steps=JSON.parse(fs.readFileSync(path.join(__dirname,'live-steps.json'),'utf8'));
const preflight=process.argv.includes('--preflight'),fps=12;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,Math.max(0,ms)));
function wave(file){const b=fs.readFileSync(file);let fmt,data;for(let i=12;i+8<=b.length;){const kind=b.toString('ascii',i,i+4),n=b.readUInt32LE(i+4);if(kind==='fmt ')fmt=b.subarray(i+8,i+24);if(kind==='data'){data=b.subarray(i+8,i+8+n);break;}i+=8+n+n%2;}if(!fmt||!data||fmt.readUInt16LE(0)!==1)throw Error('Invalid narration file: '+file);return{fmt,data,rate:fmt.readUInt32LE(8),align:fmt.readUInt16LE(12)};}
async function encoder(){
 const file=path.join(directory,'ffmpeg.exe'),expected='04e1307997530f9cf2fe35cba2ca7e8875ca91da02f89d6c7243df819c94ad00';
 if(fs.existsSync(file)&&crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')===expected)return file;
 console.log('Downloading the verified standalone MP4 encoder…');
 const response=await fetch('https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64.gz',{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Encoder download HTTP '+response.status);
 const compressed=Buffer.from(await response.arrayBuffer());if(crypto.createHash('sha256').update(compressed).digest('hex')!=='8883a3dffbd0a16cf4ef95206ea05283f78908dbfb118f73c83f4951dcc06d77')throw Error('Encoder archive checksum mismatch.');
 const binary=zlib.gunzipSync(compressed);if(crypto.createHash('sha256').update(binary).digest('hex')!==expected)throw Error('Encoder executable checksum mismatch.');fs.writeFileSync(file,binary);return file;
}
function narration(){
 const first=wave(path.join(directory,steps[0].id+'.wav')),parts=[];let total=0;
 for(const step of steps){const audio=wave(path.join(directory,step.id+'.wav'));if(!audio.fmt.equals(first.fmt))throw Error('Narration formats differ.');step.duration=Math.max(step.minimum,audio.data.length/audio.rate+1);step.start=total;total+=step.duration;
  const silence=seconds=>Buffer.alloc(Math.round(seconds*audio.rate/audio.align)*audio.align);parts.push(silence(.4),audio.data,silence(step.duration-.4-audio.data.length/audio.rate));
 }
 const pcm=Buffer.concat(parts),header=Buffer.alloc(44);header.write('RIFF',0);header.writeUInt32LE(pcm.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);first.fmt.copy(header,20);header.write('data',36);header.writeUInt32LE(pcm.length,40);
 const file=path.join(directory,'live-narration.wav');fs.writeFileSync(file,Buffer.concat([header,pcm]));return{file,total};
}
async function main(){
 fs.mkdirSync(directory,{recursive:true});const audio=preflight?null:narration(),ffmpeg=preflight?null:await encoder();if(audio)console.log('Planned continuous recording duration: '+audio.total.toFixed(1)+' seconds');
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:9231/json')).json();break;}catch{await sleep(250);}}if(!tabs)throw Error('Start an isolated Chrome session on port 9231.');
 const socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
 const pending=new Map(),errors=[];let serial=0,lastFrame=null,frameCount=0,backpressure=false,pumpTimer=null,captionTimer=null,job=null,jobError=null;
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Page.screencastFrame'){lastFrame=Buffer.from(m.params.data,'base64');send('Page.screencastFrameAck',{sessionId:m.params.sessionId}).catch(()=>{});}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 async function wait(expression){for(let i=0;i<200;i++){if(await evaluate(expression))return;await sleep(100);}throw Error('UI condition failed: '+expression);}
 async function key(name,code,virtual,modifiers=0){await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code,windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual,modifiers});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code,windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual,modifiers});}
 let cursor={x:640,y:300},addedId;
 async function click(selector){
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:${JSON.stringify(preflight?'instant':'smooth')}})`);await sleep(preflight?25:400);
  const r=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();if(e.disabled)throw Error('Control disabled');return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  const old={...cursor},count=preflight?1:12;for(let i=1;i<=count;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:old.x+(r.x-old.x)*i/count,y:old.y+(r.y-old.y)*i/count});await sleep(preflight?0:35);}cursor=r;
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});await sleep(preflight?0:90);await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1});await sleep(preflight?35:250);
 }
 async function type(selector,text){await click(selector);await key('a','KeyA',65,2);await key('Backspace','Backspace',8);for(const char of String(text)){await send('Input.insertText',{text:char});await sleep(preflight?0:70);}}
 async function select(selector,index){await click(selector);await key('Home','Home',36);for(let i=0;i<index;i++){await key('ArrowDown','ArrowDown',40);await sleep(preflight?0:90);}await key('Enter','Enter',13);await sleep(preflight?40:350);}
 async function route(name){await click(`#nav a[href="#${name}"]`);await wait(`!document.querySelector('#${name}').hidden`);}
 async function scroll(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:${JSON.stringify(preflight?'instant':'smooth')}})`);await sleep(preflight?30:750);}
 async function action(id){
  if(id==='open'){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:750,y:350});}
  if(id==='overview'){await scroll('#stats');await sleep(preflight?0:1200);await scroll('#supply-chart');}
  if(id==='add'){await route('manage');await click('#add-area');await type('#name','Community Clinic');await type('#demand',60);await select('#priority',0);await select('#type',0);await click('#area-form button.primary');await wait("!document.querySelector('#area-dialog').open && state.areas.some(a=>a.name==='Community Clinic')");addedId=await evaluate("state.areas.find(a=>a.name==='Community Clinic').id");}
  if(id==='edit'){await click(`[data-edit="${addedId}"]`);await type('#demand',50);await select('#priority',1);await click('#area-form button.primary');await wait(`!document.querySelector('#area-dialog').open && state.areas.find(a=>a.id===${addedId}).demand===50 && state.areas.find(a=>a.id===${addedId}).priority==='High'`);}
  if(id==='delete'){await click(`[data-delete="${addedId}"]`);await wait(`state.areas.length===6 && !state.areas.some(a=>a.id===${addedId})`);}
  if(id==='capacity'){await route('dashboard');await type('#capacity',450);await click('#capacity-form button');await wait('state.capacity===450 && state.allocation===null');await scroll('#stats');}
  if(id==='greedy'||id==='knapsack'){await route(id);await click(`[data-run="${id}"]`);await wait(`Boolean(cache.${id}) && !document.querySelector('[data-run="${id}"]').disabled`);await scroll(`#${id} .lab-grid`);}
  if(id==='merge'){await route('merge');await select('#sort-direction',1);await click('[data-run="merge"]');await wait('Boolean(cache.merge)');await scroll('#merge .lab-grid');}
  if(id==='binary'){await route('binary');await type('#target-id',3);await click('[data-run="binary"]');await wait('cache.binary?.result.found?.id===3');await scroll('#binary .lab-grid');}
  if(id==='benchmark'){await route('algorithm-report');await select('#algorithm-report-input',1);await type('#algorithm-report-runs',7);await type('#algorithm-report-warmups',2);await click('#algorithm-report-run');await wait("document.querySelector('#algorithm-report-status').textContent.startsWith('Collected')");await scroll('.report-runtime-chart');}
  if(id==='export'){await scroll('#algorithm-report-table');await sleep(preflight?0:2500);await click('#algorithm-report-csv');await click('#algorithm-report-json');await scroll('.report-runtime-chart');}
  if(id==='reports'){await route('reports');await click('#report-list [data-report]');await scroll('#report-detail');await sleep(preflight?0:1500);await click('#report-detail [data-csv]');}
  if(id==='themes'){await route('dashboard');await select('#palette-select',1);await sleep(preflight?0:2000);await select('#palette-select',5);await sleep(preflight?0:2000);}
  if(id==='finish'){await scroll('#stats');await sleep(preflight?0:1500);await scroll('#priority-chart');}
 }
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});await send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:directory});
  await send('Page.navigate',{url:site});await wait("document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");await evaluate("localStorage.clear();localStorage.setItem('electricity-theme','dark');localStorage.setItem('electricity-palette','volt');location.reload()");await wait("document.querySelectorAll('.stat').length===8 && !document.querySelector('#add-area').disabled");
  await evaluate(`(()=>{const pointer=document.createElement('div');pointer.id='live-demo-pointer';pointer.style.cssText='position:fixed;left:640px;top:300px;width:24px;height:30px;z-index:2147483647;pointer-events:none;filter:drop-shadow(1px 2px 2px #0009)';pointer.innerHTML='<svg viewBox="0 0 24 30"><path d="M2 2v23l6-6 5 9 4-2-5-9h9Z" fill="white" stroke="#132131" stroke-width="1.4"/></svg>';document.body.append(pointer);window.addEventListener('mousemove',e=>{pointer.style.left=e.clientX+'px';pointer.style.top=e.clientY+'px'});window.addEventListener('mousedown',e=>{const r=document.createElement('div');r.style.cssText='position:fixed;pointer-events:none;width:36px;height:36px;border:3px solid #b8f568;border-radius:50%;z-index:2147483646;left:'+(e.clientX-18)+'px;top:'+(e.clientY-18)+'px';document.body.append(r);r.animate([{transform:'scale(.5)',opacity:1},{transform:'scale(1.7)',opacity:0}],{duration:650});setTimeout(()=>r.remove(),650)});const caption=document.createElement('div');caption.id='live-demo-caption';caption.style.cssText='position:fixed;pointer-events:none;bottom:10px;left:225px;right:16px;z-index:2147483645;background:#06101eea;color:#f1f8ff;padding:10px 14px;border-radius:8px;border:1px solid #77965a;font:14px/1.5 Segoe UI,sans-serif';document.body.append(caption);})()`);
  await evaluate(`(()=>{const pointer=document.querySelector('#live-demo-pointer');const sync=()=>{const host=document.querySelector('dialog[open]')||document.body;if(pointer.parentElement!==host)host.append(pointer)};new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});window.addEventListener('mousedown',()=>{const host=document.querySelector('dialog[open]');if(host)for(const child of [...document.body.children])if(child.style.zIndex==='2147483646')host.append(child)});sync()})()`);
  const completed=[];
  if(preflight){for(const step of steps){await action(step.id);completed.push(step.id);console.log('UI preflight passed:',step.id);}if(errors.length)throw Error(errors.join('; '));console.log('PREFLIGHT PASS: all live website actions completed using browser input.');return;}
  await send('Page.startScreencast',{format:'jpeg',quality:75,maxWidth:1280,maxHeight:720,everyNthFrame:2});for(let i=0;i<100&&!lastFrame;i++)await sleep(50);if(!lastFrame)throw Error('Browser did not provide screencast frames.');
  const output=path.join(__dirname,'Smart-Electricity-Live-Demo.mp4');
  job=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0','-i',audio.file,'-t',audio.total.toFixed(6),'-c:v','libx264','-preset','ultrafast','-crf','24','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',output],{stdio:['pipe','ignore','pipe']});let encoderErrors='';job.stderr.on('data',b=>encoderErrors+=b.toString());job.stdin.on('error',error=>jobError=error);const exited=new Promise(resolve=>job.on('close',resolve));job.on('error',error=>jobError=error);
  const started=performance.now(),frames=Math.ceil(audio.total*fps);
  const pump=()=>{if(backpressure||jobError||!lastFrame)return;const target=Math.min(frames,Math.floor((performance.now()-started)/1000*fps)+1);while(frameCount<target){frameCount++;if(!job.stdin.write(lastFrame)){backpressure=true;job.stdin.once('drain',()=>{backpressure=false;pump()});break;}}};pumpTimer=setInterval(pump,20);pump();
  let current=steps[0];captionTimer=setInterval(()=>{const t=(performance.now()-started)/1000-current.start,words=current.narration.split(/\s+/),start=Math.min(words.length-1,Math.max(0,Math.floor((t-.4)/Math.max(1,current.duration-.8)*words.length/17)*17));const caption=current.title+' · '+words.slice(start,start+17).join(' ');evaluate(`document.querySelector('#live-demo-caption').textContent=${JSON.stringify(caption)}`).catch(()=>{});},700);
  for(const step of steps){current=step;await sleep(step.start*1000-(performance.now()-started));if(jobError)throw jobError;console.log('Recording real interaction:',step.id);const began=performance.now();await action(step.id);completed.push({id:step.id,action_ms:performance.now()-began});await sleep((step.start+step.duration)*1000-(performance.now()-started));}
  clearInterval(captionTimer);captionTimer=null;for(let i=0;i<300&&frameCount<frames;i++){pump();await sleep(100);}clearInterval(pumpTimer);pumpTimer=null;job.stdin.end();const exitCode=await exited;if(exitCode!==0)throw Error('Encoder failed: '+encoderErrors);await send('Page.stopScreencast');
  const check=spawnSync(ffmpeg,['-v','error','-i',output,'-t','3','-f','null','-'],{encoding:'utf8'});if(check.status!==0)throw Error('Live recording could not be decoded.');
  const tail=spawnSync(ffmpeg,['-v','error','-sseof','-2','-i',output,'-t','2','-f','null','-'],{encoding:'utf8'});if(tail.status!==0)throw Error('End of live recording could not be decoded.');
  const metadata=spawnSync(ffmpeg,['-hide_banner','-i',output],{encoding:'utf8'}).stderr.replace(/At least one output file must be specified\s*$/,'');if(!/1280x720/.test(metadata)||!/Audio: aac/.test(metadata))throw Error('Unexpected recording format.');
  spawnSync(ffmpeg,['-v','error','-y','-i',output,'-frames:v','1',path.join(__dirname,'live-demo-cover.jpg')]);
  const info={file:path.basename(output),bytes:fs.statSync(output).size,site,recording:'Continuous real browser screencast; no slide images',resolution:'1280x720',fps,narration:'English / Microsoft David Desktop',duration_seconds:audio.total,frames:frameCount,steps:completed,errors,generated_at:new Date().toISOString(),metadata};
  fs.writeFileSync(path.join(__dirname,'LIVE_DEMO_INFO.json'),JSON.stringify(info,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'LIVE_DEMO_NARRATION.md'),'# Live website demonstration\n\n'+steps.map(s=>`## ${s.title}\n\n${s.narration}`).join('\n\n')+'\n');console.log('LIVE VIDEO READY:',output);console.log(JSON.stringify(info));
 }finally{if(pumpTimer)clearInterval(pumpTimer);if(captionTimer)clearInterval(captionTimer);if(job&&job.exitCode===null)job.stdin.end();if(!preflight)await Promise.race([send('Browser.close').catch(()=>{}),sleep(2000)]);socket.close();}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
