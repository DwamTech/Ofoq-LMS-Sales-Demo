import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openBrowser} from './brand-browser.mjs';
const out=resolve('public/brand');await mkdir(out,{recursive:true});
const name='منصتك التعليمية';
const primary=await readFile(resolve(out,'mansatak-primary.svg'),'utf8');
const icon=await readFile(resolve(out,'mansatak-icon.svg'),'utf8');
const dim=primary.match(/viewBox="0 0 (\d+) (\d+)"/);const width=Number(dim[1]),height=Number(dim[2]);
const inner=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const app=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" aria-label="${name}"><rect width="512" height="512" rx="108" fill="#29233B"/><g transform="translate(96 96) scale(5)" fill="#D8EF73">${inner(icon).replace(/fill="#[0-9A-Fa-f]+"/g,'fill="#D8EF73"')}</g></svg>`;
const mask=app.replace('rx="108"','rx="0"');
const og=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${name}"><title>${name}</title><rect width="1200" height="630" fill="#F6F4ED"/><g fill="none" stroke="#DEDAD1"><path d="m1080-130 460 460-460 460-460-460Z"/><path d="m1080 15 315 315-315 315-315-315Z"/></g><g transform="translate(${(1200-width*2)/2} ${(630-height*2)/2}) scale(2)">${inner(primary)}</g></svg>`;
await writeFile(resolve(out,'mansatak-social.svg'),app);await writeFile(resolve(out,'mansatak-og.svg'),og);
const browser=await openBrowser(9252);
try{
 await browser.send('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
 const raster=async(svg,path,w,h)=>{await browser.viewport(w,h);await browser.go('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));await browser.screenshot(path,false);};
 for(const theme of ['light','dark','mono'])for(const variant of ['primary','compact','icon']){const svg=await readFile(resolve(out,`mansatak-${variant}-${theme}.svg`),'utf8');const d=svg.match(/viewBox="0 0 (\d+) (\d+)"/);const w=Number(d[1])*4,h=Number(d[2])*4;await raster(svg.replace(/width="\d+" height="\d+"/,`width="${w}" height="${h}"`),resolve(out,`mansatak-${variant}-${theme}@4x.png`),w,h);}
 for(const size of [192,512])await raster(app.replace(/width="512" height="512"/,`width="${size}" height="${size}"`),resolve(out,`mansatak-app-${size}.png`),size,size);
 await raster(mask,resolve(out,'mansatak-maskable-512.png'),512,512);
 await raster(app.replace(/width="512" height="512"/,'width="180" height="180"'),resolve(out,'mansatak-apple-touch.png'),180,180);
 await raster(app.replace(/width="512" height="512"/,'width="1024" height="1024"'),resolve(out,'mansatak-social.png'),1024,1024);
 await raster(og,resolve(out,'mansatak-og.png'),1200,630);
 await raster(icon.replace(/width="64" height="64"/,'width="1024" height="1024"'),resolve(out,'mansatak-icon-transparent-1024.png'),1024,1024);
 await copyFile(resolve(out,'mansatak-primary.svg'),'public/logo.svg');await copyFile(resolve(out,'mansatak-icon.svg'),'public/favicon.svg');await copyFile(resolve(out,'mansatak-primary.svg'),'public/icons/logo.svg');
 await writeFile('public/favicon.svg',icon.replace('<path','<style>@media(prefers-color-scheme:dark){path{fill:#D8EF73}}</style><path'));
 for(const alias of ['public/logo.png','public/mahad_alofk2.png','public/images/ofuq-logo.png'])await copyFile(resolve(out,'mansatak-primary-light@4x.png'),alias);
 console.log('Generated vector assets and accurate transparent PNG exports with installed Chrome.');
}finally{browser.close();}
