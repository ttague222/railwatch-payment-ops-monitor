# AI Collaboration Context

This file documents the thought process, decisions, research, and iterations made throughout this project. It is intentionally maintained from the start to show how the product idea evolved — not just the final result.

---

## Assignment

**Source:** AI-First Product Owner — Take-Home Assessment  
**Goal:** Build something useful in the personal finance or fintech space. Identify a real problem, define requirements, design a system, and implement a working application using Kiro's spec-driven workflow.

**Constraints:**
- Domain: personal finance, banking, or fintech
- Must integrate at least 2 public APIs
- Must be built using Kiro's spec-driven workflow
- Must be published to a public GitHub repo (including `.kiro/` directory)

---

## Session 1 — Problem Discovery

### Starting Point

The assignment was intentionally open-ended. Rather than jumping straight to a solution, the decision was made to ground the product in a real, researched problem — specifically looking at pain points that **Nymbus** customers (community banks and credit unions) are experiencing today.

### Initial Research Direction

First pass of research explored general community bank/credit union member pain points:
- 60%+ of credit union members are financially struggling
- 27% of Americans have zero emergency savings
- 69% worry they couldn't cover expenses if they lost their job
- Members are leaving for neobanks that offer proactive financial tools

### First Problem Set (Consumer-Facing — Discarded)

An initial set of 5 problems was generated focused on the **end member** (consumer):

1. Members have no idea where they stand financially until something goes wrong
2. Loan anxiety is killing the member relationship before it starts
3. Members are quietly leaving for neobanks — and credit unions don't see it coming
4. Members treat their checking account like a "paycheck motel"
5. Emergency savings is a crisis hiding in plain sight

**Why discarded:** The user correctly redirected — we are solutioning for **banks and credit unions** as the customer, not the end member. The product needs to solve an operational or institutional problem, not a consumer UX problem.

### Reframe: B2B Focus on Payments and Core Banking

The user clarified: focus on problems related to **payments and core banking** that banks and credit unions face in serving their members.

### Second Research Direction

Researched operational pain points in:
- Real-time payments (FedNow, RTP) adoption
- ACH fraud and monitoring
- Payment reconciliation
- Cross-border wire transfers
- Core banking data silos

### Second Problem Set (Payments & Core Banking — Active)

5 real, research-backed problems identified for banks and credit unions:

1. **Real-time payments gap** — Most credit unions can receive FedNow/RTP but can't send. Members expect instant; they get 1–3 business days. ($480B through RTP in Q2 2025 alone.)

2. **Manual payment reconciliation** — 84% of payment firms still rely on spreadsheets. Month-end is a manual grind. Costs scale linearly with volume — no leverage.

3. **Cross-border wire transfers are opaque and expensive** — Fees can reach 6–10% of transfer value. Multi-day settlement. Zero visibility. Wise and Remitly are eating this relationship.

4. **ACH fraud monitoring gap** — 80% of organizations were fraud targets in 2023. Nacha now mandates monitoring, but most community banks lack the tooling. Manual review queues can't keep up.

5. **Core banking data silos** — Payments, lending, and deposits don't talk to each other. Ops teams toggle between 3–4 systems to resolve a single member issue. Compliance gaps, slow dispute resolution, eroded trust.

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Deleted initial `requirements.md` | It was built on a consumer-facing product idea before the problem was properly defined. Starting over with the right foundation. |
| Reframed user from "member" to "bank/credit union" | The assignment asks to solve a real problem for a real user. The real user here is the institution, not the end consumer. |
| Grounded research in Nymbus's actual customer base | Nymbus serves community banks and credit unions ($1B–$10B asset size). Solving for their pain points makes the submission directly relevant to the role. |
| Created this context file before writing any spec | The assignment explicitly evaluates AI collaboration. Capturing thought process from the start, not retrofitting it at the end. |

---

## Problem Selection — Decision Log

### Evaluated: Cross-Border Payments vs. Real-Time Payments

**Cross-Border — Rejected.** High drama, low frequency for a typical community CU. Wise/Remitly have commoditized the consumer side. Too hard to solve meaningfully in a 4–6 hour build.

**Real-Time Payments — Selected.** $853B processed through FedNow in 2025 (2,134% YoY increase). 45% of FIs still in evaluation. Most CUs are receive-only. This is a daily operational problem, not a niche one.

**Refined angle:** Not "build instant payments infrastructure" (too hard) — but a **Payments Modernization Readiness Tracker**. The real gap is that CU payments leaders have no structured, self-service way to assess where they stand, what's blocking them, and how urgent the window is.

### Scope Decision

Two-layer vision (Readiness Tracker + Live Ops Monitor) is too much for 4–6 hours. Scoped to:
- **Core product:** Instant Payments Readiness Tracker
- **Future state (README):** Live payment operations monitor

This demonstrates scope judgment — a key evaluation criterion.

### API Selection

| API | Role in product |
|-----|----------------|
| **Marketaux** | Live fintech/payments news feed — shows market momentum and urgency around instant payments adoption |
| **Frankfurter** | Real-time FX rates — market context panel showing how fast money is moving globally while the CU evaluates |

ExchangeRate-API and Alpha Vantage deprioritized — redundant or weak fit for this specific product.

### User Definition

- **Primary user:** VP of Payments / Director of Operations at a $1B–$10B community bank or credit union
- **Secondary user:** CFO/CEO/Board — consumers of the readiness score output, not the tool itself
- **Design principle:** Solve the operational problem for the VP; make the output shareable upward to leadership

### Locked Problem Statement

> Community banks and credit unions are losing members to neobanks and fintechs that offer what their members now expect as a baseline: instant payments.
>
> FedNow processed $853 billion in 2025 — a 2,134% increase year-over-year. The Clearing House's RTP network now reaches 70% of U.S. deposit accounts. Yet 45% of financial institutions are still in the evaluation phase, and most that have connected can only receive — not send. Meanwhile, 14% of members who switch financial institutions cite poor digital experience as the primary reason. Instant payments isn't a future capability anymore. It's a retention problem happening right now.
>
> The payments and operations leaders at $1B–$10B credit unions know they need to move. What they lack is clarity: Where exactly do we stand? What's blocking us? What will it actually take to get to send-capable? And how does our pace compare to what's happening in the market?
>
> There is no lightweight, self-service tool that gives a credit union's VP of Payments a structured readiness assessment across the dimensions that actually matter — core integration, fraud controls, liquidity management, reconciliation maturity, and rail connectivity — with a clear gap analysis, effort estimate, and live market context showing how fast the window is closing.

---

---

## Major Pivot — PayPath → RailWatch

### Why PayPath was cut

After generating the requirements for PayPath (Instant Payments Readiness Tracker), a critical product question surfaced: **this isn't a product — it's a sales tool.**

A readiness assessment has no recurring value. A user fills it out once, gets a score, and is done. There's no reason to come back tomorrow. A real product solves a daily problem.

### The real daily problem

A credit union's payments operations team opens 3–4 different systems every morning to piece together what's happening across ACH, wire, and instant payment rails. There's no unified view. Exceptions pile up. Settlement positions are unclear. They're flying blind.

### RailWatch — Payment Operations Monitor

**Product:** A dashboard that a credit union's payments team opens every morning. Unified view of payment rail health across ACH, wire, and FedNow/RTP.

**What it shows:**
- Payment volume trends by rail (ACH, wire, RTP/FedNow)
- Failure and exception rates by rail and reason code
- Exception queue aging — open items, SLA status
- Settlement position — funded vs. at-risk
- Rail health status — network degradation signals
- Live market context — economic indicators, FX rates, industry news

**Demo mode:** Runs on realistic simulated data for a fictional $3B credit union. Transparent banner indicates demo mode. Standard practice for fintech demos.

**The readiness assessment** was cut entirely. It becomes a "future state" item in the README — demonstrating scope judgment.

### Final API Selection (3 APIs)

| API | Role | Auth |
|-----|------|------|
| **FRED** (Federal Reserve Economic Data) | Live economic indicators — Fed Funds Rate, payment volume trends, inflation | Free API key |
| **Frankfurter** | Live FX rates — global payment velocity context | None required |
| **Marketaux** | Live fintech/payments news with sentiment scoring | Free API key |

Using 3 APIs (assignment requires minimum 2) shows initiative without overcomplicating the build.

### Product Name

**RailWatch** — monitors the payment rails. Clear, direct, B2B appropriate.

### Spec Directory

`.kiro/specs/railwatch-payment-ops-monitor/`

---

## Next Steps

1. Create `requirements.md` for RailWatch
2. Create `design.md` with API integration patterns and data flow
3. Create `tasks.md` with incremental implementation steps
4. Build the working application
5. Write `README.md`

---

*This file will be updated continuously as decisions are made and the product evolves.*
