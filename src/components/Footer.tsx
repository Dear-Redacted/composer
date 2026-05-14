import { memo } from "react";
import XIcon from "../assets/icons/xtwitter.svg?react";
import InstagramIcon from "../assets/icons/instagram.svg?react";
import ThreadsIcon from "../assets/icons/threads.svg?react";
import BlueskyIcon from "../assets/icons/bluesky.svg?react";
import LinkedinIcon from "../assets/icons/linkedin.svg?react";

import GithubIcon from "../assets/icons/github.svg?react";
import DonateIcon from "../assets/icons/donate.svg?react";

{
  /* Utility Icons */
}
import ThemeIconLight from "../assets/icons/utils/theme-light.svg?react";
import ThemeIconDark from "../assets/icons/utils/theme-dark.svg?react";

import NewDocIcon from "../assets/icons/utils/new-doc.svg?react";
import OpenDocIcon from "../assets/icons/utils/open-doc.svg?react";
import SaveDocIcon from "../assets/icons/utils/save-doc.svg?react";
import EmailDocIcon from "../assets/icons/utils/email-doc.svg?react";

type Theme = "dark" | "light";

type Props = {
  deviationDetected: boolean;
  theme: Theme;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onOpenEmailModal: () => void;
  onToggleTheme: () => void;
};

function Footer({
  deviationDetected,
  theme,
  onNew,
  onOpen,
  onSave,
  onOpenEmailModal,
  onToggleTheme,
}: Props) {
  return (
    <>
      <div className="footer-nav grid gap-4 border-t border-[var(--app-border)] pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3">
          <button
            onClick={onNew}
            className="
                    group
                    flex
                    sm:h-auto sm:w-auto
                    items-center
                    justify-center
                    gap-2
                    text-[11px]
                    uppercase
                    tracking-[1.5px]
                    text-[var(--app-fg-muted)]
                    transition-colors
                    hover:text-[var(--app-fg)]
                "
                id="nav-new"
          >
            {/* Mobile Icon */}
            <NewDocIcon className="svg-icon sm:hidden" />
            {/* Desktop Dot */}
            <span className="hidden sm:block h-1.5 w-1.5 rounded-full border border-current transition-colors group-hover:bg-[var(--app-fg)]" />
            {/* Desktop Text */}
            <span className="hidden sm:inline">New Document</span>
          </button>
          <button
            onClick={onOpen}
            className="
                    group
                    flex
                    sm:h-auto sm:w-auto
                    items-center
                    justify-center
                    gap-2
                    text-[11px]
                    uppercase
                    tracking-[1.5px]
                    text-[var(--app-fg-muted)]
                    transition-colors
                    hover:text-[var(--app-fg)]
                "
                id="nav-open"
          >
            <OpenDocIcon className="svg-icon sm:hidden" />
            <span className="hidden sm:block h-1.5 w-1.5 rounded-full border border-current transition-colors group-hover:bg-[var(--app-fg)]" />
            <span className="hidden sm:inline">Open Document</span>
          </button>
          <button
            onClick={onSave}
            className="
                    group
                    flex
                    sm:h-auto sm:w-auto
                    items-center
                    justify-center
                    gap-2
                    text-[11px]
                    uppercase
                    tracking-[1.5px]
                    text-[var(--app-fg-muted)]
                    transition-colors
                    hover:text-[var(--app-fg)]
                "
                id="nav-save"
          >
            <SaveDocIcon className="svg-icon sm:hidden" />
            <span className="hidden sm:block h-1.5 w-1.5 rounded-full border border-current transition-colors group-hover:bg-[var(--app-fg)]" />
            <span className="hidden sm:inline">Save Document</span>
          </button>
          <button
            onClick={onOpenEmailModal}
            className="
                    group
                    flex
                    sm:h-auto sm:w-auto
                    items-center
                    justify-center
                    gap-2
                    text-[11px]
                    uppercase
                    tracking-[1.5px]
                    text-[var(--app-fg-muted)]
                    transition-colors
                    hover:text-[var(--app-fg)]
                "
                id="nav-send"
          >
            <EmailDocIcon className="svg-icon sm:hidden" />
            <span className="hidden sm:block h-1.5 w-1.5 rounded-full border border-current transition-colors group-hover:bg-[var(--app-fg)]" />
            <span className="hidden sm:inline">Send via e-mail</span>
          </button>

        </div>
      </div>

      {/* Footer Social Links & Download */}
      <div className="footer-social flex flex-wrap items-center justify-between gap-4 border-t border-[var(--app-border)] pt-5">
        <div className="flex flex-wrap items-center gap-3 py-1 text-[var(--app-fg-muted)]">
          <a
            href="https://github.com/Dear-Redacted"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 hover:opacity-100 transition-opacity"
            title="GitHub"
          >
            <GithubIcon className="svg-icon" />
          </a>
          <a
            href="https://www.instagram.com/dear.redacted.exhibit/"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 transition-opacity hover:opacity-100"
            title="Instagram"
          >
            <InstagramIcon className="svg-icon" />
          </a>
          <a
            href="https://www.threads.com/@dear.redacted.exhibit"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 transition-opacity hover:opacity-100"
            title="Threads"
          >
            <ThreadsIcon className="svg-icon" />
          </a>
          <a
            href="https://bsky.app/profile/dear-redacted.bsky.social"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 transition-opacity hover:opacity-100"
            title="Bluesky"
          >
            <BlueskyIcon className="svg-icon" />
          </a>
          <a
            href="https://x.com/redact_exhibit"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 transition-opacity hover:opacity-100"
            title="X (Twitter)"
          >
            <XIcon className="svg-icon" />
          </a>
          <a
            href="https://linkedin.com/in/dear-redacted"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 transition-opacity hover:opacity-100"
            title="Linkedin"
          >
            <LinkedinIcon className="svg-icon" />
          </a>
          <a
            href="https://patreon.com/DearRedacted"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 transition-opacity hover:opacity-100"
            title="Donate"
          >
            <DonateIcon className="svg-icon" />
          </a>
        </div>

        <div className="justify-self-end flex items-center gap-2 text-right text-[9px] uppercase tracking-[1.5px] text-[var(--app-fg-muted)] ">
          {typeof window !== "undefined" && !window.redactedComposer ? (
            <button
              onClick={() =>
                window.open(
                  "https://github.com/Dear-Redacted/Composer/releases/latest",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="w-full sm:w-auto inline-flex rounded-full border border-[var(--app-border)] px-3 py-2 text-[var(--app-fg-muted)] transition-colors hover:border-[var(--app-fg-muted)] hover:text-[var(--app-fg)] opacity-90 transition-opacity group-hover:opacity-100"
            >
              Download Composer
            </button>
          ) : null}

          <button
            onClick={onToggleTheme}
            className="group inline-flex items-center justify-center rounded-full border border-[var(--app-border)] px-3 py-2 text-[var(--app-fg-muted)] transition-colors hover:border-[var(--app-fg-muted)] hover:text-[var(--app-fg)]"
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            aria-pressed={theme === "light"}
            title={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            id="theme-toggle"
          >
            {theme === "dark" ? (
              <ThemeIconLight
                className="h-3.5 w-3.5 opacity-90 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            ) : (
              <ThemeIconDark
                className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default memo(Footer);
