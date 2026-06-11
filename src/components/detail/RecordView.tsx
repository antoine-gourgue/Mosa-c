"use client";

import { useEffect, useRef } from "react";
import { recordPinView } from "@/server/actions/analytics";

/**
 * Records a pin view once, when the detail mounts on the client. Firing on mount
 * (rather than during server render) avoids counting prefetches, and the action
 * deduplicates per viewer per day and ignores the creator's own views. Renders
 * nothing.
 *
 * @param props - The viewed pin's id.
 * @returns Null — this component has no visual output.
 */
export function RecordView({ pinId }: { pinId: string }): null {
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) {
      return;
    }
    recorded.current = true;
    void recordPinView(pinId);
  }, [pinId]);
  return null;
}
