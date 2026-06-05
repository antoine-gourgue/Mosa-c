/**
 * Creates (or reuses) a GitHub Projects v2 board and adds every repository
 * issue to it. Requires the `project` token scope:
 *
 *   gh auth refresh -s project,read:project --hostname github.com
 *
 * Usage: `node scripts/add-to-project.mjs [project title]`
 */
import { execFileSync } from "node:child_process";

/**
 * @param {string} cmd
 * @param {string[]} args
 * @returns {string}
 */
function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

const title = process.argv[2] ?? "Mosaic";
const owner = run("gh", ["api", "user", "--jq", ".login"]);
const repo = JSON.parse(run("gh", ["repo", "view", "--json", "nameWithOwner"])).nameWithOwner;

const projects = JSON.parse(run("gh", ["project", "list", "--owner", owner, "--format", "json"])).projects ?? [];
let project = projects.find((p) => p.title === title);
if (!project) {
  process.stdout.write(`Creating project "${title}"...\n`);
  project = JSON.parse(run("gh", ["project", "create", "--owner", owner, "--title", title, "--format", "json"]));
} else {
  process.stdout.write(`Reusing project "${title}" (#${project.number}).\n`);
}

const issues = JSON.parse(run("gh", ["issue", "list", "--state", "all", "--limit", "500", "--json", "number,url"]));
process.stdout.write(`Adding ${issues.length} issues to the board...\n`);
for (const issue of issues) {
  run("gh", ["project", "item-add", String(project.number), "--owner", owner, "--url", issue.url]);
  process.stdout.write(`  ✓ #${issue.number}\n`);
}
process.stdout.write(`Done. Project: https://github.com/users/${owner}/projects/${project.number}\n`);
process.stdout.write(`Repo: ${repo}\n`);
