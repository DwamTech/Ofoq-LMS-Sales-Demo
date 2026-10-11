import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Local-only launcher. Private values live only in the child-process environment.
// Never write a signing key/password/token to source, logs, URLs or .env files.
const backend=resolve('../../Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main')
const database=process.argv[process.argv.indexOf('--database')+1]
if(!process.argv.includes('--database') || !database || !/(^|[_-])demo([_-]|$)/i.test(database)) throw new Error('Pass an explicitly verified --database NAME_demo.')
const environment={...process.env,DEMO_ENTRY_ENABLED:'true',DEMO_ENTRY_DATABASE:database,
  DEMO_ENTRY_SIGNING_KEY:randomBytes(32).toString('hex'),DEMO_ENTRY_FRONTEND_ORIGIN:'http://127.0.0.1:3004',DEMO_ENTRY_API_URL:'http://127.0.0.1:8000/api'}
const audit=spawnSync('php',['artisan','demo:entry-audit'],{cwd:backend,env:environment,encoding:'utf8',windowsHide:true})
if(audit.status!==0) throw new Error('Local demo isolation audit failed. No servers or sessions were created. '+audit.stdout)
await mkdir('artifacts/phase04',{recursive:true})
await writeFile('artifacts/phase04/isolation-audit.json',audit.stdout)
console.log('Local demo isolation verified; ephemeral server-only signing enabled for this process.')
if(process.argv.includes('--check')) process.exit(0)
const php=spawn('php',['artisan','serve','--host=127.0.0.1','--port=8000','--no-reload'],{cwd:backend,env:environment,stdio:'inherit',windowsHide:true})
const next=spawn(process.execPath,['node_modules/next/dist/bin/next',process.argv.includes('--dev')?'dev':'start','-H','127.0.0.1','-p','3004'],{env:environment,stdio:'inherit',windowsHide:true})
const stop=()=>{ for(const child of [php,next]) { if(child.pid) spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true}) } }
process.once('SIGINT',()=>{stop();process.exit(0)})
process.once('SIGTERM',()=>{stop();process.exit(0)})
process.once('exit',stop)
console.log('Gateway: http://127.0.0.1:3004/experience — public deployment remains disabled by the local-only guard.')
