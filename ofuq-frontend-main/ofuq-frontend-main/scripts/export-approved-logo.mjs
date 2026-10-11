/** Render the approved artwork with the SAME CSS as BrandLogo. No tracing,
 * lettering regeneration or raster-in-SVG substitution. Chrome is installed. */
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openBrowser } from './brand-browser.mjs';

const out = resolve('public/brand'), evidence = resolve('artifacts/mansatak-approved');
await mkdir(evidence, { recursive: true });
const config = await readFile('lib/brand.ts', 'utf8');
const colors = Object.fromEntries([...config.matchAll(/(ink|purple|ivory|paper|lime|copper): '(#[0-9A-Fa-f]+)'/g)].map(m => [m[1], m[2]]));
const tokens = Object.entries(colors).map(([key, value]) => `--brand-${key}:${value};`).join('');
const source = 'data:image/png;base64,' + (await readFile(resolve(out, 'mansatak-approved.png'))).toString('base64');
const css = await readFile('components/brand/BrandLogo.module.css', 'utf8');
const logo = (kind, theme, width) => `<span class="logo ${kind} ${theme}" style="width:${width}px;--brand-logo-source:url('${source}')" role="img" aria-label="منصتك التعليمية"><span class="canvas" aria-hidden="true"><img class="artwork" width="1958" height="803" alt="" src="${source}"><span class="wordTone"></span><span class="accentTone"></span></span></span>`;
const page = content => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css} html,body{margin:0;background:transparent} body{${tokens}} *{box-sizing:border-box}</style></head><body>${content}</body></html>`;
const browser = await openBrowser(9261);
const render = async (content, path, width, height) => {
  await browser.viewport(width, height);
  await browser.go('about:blank');
  const { frameTree } = await browser.send('Page.getFrameTree');
  await browser.send('Page.setDocumentContent', { frameId:frameTree.frame.id, html:page(content) });
  await browser.wait('document.images.length>0&&[...document.images].every(i=>i.complete&&i.naturalWidth>0)');
  await browser.pause(80);
  await browser.screenshot(path, false, { x:0, y:0, width, height, scale:1 });
};
try {
  await browser.send('Emulation.setDefaultBackgroundColorOverride', { color:{r:0,g:0,b:0,a:0} });
  for (const theme of ['light', 'dark', 'mono']) {
    await render(logo('primary', theme, 1825), resolve(out, `mansatak-approved-horizontal-${theme}.png`), 1825, 700);
    await render(logo('icon', theme, 700), resolve(out, `mansatak-approved-icon-${theme}.png`), 700, 700);
  }
  const app = (size, square=false) => `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${colors.ink};border-radius:${square?0:size*.21}px">${logo('icon','dark',size*.68)}</div>`;
  for (const size of [16,24,32,48,64,180,192,512,1024]) {
    const path = size === 180 ? 'mansatak-apple-touch.png' : size === 1024 ? 'mansatak-social.png' : size >= 192 ? `mansatak-app-${size}.png` : `mansatak-favicon-${size}.png`;
    await render(app(size), resolve(out, path), size, size);
  }
  await render(app(512,true), resolve(out,'mansatak-maskable-512.png'),512,512);
  await render(`<div style="width:1200px;height:630px;background:${colors.ivory};display:grid;place-items:center">${logo('primary','light',860)}</div>`,resolve(out,'mansatak-og.png'),1200,630);
  // ICO directory containing actual Chrome-rendered 16/32/48 PNG frames.
  const frames = await Promise.all([16,32,48].map(size=>readFile(resolve(out,`mansatak-favicon-${size}.png`))));
  const directory = Buffer.alloc(6 + frames.length*16);
  directory.writeUInt16LE(1,2); directory.writeUInt16LE(frames.length,4);
  let offset = directory.length;
  frames.forEach((frame,i)=>{const entry=6+i*16, size=[16,32,48][i]; directory[entry]=size;directory[entry+1]=size;directory.writeUInt16LE(1,entry+4);directory.writeUInt16LE(32,entry+6);directory.writeUInt32LE(frame.length,entry+8);directory.writeUInt32LE(offset,entry+12);offset+=frame.length;});
  await writeFile('public/favicon.ico',Buffer.concat([directory,...frames]));
  await copyFile(resolve(out,'mansatak-favicon-64.png'),'public/favicon.png');
  for (const path of ['public/logo.png','public/mahad_alofk2.png','public/images/ofuq-logo.png','assets/mahad_alofk2.png']) await copyFile(resolve(out,'mansatak-approved-horizontal-light.png'),path);
  await copyFile('public/favicon.ico','assets/favicon.ico');
  await copyFile(resolve(out,'mansatak-app-512.png'),'assets/tab_icon.png');
  // A real rendered comparison, not an AI-generated screenshot.
  const rows = ['light','dark','mono'].map(theme=>`<section style="height:230px;display:flex;justify-content:space-evenly;align-items:center;background:${theme==='dark'?colors.ink:colors.ivory}">${logo('primary',theme,400)}${logo('compact',theme,200)}${logo('icon',theme,100)}</section>`).join('');
  const sizes = await Promise.all([16,24,32,48,64].map(async size=>`<figure style="margin:0;text-align:center"><img src="data:image/png;base64,${(await readFile(resolve(out,`mansatak-favicon-${size}.png`))).toString('base64')}" width="${size}" height="${size}" alt="منصتك التعليمية"><figcaption style="font:14px sans-serif;margin-top:14px">${size}px</figcaption></figure>`));
  await render(rows+`<section style="height:150px;display:flex;gap:60px;justify-content:center;align-items:center;background:${colors.ivory}">${sizes.join('')}</section>`,resolve(evidence,'logo-theme-comparison.png'),1100,840);
  const luminance = hex => { const rgb=hex.match(/[0-9a-f]{2}/gi).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; };
  const contrast = (a,b) => { const x=luminance(a),y=luminance(b);return Number(((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2)); };
  await writeFile(resolve(evidence,'contrast.json'),JSON.stringify({inkOnIvory:contrast(colors.ink,colors.ivory),purpleOnIvory:contrast(colors.purple,colors.ivory),inkOnLime:contrast(colors.ink,colors.lime),ivoryOnInk:contrast(colors.ivory,colors.ink),limeOnInk:contrast(colors.lime,colors.ink),note:'Solid color token ratios, not a claim that every gradient pixel meets text contrast.'},null,2));
  console.log('Approved logo PNG variants, favicon, app icons and real rendered comparison exported.');
} finally { browser.close(); }
