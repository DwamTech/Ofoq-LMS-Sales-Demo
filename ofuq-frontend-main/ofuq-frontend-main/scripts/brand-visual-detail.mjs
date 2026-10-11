import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {openBrowser} from './brand-browser.mjs';
import {resolve} from 'node:path';
const out=resolve('artifacts/mansatak'),base='http://127.0.0.1:3004',reports=[];await mkdir(out,{recursive:true});
const browser=await openBrowser(9254);const check=(test,pass)=>{reports.push({test,status:pass?'PASS':'FAIL'});console.log((pass?'PASS ':'FAIL ')+test);};
try{
 for(const width of [1440,390,360]){await browser.viewport(width);await browser.go(base+'/');await browser.wait("document.querySelector('[data-public-hydrated=true]')");await browser.pause(1200);await browser.screenshot(resolve(out,'homepage-hero-'+width+'.png'),false);check('Header logo link has exact brand accessible name '+width,await browser.evaluate(`(()=>{const link=document.querySelector('#public-top a');return link?.href===location.origin+'/'&&link.getAttribute('aria-label')==='منصتك التعليمية — الصفحة الرئيسية'&&link.querySelector('svg[aria-label="منصتك التعليمية"]')!==null;})()`));}
 await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 check('Brand link is keyboard focusable',await browser.evaluate("document.activeElement===document.querySelector('#public-top a')"));
 await browser.screenshot(resolve(out,'header-keyboard-focus.png'),false);
 await browser.viewport(256,256);const favicon=await readFile('public/favicon.svg','utf8');
 await browser.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});
 await browser.go('data:image/svg+xml;base64,'+Buffer.from(favicon.replace(/width="64" height="64"/,'width="256" height="256"')).toString('base64'));
 check('Adaptive vector favicon uses light mark in dark mode',await browser.evaluate("getComputedStyle(document.querySelector('path')).fill==='rgb(216, 239, 115)'"));await browser.evaluate("document.documentElement.style.background='#29233b';document.documentElement.style.width='256px';document.documentElement.style.height='256px'");await browser.pause(100);await browser.screenshot(resolve(out,'favicon-dark-mode.png'),false);
}finally{browser.close();await writeFile(resolve(out,'visual-detail-results.json'),JSON.stringify({reports,summary:{pass:reports.filter(r=>r.status==='PASS').length,fail:reports.filter(r=>r.status==='FAIL').length}},null,2));if(reports.some(r=>r.status==='FAIL'))process.exitCode=1;}
