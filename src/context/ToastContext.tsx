/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../components/Toast/Toast.css";

export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant, opts?: ToastOptions) => void;
  success: (message: string, opts?: ToastOptions) => void;
  error: (message: string, opts?: ToastOptions) => void;
  info: (message: string, opts?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_DURATION = 4000;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function SingleToast({
  item,
  onDismiss,
  onUndo,
}: {
  item: ToastItem;
  onDismiss: () => void;
  onUndo?: () => void;
}) {
  return (
    <motion.li
      className={`toast toast--${item.variant}`}
      initial={{ opacity: 0, x: 56, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 56, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      layout
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <span className={`toast__icon toast__icon--${item.variant}`}>
        <ToastIcon variant={item.variant} />
      </span>

      <p className="toast__message">{item.message}</p>

      {item.onUndo && (
        <button
          className="toast__undo"
          onClick={() => {
            item.onUndo!();
            onDismiss();
          }}
          type="button"
        >
          {item.undoLabel ?? "Undo"}
        </button>
      )}

      <button
        className="toast__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        type="button"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <span
        className={`toast__progress toast__progress--${item.variant}`}
        style={{ animationDuration: `${TOAST_DURATION}ms` }}
      />
    </motion.li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", opts?: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [
        ...prev.slice(-2),
        {
          id,
          message,
          variant,
          onUndo: opts?.onUndo,
          undoLabel: opts?.undoLabel,
        },
      ]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_DURATION),
      );
    },
    [dismiss],
  );

  const success = useCallback(
    (msg: string, opts?: ToastOptions) => toast(msg, "success", opts),
    [toast],
  );
  const error = useCallback(
    (msg: string, opts?: ToastOptions) => toast(msg, "error", opts),
    [toast],
  );
  const info = useCallback(
    (msg: string, opts?: ToastOptions) => toast(msg, "info", opts),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}

      {/* Portal - renders above all other content */}
      <ul className="toast-list" aria-label="Notifications" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map((item) => (
            <SingleToast
              key={item.id}
              item={item}
              onDismiss={() => dismiss(item.id)}
            />
          ))}
        </AnimatePresence>
      </ul>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
