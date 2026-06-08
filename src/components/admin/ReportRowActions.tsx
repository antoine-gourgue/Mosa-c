"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, ConfirmDialog, useToast } from "@/components/ui";
import { dismissReport, resolveReport } from "@/server/actions/admin";

/**
 * Props for the {@link ReportRowActions} component.
 */
export type ReportRowActionsProps = {
  reportId: string;
  pinTitle: string;
};

/**
 * Row actions for a pending report: dismiss it (keeping the pin) or resolve it
 * by removing the reported pin, which closes the report. Removal is confirmed.
 *
 * @param props - The report id and the reported pin's title.
 * @returns The report actions element.
 */
export function ReportRowActions({ reportId, pinTitle }: ReportRowActionsProps): ReactElement {
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

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
        Remove pin
      </Button>
      <ConfirmDialog
        open={confirm}
        title="Remove this pin?"
        description={`"${pinTitle}" and its likes, comments and saves will be permanently removed, closing the report.`}
        confirmLabel="Remove pin"
        destructive
        pending={pending}
        onConfirm={() => run(() => resolveReport(reportId), "Pin removed")}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
