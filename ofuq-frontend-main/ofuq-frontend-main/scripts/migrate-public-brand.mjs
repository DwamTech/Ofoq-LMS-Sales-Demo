/** Emits an apply_patch patch; never writes application source itself. */
import ts from 'typescript';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await walk(p);else if(/\.tsx?$/.test(p)&&!p.includes('.test.')&&!p.includes('/api/')&&!p.endsWith('logoVectors.ts'))files.push(p);}}
await walk('app');await walk('components');
const marker='__NEW_PUBLIC_BRAND__';
function change(value){
 return value
  .replace(/منصة (?:الأفق|أفق|أُفُق)(?: للتعليم(?: والتدريب| عن بعد)?)?/g,marker)
  .replace(/(?<![\u0600-\u06ff])(?:أُفُق|أفق|الأفق|الأُفُق)(?:ًا|ًا)?(?![\u0600-\u06ff])/g,marker)
  .replace(/(?<![\u0600-\u06ff])منصتك التعليمية(?![\u0600-\u06ff])/g,marker)
  .replace(/\b(?:OFOQ|OFUQ)\b/g,marker)
  .replace(/A NEW HORIZON FOR EDUCATION|EDUCATION, WITH A WIDER PERSPECTIVE|YOUR NEXT HORIZON|ABOUT __NEW_PUBLIC_BRAND__ \/ A WIDER PERSPECTIVE|__NEW_PUBLIC_BRAND__ \/ A WORLD OF POSSIBILITIES|01 \/ YOUR LEARNING HORIZON/g,'التجربة التعليمية')
}
function expression(value){const parts=value.split(marker);return parts.length===2&&!parts[0]&&!parts[1]?'brand.name':'`'+parts.map(p=>p.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$/g,'\\$').replace(/\r/g,'\\r').replace(/\n/g,'\\n')).join('${brand.name}')+'`';}
let patch='*** Begin Patch\n';
const modified=[];
for(const file of files){
 const old=await readFile(file,'utf8');const source=ts.createSourceFile(file,old,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);const edits=[];
 const visit=(n)=>{
  if(ts.isJsxText(n)){const value=n.getFullText(source),next=change(value);if(next!==value)edits.push({start:n.pos,end:n.end,value:next.split(marker).join('{brand.name}')});return;}
  if(ts.isStringLiteral(n)){
   const value=n.text;
   // Preserve URLs, contact addresses, storage/API identifiers and parsing patterns.
   if(/https?:|@|^\/|^__|^ofoq_|^ofuq_|^about-ofuq/.test(value))return;
   const next=change(value);if(next!==value){const expr=expression(next);edits.push({start:n.getStart(source),end:n.end,value:ts.isJsxAttribute(n.parent)?'{'+expr+'}':expr});}return;
  }
  if(ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n)||ts.isNoSubstitutionTemplateLiteral(n)){
   const raw=n.getText(source);if(!/https?:|@demo\.|__ofuq|ofoq_demo|ofoq_experience/.test(raw)){const next=change(raw);if(next!==raw)edits.push({start:n.getStart(source),end:n.end,value:next.split(marker).join('${brand.name}')});}return;
  }
  ts.forEachChild(n,visit);
 };
 visit(source);if(!edits.length)continue;
 let next=old;for(const edit of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,edit.start)+edit.value+next.slice(edit.end);
 const beforeImport=next;
 let importPosition=-1;
 if(next.includes('brand.name')&&!/import\s+\{[^}]*\bbrand\b/.test(next)){
  const directive=next.match(/^(?:\uFEFF)?['"]use client['"];?\r?\n/);
  const pos=directive?directive[0].length:0;importPosition=directive?1:0;
 }
 const a=old.split(/\r?\n/),b=beforeImport.split(/\r?\n/);if(a.length!==b.length)throw Error('Unexpected line delta '+file);
 patch+='*** Update File: '+resolve(file).replaceAll('\\','/')+'\n';
 for(let i=0;i<a.length;i++){
   if(i===importPosition)patch+='@@\n'+(i?' '+a[i-1]+'\n':'')+"+import { brand } from '@/lib/brand'\n"+' '+a[i]+'\n';
   if(a[i]!==b[i])patch+='@@\n-'+a[i]+'\n+'+b[i]+'\n';
 }
 modified.push(file);
}
patch+='*** End Patch';
if(process.argv.includes('--list'))console.log(JSON.stringify(modified));else console.log(patch);
