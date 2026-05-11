# Dear Redacted

Dear Redacted Composer is a self-redacting text editor, designed to replace Microsoft's Notepad, Notepad++, and Word on every school computer worldwide.

The editor is artistic expression in the form of software and part our art exhibit **Dear Redacted**. It sits in Phase 3: Reintegration, Stage 5: Rebuilding and Untangling, of the trauma progression that guides the exhibit.

A digital confessional invites you in, but the computer watches exactly how you type. You may write a letter to the powerful, but be warned: the machine knows the exact words you are looking for. As soon as you type a specific name, characteristic, or crime, it vanishes behind a thick black bar, forcing you to find an entirely new way to speak.

This piece directly targets the predictable media scripts that dictate how we usually discuss sweeping scandals. By censoring specific keywords in real-time, the program pushes the visitor toward creative circumlocution. It effectively breaks the standard cycle of outrage-by-proxy. The user is required to engage their own original thought and vocabulary to successfully bypass the strict digital filter.

## Architects & Redacted

We create Dear Redacted because silence represents the final victory of power. The collective Architects & Redacted, which functions as an anonymous alliance of painters, sculptors, architects, engineers, programmers, and craftsmen, was formed in the wake of institutional collapse. For years we watched courts, journalists, and public memory fail to deliver accountability in the Epstein Files. Op-eds faded, protests were absorbed, and the public retreated into protective nihilism. Art alone remained capable of holding the wound open.

**We are the creators of the art exhibit under the name "Dear Redacted".**

The driving force of the entire exhibition is trauma progression. We do not illustrate trauma; instead, we enact its psychological architecture. Drawing directly from the established stages of trauma recovery, specifically the transition from Stabilisation to Trauma Processing and finally Reintegration, the show transforms any gallery into a guided, unidirectional journey that visitors must traverse in sequence. Six precisely calibrated stages mirror the six emotional stations of collective betrayal: Shock and Denial, Pain and Anger, Bargaining and Guilt, Depression and Isolation, Rebuilding and Working Through, and finally Acceptance, Integration, and Meaning.

Redaction serves as our central metaphor and material. Black bars become sculptural objects, interactive machines, photographic voids, and architectural barriers. Classic painting and photography sit beside mechanical installations and participatory environments. This ensures that visitors are never spectators. Rather, they become active participants in the very mechanisms of erasure. The result is neither didactic outrage nor nihilistic resignation. It is catharsis without false comfort: a space where raw anger, dark fantasy, and exhausted powerlessness are finally granted artistic form and communal release.

**Follow us at:**

X.com: https://x.com/redact_exhibit

instagram: https://www.instagram.com/dear.redacted.exhibit/

threads: https://www.threads.com/@dear.redacted.exhibit

bsky: https://bsky.app/profile/dear-redacted.bsky.social

linkedin: https://linkedin.com/in/dear-redacted

**Or support us directly on:**

patreon: https://patreon.com/DearRedacted


## Technical Notes

Dear Redacted is a custom-built writing environment with a deliberately narrow toolset: start a new draft, save locally, and send text via email. The constraints are intentional. This is not a general-purpose word processor; it is a staged writing instrument designed to pressure language and force detours around familiar narratives.

### Core Interaction Model

- Every document begins with a fixed opening prompt (`Dear`).
- The editor continuously scans typed words against a predefined keyword set.
- When a blocked word is detected, it is replaced with a same-length redaction bar using the block character (`U+2588`, `█`).
- Redacted text is irreversible in-session: deleting characters shortens the bar, but does not restore the original word.

### Why the Redaction Matters

The censorship mechanic is the artwork. Users cannot rely on default media phrasing or ready-made slogans. They must rephrase, invent, and work around linguistic dead ends in real time. The result is a writing process that shifts from repetition toward deliberate expression.

### Keyword System

The forbidden-word list is predefined and can be adapted per installation context. In production, this list should be treated as curatorial material and versioned alongside exhibit changes.

If you want to adapt the list, you will have to write your list in English and encode it with base64 and replace the current list in constants.ts

### Output and Transmission

- Drafts can be exported as text files.
- Drafts can be sent through a prefilled email composition flow.
- The visual and typographic treatment is part of the piece and should remain consistent across deployments.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the desktop+web dev shell:
   `npm run dev`
3. Start the web renderer only:
   `npm run dev:renderer`

## Builds

1. Full release build for web and desktop artifacts:
   `npm run build`
2. Static web build:
   `npm run build:web`
3. Portable Windows app:
   `npm run build:desktop`
4. Clean web output:
   `npm run clean:web`
5. Clean desktop output:
   `npm run clean:desktop`
6. Clean both web and desktop outputs:
   `npm run clean`
7. GitHub release build for Windows artifacts:
   `npm run release:desktop`

## Publishing

- Windows installer and portable artifacts are published from tagged GitHub Releases.
- Releases are currently unsigned, so Windows may show trust warnings on first launch.

---
