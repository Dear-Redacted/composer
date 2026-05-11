import { memo, useEffect, useRef } from "react";
import BaseModal from "./BaseModal";

type Props = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen?: boolean;
};

function ConfirmModal({ title = "Confirm", message = "", confirmLabel = "OK", cancelLabel = "Cancel", onConfirm, onCancel, isOpen = true }: Props) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus confirm button when modal opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <BaseModal isOpen={isOpen} onClose={onCancel} closeOnEsc={true}>
      <div>
        <h3 className="mb-4 border-b border-[var(--app-border)] pb-2 text-[10px] uppercase tracking-[2px] text-[var(--app-fg-muted)]">{title}</h3>
        <p className="mb-8 text-sm text-[var(--app-fg)]">{message}</p>

        <div className="flex gap-4">
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="flex-1 border border-[var(--app-border)] bg-[var(--app-bg-alt)] py-3 text-[10px] uppercase tracking-[2px] text-[var(--app-fg)] transition-colors hover:bg-[var(--app-border)]"
          >
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="px-6 text-[10px] uppercase tracking-[2px] text-[var(--app-fg-muted)] transition-colors hover:text-red-400">
            {cancelLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default memo(ConfirmModal);
