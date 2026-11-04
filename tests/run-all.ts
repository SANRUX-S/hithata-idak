import { spawnSync } from "node:child_process";

console.log(">>> RUNNING SECURITY & SYSTEM SUITE...");
const res1 = spawnSync("npx", ["tsx", "tests/security-suite.ts"], { stdio: "inherit", shell: true });
if (res1.status !== 0) {
  process.exit(res1.status ?? 1);
}

console.log("\n>>> RUNNING COMMUNITY FORUM & MODERATION SUITE...");
const res2 = spawnSync("npx", ["tsx", "tests/community-suite.ts"], { stdio: "inherit", shell: true });
if (res2.status !== 0) {
  process.exit(res2.status ?? 1);
}

console.log("\n>>> ALL TEST SUITES PASSED CLEANLY! <<<");
