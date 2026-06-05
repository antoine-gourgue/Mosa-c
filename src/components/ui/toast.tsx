"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Optional call-to-action rendered inside a toast.
 */
export type ToastAction = {
  label: string;
  onClick: () => void;
};

/**
 * Content and behavior of a single toast notification.
 */
export type ToastOptions = {
  title: string;
  description?: string;
  img?: string;
  action?: ToastAction;
  duration?: number;
};

type ToastContextValue = {
  show: (options: ToastOptions) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3200;

/**
 * Accesses the toast controller. Must be called within a {@link ToastProvider}.
 *
 * @returns The `show` and `dismiss` controls.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return ctx;
}

type ToastViewportProps = {
  toast: ToastOptions | null;
  onDismiss: () => void;
};

/**
 * Renders the currently visible toast at the bottom center of the screen.
 *
 * @param props - The active toast and the dismiss handler.
 * @returns The toast element, or null when nothing is shown.
 */
function ToastViewport({ toast, onDismiss }: ToastViewportProps): ReactElement | null {
  if (toast === null) {
    return null;
  }
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-7 z-[100] flex justify-center px-4"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink p-2 pr-3 text-bg shadow-pop">
        {toast.img !== undefined ? (
          <Image
            src={toast.img}
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-xl object-cover"
          />
        ) : null}
        <div className="flex flex-col pl-1">
          <span className="text-sm font-semibold">{toast.title}</span>
          {toast.description !== undefined ? (
            <span className="text-xs text-bg/70">{toast.description}</span>
          ) : null}
        </div>
        {toast.action !== undefined ? (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="ml-2 h-9 cursor-pointer rounded-full bg-bg px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface"
          >
            {toast.action.label}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className={cn(
              "ml-1 grid size-8 cursor-pointer place-items-center rounded-full text-lg leading-none",
              "text-bg/70 transition-colors duration-150 hover:bg-white/10 hover:text-bg",
            )}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Provides the toast controller and renders a single, auto-dismissing toast.
 * Showing a new toast replaces any visible one and resets the timer.
 *
 * @param props - Provider props.
 * @param props.children - The subtree that can call {@link useToast}.
 * @returns The provider wrapping its children and the toast viewport.
 */
export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setToast(null);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    setToast(options);
    timer.current = setTimeout(() => setToast(null), options.duration ?? DEFAULT_DURATION);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
