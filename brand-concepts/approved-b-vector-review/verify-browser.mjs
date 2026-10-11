import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openBrowser} from '../../ofuq-frontend-main/ofuq-frontend-main/scripts/brand-browser.mjs';
const here=dirname(fileURLToPath(import.meta.url)),results=[];
const check=(name,pass,details)=>results.push({name,status:pass?'PASS':'FAIL',details});
const browser=await openBrowser(9264);
try{
 const filenames=(await readdir(here)).filter(f=>/^mansatak-.*\.svg$/.test(f)||/^favicon-\d+\.svg$/.test(f)||f==='comparison-board.svg');
 for(const filename of filenames){
  const source=await readFile(resolve(here,filename),'utf8');
  await browser.go('data:image/svg+xml;base64,'+Buffer.from(source).toString('base64'));
  const result=await browser.evaluate(`(()=>{const s=document.querySelector('svg'),b=s.getBBox(),v=s.viewBox.baseVal,ids=[...s.querySelectorAll('[id]')].map(e=>e.id);const urls=[...s.querySelectorAll('[fill]')].map(e=>e.getAttribute('fill')).filter(v=>v.startsWith('url(#')).map(v=>v.slice(5,-1));return {bounds:{x:b.x,y:b.y,width:b.width,height:b.height},viewBox:{width:v.width,height:v.height},missingGradients:urls.filter(id=>!document.getElementById(id)),duplicateIds:ids.length-new Set(ids).size,images:s.querySelectorAll('image').length}})()`);
  const b=result.bounds,v=result.viewBox;
  check(filename+': browser render and contained geometry',b.x>=-.01&&b.y>=-.01&&b.x+b.width<=v.width+.01&&b.y+b.height<=v.height+.01&&result.missingGradients.length===0&&result.duplicateIds===0&&result.images===0,result);
 }
 const shape=JSON.parse(await readFile(resolve(here,'shaping-evidence.json'),'utf8'));
 check('Arabic supporting font shaping and exact words',shape.some(s=>s.text==='منصتك'&&s.customInitialMeem)&&shape.some(s=>s.text==='التعليمية')&&shape.every(s=>s.missingGlyphs===0&&s.direction==='rtl'),{samples:shape.length,manualRefinement:'initial meem only; licensed outlines for other letters'});
 check('No browser exceptions',browser.errors.length===0,browser.errors);
 const result={pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,scope:'Offline SVG review only; no application endpoint/authentication requests',checks:results};
 await writeFile(resolve(here,'browser-validation.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({pass:result.pass,fail:result.fail}));
 if(result.fail)process.exitCode=1;
}finally{browser.close();}
