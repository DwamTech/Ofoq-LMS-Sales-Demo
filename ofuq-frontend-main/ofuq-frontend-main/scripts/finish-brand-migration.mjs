import ts from 'typescript';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const files=[];
async function walk(d){for(const e of await readdir(d,{withFileTypes:true})){const p=d+'/'+e.name;if(e.isDirectory())await walk(p);else if(p.endsWith('.tsx')&&!p.includes('.test.'))files.push(p);}}
await walk('components');await walk('app');
let patch='*** Begin Patch\n';
for(const f of files){
 if(process.argv[2]&&f!==process.argv[2])continue;
 const old=await readFile(f,'utf8');let next=old;const edits=[];
 const tree=ts.createSourceFile(f,old,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const visit=n=>{if(ts.isJsxSelfClosingElement(n)&&['img','Image'].includes(n.tagName.getText(tree))){const src=n.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(tree)==='src');if(src&&ts.isStringLiteral(src.initializer)&&/^\/(logo\.png|mahad_alofk2\.png)$/.test(src.initializer.text)){const cl=n.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(tree)==='className');edits.push({start:n.getStart(tree),end:n.end,value:'<BrandLogo'+(cl?' '+cl.getText(tree):'')+'/>'});}}ts.forEachChild(n,visit);};visit(tree);
 for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.value+next.slice(e.end);
 if(edits.length){const pos=next.match(/^(?:\uFEFF)?['"]use client['"];?\r?\n/)?.[0].length??0;next=next.slice(0,pos)+"import { BrandLogo } from '@/components/brand/BrandLogo'\n"+next.slice(pos);}
 // Remove only an import made unused by replacing the sole next/image brand logo.
 if(!next.includes('<Image'))next=next.replace(/import Image from ['"]next\/image['"];?\r?\n/,'');
 const maps={
  'components/brand/ProductPanel.tsx':[["import { brand } from '@/lib/brand'", "import { brand } from '@/lib/brand'\nimport { BrandLogo } from './BrandLogo'"],['<strong>{brand.name}</strong>','<BrandLogo variant="icon" decorative/>'],['<span className={styles.certificateSeal}>{brand.name}</span>','<BrandLogo variant="compact" theme="mono"/>']],
  'app/brand-lab/page.tsx':[['الأقواس والخطوط تمثل بنية تتسع مع مراحل التعلم.','رمز الميم والاتصالات الهندسية يمثلان منظومة تعلم مترابطة.'],['في {brand.name} واحد.','مع {brand.name}.']],
  'app/page.tsx':[['`${brand.name} — مساحة واحدة لكل التجربة التعليمية`','brand.name'],['كلّ المعرفة.<br/>كلّ الرحلة.<br/>في <em>{brand.name}.</em>','<em>{brand.name}.</em><br/>لإدارة التجربة<br/>التعليمية.'],['في <em>{brand.name} واحد.</em>','في <em>{brand.name}.</em>'],['افتح {brand.name} جديدًا<br/>لتجربتك التعليمية.','تجربتك التعليمية،<br/>متصلة من البداية.'],['<small>{brand.name} / {brand.name}</small>','<small>{brand.name}</small>']],
  'components/experience/ExperienceGateway.tsx':[['عالم {brand.name}.','{brand.name}.']],
  'app/about/page.tsx':[['التعليم يستحق<br/>{brand.name} أوسع.','التعليم يستحق<br/>تجربة متصلة.']],
  'components/brand/ShowcaseMotion.tsx':[['منظومة واحدة. آفاق كثيرة.','منظومة واحدة. مسارات متصلة.']],
  'components/student/StudentHome.tsx':[['كل ما تتعلّمه، وكل ما أنجزته. رحلتك إلى {brand.name} أبعد تبدأ من هنا.','كل ما تتعلّمه، وكل ما أنجزته. رحلتك مع {brand.name} تبدأ من هنا.']],
  'components/student/StudentWorkspace.tsx':[['YOUR LEARNING HORIZON','مساحة التعلّم'],['كل خطوة، {brand.name} جديد.','{brand.name} · كل خطوة في مكانها.']],
  'components/brand/ProgramArtwork.tsx':[['<small>{brand.name} / {brand.name}</small>','<small>{brand.name}</small>']],
  'components/Footer.tsx':[['<span>{emailAddress}</span>','<span>البريد الإلكتروني للدعم</span>'],['Developed by Dwam Tech {brand.name}. Copyright © All Rights Reserved.','{brand.name} © جميع الحقوق محفوظة.']],
  'components/admin/showcase/AdminWorkspace.tsx':[['{user.name.slice(0, 1)}','{publicBrandText(user.name).slice(0, 1)}'],['{user.name}','{publicBrandText(user.name)}']],
  'components/admin/showcase/AdminOverview.tsx':[['{data.user.name}','{publicBrandText(data.user.name)}']],
  'components/HomeHeader.tsx':[['{user?.name}','{publicBrandText(user?.name ?? "")}']],
  'components/ProfileHeader.tsx':[['{user?.name}','{publicBrandText(user?.name ?? "")}']],
 };
 for(const [a,b]of maps[f]??[])next=next.replaceAll(a,b);
 if(next.includes('publicBrandText('))next=next.replace(/import \{ brand \} from '@\/lib\/brand'/,"import { brand, publicBrandText } from '@/lib/brand'");
 if(next===old)continue;
 // Minimal line LCS produces small, contextual patches even for multi-line images.
 const a=old.split(/\r?\n/),b=next.split(/\r?\n/),dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,hunks=[],chunk=[];
 while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){if(chunk.length){hunks.push(chunk);chunk=[];}i++;j++;}else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j]))chunk.push('+'+b[j++]);else chunk.push('-'+a[i++]);}
 if(chunk.length)hunks.push(chunk);
 patch+='*** Update File: '+resolve(f).replaceAll('\\','/')+'\n'+hunks.map(h=>'@@\n'+h.join('\n')+'\n').join('');
}
console.log(patch+'*** End Patch');
