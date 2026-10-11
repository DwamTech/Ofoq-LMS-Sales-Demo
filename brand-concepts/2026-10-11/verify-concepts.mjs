import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../ofuq-frontend-main/ofuq-frontend-main/scripts/brand-browser.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const checks=[];
const check=(name,pass,details)=>checks.push({name,status:pass?'PASS':'FAIL',details});
const browser=await openBrowser(9262);
try{
 for(const k of ['A','B','C'])for(const theme of ['light','dark','mono'])for(const variant of ['','-symbol']){
  const filename=`concept-${k}${variant}-${theme}.svg`;
  const source=await readFile(resolve(here,filename),'utf8');
  await browser.go('data:image/svg+xml;base64,'+Buffer.from(source).toString('base64'));
  const result=await browser.evaluate(`(()=>{const s=document.querySelector('svg'),b=s.getBBox(),v=s.viewBox.baseVal;return {title:s.querySelector('title')?.textContent,label:s.getAttribute('aria-label'),bounds:{x:b.x,y:b.y,width:b.width,height:b.height},viewBox:{width:v.width,height:v.height},paths:s.querySelectorAll('path').length}})()`);
  const b=result.bounds,v=result.viewBox;
  const inside=b.x>=0&&b.y>=0&&b.x+b.width<=v.width&&b.y+b.height<=v.height;
  check(`${filename}: title, real paths, no external font or image`,result.title==='منصتك التعليمية'&&result.label===result.title&&result.paths>0&&!/<(?:text|image|foreignObject|script)\b/.test(source)&&!/(?:href|font-family)=/.test(source),result);
  check(`${filename}: geometry inside canvas`,inside,{bounds:b,viewBox:v});
 }
 const evidence=JSON.parse(await readFile(resolve(here,'shaping-evidence.json'),'utf8'));
 check('Supporting Arabic typesetting: no missing glyphs',evidence.length>0&&evidence.every(e=>e.missingGlyphs===0&&e.direction==='rtl'),{shapedSamples:evidence.length});
 check('Browser JavaScript errors',browser.errors.length===0,browser.errors);
 const result={date:'2026-10-11',scope:'Standalone concept files only; no website routes or authentication tested',pass:checks.filter(c=>c.status==='PASS').length,fail:checks.filter(c=>c.status==='FAIL').length,checks};
 await writeFile(resolve(here,'validation-results.json'),JSON.stringify(result,null,2));
 const filenames=(await readdir(here)).filter(f=>f!=='file-index.json'&&!f.startsWith('__')).sort();
 const files=await Promise.all(filenames.map(async filename=>{const bytes=await readFile(resolve(here,filename));return {filename,path:resolve(here,filename).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}));
 await writeFile(resolve(here,'file-index.json'),JSON.stringify({root:here.replaceAll('\\','/'),scope:'Standalone creative approval only',count:files.length,files},null,2));
 console.log(JSON.stringify({pass:result.pass,fail:result.fail}));
 if(result.fail)process.exitCode=1;
}finally{browser.close();}
