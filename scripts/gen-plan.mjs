/**
 * Renders `PROJECT_PLAN.md` from the canonical backlog in `tickets.mjs`.
 *
 * Usage: `node scripts/gen-plan.mjs`
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { milestones, tickets, labels } from "./tickets.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Builds the markdown document for the project plan.
 *
 * @returns {string}
 */
function render() {
  const lines = [];
  lines.push("# Mosaic — Project Plan");
  lines.push("");
  lines.push(
    "Generated from `scripts/tickets.mjs` (run `node scripts/gen-plan.mjs`). " +
      "Epics map to GitHub Milestones; each ticket becomes an Issue with a `feature/<issue-number>-<slug>` branch.",
  );
  lines.push("");
  lines.push(
    `**Totals:** ${milestones.length} epics · ${tickets.length} tickets · ${labels.length} labels.`,
  );
  lines.push("");
  lines.push("## Labels");
  lines.push("");
  lines.push(labels.map((l) => `\`${l.name}\``).join(" · "));
  lines.push("");

  for (const m of milestones) {
    const items = tickets.filter((t) => t.milestone === m.key);
    lines.push(`## ${m.title}`);
    lines.push("");
    lines.push(`> ${m.description} — _${items.length} tickets_`);
    lines.push("");
    lines.push("| # | Ticket | Type | Branch | Labels |");
    lines.push("| - | ------ | ---- | ------ | ------ |");
    items.forEach((t, i) => {
      lines.push(
        `| ${i + 1} | ${t.title} | ${t.type} | \`${t.type}/<n>-${t.slug}\` | ${t.labels
          .map((l) => `\`${l}\``)
          .join(" ")} |`,
      );
    });
    lines.push("");
  }
  return lines.join("\n");
}

writeFileSync(join(root, "PROJECT_PLAN.md"), render() + "\n");
process.stdout.write(
  `PROJECT_PLAN.md written: ${tickets.length} tickets across ${milestones.length} milestones.\n`,
);
