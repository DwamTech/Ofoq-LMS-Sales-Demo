import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const files=[];async function walk(d){for(const e of await readdir(d,{withFileTypes:true})){const p=d+'/'+e.name;if(e.isDirectory())await walk(p);else if(p.endsWith('.tsx')&&!p.endsWith('.test.tsx'))files.push(p);}}
await walk('app');await walk('components');let patch='*** Begin Patch\n';
for(const file of files){const old=await readFile(file,'utf8');const lines=old.split(/\r?\n/);const imports=lines.filter(l=>/^import \{ BrandLogo \}/.test(l));let hunks='';
 if(!process.argv.includes('--unused'))for(const imp of imports){if(lines.indexOf(imp)>4){hunks+='@@\n '+lines[0]+'\n+'+imp+'\n '+lines[1]+'\n@@\n-'+imp+'\n';}}
 const brandImport=lines.find(l=>/^import \{ brand \} from/.test(l));if(process.argv.includes('--unused')&&brandImport&&!/\bbrand\./.test(old))hunks+='@@\n-'+brandImport+'\n';
 if(hunks)patch+='*** Update File: '+resolve(file).replaceAll('\\','/')+'\n'+hunks;
}
console.log(patch+'*** End Patch');
