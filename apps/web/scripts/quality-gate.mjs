#!/usr/bin/env node
/**
 * Quality gate: typecheck → build → playwright e2e (screenshots + functional).
 * Does not mutate product features.
 */
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.join(root, "..")
const qualityDir = path.join(webRoot, "docs", "quality")
const stamp = new Date().toISOString()

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`)
  const result = spawnSync(cmd, args, {
    cwd: webRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  })
  return result.status === 0
}

fs.mkdirSync(path.join(qualityDir, "screenshots", "institutional"), { recursive: true })
fs.mkdirSync(path.join(qualityDir, "screenshots", "drive"), { recursive: true })
fs.mkdirSync(path.join(qualityDir, "reports"), { recursive: true })

const steps = []
const typecheck = run("npm", ["run", "typecheck"])
steps.push({ name: "typecheck", ok: typecheck })

const build = typecheck && run("npm", ["run", "build"])
steps.push({ name: "build", ok: build })

const driveUnit = run("npm", ["run", "test:drive"])
steps.push({ name: "test:drive (pricing/status)", ok: driveUnit })

const e2e = build && run("npx", ["playwright", "test"])
steps.push({ name: "playwright e2e", ok: e2e })

const summaryPath = path.join(qualityDir, "reports", "last-gate.json")
fs.writeFileSync(
  summaryPath,
  JSON.stringify({ stamp, steps, ok: steps.every((s) => s.ok) }, null, 2),
)

console.log("\n=== Quality gate summary ===")
for (const step of steps) {
  console.log(`${step.ok ? "PASS" : "FAIL"} — ${step.name}`)
}
console.log(`Report: ${summaryPath}`)
console.log(`Screenshots: ${path.join(qualityDir, "screenshots")}`)
console.log(`Update docs/quality/AUDIT.md with findings after reviewing captures.`)

process.exit(steps.every((s) => s.ok) ? 0 : 1)
