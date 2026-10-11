import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
const directory='artifacts/final-polish'
await mkdir(directory,{recursive:true})
const files=['app/page.tsx','app/community/page.tsx','app/course-details/[id]/page.tsx','app/diplomas/[slug]/page.tsx','app/diploms/[slug]/page.tsx','components/CourseSidebar.tsx','components/CourseContent.tsx','components/DiplomaCard.tsx','components/CourseCard.tsx','components/SocialMediaFloat.tsx','components/brand/PublicShell.tsx','components/brand/ProgramArtwork.tsx']
const lint=spawnSync(process.execPath,['node_modules/eslint/bin/eslint.js',...files,'-f','json'],{encoding:'utf8',maxBuffer:10_000_000})
const diagnostics=JSON.parse(lint.stdout).map(file=>({file:file.filePath.replaceAll('\\','/').split('/ofuq-frontend-main/ofuq-frontend-main/')[1],errors:file.errorCount,warnings:file.warningCount,rules:file.messages.filter(x=>x.severity===2).map(x=>x.ruleId).sort()}))
const types=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit'],{encoding:'utf8',maxBuffer:10_000_000})
const typeDiagnostics=types.stdout.split(/\r?\n/).filter(line=>line.includes('error TS'))
const result={lint:diagnostics,typeErrorCount:typeDiagnostics.length,typeDiagnostics}
const baseline=process.argv.includes('--baseline')
await writeFile(`${directory}/${baseline?'baseline':'technical-results'}.json`,JSON.stringify(result,null,2))
if(!baseline){const before=JSON.parse(await readFile(`${directory}/baseline.json`,'utf8'));result.increasedLintErrors=diagnostics.filter(x=>x.errors>(before.lint.find(y=>y.file===x.file)?.errors||0));result.typeCountDelta=result.typeErrorCount-before.typeErrorCount;await writeFile(`${directory}/technical-results.json`,JSON.stringify(result,null,2));if(result.increasedLintErrors.length||result.typeCountDelta>0)process.exitCode=1}
console.log(JSON.stringify({...result,typeDiagnostics:undefined},null,2))
