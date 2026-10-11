import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../ofuq-frontend-main/ofuq-frontend-main/scripts/brand-browser.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const browser=await openBrowser(9261);
try {
  await browser.send('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
  const files=process.argv.slice(2);
  for(const filename of files){
    const [asset,scaleText='1']=filename.split('@');
    let source=await readFile(resolve(here,asset),'utf8');
    const scale=Number(scaleText);
    const width=Number(source.match(/<svg[^>]*width="(\d+)"/)[1])*scale;
    const height=Number(source.match(/<svg[^>]*height="(\d+)"/)[1])*scale;
    source=source.replace(/(<svg[^>]*width=")\d+(" height=")\d+/,`$1${width}$2${height}`);
    await browser.viewport(width,height);
    await browser.go('data:image/svg+xml;base64,'+Buffer.from(source).toString('base64'));
    await browser.screenshot(resolve(here,asset.replace(/\.svg$/,scale===1?'.png':`@${scale}x.png`)),false,{x:0,y:0,width,height,scale:1});
    console.log(filename, width, height);
  }
} finally {browser.close();}
