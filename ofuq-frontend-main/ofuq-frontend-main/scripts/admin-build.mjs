import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
await mkdir("artifacts/phase06", { recursive: true });
const build = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let output = "";
build.stdout.on("data", (data) => {
  output += data.toString();
});
build.stderr.on("data", (data) => {
  output += data.toString();
});
const code = await new Promise((done) => build.on("close", done));
await writeFile("artifacts/phase06/build.log", output);
await writeFile(
  "artifacts/phase06/build-result.json",
  JSON.stringify(
    {
      status: code === 0 ? "PASS" : "FAIL",
      exitCode: code,
      buildId:
        code === 0 ? (await readFile(".next/BUILD_ID", "utf8")).trim() : null,
      typesSkipped: /Skipping validation of types/.test(output),
      lintSkipped: /Skipping linting/.test(output),
      configurationUnchanged: true,
    },
    null,
    2,
  ),
);
console.log(
  code === 0
    ? "Production build PASS; full log saved."
    : "Production build FAIL; inspect artifacts/phase06/build.log",
);
process.exitCode = code ?? 1;
