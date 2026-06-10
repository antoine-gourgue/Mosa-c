"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, ConfirmDialog, useToast } from "@/components/ui";
import type { AdminReportTarget } from "@/server/services";
import { dismissReport, resolveReport } from "@/server/actions/admin";

/**
 * Props for the {@link ReportRowActions} component.
 */
export type ReportRowActionsProps = {
  reportId: string;
  target: AdminReportTarget;
};

/**
 * The resolve action's label, confirm copy and success toast for a report,
 * derived from its target: pins and comments are removed, while profiles are
 * marked reviewed (admins disable accounts from the users queue).
 *
 * @param target - The report's discriminated target.
 * @returns The labels for the resolve action.
 */
function resolveCopy(target: AdminReportTarget): {
  label: string;
  title: string;
  description: string;
  success: string;
} {
  switch (target.type) {
    case "PIN":
      return {
        label: "Remove pin",
        title: "Remove this pin?",
        description: `"${target.title}" and its likes, comments and saves will be permanently removed, closing the report.`,
        success: "Pin removed",
      };
    case "COMMENT":
      return {
        label: "Remove comment",
        title: "Remove this comment?",
        description: "The comment and its replies will be permanently removed, closing the report.",
        success: "Comment removed",
      };
    default:
      return {
        label: "Mark reviewed",
        title: "Mark as reviewed?",
        description:
          "The report will be closed. Disable the account from the users queue if needed.",
        success: "Report reviewed",
      };
  }
}

/**
 * Row actions for a pending report: dismiss it (keeping the content) or resolve
 * it. Resolving removes the reported pin/comment, or marks a profile report
 * reviewed. The resolve action is confirmed.
 *
 * @param props - The report id and its target.
 * @returns The report actions element.
 */
export function ReportRowActions({ reportId, target }: ReportRowActionsProps): ReactElement {
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const copy = resolveCopy(target);

  const run = (action: () => Promise<void>, success: string): void => {
    startTransition(async () => {
      try {
        await action();
        setConfirm(false);
        show({ title: success });
        router.refresh();
      } catch (error) {
        setConfirm(false);
        show({
          title: "Action failed",
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    });
  };

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="plain"
        size="sm"
        className="text-ink-soft hover:bg-surface hover:text-ink"
        onClick={() => run(() => dismissReport(reportId), "Report dismissed")}
      >
        Dismiss
      </Button>
      <Button
        variant="plain"
        size="sm"
        className="text-accent hover:bg-accent/10"
        onClick={() => setConfirm(true)}
      >
        {copy.label}
      </Button>
      <ConfirmDialog
        open={confirm}
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.label}
        destructive
        pending={pending}
        onConfirm={() => run(() => resolveReport(reportId), copy.success)}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
