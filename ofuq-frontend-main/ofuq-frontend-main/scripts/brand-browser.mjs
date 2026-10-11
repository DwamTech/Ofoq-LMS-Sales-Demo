import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
export async function openBrowser(port=9251){
 const process=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-extensions',`--remote-debugging-port=${port}`,`--user-data-dir=${await mkdtemp(resolve(tmpdir(),'mansatak-brand-'))}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 const pause=ms=>new Promise(r=>setTimeout(r,ms));let target;
 for(let i=0;i<60;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await pause(100);}
 if(!target)throw Error('Installed Chrome CDP unavailable');
 const socket=new WebSocket(target.webSocketDebuggerUrl),pending=new Map(),errors=[];let id=0;
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 await new Promise(r=>socket.onopen=r);
 const send=(method,params={})=>new Promise((resolve,reject)=>{const mid=++id;pending.set(mid,{resolve,reject});socket.send(JSON.stringify({id:mid,method,params}));});
 const evaluate=async(expression)=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const wait=async exp=>{for(let i=0;i<350;i++){if(await evaluate(`Boolean(${exp})`))return true;await pause(100);}throw Error('Browser wait timed out: '+exp);};
 const viewport=(width,height=900)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<640,screenWidth:width,screenHeight:height});
 const go=async url=>{await send('Page.navigate',{url});await pause(200);await wait("document.readyState==='complete'");await evaluate('document.fonts.ready');await pause(250);};
 const screenshot=async(path,full=true,clip)=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:full,fromSurface:true,...(clip?{clip}:{} )});await writeFile(path,Buffer.from(r.data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');
 return {send,evaluate,wait,viewport,go,screenshot,pause,errors,close(){socket.close();if(process.pid)spawnSync('taskkill',['/PID',String(process.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}};
}
