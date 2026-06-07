"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * Per-pin engagement overrides held in the shared store. Each field, when set,
 * takes precedence over the server-rendered value so an action performed in one
 * React tree (e.g. the detail modal) is reflected in another (e.g. the grid).
 */
export type PinOverride = {
  liked?: boolean;
  likeCount?: number;
  saved?: boolean;
  commentCount?: number;
  downloadCount?: number;
};

type EngagementContextValue = {
  overrides: ReadonlyMap<string, PinOverride>;
  setLike: (pinId: string, liked: boolean, likeCount: number) => void;
  setSaved: (pinId: string, saved: boolean) => void;
  setCommentCount: (pinId: string, commentCount: number) => void;
  setDownloadCount: (pinId: string, downloadCount: number) => void;
};

const noop = (): void => {};

const EngagementContext = createContext<EngagementContextValue>({
  overrides: new Map(),
  setLike: noop,
  setSaved: noop,
  setCommentCount: noop,
  setDownloadCount: noop,
});

/**
 * Provides the shared engagement store. Mounted once above both the routed page
 * and the parallel `@modal` slot so likes, saves, comment counts and download
 * counts stay in sync between the grid and the pin detail overlay without a
 * reload.
 *
 * @param props - The subtree that reads and writes engagement state.
 * @returns The provider element.
 */
export function EngagementProvider({ children }: { children: ReactNode }): ReactElement {
  const [overrides, setOverrides] = useState<Map<string, PinOverride>>(() => new Map());

  const patch = useCallback((pinId: string, part: PinOverride): void => {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(pinId, { ...next.get(pinId), ...part });
      return next;
    });
  }, []);

  const value = useMemo<EngagementContextValue>(
    () => ({
      overrides,
      setLike: (pinId, liked, likeCount) => patch(pinId, { liked, likeCount }),
      setSaved: (pinId, saved) => patch(pinId, { saved }),
      setCommentCount: (pinId, commentCount) => patch(pinId, { commentCount }),
      setDownloadCount: (pinId, downloadCount) => patch(pinId, { downloadCount }),
    }),
    [overrides, patch],
  );

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}

const EMPTY_OVERRIDE: PinOverride = {};

/**
 * Returns the full engagement store: the overrides map and every setter. Used
 * by the grid feed, which reads many pins at once.
 *
 * @returns The engagement context value.
 */
export function useEngagement(): EngagementContextValue {
  return useContext(EngagementContext);
}

/**
 * Reads the current engagement overrides for a single pin.
 *
 * @param pinId - The pin id.
 * @returns The pin's overrides, or an empty object when none are set.
 */
export function usePinOverride(pinId: string): PinOverride {
  const { overrides } = useContext(EngagementContext);
  return overrides.get(pinId) ?? EMPTY_OVERRIDE;
}

/**
 * Returns the setters used to publish engagement changes to the shared store.
 *
 * @returns The engagement store setters.
 */
export function useEngagementActions(): Omit<EngagementContextValue, "overrides"> {
  const { setLike, setSaved, setCommentCount, setDownloadCount } = useContext(EngagementContext);
  return { setLike, setSaved, setCommentCount, setDownloadCount };
}
