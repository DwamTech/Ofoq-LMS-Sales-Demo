import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const logo=await readFile('public/brand/mansatak-primary-mono.svg','utf8');
const inner=logo.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
let patch='*** Begin Patch\n';
for(const file of ['public/certificates/sample-certificate.svg','public/certificates/javascript-certificate.svg']){
 if(process.argv[2]&&!file.includes(process.argv[2]))continue;
 const old=await readFile(file,'utf8');const line=old.split(/\r?\n/).find(l=>l.includes('منصة الأفق')||l.includes('translate(592 436)'));
 if(line)patch+='*** Update File: '+resolve(file).replaceAll('\\','/')+'\n@@\n-'+line+'\n+  <g transform="translate(300 436) scale(.5)">'+inner+'</g>\n';
}
const license='public/licenses/ofoq-brand-fonts.txt';const old=await readFile(license,'utf8');const first=old.split(/\r?\n/)[0];
patch+='*** Update File: '+resolve(license).replaceAll('\\','/')+'\n@@\n-'+first+'\n+منصتك التعليمية — local brand fonts; original copyright notices and licenses.\n';
console.log(patch+'*** End Patch');
