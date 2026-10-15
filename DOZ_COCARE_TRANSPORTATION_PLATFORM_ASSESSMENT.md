# Doz and CoCare LLC — Transportation Management Platform Assessment

**Prepared for:** Business owner, Doz and CoCare LLC
**Prepared:** 2026-10-15
**Status:** Preliminary. Most inputs that decide this question have not been provided yet.

**Label key used throughout**

| Label | Meaning |
|---|---|
| **[OWNER]** | Provided by the owner, not independently verified |
| **[VERIFIED]** | Confirmed from a cited public source (see Section 20) |
| **[ASSUMPTION]** | Unverified; must be confirmed |
| **[ILLUSTRATIVE]** | Made-up number used to show how the maths works. Not a fact about this business and not a quote |
| **[REC]** | Recommendation |
| **[?]** | Open question for the owner |

---

## 1. Executive summary

- **Do not commission a custom application now.** There is no documented problem, no trip volume, no baseline of admin hours or error costs, and no maintenance owner. Without those, a custom build cannot be justified. [REC]
- The transportation work is a side line of a home-care company. The most likely best-value path is: **(1) a well-structured spreadsheet or small no-code database with contract-rate logic, (2) a 60–90 day measured pilot, (3) test one or two existing NEMT/dispatch products only if the pilot shows real pain.** [REC]
- Custom software only wins if volume is high enough that measurable benefits exceed roughly **$1,500+/month** (illustrative break-even, Section 11). A fleet of 6–10 drivers is unlikely to reach this unless volume or error losses are far larger than expected. [ILLUSTRATIVE]
- **Two facts about the business conflict and must be resolved first:** the request describes both "non-medical transportation" and Medicaid **NEMT**. NEMT brings Medicaid enrolment, broker/trip-data rules, and likely HIPAA obligations. This changes software choice and cost materially.
- The contract rates ($13.50 + $1.60/mi; $15.00 + $1.75/mi) are **not confirmed** as revenue, driver pay, or something else. No margin can be calculated until this is known.
- The 6–10 driver figure is **unconfirmed**. The ~30 workers the owner mentioned are home-care staff and are **excluded** from scope unless the owner says otherwise.

---

## 2. Preliminary recommendation

**Outcome B — pilot a lightweight solution — conditional on discovery confirming real admin pain. If discovery shows low volume and little pain, Outcome A (do not build; use a clean spreadsheet).** Outcome C (custom) is **not supported by current evidence**.

| Step | Action | Cost posture |
|---|---|---|
| 1 | Owner completes Section 6 questionnaire; export 1–3 months of real trip data | Time only |
| 2 | Build a rate-calculating spreadsheet (Section 4 spec) using de-identified data | Near zero |
| 3 | Run it in parallel with the current process for 60–90 days; log hours and errors | Near zero |
| 4 | If pain persists, trial 1–2 commercial products using real trip files | Free trials / low monthly |
| 5 | Revisit custom only if Section 12 Outcome C evidence exists | Decision gate |

**Weakest assumption in this recommendation:** that trip volume is small enough for a spreadsheet to cope. If the business handles several hundred trips a week, or must ingest broker data daily, spreadsheets become fragile and a commercial product becomes more attractive sooner.

---

## 3. Confirmed business information

| Item | Status | Detail |
|---|---|---|
| Legal name | [OWNER] | Doz and CoCare LLC (logo reads "Doz and Co Care LLC.") |
| Core business | [OWNER] | Home-care business that also offers transportation |
| Home-care workforce | [OWNER] | ~30 workers — **not** assumed to be drivers or platform users |
| Service description | [OWNER] | Marketing text says NEMT to Medicaid appointments; the instruction also says "non-medical transportation". **Conflict — unresolved** |
| Contract A | [OWNER] | $13.50 flat + $1.60/mile |
| Contract B | [OWNER] | $15.00 flat + $1.75/mile |
| Location | [ASSUMPTION] | North Carolina "believed". A web search found **no** North Carolina Secretary of State registration under the exact name "Doz and Co Care LLC" (nearest result was an unrelated entity). The name may be registered differently or elsewhere. **Not verified.** |
| Branding | [OWNER] | Logo supplied (blue heart, orange hands). Not relevant to the build decision; usable on reports and driver pages later |

---

## 4. Unknown information and assumptions

| # | Unknown | Why it matters |
|---|---|---|
| U1 | Medical (NEMT/Medicaid) vs non-medical service | Decides HIPAA exposure, enrolment, broker systems, software shortlist |
| U2 | State and licensing | Rules are state-specific |
| U3 | Number of transportation drivers (6–10 is a guess) | Per-driver pricing, scope |
| U4 | Trips per day/week/month | Single biggest driver of whether software pays back |
| U5 | Whether $13.50/$15.00 and $1.60/$1.75 are revenue, driver pay, or both | No margin can be computed without it |
| U6 | Who the contract counterparties are (broker, managed-care plan, county DSS, other) | Determines trip-data source, required reports, mandated systems |
| U7 | Whether flat fee and mileage are both payable on every trip | The formula is an example only |
| U8 | Other charges: wait time, cancellations, no-shows, returns, admin fees | Changes the calculation spec |
| U9 | Current tools (spreadsheets, paper, existing software) | Determines migration effort |
| U10 | Whether admin staff/software are shared with home care | May reduce incremental cost or enable reuse |
| U11 | Budget (initial and monthly) | Eliminates options |
| U12 | Who would maintain any system | Custom software without an owner is a liability |

---

## 5. Contract pricing and calculation examples

**Worked examples** — *[ILLUSTRATIVE]; they assume flat fee + per-mile both apply, which is unconfirmed.*

Formula: `Trip amount = Flat fee + (Billable miles × Rate per mile)`

| Billable miles | Contract A ($13.50 + $1.60/mi) | Contract B ($15.00 + $1.75/mi) | B − A |
|---:|---:|---:|---:|
| 5 | $21.50 | $23.75 | $2.25 |
| 10 | $29.50 | $32.50 | $3.00 |
| 20 | $45.50 | $50.00 | $4.50 |
| 30 | $61.50 | $67.50 | $6.00 |

**Do not read these as profit.** If drivers are paid per trip/mile, fuel, vehicle costs, insurance, and admin all come out of this amount. The contract amounts are, at best, *gross revenue per trip* — and only if the owner confirms the rates are what the company receives.

**What a typical question looks like once confirmed:** a per-trip table with three separate figures — **revenue billed**, **driver cost**, **other direct cost** — and margin as the remainder.

---

## 6. Owner discovery questionnaire

Mark unknown answers as **Unknown**. Do not guess.

**A. The business and contracts**
1. Is the transportation Medicaid NEMT, non-medical, or both? Who pays — a broker, managed-care plan, county DSS, private pay?
2. In which state(s) do you operate? Under what licences/enrolments (e.g., Medicaid provider enrolment, DSS vehicle certification)?
3. Are Contract A and B revenue to the company, driver pay, or both? Does either include other fees?
4. What does "administrative fee" mean — a deduction by the payer, a fee you charge, or a driver deduction?
5. Do the contracts differ in rules beyond rates (eligible trip types, mileage rounding, cancellation pay, reporting format)?

**B. Volume and people**
6. Trips per day / week / month, by contract?
7. How many drivers? Full-time, part-time, own vehicles or company vehicles?
8. How many people schedule, bill, and administer transportation? Are they also doing home-care admin?
9. Weekly hours spent on: scheduling, mileage checking, payment/invoice reconciliation, report preparation, fixing errors?
10. How often do scheduling errors, mileage disputes, payment errors, or missed trips occur? What is the dollar cost of each?

**C. Systems and data**
11. What tools are used now (spreadsheets, paper, phone, email, a payer portal)?
12. Where do trip requests come from? In what format (portal, email, spreadsheet, phone, API)?
13. Do you have to use any payer-mandated system or portal?
14. Can you export 1–3 months of trip history with passenger identifiers removed?
15. Do you share software, accounts, or admin staff with the home-care business?

**D. Operations**
16. Is real-time GPS required by any contract, or is recorded/verified mileage enough?
17. Do drivers have smartphones they will use? Will they use their own?
18. What scheduling restrictions exist (days of week, hours, recurring trips)?
19. Who needs information shared with them (passengers, facilities, payers), and what?
20. What reports are required, how often, in what format, and who receives them?

**E. Money and ownership**
21. What is the available initial budget?
22. What is the maximum acceptable monthly cost?
23. Who will maintain the system and respond when it breaks?
24. What is the cost of the *current* process in staff time, errors, and unbilled trips?

---

## 7. Current workflow and problem assessment

**Honest status:** no problems have been documented. The table below lists *candidate* problems. Each is [?] until the owner confirms it is real, frequent, and costly.

| Task | Possible pain | Needed in a first version? |
|---|---|---|
| Receiving requests | Multiple channels, re-keying | Only if volume is high or sources are inconsistent |
| Passenger and address records | Typos, PHI exposure | Minimal data only |
| Scheduling and driver assignment | Double-booking, conflicts | Probably — a shared calendar/sheet may suffice |
| Recurring trips | Manual re-entry weekly | Useful only if recurring trips are common |
| Completed/cancelled/missed tracking | Billing disputes | Yes — status column |
| Billable mileage | Disputes, missing data | Yes — highest financial risk |
| Applying correct contract rate | Wrong rate applied | Yes — easy to automate in a spreadsheet |
| Reconciling against payer remittances | Underpayments unnoticed | Likely high value |
| Driver compensation | Calculation errors | Only if pay is per trip/mile |
| Partner reports | Time-consuming | Depends on format required |
| Audit/compliance records | Missing documentation | Depends on contract |
| Driver communication | Missed changes | Group messaging may suffice |
| Real-time GPS | None identified | **No — not justified without a contract requirement** |

**Pattern to watch for:** most small operators' costs are in **mileage disputes and unbilled/underpaid trips**, not in scheduling effort. If true here, the fix is a reconciliation process, not a dispatch app. [ASSUMPTION — based on general industry pattern, unverified for this business]

---

## 8. Existing software and competitor research

**Important:** vendor pricing for NEMT products is mostly **not public**. The searches done for this assessment returned vendor-authored comparison articles, not price lists. No NEMT product price below is verified. [VERIFIED where marked; otherwise unknown]

### 8.1 NEMT / dispatch products (vendors named in search results)

| Product | Positioning (per third-party descriptions) | Price | Evidence |
|---|---|---|---|
| TripMaster | Described as a common starting point for providers moving off spreadsheets | Not found | Vendor-style comparison article ([Mindbowser](https://www.mindbowser.com/top-nemt-software-comparison/)) |
| RoutingBox | Described as popular with small fleets needing basic dispatch + driver mobile app | Not found | Same article |
| RouteGenie | Described as suited to larger, multi-site operators | Not found | [SourceForge listing](https://sourceforge.net/software/product/Pathwise/) |
| MediRoutes, Moovs, NEMT Cloud Dispatching, NEMT Platform | Listed for providers/startups | Not found | [Fit-Gap](https://us.fitgap.com/products/momentm-technologies), [Capterra listing](https://www.capterra.com/p/238071/NEMT-Platform/) |

**Pricing models described by vendors:** subscription tiers, flat fees, or per-user pricing; cost generally rises with vehicles, monthly trips, and admin users; API/EHR integrations may cost extra ([MediRoutes](https://mediroutes.com/blog/nemt-scheduling-software), [NEMT Platform](https://nemtplatform.com/blogs/nemt-software-pricing-a-guide-to-understanding-costs)). These are sources with a commercial interest.

**Key caveat:** vendors claim broker-system and Medicaid billing integrations, but support varies by state and broker. **No evidence was found that any product handles NC broker trip imports or this company's two rate structures out of the box.** This must be tested with a demo using real files.

### 8.2 General field-delivery tools

| Product | Price [VERIFIED via secondary source, may be outdated] | Fit |
|---|---|---|
| Onfleet | ~$619/mo (2,500 tasks), ~$1,349/mo (5,000), by task volume; telephony extra ([Upper blog](https://www.upperinc.com/blog/onfleet-pricing/), [Capterra](https://capterra.com/p/142633/Onfleet/) — competitor-authored, check vendor) | Built for delivery, not passenger or Medicaid workflows. Likely poor fit and expensive for this size |

### 8.3 Low-code / spreadsheet tools

| Tool | Price | Notes |
|---|---|---|
| Airtable | Team $20/user/mo, Business $45/user/mo, billed annually; Free tier exists; only editors are billed; read-only users and form submissions are free on Team/Business ([Airtable pricing page](https://www.airtable.com/pricing)) | Per-seat pricing suits a tiny admin team. **Whether a HIPAA BAA is available on which tier was not verified.** |
| Google Sheets / Excel | Generally low cost | **If PHI is stored, confirm the vendor will sign a BAA on your plan — not verified here** |
| Google Maps Routes API | Distance Matrix/Directions: first 10,000 billable requests/month free, then $5.00 per 1,000 up to 100K ([Google pricing](https://developers.google.com/maps/billing-and-pricing/pricing)) | Only relevant if mileage is computed automatically. At hundreds of trips/month, likely inside the free allowance [ASSUMPTION] |

### 8.4 Feature vs. fit

A product "offering" contract-specific billing is not the same as supporting **two flat-fee-plus-mileage contracts with your rounding, cancellation, and report rules**. Test with real files before believing a feature list. Extra setup, professional services, or custom integration fees can erase the saving versus a spreadsheet.

---

## 9. Comparison of alternative approaches

Evidence level: ● verified · ○ vendor claim / unverified · ? unknown

| Criterion | Existing product (NEMT/dispatch) | Spreadsheet or no-code | Custom application |
|---|---|---|---|
| Initial cost | ? Not public; setup fees possible | Near zero to low (hours of work) | Highest; see Section 10 (illustrative) |
| Monthly/annual cost | ? Not public; scales with trips/vehicles/admins ○ | Free to ~$20/editor/mo (Airtable, ●) | Hosting + maintenance + support |
| Driver accounts | ○ Usually included | Weak; drivers often get a shared/read-only view or form | Whatever is built |
| Scheduling & dispatch | ○ Strong | Basic: sheet/calendar, manual conflict checks | Whatever is built |
| Contract-specific rates | ? Must be tested | Easy: lookup table by contract | Easy, but so is a spreadsheet |
| Mileage recording | ○ Usually via GPS/trip logs | Manual entry or Maps API | Custom |
| GPS | ○ Common | Not included | Costly and privacy-sensitive |
| Spreadsheet/CSV import | ○ Varies | Native | Must be built |
| Financial reports | ○ Varies; may not match payer format | Fully flexible | Fully flexible, built at cost |
| Privacy & security | Vendor-managed; ask for BAA/SOC 2 | Depends on tool tier | **You** own the whole burden |
| Setup effort | Medium (data migration, training) | Low | High |
| Ongoing maintenance | Vendor | You (light) | You (heavy) |
| Vendor dependency | High | Low–medium | Developer dependency |
| Ability to customise | Limited | High | Highest |
| Suitability for 6–10 drivers | ○ Plausible if volume warrants | **Likely best starting point** | Unlikely to be cost-justified |

---

## 10. Preliminary cost estimates with sources and caveats

All **[ILLUSTRATIVE]** unless a source is shown. **None of these is a quote.** Get written quotes before relying on any.

| Cost item | Spreadsheet / no-code | Existing NEMT product | Custom build |
|---|---|---|---|
| One-time setup/dev | $0–$1,500 (own time or a few freelancer hours) | $0–$2,000 (setup/training; unknown) | $15,000–$60,000 (small web app with admin + driver web view) |
| Software/subscription | $0–$40/mo (Airtable Team × 2 editors = $40/mo ● at $20 each, annual billing) | $150–$600/mo (placeholder; real price unknown) | $0 |
| Hosting/database | included | included | $50–$150/mo |
| Maps API | Usually $0 inside free tier ● (see 8.3) | included/extra | $0–$50/mo |
| SMS/notifications | $0 | extra possible | $10–$50/mo |
| Security/privacy work | Low (config + policy) | Vendor + due diligence | **Significant**: pen-test, encryption, audit logs, backups |
| Data migration/testing | Low | Medium | Medium–high |
| Maintenance/bug fixes/updates | Owner's time | Included | Rule of thumb 15–20% of build cost per year [ASSUMPTION] ≈ $190–$1,000/mo |
| Support/recovery | Owner | Vendor | Developer retainer or in-house |

**What the owner should not assume:** hosting is the small part. The big recurring costs of custom software are the person who fixes it, security upkeep, and the risk that a wrong calculation goes unnoticed.

---

## 11. Financial feasibility model

### 11.1 Formulas (from the brief)

- **Monthly net benefit** = Measurable monthly savings + Recovered revenue contribution − New monthly operating cost
- **First-year net benefit** = First-year measurable benefits − Total first-year solution cost
- **Payback (months)** = Initial investment ÷ Monthly net benefit *(use only if net benefit is positive and stable)*

### 11.2 Scenarios — **[ILLUSTRATIVE ONLY, not facts about this business]**

Assumptions: admin time valued at $18/hour loaded [ASSUMPTION]; average trip ≈ 12 miles on Contract A ≈ $32.70 gross [ILLUSTRATIVE]; software reduces admin hours and recovers a share of under-billed trips.

| | Low | Middle | High |
|---|---:|---:|---:|
| Trips/month | 200 | 600 | 1,500 |
| Admin hours saved/month | 10 | 25 | 50 |
| Value of hours saved | $180 | $450 | $900 |
| Gross billings (trips × $32.70) | $6,540 | $19,620 | $49,050 |
| Recovered revenue (0% / 1% / 2%) | $0 | $196 | $981 |
| **Total monthly benefit** | **$180** | **$646** | **$1,881** |

**Options against each scenario** (initial / monthly):

| Option | Low net/mo | Mid net/mo | High net/mo | Payback (L / M / H) | First-year net (L / M / H) |
|---|---:|---:|---:|---|---|
| No-code pilot ($1,500 / $60) | $120 | $586 | $1,821 | 12.5 / 2.6 / 0.8 mo | −$60 / $5,532 / $20,352 |
| Commercial NEMT ($1,000 / $300) | −$120 | $346 | $1,581 | never / 2.9 / 0.6 mo | −$2,440 / $3,152 / $17,972 |
| Custom ($30,000 / $700) | −$520 | −$54 | $1,181 | never / never / 25.4 mo | −$36,240 / −$30,648 / −$15,828 |

**How to read this:** under these made-up numbers, custom software only pays back in the High scenario, and still loses money in year one. A cheaper tool captures most of the benefit.

### 11.3 Break-even for a custom build

For a $30,000 build with $700/month running cost over 36 months: total cost ≈ $55,200, or **~$1,533/month** of measurable benefit required. At $18/hour that is **~85 saved hours/month** (roughly half a full-time employee) or equivalent recovered revenue. [ILLUSTRATIVE]

### 11.4 Warning: time saved is not cash saved

Hours saved are only a cash benefit if they **prevent a hire, remove paid overtime, or free capacity the business will actually use** (for example, billing more trips). Otherwise they are a convenience. Count only benefits you can point to on a payroll or invoice.

### 11.5 What the owner must supply to replace the illustrative numbers
Trips/month, admin hours/week by task, hourly cost of those staff, error and missed-billing counts, and the dollar value of each.

---

## 12. Build-versus-buy decision framework

### Outcome A — Do not build custom software
**Choose this when any of these hold:**
- Existing products or a spreadsheet meet the needs reliably.
- Trip volume is low (e.g., a few trips per day) and manual work is cheap.
- The owner cannot name a measurable problem or put a dollar value on it.
- No budget or person exists to maintain the system after launch.
- Requirements cannot be stated clearly.
- The app would duplicate a payer-mandated system.

**Action:** structured spreadsheet + written procedures + monthly reconciliation + a backup routine.

### Outcome B — Pilot a lightweight solution
**Choose this when** pain is real but unquantified, or an existing tool looks close to fitting.

**Pilot design (60–90 days):**
- Tool: spreadsheet or Airtable with Contract table, Trip table, Driver table (Section 13 columns).
- Scope: one contract or one month of trips; run in parallel with the current process.
- Measure: weekly admin hours, calculation mismatches versus payer remittances, duplicate/missed trips, report preparation time.
- **Go-further trigger:** pilot shows ≥ X hours saved or ≥ Y errors prevented (set X and Y *after* baseline exists; Section 17).
- **Stop trigger:** no measurable improvement or privacy concerns cannot be resolved.

### Outcome C — Consider custom
**Only if all are documented:**
1. Problem is written down and measured over at least 2–3 months.
2. At least two commercial products were trialled with real data and failed on specific, important requirements.
3. Projected benefits exceed total cost (initial + recurring) with margin, using owner-supplied figures.
4. Owner approves scope, budget, and recurring costs in writing.
5. Named maintenance and support owner, with a response-time agreement.
6. Security/privacy plan and data-ownership terms are in place (Sections 14–15).

---

## 13. Minimum viable product specification (only if Outcome C is reached)

**Not recommended to build now.** Included so that, if justified, scope is capped. It is also the **specification for the spreadsheet pilot**.

### 13.1 Essential data (one row per trip)

| Field | Notes |
|---|---|
| Trip ID | Unique; supports duplicate checks |
| Contract ID | A or B; drives rates |
| Driver ID | |
| Trip date / time | |
| Pickup / drop-off | Minimum necessary; avoid medical detail |
| Status | Scheduled, completed, cancelled, no-show, disputed |
| Billable miles | Approved value + source (odometer, Maps, payer) |
| Flat fee, per-mile rate | Looked up from Contract table, with effective dates |
| Additional charges, deductions | With reason |
| Revenue billed | Formula below |
| Driver pay | If applicable |
| Invoice/payment status | |
| Correction note, who, when | Mandatory for manual changes |

**Formula (use only after owner confirms it matches the contracts):**
`Trip total = Flat fee + (Approved billable miles × Mileage rate) + Approved additional charges − Applicable deductions`

Keep **revenue, driver expense, other expense, and margin as separate columns.**

### 13.2 Rules requiring owner approval before implementation

| Situation | Decision needed |
|---|---|
| Missing mileage | Block the trip, estimate, or hold? |
| Wrong contract assigned | Who may correct; how to re-price |
| Duplicate trips | Match rule (date + passenger + addresses)? |
| Cancellations / no-shows | Is flat fee payable? Mileage? |
| Multi-leg and return trips | One flat fee per leg or per journey? |
| Waiting time | Billable? At what rate and increments? |
| Rounding | Miles to 0.1? Currency rounding point? |
| Manual corrections | Approval and audit trail |
| Retroactive rate changes | Effective-dated rates; recalc history or not |
| Disputed trips | Hold from invoice until resolved |

### 13.3 Features: essential vs. optional

| Essential | Optional / later | Excluded unless a contract requires it |
|---|---|---|
| Admin login, driver list, contract rate table | Recurring trip templates | Real-time GPS |
| Trip entry, assignment, status | Driver mobile web view | Route optimisation |
| Mileage entry/approved import | Automated reminders | Native mobile apps |
| Duplicate checks, audit history | CSV import | Passenger notifications |
| Reports: by contract, by driver, unassigned, cancelled, disputed, reconciliation | Dashboards | Complex dashboards |

**Do drivers need an app?** Probably not. A mobile-friendly web page or a form is likely enough. [REC]

---

## 14. Data security and compliance considerations

**Do not assume.** What applies depends on U1 and U6.

**If non-medical only and no health information is handled:** HIPAA is unlikely to apply, but treat passenger names and addresses as sensitive personal data anyway.

**If Medicaid NEMT (as the marketing text suggests):**
- [VERIFIED] In North Carolina, any vendor providing NEMT must enrol as a Medicaid provider through NCTracks; some taxonomy codes require an NEMT Provider/Broker Attestation; vans require DSS certification; site visits are required ([NC Medicaid letter](https://medicaid.ncdhhs.gov/documents/files/dear-county-letter-2016-03-02-0/open), [NCTracks](https://www.nctracks.nc.gov/content/public/providers/provider-communications/2021-Announcements/NC-Medicaid-Non-Emergency-Medical-Transportation--NEMT--Provider-Broker-Attestation-Form-Now-Available.html)). **These sources are 2016–2021; check current rules.**
- [VERIFIED] NC Medicaid Standard and Tailored Plans use statewide NEMT brokers; Medicaid Direct members are served via county DSS ([NC Medicaid fact sheet](https://medicaid.ncdhhs.gov/ncmt-fact-sheet-nemt-part-1/open)). **Which broker(s) are current was not confirmed.**
- **HIPAA:** Washington's health authority treats its NEMT brokers as business associates ([WA HCA](https://www.hca.wa.gov/assets/billers-and-providers/hipaa_business_associates.pdf)). Vendor blogs say a transport provider that handles trip data for a broker or plan may be a business associate; this is **secondary, not HHS guidance**. The official HHS business-associate page could not be retrieved in this research. **Whether Doz and CoCare is a covered entity or business associate depends on its contracts. Confirm with counsel or the payer's compliance contact.** [?]
- Home-care operations may already create HIPAA obligations. If so, reuse that compliance programme rather than building a new one. [?]

**Baseline controls regardless of option [REC]:**
- Collect minimum data; never store diagnosis or appointment purpose unless required.
- Unique logins, multi-factor authentication, role-based access.
- Encryption in transit and at rest; automatic backups tested by restoring.
- Remove driver access the day they leave.
- Audit trail for edits; retention schedule agreed with counsel/payer.
- Secure exports (no emailing unencrypted spreadsheets with names/addresses).
- Written incident-response steps.
- Avoid location tracking beyond contract needs.
- **Before putting PHI in any tool (Sheets, Airtable, vendor product), obtain a signed BAA where required. This was not verified for any tool above.**

**Cost effect:** commercial vendors bundle much of this (ask for BAA, SOC 2); custom builds make you responsible for all of it, a meaningful share of the build and maintenance cost.

---

## 15. Ownership and maintenance plan

| Responsibility | Spreadsheet/no-code | Commercial product | Custom |
|---|---|---|---|
| Hosting/uptime | Vendor | Vendor | You/developer |
| Updates/security patches | Vendor | Vendor | You/developer |
| Bug fixes | You (formulas) | Vendor | Developer |
| Access problems | You | Vendor support | Developer |
| Failed imports | You | Vendor/you | Developer |
| Wrong calculations | You | You, with vendor help | Developer + you |
| Backup restore | You/vendor | Vendor | Developer |
| API changes (maps, SMS) | n/a | Vendor | Developer |
| Rate/rule changes | You | Vendor config | Paid change |
| Driver support | You | Vendor/you | You |

**If an external developer is used, get a written agreement covering:** source-code ownership or licence (payment alone does not transfer ownership); access to code and deployment accounts; business-data ownership; documentation; credentials in the company's name; maintenance duties and response times; hosting-account ownership; exit/migration help; third-party licence list.

**AI-built software:** still needs testing, security review, deployment, monitoring, and a maintainer. Faster creation does not remove the lifetime cost.

---

## 16. Phased implementation plan

| Phase | Output | Gate |
|---|---|---|
| 1 Discovery (1–2 weeks) | Questionnaire, trip export, contract documents, baseline hours/errors | Owner confirms U1–U12 |
| 2 Product evaluation (2–3 weeks) | 1–2 vendor demos using real (de-identified) files; written quotes; BAA status | Can any product apply both contracts and import our data? |
| 3 Go/no-go | One-page business case: best existing option vs. spreadsheet vs. custom | Owner approves in writing |
| 4 Limited pilot (60–90 days) | Parallel-run on one contract/month | No live PHI in an unapproved tool |
| 5 Evaluation | Compare against baseline (Section 17) | Targets met? |
| 6 Controlled rollout | Move one contract/driver group at a time; keep old process as fallback for one cycle | Owner approves ongoing costs and owners |

---

## 17. Success metrics

**Set the baseline first. Targets come after, not before.**

| Metric | Baseline to measure | Target |
|---|---|---|
| Admin hours/week (scheduling, billing, reporting) | From time log | Set after baseline |
| Calculation errors per month | From reconciliation | Set after baseline |
| Time to reconcile a payer remittance | From log | Set after baseline |
| Duplicate/missed/unbilled trips | Count | Set after baseline |
| Report preparation time | Log | Set after baseline |
| Correct application of contract rates | Audit sample | Near 100% (exact threshold agreed) |
| Total monthly cost (tools + labour) | Current | Not above approved ceiling |
| Backup restore tested | Y/N | Yes |
| Driver/admin satisfaction | Short survey | Agreed |

---

## When We Should NOT Build This Application

Do **not** build custom software if any of the following is true:

1. The business handles few trips and the current process costs only a few hours a week.
2. A spreadsheet with a rate table and reconciliation tab handles the calculations.
3. A commercial product already handles both contracts and imports your data at a monthly price below the break-even in Section 11.3.
4. Contract partners require you to use their portal, so your app would just duplicate entry.
5. No one can state the problem in numbers.
6. No named person will maintain it and no monthly support budget exists.
7. Rates, contract rules, or service type are still undecided; software built on moving rules will be wrong or expensive to change.
8. The main pain is slow payer payment or underpayment, not scheduling. That is a billing-process issue.
9. The motivation is "we could build it" rather than "it costs us $X per month."

---

## What Must Be Confirmed Before Spending Money

1. Is the service NEMT/Medicaid, non-medical, or both? (U1)
2. State, licensing, and payer/broker relationships. (U2, U6)
3. Whether $13.50/$1.60 and $15.00/$1.75 are revenue, driver pay, or both; what "administrative fee" means. (U5, U8)
4. Whether the flat fee and mileage both apply on every trip; cancellation, wait, and return rules.
5. Number of transportation drivers and trips per week. (U3, U4)
6. Hours spent and dollars lost today. (Questionnaire B)
7. Which payer systems and report formats are mandatory.
8. Whether HIPAA applies and whether the chosen tool will sign a BAA.
9. Whether any admin staff/software are shared with home care.
10. Budget, monthly ceiling, and who maintains the system.
11. Current vendor pricing: obtain written quotes for 1–2 commercial NEMT products; none was verified here.
12. Whether this entity is registered in North Carolina under this name (the search did not find it).

Until items 1–6 and 10 are answered, any investment in software is a guess.

---

## 18. Final recommendation to the owner

1. **Do not commission custom development now.** The evidence does not show a problem large enough, and the maintenance burden would fall on you.
2. **Spend the next two to three weeks on discovery**, using Section 6. Pull 1–3 months of real trips.
3. **Build a controlled spreadsheet (or Airtable) with contract-rate logic** and run it in parallel for 60–90 days. Cost is near zero.
4. **Trial one or two commercial NEMT products** only if the pilot shows meaningful pain. Test the real trip file and both contract rate structures.
5. **Revisit custom only if** Outcome C evidence exists in writing.
6. **Resolve the NEMT/HIPAA question early.** It affects tool choice more than features do.

**Weakest assumption:** that volume is small. If volume is several hundred trips weekly, the recommended order shifts toward evaluating commercial products earlier, but custom is still not the default.

---

## 19. Decision checklist

- [ ] Service type confirmed (NEMT / non-medical / both)
- [ ] State, licences, payers confirmed
- [ ] Rates classified as revenue / driver pay / both
- [ ] Trip volume and driver count known
- [ ] Baseline admin hours and error costs measured
- [ ] Mandatory payer systems and reports listed
- [ ] HIPAA applicability checked; BAA available for any tool holding PHI
- [ ] Spreadsheet pilot run and measured
- [ ] 1–2 commercial products trialled with real data; written quotes obtained
- [ ] Business case approved in writing
- [ ] Maintenance owner and support budget named
- [ ] Ownership and exit terms agreed (if a developer is used)
- [ ] Only then: approve Outcome C scope and budget

**Session-end capture (to fill in after the owner conversation):**
*What was decided:* ______ *What changed:* ______ *What happens next, who, by when:* ______

---

## 20. Research sources

*Retrieved 2026-10-15. Several are secondary or vendor-authored; the label says so.*

**Government / official**
- NC Medicaid, county letter on NEMT vendor enrolment: https://medicaid.ncdhhs.gov/documents/files/dear-county-letter-2016-03-02-0/open (2016)
- NC Medicaid NEMT fact sheet: https://medicaid.ncdhhs.gov/ncmt-fact-sheet-nemt-part-1/open
- NCTracks, NEMT Provider/Broker Attestation: https://www.nctracks.nc.gov/content/public/providers/provider-communications/2021-Announcements/NC-Medicaid-Non-Emergency-Medical-Transportation--NEMT--Provider-Broker-Attestation-Form-Now-Available.html (2021)
- Washington HCA, NEMT brokers as HIPAA business associates (another state; illustrative only): https://www.hca.wa.gov/assets/billers-and-providers/hipaa_business_associates.pdf
- HHS business-associate guidance (**fetch failed, not read**): https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html

**Official pricing**
- Airtable: https://www.airtable.com/pricing
- Google Maps Platform: https://developers.google.com/maps/billing-and-pricing/pricing

**Secondary / vendor-authored (treat cautiously)**
- Mindbowser NEMT software comparison: https://www.mindbowser.com/top-nemt-software-comparison/
- MediRoutes NEMT scheduling guide: https://mediroutes.com/blog/nemt-scheduling-software
- NEMT Platform pricing guide: https://nemtplatform.com/blogs/nemt-software-pricing-a-guide-to-understanding-costs
- Capterra, NEMT Platform: https://www.capterra.com/p/238071/NEMT-Platform/
- Fit-Gap NEMT list: https://us.fitgap.com/products/momentm-technologies
- SourceForge, RouteGenie/Pathwise listing: https://sourceforge.net/software/product/Pathwise/
- Onfleet pricing (competitor and review-site sources): https://www.upperinc.com/blog/onfleet-pricing/ , https://capterra.com/p/142633/Onfleet/

**Not found / not verified**
- Current NC NEMT broker contract holders; current NCTracks rules after 2021.
- Public pricing for TripMaster, RoutingBox, RouteGenie, MediRoutes, Moovs.
- BAA availability for Google Workspace, Excel/Microsoft 365, or Airtable.
- NC Secretary of State registration for "Doz and Co Care LLC".
