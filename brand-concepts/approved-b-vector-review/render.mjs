import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openBrowser} from '../../ofuq-frontend-main/ofuq-frontend-main/scripts/brand-browser.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const browser=await openBrowser(9263);
try{
 await browser.send('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
 for(const arg of process.argv.slice(2)){
  const [file,scaleText='1']=arg.split('@'),scale=Number(scaleText);
  let source=await readFile(resolve(here,file),'utf8');
  const w=Number(source.match(/<svg[^>]*width="(\d+)"/)[1])*scale,h=Number(source.match(/<svg[^>]*height="(\d+)"/)[1])*scale;
  source=source.replace(/(<svg[^>]*width=")\d+(" height=")\d+/,`$1${w}$2${h}`);
  await browser.viewport(w,h);await browser.go('data:image/svg+xml;base64,'+Buffer.from(source).toString('base64'));
  await browser.screenshot(resolve(here,file.replace(/\.svg$/,scale===1?'.png':`@${scale}x.png`)),false,{x:0,y:0,width:w,height:h,scale:1});
  console.log(file,w,h);
 }
}finally{browser.close();}
