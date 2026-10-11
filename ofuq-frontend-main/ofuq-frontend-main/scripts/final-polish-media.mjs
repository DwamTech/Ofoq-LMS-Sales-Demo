import { readFile, writeFile } from 'node:fs/promises'
const source=await readFile('components/brand/communityMediaSources.ts','utf8')
const urls=source.match(/https:\/\/player\.mediadelivery\.net\/embed\/[\w/-]+/g)
const results=await Promise.all(urls.map(async url=>{
  try {const response=await fetch(url,{signal:AbortSignal.timeout(10000)});await response.body?.cancel();return {url,status:response.status,available:response.ok}}
  catch(error){return {url,error:error.message,available:false}}
}))
await writeFile('artifacts/final-polish/media-results.json',JSON.stringify(results,null,2))
console.log(JSON.stringify(results,null,2))
