'use strict';
// Offline MP4 export from captured UI images and verified Windows narration WAVs.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn,spawnSync}=require('node:child_process');
const assets=path.join(os.tmpdir(),'SmartElectricityVideoAssets');
const encoder=process.env.PROJECT_VIDEO_FFMPEG||path.join(os.tmpdir(),'SmartElectricityVideoEncoder','ffmpeg.exe');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function readWave(file){const b=fs.readFileSync(file);let fmt,data;for(let i=12;i+8<=b.length;){const tag=b.toString('ascii',i,i+4),n=b.readUInt32LE(i+4);if(tag==='fmt ')fmt=b.subarray(i+8,i+8+16);if(tag==='data'){data=b.subarray(i+8,i+8+n);break;}i+=8+n+n%2;}if(!fmt||!data||fmt.readUInt16LE(0)!==1)throw Error('Expected PCM narration WAV: '+file);return{fmt,data,rate:fmt.readUInt32LE(8),align:fmt.readUInt16LE(12)};}
async function main(){
 if(!fs.existsSync(encoder))throw Error('Set PROJECT_VIDEO_FFMPEG to a standalone ffmpeg executable.');
 const manifest=JSON.parse(fs.readFileSync(path.join(assets,'manifest.json'),'utf8')),scenes=manifest.scenes;
 let tabs;for(let attempt=0;attempt<40;attempt++){try{tabs=await (await fetch('http://127.0.0.1:9230/json')).json();break;}catch{await pause(250);}}if(!tabs)throw Error('The isolated Chrome recorder did not start on port 9230.');const tab=tabs.find(t=>t.type==='page');
 const socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));const pending=new Map();let serial=0;
 socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let file,type;if(url.pathname==='/'){file=path.join(__dirname,'recorder.html');type='text/html';}else if(url.pathname==='/manifest.json'){file=path.join(assets,'manifest.json');type='application/json';}else if(/^\/assets\/[a-z0-9-]+\.png$/.test(url.pathname)){file=path.join(assets,path.basename(url.pathname));type='image/png';}else{res.writeHead(404);return res.end();}fs.readFile(file,(error,b)=>{if(error){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':type});res.end(b);});});
 const frames=[];let total=0;
 try{
  await new Promise(resolve=>server.listen(5081,'127.0.0.1',resolve));await send('Page.navigate',{url:'http://127.0.0.1:5081/'});
  for(let i=0;i<100;i++){if(await evaluate("typeof window.prepareFrames==='function'"))break;await pause(100);}await evaluate('window.prepareFrames()');
  for(let i=0;i<scenes.length;i++){
   const scene=scenes[i],words=scene.narration.split(/\s+/),count=Math.ceil(words.length/19),span=(scene.duration-1)/count;
   for(let j=0;j<count;j++){const data=await evaluate(`window.renderFrame(${i},${j})`),file=path.join(assets,`frame-${String(i).padStart(2,'0')}-${j}.png`);fs.writeFileSync(file,Buffer.from(data,'base64'));frames.push({file,duration:span+(j===0?.4:0)+(j===count-1?.6:0)});}
   total+=scene.duration;console.log(`Rendered chapter ${i+1}/${scenes.length}: ${scene.title}`);
  }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await Promise.race([send('Browser.close').catch(()=>{}),pause(2000)]);socket.close();}
 const first=readWave(path.join(assets,scenes[0].id+'.wav')),audioParts=[];
 for(const scene of scenes){const wave=readWave(path.join(assets,scene.id+'.wav'));if(!wave.fmt.equals(first.fmt))throw Error('Narration formats differ.');for(const seconds of [.4])audioParts.push(Buffer.alloc(Math.round(wave.rate*seconds/wave.align)*wave.align));audioParts.push(wave.data);audioParts.push(Buffer.alloc(Math.round(wave.rate*.6/wave.align)*wave.align));}
 const pcm=Buffer.concat(audioParts),header=Buffer.alloc(44);header.write('RIFF',0);header.writeUInt32LE(pcm.length+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);first.fmt.copy(header,20);header.write('data',36);header.writeUInt32LE(pcm.length,40);
 const audioFile=path.join(assets,'full-narration.wav');fs.writeFileSync(audioFile,Buffer.concat([header,pcm]));
 const list=path.join(assets,'frames.ffconcat'),quote=file=>file.replace(/\\/g,'/').replace(/'/g,"'\\''");
 fs.writeFileSync(list,'ffconcat version 1.0\n'+frames.map(f=>`file '${quote(f.file)}'\nduration ${f.duration.toFixed(8)}`).join('\n')+`\nfile '${quote(frames.at(-1).file)}'\n`);
 const output=path.join(__dirname,'Smart-Electricity-Walkthrough.mp4');
 const args=['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-i',audioFile,'-t',total.toFixed(6),'-r','20','-fps_mode','cfr','-c:v','libx264','-preset','ultrafast','-tune','stillimage','-crf','23','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart','-progress','pipe:1','-nostats',output];
 await new Promise((resolve,reject)=>{const job=spawn(encoder,args,{stdio:['ignore','pipe','pipe']});let errors='',last=0;job.stderr.on('data',b=>errors+=b.toString());job.stdout.on('data',b=>{for(const match of b.toString().matchAll(/out_time_ms=(\d+)/g)){const seconds=Number(match[1])/1e6;if(seconds-last>=30){last=seconds;console.log(`Encoded ${seconds.toFixed(0)} / ${total.toFixed(0)} seconds`);}}});job.on('error',reject);job.on('close',code=>code===0?resolve():reject(Error('MP4 export failed: '+errors)));});
 const decoded=spawnSync(encoder,['-v','error','-i',output,'-t','3','-f','null','-'],{encoding:'utf8'});if(decoded.status!==0)throw Error('Video decode check failed: '+decoded.stderr);
 const tail=spawnSync(encoder,['-v','error','-sseof','-2','-i',output,'-t','2','-f','null','-'],{encoding:'utf8'});if(tail.status!==0)throw Error('End-of-video decode check failed: '+tail.stderr);
 const probe=spawnSync(encoder,['-hide_banner','-i',output],{encoding:'utf8'}).stderr;if(!/1920x1080/.test(probe)||!/Audio: aac/.test(probe)||!/Video: h264/.test(probe))throw Error('Unexpected audio/video codec or dimensions.');
 const cover=path.join(__dirname,'cover.jpg');const poster=spawnSync(encoder,['-v','error','-y','-i',output,'-frames:v','1',cover],{encoding:'utf8'});if(poster.status!==0)throw Error('Poster export failed.');
 const info={file:path.basename(output),bytes:fs.statSync(output).size,language:'English',narration:'Microsoft David Desktop',chapters:scenes.length,expected_duration_seconds:total,resolution:'1920x1080',frames_per_second:20,video_codec:'H.264',audio_codec:'AAC',encoder:'FFmpeg 6.1.1',generated_at:new Date().toISOString(),validation:'Decoded first 3 seconds and last 2 seconds; confirmed H.264, AAC and 1920x1080',metadata:probe};
 fs.writeFileSync(path.join(__dirname,'VIDEO_INFO.json'),JSON.stringify(info,null,2)+'\n');console.log('VIDEO READY:',output);console.log(JSON.stringify(info));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
