import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import "./Modal.css";

interface ModalProps {
  open: boolean;
  title: string;
  icon?: ReactNode;
  tone?: "default" | "danger" | "accent";
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({
  open,
  title,
  icon,
  tone = "default",
  onClose,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal_overlay" onClick={onClose}>
      <div
        className="modal_dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal_header">
          <div className="modal_title-wrap">
            {icon && (
              <span className={`modal_title-icon modal_title-icon--${tone}`}>
                {icon}
              </span>
            )}
            <h3 className="modal_title">{title}</h3>
          </div>
          <button className="modal_close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal_body">{children}</div>
        {footer && <div className="modal_footer">{footer}</div>}
      </div>
    </div>
  );
}
