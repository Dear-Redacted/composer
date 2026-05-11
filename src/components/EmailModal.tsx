import { memo, KeyboardEvent } from "react";
import BaseModal from "./BaseModal";
import { isValidEmail } from "../utils/emailValidator";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
  email: string;
  onEmailChange: (email: string) => void;
};

function EmailModal({ isOpen, onClose, onSend, email, onEmailChange }: Props) {
  const isValid = isValidEmail(email);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isValid) {
      onSend();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} closeOnEsc={true}>
      <div>
        <h2 className="mb-4 text-lg font-mono text-[var(--app-fg)]">Send via Gmail</h2>
        <h3 className="mb-8 border-b border-[var(--app-border)] pb-2 text-[10px] uppercase tracking-[2px] text-[var(--app-fg-muted)]">
          Warning! This will open your default browser. Make sure to review the content before sending.
        </h3>

        <input
          type="email"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="example@example.com"
          className="mb-8 w-full border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-sm font-mono text-[var(--app-fg)] outline-none transition-colors placeholder:text-[var(--app-fg-muted)] focus:border-[var(--app-fg-muted)]"
          id="email-input"
        />

        <div className="flex gap-4">
          <button
            onClick={onSend}
            disabled={!isValid}
            className="flex-1 border border-[var(--app-border)] bg-[var(--app-bg-alt)] py-3 text-[10px] uppercase tracking-[2px] text-[var(--app-fg)] transition-colors hover:bg-[var(--app-border)] disabled:cursor-not-allowed disabled:opacity-30"
            id="modal-send"
          >
            Confirm
          </button>
          <button onClick={onClose} className="px-6 text-[10px] uppercase tracking-[2px] text-[var(--app-fg-muted)] transition-colors hover:text-red-400" id="modal-cancel">
            Abort
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default memo(EmailModal);
