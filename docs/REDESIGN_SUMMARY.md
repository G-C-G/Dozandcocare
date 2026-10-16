# Doz and CoCare Trips: UI/UX redesign summary

## What this is

The only existing "application" was the prototype saved at `prototype/driver-app-v1.html`. The repository had no other app code, backend or database. The redesign is a rebuild of that prototype in `app/` (plain HTML, CSS and JavaScript, no dependencies). It runs entirely in the browser against invented demo data. **It is not connected to a server, and it is not production software.**

Run it: open `app/index.html`. Test it: `NODE_PATH=$(npm root -g) node tests/ui.test.cjs` (needs Playwright and Chromium).

## Usability problems found in the v1 prototype

| Problem | Fix |
|---|---|
| The driver chose the contract, which sets the rate | The office assigns the contract. The driver is only asked when the office has not, and the office must confirm that choice |
| One screen mixed the phone and the office view | Separate driver (phone-first) and office (desktop and phone) experiences |
| No home screen, no "what next" | Home shows the current or next trip with one action |
| Job board did not say who could take a job | Jobs that overlap the driver's own trips are listed separately with the reason |
| No handling for losing a race, a dropped connection, an expired login | Each has a plain-language message and keeps the driver's entries |
| Office detail view showed every field as an equal card | Sections: summary, financial, mileage check, waiting, history, approval |
| No filters, no review queue, no "needs attention" | Attention list first, clickable status tiles, search and filters that persist |
| Claimed "every tap cannot be edited by the driver" | Removed. Nothing enforces it. The app now says history is not locked in the demo |
| Odometer entered with no validation | Blocks missing and lower-than-start readings with a reason |
| No onboarding, help or empty states | Added for both roles (see below) |

## What changed

- **Design system** (`app/styles.css`): spacing scale 4/8/12/16/24/32/40/48, navy and green from the updated NEMT logo (the app was first built with the earlier blue and orange logo), status always shown as icon plus word, 48px controls, visible focus, reduced-motion respected. Text and background pairs are checked for WCAG AA contrast in the tests.
- **Driver (phone):** Home, My trips, Available (only when the office allows claiming), History, Help. One action per trip stage. Confirmation after every save ("Trip started at 8:16 AM"). Waiting time is recorded with a reason and a running timer. No money amounts are shown to drivers.
- **Office:** Overview (needs your attention first, then six status tiles with definitions), Trips (search, filters, table on desktop, cards on phones), full trip record, Drivers, Contracts, Import trips, Help.
- **Trip record:** the financial section shows flat fee, miles times rate, and the total, labelled "estimated" until approved, and never as profit. The mileage check applies a stated rule (default 10%) and requires a written reason to resolve a difference. Recorded waiting is kept separate from billable waiting.
- **Onboarding, driver:** welcome, sign-in (account already created by the office), confirm details already on file, a short skippable six-step intro with examples only, then home. Reopen anytime from Help. Progress is saved.
- **Onboarding, office:** a five-step setup (organisation and job assignment, contracts with a worked example, drivers, first trips, review checklist) plus a one-line-per-section tour. Items are marked done only after they succeed. Leaving early is allowed and leaves a reminder of what is essential.
- **Drivers:** add one, import a list with preview, duplicate and format checks, invitation status.
- **Trips in:** add one by hand, or import with a template, preview, error table and confirmation. Rows that fail stay in the box to fix.
- **Help:** common questions, what to do when something fails, and a contact section that says contact details have not been configured, rather than inventing any.

## Tests

`tests/ui.test.cjs` runs 120+ checks in a real browser: the driver trip flow, claiming and a lost race, network and expired-login failures keeping entries, odometer validation, the office review, approval and import flows, both onboarding paths, empty states, contrast, touch-target size and horizontal overflow at 360, 390, 768 and 1280 pixels.

**Not done:** none of this has been tested with real drivers or administrators. Task completion, time, mistakes and confidence have not been measured. Do not call the onboarding successful until that happens (see the plan below).

## Backend and data changes still required

1. Real authentication (the demo role switch and code `123456` are stand-ins), sign-in code delivery, invitation delivery, and account recovery.
2. Server-side roles and permissions. Drivers must not be able to read financial data, other drivers' trips, or office pages. The demo does not enforce this.
3. A trip database with an append-only event log, so history cannot be edited. The demo's history is in memory.
4. Saving every action with server-side checks: the first claim wins, the driver's schedule is checked for overlap, state changes are valid, and a repeated request is ignored.
5. Contract rates with effective dates and an audit trail of changes. Financial terms editable only by authorised staff.
6. Real distance estimates from a maps service. The map and "route distance" in the demo are an illustration, not GPS.
7. Imports processed server-side with the same validation as the browser.
8. Storing onboarding progress per user instead of in the browser.
9. Data retention rules and encryption. If the business handles Medicaid trip data, confirm whether HIPAA applies before storing any real passenger information (see the platform assessment).

## Known limitations that block production use

- No server, no login, no real permissions, no persistent data. Refreshing resets all trips and drivers. Only onboarding progress is kept, in the browser.
- No messages are sent. Invitations and codes are simulated.
- Contract rates are the owner's figures and are unconfirmed. Waiting time is recorded but not charged, because no rule exists. Driver pay and margin are not tracked.
- Downloads are blocked when the demo is viewed inside claude.ai. Use Copy template there.
- Reports and invoicing are not built, so "Approved for billing" is a status, not an invoice.
- Accessibility was checked with automated tests and manual inspection. It has not been checked with a screen reader on a phone.
- The design is phone-first, but it has been tested only in desktop Chromium at phone widths, not on real devices.

## Plan to test onboarding with real people

1. Ask three drivers who have never seen the app to sign in, find the next trip, read the pickup and destination, take the next action, and find help. Do not explain anything.
2. Ask two administrators to add a driver, set a contract, add a trip, assign it, find a completed trip, and say whether it is ready for billing.
3. Record: tasks completed without help, time per task, mistakes, times they asked for help, and a 1 to 5 confidence rating after each task.
4. Change what causes hesitation, then repeat with new people.

## Calculation-only mode (added 2026-10-16)

The app now has a "What this app stores" setting on the Contracts page. **Calculation only** is the default. It holds trip ID, date, time, contract, driver, odometer and authorised miles (from the broker). It holds no passenger names or references, no addresses and no notes, and the driver is told to take pickup and destination from the broker's system. **Full trip details** restores the earlier behaviour. Tests cover both modes, including a check that no passenger, address or note data is held in any trip in calculation-only mode.

This reduces the chance that HIPAA applies. It does not remove it: the broker contract may still require a business associate agreement. Drivers need addresses to do the job, so this mode relies on the broker's system for them. See `docs/ONE_PAGER.html`.
