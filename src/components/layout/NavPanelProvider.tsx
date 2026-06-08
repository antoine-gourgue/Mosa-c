"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * The rail panels that can slide in over the page content.
 */
export type NavPanel = "messages" | "notifications";

type NavPanelContextValue = {
  activePanel: NavPanel | null;
  open: (panel: NavPanel) => void;
  close: () => void;
  toggle: (panel: NavPanel) => void;
};

const NavPanelContext = createContext<NavPanelContextValue>({
  activePanel: null,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

/**
 * Tracks which left-rail overlay panel (messages or notifications) is currently
 * open. Only one can be open at a time, so opening one closes the other, and
 * the {@link ContentShell} pushes the page to the right whenever any panel is
 * open.
 *
 * @param props - The wrapped subtree.
 * @returns The provider element.
 */
export function NavPanelProvider({ children }: { children: ReactNode }): ReactElement {
  const [activePanel, setActivePanel] = useState<NavPanel | null>(null);

  const open = useCallback((panel: NavPanel): void => setActivePanel(panel), []);
  const close = useCallback((): void => setActivePanel(null), []);
  const toggle = useCallback(
    (panel: NavPanel): void => setActivePanel((current) => (current === panel ? null : panel)),
    [],
  );

  const value = useMemo<NavPanelContextValue>(
    () => ({ activePanel, open, close, toggle }),
    [activePanel, open, close, toggle],
  );

  return <NavPanelContext.Provider value={value}>{children}</NavPanelContext.Provider>;
}

/**
 * Reads the rail-panel state: which panel is open and the open/close/toggle
 * controls.
 *
 * @returns The active panel and its controls.
 */
export function useNavPanel(): NavPanelContextValue {
  return useContext(NavPanelContext);
}
