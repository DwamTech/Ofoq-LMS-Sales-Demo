import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const output='artifacts/phase04'
await mkdir(output,{recursive:true})
const files=['app/experience/page.tsx','app/api/demo-entry/route.ts','app/api/demo-entry/route.test.ts','app/login_old/page.tsx','app/register_old/page.tsx','components/experience/ExperienceGateway.tsx','components/experience/HorizonIntro.tsx','components/experience/PersonaWorlds.tsx','components/SessionGuard.tsx','components/AuthGuard.tsx','components/AdminAuthGuard.tsx','utils/demoGateway.ts','utils/demoGateway.test.ts','lib/experienceRoutes.ts','components/brand/publicRoutes.ts','components/brand/PublicShell.tsx','components/brand/ShowcaseMotion.tsx','components/brand/ProductPanel.tsx','app/page.tsx']
const run=(file,args,options={})=>spawnSync(file,args,{encoding:'utf8',maxBuffer:10_000_000,windowsHide:true,...options})
const lint=run(process.execPath,['node_modules/eslint/bin/eslint.js',...files,'-f','json'])
const lintResults=JSON.parse(lint.stdout).map(item=>({file:item.filePath.replaceAll('\\','/').split('/ofuq-frontend-main/ofuq-frontend-main/')[1],errors:item.errorCount,warnings:item.warningCount}))
const types=run(process.execPath,['node_modules/typescript/bin/tsc','--noEmit'])
const typeDiagnostics=types.stdout.split(/\r?\n/).filter(line=>line.includes('error TS'))
const baseline=JSON.parse(await readFile('artifacts/final-polish/baseline.json','utf8'))
const focused=run(process.execPath,['node_modules/jest/bin/jest.js','--runInBand','utils/demoGateway.test.ts','app/api/demo-entry/route.test.ts'])
const all=run(process.execPath,['node_modules/jest/bin/jest.js','--runInBand'])
const backend=resolve('../../Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main')
const php=run('php',['vendor/phpunit/phpunit/phpunit','tests/Feature/DemoEntryTest.php','tests/Feature/DemoModeReadOnlyTest.php'],{cwd:backend})
const pint=run('php',['vendor/bin/pint','--test','app/Support/DemoPersonas.php','app/Support/DemoEntryGuard.php','app/Console/Commands/AuditDemoEntry.php','app/Http/Controllers/DemoEntryController.php','app/Http/Middleware/RestrictDemoGatewayToken.php','tests/Feature/DemoEntryTest.php'],{cwd:backend})
const result={focusedLint:{status:lint.status===0?'PASS':'FAIL',files:lintResults},typescript:{status:types.status===0?'PASS':'FAIL',errorCount:typeDiagnostics.length,baselineCount:baseline.typeErrorCount,delta:typeDiagnostics.length-baseline.typeErrorCount,newGatewayDiagnostics:typeDiagnostics.filter(line=>files.filter(file=>!file.startsWith('components/brand')&&file!=='app/page.tsx').some(file=>line.startsWith(file))),diagnostics:typeDiagnostics},focusedJest:{status:focused.status===0?'PASS':'FAIL',output:focused.stdout+focused.stderr},fullJest:{status:all.status===0?'PASS':'FAIL',output:all.stdout+all.stderr},phpunit:{status:php.status===0?'PASS':'FAIL',output:php.stdout+php.stderr},pint:{status:pint.status===0?'PASS':'FAIL',output:pint.stdout+pint.stderr},configuration:{ignoreBuildErrors:true,ignoreDuringBuilds:true,changed:false}}
await writeFile(output+'/technical-results.json',JSON.stringify(result,null,2))
console.log(JSON.stringify({...result,typescript:{...result.typescript,diagnostics:undefined},fullJest:{status:result.fullJest.status,summary:result.fullJest.output.match(/Tests:.*|Test Suites:.*/g)}},null,2))
if(lint.status||focused.status||php.status||pint.status||result.typescript.delta>0||result.typescript.newGatewayDiagnostics.length)process.exitCode=1
