import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
await mkdir('artifacts/mansatak',{recursive:true});
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','build'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';
child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);
const exit=await new Promise(r=>child.on('close',r));
await writeFile('artifacts/mansatak/build.log',output);
const result={status:exit===0?'PASS':'FAIL',exitCode:exit,buildId:exit===0?(await readFile('.next/BUILD_ID','utf8')).trim():null,typesSkipped:/Skipping validation of types/.test(output),lintSkipped:/Skipping linting/.test(output)};
await writeFile('artifacts/mansatak/build-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));process.exitCode=exit??1;
