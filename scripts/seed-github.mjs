/**
 * Seeds the GitHub repository from the canonical backlog: labels, milestones,
 * issues and one `feature|chore|fix/<issue-number>-<slug>` branch per ticket.
 *
 * Idempotent: existing labels are updated, existing milestones reused, and
 * issues whose exact title already exists are skipped.
 *
 * Usage: `node scripts/seed-github.mjs`
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { milestones, labels, tickets } from "./tickets.mjs";

/**
 * Runs a command and returns trimmed stdout.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @returns {string}
 */
function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

/**
 * Runs a command, returning stdout or null when it exits non-zero.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @returns {string | null}
 */
function tryRun(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

const repo = JSON.parse(run("gh", ["repo", "view", "--json", "nameWithOwner,defaultBranchRef"]));
const nameWithOwner = repo.nameWithOwner;
const baseBranch = repo.defaultBranchRef?.name ?? "main";
process.stdout.write(`Seeding ${nameWithOwner} (base: ${baseBranch})\n`);

process.stdout.write("\n== Labels ==\n");
for (const l of labels) {
  run("gh", ["label", "create", l.name, "--color", l.color, "--description", l.description, "--force"]);
  process.stdout.write(`  ✓ ${l.name}\n`);
}

process.stdout.write("\n== Milestones ==\n");
const existingMilestones = JSON.parse(
  run("gh", ["api", `repos/${nameWithOwner}/milestones?state=all&per_page=100`]),
);
const milestoneTitleByKey = new Map();
for (const m of milestones) {
  const found = existingMilestones.find((e) => e.title === m.title);
  if (found) {
    process.stdout.write(`  = ${m.title} (exists)\n`);
  } else {
    run("gh", [
      "api",
      `repos/${nameWithOwner}/milestones`,
      "-f",
      `title=${m.title}`,
      "-f",
      `description=${m.description}`,
    ]);
    process.stdout.write(`  ✓ ${m.title}\n`);
  }
  milestoneTitleByKey.set(m.key, m.title);
}

process.stdout.write("\n== Issues ==\n");
const existingIssues = JSON.parse(
  run("gh", ["issue", "list", "--state", "all", "--limit", "500", "--json", "number,title"]),
);
const existingTitles = new Map(existingIssues.map((i) => [i.title, i.number]));
const tmp = mkdtempSync(join(tmpdir(), "mosaic-issues-"));

const created = [];
for (const t of tickets) {
  if (existingTitles.has(t.title)) {
    created.push({ number: existingTitles.get(t.title), ticket: t });
    process.stdout.write(`  = #${existingTitles.get(t.title)} ${t.title} (exists)\n`);
    continue;
  }
  const bodyFile = join(tmp, `${t.slug}.md`);
  writeFileSync(bodyFile, t.body);
  const args = [
    "issue",
    "create",
    "--title",
    t.title,
    "--body-file",
    bodyFile,
    "--milestone",
    milestoneTitleByKey.get(t.milestone),
  ];
  for (const label of t.labels) args.push("--label", label);
  const url = run("gh", args);
  const number = Number(url.split("/").pop());
  created.push({ number, ticket: t });
  process.stdout.write(`  ✓ #${number} ${t.title}\n`);
}

process.stdout.write("\n== Branches ==\n");
run("git", ["fetch", "origin", baseBranch]);
const baseSha = run("git", ["rev-parse", `origin/${baseBranch}`]);
for (const { number, ticket } of created) {
  const branch = `${ticket.type}/${number}-${ticket.slug}`;
  const exists = tryRun("git", ["ls-remote", "--exit-code", "--heads", "origin", branch]);
  if (exists) {
    process.stdout.write(`  = ${branch} (exists)\n`);
    continue;
  }
  run("gh", ["api", `repos/${nameWithOwner}/git/refs`, "-f", `ref=refs/heads/${branch}`, "-f", `sha=${baseSha}`]);
  process.stdout.write(`  ✓ ${branch}\n`);
}

process.stdout.write(`\nDone. ${created.length} issues processed.\n`);
