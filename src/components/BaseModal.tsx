import { memo, ReactNode, useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  closeOnEsc?: boolean;
};

function BaseModal({ isOpen, onClose, children, closeOnEsc = true }: Props) {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
          />

          <div
            className="relative w-full max-w-sm border border-[var(--app-border)] bg-[var(--app-container)] p-8 text-[var(--app-fg)] shadow-2xl sm:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(BaseModal);
