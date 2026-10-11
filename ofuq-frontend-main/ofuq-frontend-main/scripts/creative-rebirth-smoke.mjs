import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const base = process.env.OFOQ_QA_URL || 'http://127.0.0.1:3004'
const api = process.env.OFOQ_QA_API || 'http://127.0.0.1:8000/api'
const results = []
for (const path of ['/', '/about', '/courses', '/diploms', '/community', '/privacy', '/terms', '/search', '/verify-certificate', '/auth', '/user', '/admin', '/brand-lab']) {
  const response = await fetch(base + path, { redirect: 'manual' })
  const html = await response.text()
  const expected = path === '/brand-lab' ? 404 : path === '/search' ? 307 : 200
  results.push({ test: 'production HTTP ' + path, statusCode: response.status, location: response.headers.get('location'), status: response.status === expected ? 'PASS' : 'FAIL', brandScope: html.includes('Showcase_publicScope') })
}
const home = await (await fetch(base)).text()
for (const path of ['/categories', '/allCourses']) {
  const response = await fetch(api + path)
  const json = await response.json()
  const records = Array.isArray(json) ? json : (json.data?.data || json.data || [])
  results.push({ test: 'genuine public API ' + path, statusCode: response.status, count: records.length, status: response.ok && records.length > 0 ? 'PASS' : 'FAIL' })
  if (path === '/categories') results.push({ test: 'homepage uses real program names', names: records.map(item => item.name), status: records.slice(0, 3).every(item => home.includes(item.name)) ? 'PASS' : 'FAIL' })
}
const manifest = JSON.parse(await readFile('.next/app-build-manifest.json', 'utf8'))
let compressedJS = 0
for (const file of manifest.pages['/page'].filter(file => file.endsWith('.js'))) compressedJS += gzipSync(await readFile('.next/' + file)).length
results.push({ test: 'homepage manifest JavaScript gzip (not network benchmark)', bytes: compressedJS })
await mkdir('artifacts/creative-rebirth', { recursive: true })
await writeFile('artifacts/creative-rebirth/production-smoke.json', JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1
