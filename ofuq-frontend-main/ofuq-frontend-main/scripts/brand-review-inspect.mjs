import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openBrowser} from './brand-browser.mjs';
const b=await openBrowser(9255);
try{await b.viewport(1200,900);await b.go('data:text/html;base64,'+Buffer.from(await readFile('artifacts/mansatak/logo-review.html','utf8')).toString('base64'));const data=await b.evaluate(`({innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.getBoundingClientRect().width,images:[...document.images].map(e=>({width:e.width,naturalWidth:e.naturalWidth,rect:e.getBoundingClientRect().toJSON()})),sections:[...document.querySelectorAll('section')].map(e=>e.getBoundingClientRect().toJSON())})`);console.log(JSON.stringify(data));await writeFile('artifacts/mansatak/logo-review-layout.json',JSON.stringify(data,null,2));await b.screenshot(resolve('artifacts/mansatak/logo-family-reviewed.png'),false,{x:0,y:0,width:1200,height:684,scale:1});}finally{b.close();}
