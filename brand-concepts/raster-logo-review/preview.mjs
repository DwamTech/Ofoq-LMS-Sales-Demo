import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openBrowser} from '../../ofuq-frontend-main/ofuq-frontend-main/scripts/brand-browser.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const png=await readFile(resolve(here,'mansatak-reference-extracted-v2.png'));
const html=`<!doctype html><html lang="ar"><head><meta charset="utf-8"><style>html,body{margin:0;width:1600px;height:760px;background:#F6F4ED}body{display:flex;align-items:center;justify-content:center}img{display:block;width:1450px;height:auto}</style></head><body><img alt="منصتك التعليمية" src="data:image/png;base64,${png.toString('base64')}"></body></html>`;
const browser=await openBrowser(9265);
try{await browser.viewport(1600,760);await browser.go('data:text/html;base64,'+Buffer.from(html).toString('base64'));await browser.wait('document.images[0].complete');await browser.screenshot(resolve(here,'preview-on-ivory.png'),false,{x:0,y:0,width:1600,height:760,scale:1});}finally{browser.close();}
