"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * The rail panels that can slide in over the page content.
 */
export type NavPanel = "messages" | "notifications" | "create";

type NavPanelContextValue = {
  activePanel: NavPanel | null;
  /** A conversation the messages panel should open once shown (desktop entry points). */
  pendingConversationId: string | null;
  open: (panel: NavPanel, conversationId?: string) => void;
  close: () => void;
  toggle: (panel: NavPanel) => void;
  clearPendingConversation: () => void;
};

const NavPanelContext = createContext<NavPanelContextValue>({
  activePanel: null,
  pendingConversationId: null,
  open: () => {},
  close: () => {},
  toggle: () => {},
  clearPendingConversation: () => {},
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
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  const open = useCallback((panel: NavPanel, conversationId?: string): void => {
    setActivePanel(panel);
    setPendingConversationId(conversationId ?? null);
  }, []);
  const close = useCallback((): void => setActivePanel(null), []);
  const toggle = useCallback(
    (panel: NavPanel): void => setActivePanel((current) => (current === panel ? null : panel)),
    [],
  );
  const clearPendingConversation = useCallback((): void => setPendingConversationId(null), []);

  const value = useMemo<NavPanelContextValue>(
    () => ({ activePanel, pendingConversationId, open, close, toggle, clearPendingConversation }),
    [activePanel, pendingConversationId, open, close, toggle, clearPendingConversation],
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
