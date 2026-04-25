# Requirements Document

## Introduction

RailWatch is a Payment Operations Monitor dashboard built for payments operations teams at community banks and credit unions ($1B–$10B in assets). It provides a unified, real-time view of payment rail health, exception queue status, settlement position, and live market context — all in a single browser-based dashboard that ops teams open every morning.

The core problem: payments operations managers currently toggle between 3–4 disconnected systems each morning to piece together what happened overnight across ACH, wire, and instant payment rails (FedNow/RTP). Exceptions pile up undetected. Settlement positions are unclear until it's too late. RailWatch eliminates that fragmentation.

All payment data is realistically simulated for a fictional $3B credit union (Lakeside Community Credit Union) using industry-benchmark figures. Live market context (economic indicators, FX rates, industry news) is fetched from real public APIs. The application runs entirely client-side with no backend server.

RailWatch is designed as an intelligence layer on top of a modern core banking platform such as Nymbus — it surfaces and contextualizes data that the core already holds, without replacing any core processing function. In a production environment, the Simulator module would be replaced by a DataProvider client connected to the Nymbus Connect API, with no changes required to any consuming dashboard component.

IMPORTANT — DEMO VERSION NOTICE: This version of RailWatch operates entirely in Demo_Mode using simulated data. It has no authentication or authorization controls and MUST NOT be deployed in a production environment or used with real member financial data without implementing role-based access controls, audit logging, and appropriate security hardening.

---

## Glossary

- **Dashboard**: The RailWatch single-page application rendered in the browser.
- **Payment_Rail**: A payment network or channel over which transactions are processed. Supported rails: ACH_Standard, ACH_Same_Day, Wire_Domestic, Wire_International, RTP, FedNow.
- **ACH_Standard**: Automated Clearing House standard batch payments, typically settling in 1–2 business days.
- **ACH_Same_Day**: Automated Clearing House same-day settlement payments.
- **Wire_Domestic**: Domestic wire transfers settled via Fedwire or CHIPS.
- **Wire_International**: International wire transfers (SWIFT-based).
- **RTP**: The Clearing House Real-Time Payments network.
- **FedNow**: The Federal Reserve's instant payment service.
- **Rail_Health_Status**: A categorical indicator of a payment rail's operational condition. Values: Healthy, Degraded, Critical.
- **Exception**: A payment transaction that failed to process normally and requires manual review or intervention.
- **Exception_Queue**: The collection of all open, unresolved exceptions across all rails.
- **Reason_Code**: A standardized code identifying why a payment exception occurred, qualified by its namespace. NACHA codes apply to ACH rails (e.g., R01 Insufficient Funds, R02 Account Closed). ISO 20022 codes apply to RTP and FedNow rails (e.g., AC01 IncorrectAccountNumber, AM04 InsufficientFunds). SWIFT codes apply to Wire_International rails (e.g., AC01, FOCR FraudOnCustomerRequest). The reasonCodeNamespace field on the Transaction record identifies which scheme applies.
- **SLA_Threshold**: The maximum acceptable time an exception may remain open before escalation. Thresholds are rail-specific: FedNow, RTP, and ACH_Same_Day — 4 hours (warning) / 8 hours (breach); Wire_Domestic and Wire_International — 24 hours (warning) / 48 hours (breach); ACH_Standard — 48 hours (warning) / 72 hours (breach).
- **Settlement_Position**: The current funded balance available to cover outgoing payment obligations for the business day.
- **Projected_Daily_Obligation**: The estimated total outgoing payment volume expected to settle during the current business day.
- **Funding_Coverage_Ratio**: The ratio of Settlement_Position to Projected_Daily_Obligation, expressed as a percentage.
- **Intraday_Liquidity_Alert**: A warning triggered when the Funding_Coverage_Ratio falls below a defined risk threshold.
- **Demo_Mode**: The operational state of the Dashboard in which all payment data is generated from realistic simulation rather than live core banking systems. A persistent banner indicates this state.
- **Market_Context_Panel**: The section of the Dashboard displaying the economic context indicator, inline FX conversions, and industry news fetched from external APIs.
- **FRED_API**: The Federal Reserve Bank of St. Louis's FRED (Federal Reserve Economic Data) REST API, providing macroeconomic time series data.
- **Frankfurter_API**: A free, open-source currency exchange rate API providing current and historical FX rates.
- **Marketaux_API**: A financial news API providing real-time news articles with sentiment scoring.
- **Stale_Data_Indicator**: A visual label shown when cached API data is older than the defined freshness threshold.
- **Daily_Summary**: A plain-text export of the current dashboard state, formatted for use in a morning standup or leadership email.
- **Simulator**: The client-side module responsible for generating all simulated payment data in Demo_Mode.
- **DataProvider**: The interface implemented by both the Simulator (in Demo_Mode) and any live core banking integration (in production). All dashboard components consume data exclusively through the DataProvider interface, enabling the Simulator to be replaced by a Nymbus Connect API client without modifying any consuming component.
- **LocalStorage**: The browser's built-in key-value storage used to persist user preferences and last-refresh timestamps.
- **Transaction**: A single payment record conforming to ISO 20022 message conventions, with fields: transactionId (UUID), endToEndId (string — unique end-to-end payment chain identifier per ISO 20022 pacs.008), rail (Payment_Rail), amount (USD decimal), instructedAmount (decimal — original instructed amount before any FX conversion), destinationCurrency (ISO 4217 code, required for Wire_International), status (pending/completed/failed/returned), reasonCode (string — the reason code value), reasonCodeNamespace (enum: NACHA | ISO20022 | SWIFT — identifies the coding scheme), createdAt (ISO 8601 timestamp), openedAt (ISO 8601 timestamp for exceptions), settlementDate (ISO 8601 date — the date on which the transaction is expected to or did settle). In Demo_Mode, endToEndId and settlementDate are populated with realistic placeholder values.
- **Destination_Currency**: The ISO 4217 currency code of the beneficiary account for Wire_International transactions (e.g., EUR, GBP, CAD, MXN, JPY, CNY).
- **Cut_Off_Time**: The deadline by which a payment must be submitted to settle on the current business day for a given rail.
- **Dollar_Exposure**: The total USD value of all open exceptions for a given rail or reason code grouping.
- **Page_Load_Start**: The moment the browser begins parsing the HTML document, equivalent to the `navigationStart` timestamp in the Navigation Timing API. All render time requirements (Req 1.1, 14.1) measure elapsed time from Page_Load_Start.

---

## Requirements

---

### Requirement 1: Dashboard Initialization and Demo Mode

**User Story:** As a Payments Operations Manager, I want the dashboard to load immediately with realistic payment data, so that I can begin my morning review without waiting for system connections or data entry.

#### Acceptance Criteria

1. WHEN the Dashboard is opened in a browser, THE Simulator SHALL generate a complete set of payment data for the current business day within 300 milliseconds of Page_Load_Start, so that the total time from Page_Load_Start to first meaningful render of all simulated data sections does not exceed 500 milliseconds.
2. WHEN the Dashboard is in Demo_Mode, THE Dashboard SHALL display a persistent, non-dismissible banner identifying the application as operating in Demo_Mode.
3. THE Simulator SHALL generate payment data using industry-benchmark figures consistent with a $3B community credit union (Lakeside Community Credit Union), including realistic ACH volumes, wire counts, exception rates, and settlement balances.
4. WHEN the Dashboard is opened on a weekend or federal holiday, THE Simulator SHALL generate data reflecting a non-business-day state, with reduced volumes and a clear non-business-day indicator.
5. THE Dashboard SHALL load and render all simulated data sections without requiring any network connectivity.
6. WHEN a user returns to the Dashboard after a prior session, THE Dashboard SHALL restore user preferences (panel collapse state, refresh interval setting) from LocalStorage.
7. FOR ALL simulated datasets generated across multiple page loads on the same calendar day, THE Simulator SHALL produce data that is internally consistent — the sum of per-rail transaction counts SHALL equal the reported total transaction count (consistency invariant).
8. THE Dashboard SHALL display a "Last generated" timestamp for the simulated payment data, showing when the current simulation dataset was created.
9. THE Dashboard SHALL provide a manual "Refresh Data" button that, WHEN clicked, re-runs THE Simulator to generate a fresh dataset and updates all simulated data sections. THE refresh SHALL complete within 300 milliseconds.
10. WHEN a manual refresh is in progress, THE Dashboard SHALL display a loading indicator on the "Refresh Data" button and SHALL NOT allow duplicate refresh requests.
11. THE Dashboard SHALL include a production deployment notice in its README documentation stating: "RailWatch Demo operates without authentication or authorization controls. It MUST NOT be connected to real member financial data or deployed in a production environment without implementing role-based access controls, audit logging, and appropriate security hardening per NCUA and applicable regulatory requirements."
12. THE Simulator SHALL implement a DataProvider interface such that all dashboard components consume payment data exclusively through that interface. THE DataProvider interface SHALL define the data contracts for: rail volume and health data, exception queue data, settlement position data, and historical volume data. This ensures that replacing the Simulator with a live Nymbus Connect API client requires no changes to any consuming dashboard component.

---

### Requirement 2: Dashboard Status Bar

**User Story:** As a Payments Operations Manager, I want to see the most critical operational signals at the very top of the dashboard the moment it loads, so that I can immediately identify whether anything requires urgent action without scrolling.

#### Acceptance Criteria

1. THE Dashboard SHALL display a persistent Status Bar as the first visible element below the Demo_Mode banner, visible without scrolling on any supported viewport width.
2. THE Status Bar SHALL display the following four signals in a single horizontal row: (a) total SLA breach count across all rails with a breach-level color indicator; (b) current Funding_Coverage_Ratio with its alert level color (adequately funded / warning / critical); (c) count of Payment_Rails currently in Critical or Degraded status; (d) the next approaching Cut_Off_Time across all rails with a countdown, or "All Clear" if no cut-off is within 2 hours.
3. WHEN any Status Bar signal is in a warning or critical state, THE Status Bar SHALL display that signal with its corresponding alert color and label.
4. WHEN all Status Bar signals are in a normal state (zero SLA breaches, Funding_Coverage_Ratio ≥ 110%, all rails Healthy, no cut-off within 2 hours), THE Status Bar SHALL display an "All Systems Normal" indicator.
5. THE Status Bar SHALL update in real time as underlying data changes (countdown ticking, status changes) without requiring a page reload.
6. THE Dashboard SHALL define a global alert severity hierarchy applied consistently across all alert types: CRITICAL (Funding_Coverage_Ratio < 100%, SLA breach active, rail status Critical) → WARNING (Funding_Coverage_Ratio 100–110%, cut-off within 2 hours, queue growth > 25%, rail status Degraded) → INFO (volume anomaly, cut-off within 2 hours but > 30 minutes). Higher severity alerts SHALL always be visually distinguished from lower severity alerts.
7. THE Status Bar SHALL have a maximum height of 48px and SHALL NOT push other dashboard content below the fold on a 1080p display at 1280px viewport width.
8. THE Status Bar SHALL display an inline "Simulated Data" label adjacent to the Funding_Coverage_Ratio signal, ensuring that any screenshot of the Status Bar in isolation clearly identifies the data as simulated.

---

### Requirement 3: First-Run Experience

**User Story:** As a first-time user evaluating RailWatch, I want a brief orientation when I first open the dashboard, so that I understand what I'm looking at and can immediately assess its value.

#### Acceptance Criteria

1. WHEN the Dashboard is opened for the first time (no prior session data in LocalStorage), THE Dashboard SHALL display a lightweight overlay panel identifying the five main dashboard sections: Status Bar, Rail Health Overview, Exception Queue, Settlement Position, and Market Context.
2. THE first-run overlay SHALL be dismissible with a single click or keypress and SHALL NOT block interaction with the underlying dashboard.
3. WHEN the user dismisses the first-run overlay, THE Dashboard SHALL record the dismissal in LocalStorage and SHALL NOT display the overlay on subsequent loads.
4. THE first-run overlay SHALL include a one-sentence description of the Demo_Mode data source so users understand they are viewing simulated data.
5. IF LocalStorage is unavailable, THE Dashboard SHALL NOT display the first-run overlay and SHALL proceed directly to the normal dashboard state.

---

### Requirement 4: Exception Detail Drill-Down

**User Story:** As a Payments Operations Manager, I want to expand an exception group to see the individual transactions within it, so that I can assess the specific items that need attention without leaving the dashboard.

#### Acceptance Criteria

1. WHEN a user clicks on an exception group in the Exception_Queue, THE Dashboard SHALL expand that group inline to display a list of individual Transaction records within it.
2. THE expanded exception detail SHALL display for each Transaction: transactionId, amount (USD), age (time since openedAt), SLA status indicator, Reason_Code, and for Wire_International transactions the Destination_Currency converted amount.
3. THE expanded exception detail SHALL be collapsible — WHEN the user clicks the group again, THE Dashboard SHALL collapse the detail view.
4. WHEN an exception group is expanded, THE Dashboard SHALL NOT navigate away from the dashboard or open a new page.
5. IF an exception group contains more than 10 individual transactions, THE Dashboard SHALL display the first 10 sorted by Dollar_Exposure descending and display a count of remaining items.
6. FOR ALL expanded exception groups, the sum of individual transaction amounts displayed SHALL equal the Dollar_Exposure shown for that group (drill-down consistency invariant).
7. THE expanded exception detail SHALL include a visible "Demo Data" label on each Transaction record. In a production implementation, the following controls would be required: (a) transaction IDs must be masked or tokenized for display; (b) access to the drill-down view must be gated by role-based permissions; (c) all drill-down access must be audit-logged per BSA/AML, Reg E, and Reg J requirements. These production controls are out of scope for the Demo_Mode implementation but SHALL be documented in the README.

---

### Requirement 5: Payment Rail Health Overview

**User Story:** As a Payments Operations Manager, I want to see the health status of every payment rail at a glance, so that I can immediately identify which rails need attention without opening multiple systems.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Rail_Health_Status indicator for each of the six Payment_Rails: ACH_Standard, ACH_Same_Day, Wire_Domestic, Wire_International, RTP, and FedNow.
2. WHEN a Payment_Rail's failure rate is greater than 2.00% and less than or equal to 5.00% of transaction volume, THE Dashboard SHALL set that rail's Rail_Health_Status to Degraded.
3. WHEN a Payment_Rail's failure rate is greater than 5.00% of transaction volume, THE Dashboard SHALL set that rail's Rail_Health_Status to Critical.
4. WHEN a Payment_Rail's failure rate is greater than or equal to 0% and less than or equal to 2.00%, THE Dashboard SHALL display that rail's Rail_Health_Status as Healthy.
5. THE Dashboard SHALL display the transaction volume for each Payment_Rail for the current business day.
6. THE Dashboard SHALL display the success rate and failure rate as percentages for each Payment_Rail.
7. THE Dashboard SHALL display a comparison of current-day volume against the prior business day's volume and the 7-day rolling average volume for each Payment_Rail.
8. WHEN current-day volume for a Payment_Rail is more than 20% below the 7-day rolling average, THE Dashboard SHALL display a volume anomaly indicator for that rail.
9. FOR ALL Payment_Rails, the sum of successful transactions and failed transactions SHALL equal the total transaction count for that rail (completeness invariant).
10. WHEN a user views the Rail Health Overview, THE Dashboard SHALL render all six rail status cards within 100 milliseconds of data being available.
11. In Demo_Mode, Rail_Health_Status reflects institution-side payment processing failure rates only, as generated by the Simulator. In a production integration, Rail_Health_Status would be supplemented by network-side availability feeds from the Federal Reserve (for FedNow) and The Clearing House (for RTP), which are separate data sources from the core banking system. This distinction SHALL be documented in the README.

---

### Requirement 6: Exception Queue Monitor

**User Story:** As a Payments Operations Manager, I want to see all open payment exceptions organized by rail and aging status, so that I can prioritize my team's work and prevent SLA breaches before they happen.

#### Acceptance Criteria

1. THE Dashboard SHALL display the total count of open exceptions in the Exception_Queue, broken down by Payment_Rail.
2. THE Dashboard SHALL display the count of open exceptions grouped by Reason_Code for each Payment_Rail.
3. WHEN an exception on a FedNow or RTP rail has been open for more than 4 hours, THE Dashboard SHALL display a warning-level SLA indicator on that exception group.
4. WHEN an exception on a FedNow or RTP rail has been open for more than 8 hours, THE Dashboard SHALL display a breach-level SLA indicator on that exception group and include it in the SLA breach count.
5. WHEN an exception on a Wire_Domestic or Wire_International rail has been open for more than 24 hours, THE Dashboard SHALL display a warning-level SLA indicator on that exception group.
6. WHEN an exception on a Wire_Domestic or Wire_International rail has been open for more than 48 hours, THE Dashboard SHALL display a breach-level SLA indicator on that exception group and include it in the SLA breach count.
7. WHEN an exception on an ACH_Standard rail has been open for more than 48 hours, THE Dashboard SHALL display a warning-level SLA indicator on that exception group.
8. WHEN an exception on an ACH_Standard rail has been open for more than 72 hours, THE Dashboard SHALL display a breach-level SLA indicator on that exception group and include it in the SLA breach count.
9. WHEN an exception on an ACH_Same_Day rail has been open for more than 4 hours, THE Dashboard SHALL display a warning-level SLA indicator on that exception group.
10. WHEN an exception on an ACH_Same_Day rail has been open for more than 8 hours, THE Dashboard SHALL display a breach-level SLA indicator on that exception group and include it in the SLA breach count.
11. THE Dashboard SHALL display the total count of exceptions currently in SLA breach status across all rails.
12. THE Dashboard SHALL display the change in Exception_Queue size compared to the prior business day's closing exception count, indicating whether the queue is growing or shrinking. THE Simulator SHALL generate a prior-business-day closing exception count as part of the historical dataset defined in Req 15.13.
13. WHEN the Exception_Queue size has grown by more than 25% compared to the prior business day, THE Dashboard SHALL display a queue growth alert.
14. IF the Exception_Queue contains zero open exceptions, THEN THE Dashboard SHALL display a clear all-clear indicator rather than an empty table.
15. FOR ALL exception records, each exception SHALL be assigned to exactly one Payment_Rail and exactly one Reason_Code (assignment completeness invariant).
16. THE Dashboard SHALL display the top 5 Reason_Codes by exception count across all rails, ranked in descending order.
17. THE Dashboard SHALL display the total Dollar_Exposure (sum of transaction amounts) for all open exceptions, broken down by Payment_Rail.
18. THE Dashboard SHALL display the Dollar_Exposure for each Reason_Code grouping alongside the exception count.
19. THE Dashboard SHALL rank exception groups by SLA urgency ascending as the default sort order — exceptions closest to or past their SLA breach threshold appear first. Dollar_Exposure SHALL be available as a secondary sort option selectable by the user. FOR ALL sort operations, the displayed order SHALL be consistent with the selected sort criterion (sort consistency invariant).
20. FOR ALL Dollar_Exposure calculations, the sum of individual transaction amounts for exceptions in a group SHALL equal the displayed Dollar_Exposure for that group (dollar exposure calculation invariant).
21. THE Dashboard SHALL display the reasonCodeNamespace alongside each Reason_Code in the exception queue and drill-down view, so that users can distinguish between NACHA R-codes (ACH rails), ISO 20022 codes (RTP/FedNow rails), and SWIFT codes (Wire_International rail).

---

### Requirement 7: Settlement Position Tracker

**User Story:** As a Payments Operations Manager, I want to see my current settlement position relative to today's projected obligations, so that I can identify funding shortfalls before settlement windows close.

#### Acceptance Criteria

1. THE Dashboard SHALL display the current Settlement_Position balance in U.S. dollars.
2. THE Dashboard SHALL display the Projected_Daily_Obligation in U.S. dollars.
3. THE Dashboard SHALL calculate and display the Funding_Coverage_Ratio as a percentage, computed as (Settlement_Position / Projected_Daily_Obligation) × 100.
4. WHEN the Funding_Coverage_Ratio is greater than or equal to 100% and less than 110%, THE Dashboard SHALL display a warning-level Intraday_Liquidity_Alert.
5. WHEN the Funding_Coverage_Ratio is less than 100%, THE Dashboard SHALL display a critical-level Intraday_Liquidity_Alert indicating the settlement position is underfunded.
6. THE Dashboard SHALL display the settlement status for each Payment_Rail individually, indicating whether that rail's settlement is funded, at-risk, or underfunded.
7. WHEN the Funding_Coverage_Ratio is greater than or equal to 110%, THE Dashboard SHALL display the settlement position as adequately funded with no alert.
8. FOR ALL displayed Funding_Coverage_Ratio values, the ratio SHALL equal (Settlement_Position / Projected_Daily_Obligation) × 100, rounded to two decimal places (calculation correctness invariant).
9. THE Dashboard SHALL display the intraday settlement timeline as a bar or area chart showing projected obligation drawdown from 8:00 AM ET to 6:00 PM ET in hourly intervals, with the current time marked. The timeline SHALL show cumulative obligations settled vs. remaining for the business day.
10. IF the Projected_Daily_Obligation is zero or unavailable, THEN THE Dashboard SHALL display a data unavailable indicator for the Funding_Coverage_Ratio rather than a division-by-zero error.
11. WHEN the Funding_Coverage_Ratio is below 110%, THE Dashboard SHALL display a non-dismissible "SIMULATED DATA" label directly adjacent to the ratio value and alert, ensuring that any screenshot of the settlement section in isolation clearly identifies the data as simulated and not suitable for regulatory reporting.
12. In Demo_Mode, Settlement_Position is an aggregate scalar value across all rails. In a production integration, settlement position would be exposed as per-rail settlement account balances from the core banking system, reflecting the actual funded accounts used for each payment rail. This distinction SHALL be documented in the README.

---

### Requirement 8: Economic Context Indicator — FRED API Integration

**User Story:** As a Payments Operations Manager, I want to see a current interest rate indicator alongside my payment operations data, so that I can understand the broader financial environment affecting payment volumes and urgency.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL fetch the Federal Funds Rate (series FEDFUNDS) from the FRED_API using `limit=2&sort_order=desc` to retrieve the two most recent observations in descending date order, and SHALL display the most recent value as "Fed Rate: X.XX%" with its observation date in the Dashboard header or summary bar.
2. THE Dashboard SHALL calculate and display the month-over-month change in the Federal Funds Rate using the two most recent FEDFUNDS observations retrieved in criterion 8.1.
3. WHEN a FRED_API request succeeds, THE Dashboard SHALL cache the response in LocalStorage with a timestamp and SHALL NOT re-fetch the FEDFUNDS series within a 4-hour window.
4. WHEN a FRED_API request fails due to a network error, THE Dashboard SHALL display the most recently cached value with a Stale_Data_Indicator showing the age of the cached data.
5. IF no cached FRED_API data exists and the FRED_API request fails, THEN THE Dashboard SHALL display a graceful error state for the economic context indicator with a retry option, without disrupting other Dashboard sections.
6. WHEN a FRED_API request returns an HTTP 429 (rate limit) response, THE Dashboard SHALL implement exponential backoff with a minimum 60-second delay before retrying, SHALL cap the maximum retry delay at 10 minutes, and SHALL NOT retry more than 3 times per session.
7. WHEN a FRED_API request returns an HTTP 400 or 404 response, THE Dashboard SHALL log the error to the browser console and display a configuration error message without retrying automatically.
8. FOR ALL FRED_API series displayed, the observation date shown SHALL match the date field returned in the API response (data fidelity invariant).

---

### Requirement 9: Wire International FX Conversion — Frankfurter API Integration

**User Story:** As a Payments Operations Manager, I want to see the destination currency value on Wire International transactions, so that I can assess the foreign currency exposure of pending exceptions and settlement items.

#### Acceptance Criteria

1. FOR ALL pending Wire_International transactions displayed in the Exception_Queue or settlement detail, THE Dashboard SHALL display the transaction's USD amount converted to the Destination_Currency at the current Frankfurter_API rate, shown alongside the original USD amount.
2. THE Dashboard SHALL fetch exchange rates for the Destination_Currency of each Wire_International transaction from the Frankfurter_API on demand when a Wire_International transaction is displayed.
3. WHEN a Frankfurter_API request succeeds, THE Dashboard SHALL cache the response in LocalStorage with a timestamp and SHALL NOT re-fetch rates for the same currency pair within a 15-minute window.
4. WHEN a Frankfurter_API request fails due to a network error, THE Dashboard SHALL display the most recently cached FX rate for that currency pair with a Stale_Data_Indicator showing the age of the cached data.
5. IF no cached Frankfurter_API data exists for a currency pair and the Frankfurter_API request fails, THEN THE Dashboard SHALL display a graceful error state for that transaction's converted amount without disrupting other Dashboard sections.
6. WHEN a Frankfurter_API response is received, THE Dashboard SHALL display the converted amount within 200 milliseconds of the response being parsed.
7. FOR ALL displayed FX conversions, the rate value used SHALL equal the value returned in the Frankfurter_API response for the corresponding currency pair, with no rounding beyond 4 decimal places (data fidelity invariant).
8. IF the Frankfurter_API response does not contain a rate for a required currency pair, THE Dashboard SHALL display a missing data indicator for that specific transaction's converted amount only.

---

### Requirement 10: Live Market Context Panel — Marketaux API Integration

**User Story:** As a Payments Operations Manager, I want to see live fintech and payments industry news with sentiment context, so that I can stay aware of network disruptions, regulatory changes, or market events that may affect payment operations.

#### Acceptance Criteria

1. WHEN the Market_Context_Panel loads, THE Dashboard SHALL fetch the latest news articles from the Marketaux_API filtered by the keywords: "FedNow OR RTP OR instant payments OR ACH".
2. THE Dashboard SHALL display a minimum of 3 and a maximum of 5 news articles, each showing: headline, source, publication timestamp, and sentiment score.
3. THE Dashboard SHALL display the sentiment score for each article as a categorical label (Positive, Neutral, Negative) derived from the Marketaux_API sentiment value.
4. WHEN a Marketaux_API request succeeds, THE Dashboard SHALL cache the response in LocalStorage with a timestamp and SHALL NOT re-fetch news within a 30-minute window.
5. WHEN a Marketaux_API request fails due to a network error, THE Dashboard SHALL display the most recently cached news articles with a Stale_Data_Indicator showing the age of the cached data.
6. IF no cached Marketaux_API data exists and the Marketaux_API request fails, THEN THE Dashboard SHALL display a graceful error state for the news section with a retry option, without disrupting other Dashboard sections.
7. WHEN a Marketaux_API request returns an HTTP 422 or 429 response, THE Dashboard SHALL display an appropriate error message and SHALL NOT retry automatically within the same session without user action.
8. WHEN the Marketaux_API returns fewer than 3 articles matching the keyword filter, THE Dashboard SHALL display all returned articles and indicate that limited results are available.
9. FOR ALL displayed news articles, the publication timestamp shown SHALL be rendered in the user's local timezone (timezone correctness property).
10. WHEN a FedNow or RTP Payment_Rail's Rail_Health_Status is Degraded or Critical, THE Dashboard SHALL surface the most recent Marketaux_API news headline matching "FedNow" or "RTP" directly within that rail's health card in the Rail Health Overview panel; WHEN the rail's status is Healthy, no news headline SHALL be displayed within the rail card.
11. THE Dashboard SHALL implement a request counter stored in LocalStorage tracking Marketaux_API calls made in the current calendar month. WHEN the counter reaches 80 requests (leaving a 20-request buffer before the 100-request free tier limit), THE Dashboard SHALL switch to displaying only cached news articles and display a notice that live news updates are paused until the next calendar month.
12. THE Dashboard SHALL display the current Marketaux_API request count and monthly limit in a non-intrusive location visible to the user.
13. THE Dashboard SHALL map Marketaux_API sentiment scores to categorical labels using the following thresholds: score > 0.15 → "Positive"; score < -0.15 → "Negative"; -0.15 ≤ score ≤ 0.15 → "Neutral".

---

### Requirement 11: Standard Error State Pattern

**User Story:** As a Payments Operations Manager, I want consistent, recognizable error states across all dashboard sections, so that I can quickly identify what's unavailable and take action without confusion.

#### Acceptance Criteria

1. THE Dashboard SHALL use a single standard error state component for all API failure scenarios (FRED_API, Frankfurter_API, Marketaux_API). The standard error state SHALL display: an error icon, a one-line plain-language message identifying which data source failed, the timestamp of the last successful fetch (if available), and a "Retry" button.
2. THE standard error state component SHALL be rendered inline within the affected section only, without affecting the layout or content of other sections.
3. WHEN stale cached data is available, THE standard error state SHALL display the cached data with a Stale_Data_Indicator overlay rather than replacing the data with an error message.
4. THE standard error state SHALL never display raw HTTP status codes, stack traces, or technical error messages to the user.
5. WHEN a retry is in progress, THE standard error state SHALL replace the Retry button with a loading indicator and SHALL NOT allow duplicate retry requests.

---

### Requirement 12: Market Context Panel — Aggregate Behavior

**User Story:** As a Payments Operations Manager, I want the market context panel to degrade gracefully when APIs are unavailable, so that a network issue never prevents me from accessing my core payment operations data.

#### Acceptance Criteria

1. WHEN all three external APIs (FRED_API, Frankfurter_API, Marketaux_API) are unavailable simultaneously, THE Dashboard SHALL continue to display all simulated payment operations data (rail health, exceptions, settlement) without degradation.
2. THE Dashboard SHALL display each API data source (FRED economic context indicator, Frankfurter inline FX conversions, Marketaux news) in an independently isolated section so that a failure in one source does not affect the display of the other two sources.
3. WHEN any external API request is in-flight, THE Dashboard SHALL display a loading indicator for that specific data source section.
4. THE Dashboard SHALL display the last-successful-fetch timestamp for each API data source so users can assess data freshness.
5. WHEN a user clicks a retry button on a failed API section, THE Dashboard SHALL attempt a new fetch for that specific API only, without re-fetching other sections.
6. THE Dashboard SHALL complete the initial render of all simulated data sections before initiating any external API requests, ensuring the core dashboard is usable within 500 milliseconds regardless of API response times.

---

### Requirement 13: Daily Summary Export

**User Story:** As a Payments Operations Manager, I want to generate a plain-text daily summary with one click, so that I can share the morning ops status with leadership or use it in a standup without manual transcription.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a single-click action that generates a Daily_Summary as plain text.
2. THE Daily_Summary SHALL include: the current date and time, overall rail health status for each Payment_Rail, total exception count and the top 3 aging exceptions by SLA status, current Settlement_Position and Funding_Coverage_Ratio, and any active Intraday_Liquidity_Alerts.
3. WHEN live market data is available, THE Daily_Summary SHALL include the current Federal Funds Rate and the headline of the top-ranked news article. IF any Wire_International FX rates have been fetched and cached during the current session, THE Daily_Summary SHALL include up to two of those rates; otherwise the FX rate section SHALL be omitted from the summary without error.
4. WHEN live market data is unavailable, THE Daily_Summary SHALL include a note indicating market data was unavailable at time of export, and SHALL still include all payment operations data.
5. THE Daily_Summary SHALL begin with the following mandatory disclaimer as its FIRST line: "⚠ SIMULATED DATA — FOR DEMONSTRATION PURPOSES ONLY. NOT FOR USE IN REGULATORY REPORTING, BOARD PRESENTATIONS, OR ANY COMPLIANCE PURPOSE." THE Daily_Summary SHALL also end with this same disclaimer as its LAST line before any signature or footer.
6. WHEN the user clicks the export action, THE Dashboard SHALL copy the Daily_Summary text to the system clipboard and display a confirmation message within 300 milliseconds.
7. IF the Clipboard API is unavailable in the user's browser, THEN THE Dashboard SHALL display the Daily_Summary text in a modal dialog that the user can manually copy.
8. FOR ALL Daily_Summary exports, the Funding_Coverage_Ratio value in the export SHALL match the value displayed on the Dashboard at the time of export (export consistency invariant).

---

### Requirement 14: Performance and Responsiveness

**User Story:** As a Payments Operations Manager, I want the dashboard to be fast and usable on the devices I have at my desk, so that it doesn't slow down my morning review process.

#### Acceptance Criteria

1. THE Dashboard SHALL complete initial render of all simulated data sections within 500 milliseconds of Page_Load_Start on a modern desktop browser (Chrome, Firefox, Safari, Edge — current stable versions).
2. THE Dashboard SHALL be fully functional and legible on viewport widths from 1024px to 2560px.
3. WHEN the viewport width is between 1024px and 1279px, THE Dashboard SHALL reflow into a two-column layout without horizontal scrolling or content overflow.
4. WHEN the viewport width is 1280px or greater, THE Dashboard SHALL display in a full multi-panel layout with all sections visible without scrolling past the primary viewport.
5. THE Dashboard SHALL not block the browser's main thread for more than 50 milliseconds during any single Simulator data generation cycle.
6. WHEN a user resizes the browser window, THE Dashboard SHALL reflow layout within 100 milliseconds without requiring a page reload.
7. THE Dashboard SHALL not consume more than 50MB of browser memory during normal operation with all panels loaded and all API data cached.
8. WHEN LocalStorage is unavailable or full, THE Dashboard SHALL continue to operate normally without persisting state, and SHALL display a non-blocking notice that preferences will not be saved.
9. THE Dashboard SHALL be served over HTTPS or localhost in order to support the Clipboard API (Req 13.6) and browser security policies. THE Dashboard documentation SHALL note this requirement.

---

### Requirement 15: Data Simulation Integrity

**User Story:** As a Payments Operations Manager evaluating RailWatch, I want the simulated data to reflect realistic payment operations benchmarks, so that I can accurately assess whether the dashboard would be useful in a real environment.

#### Acceptance Criteria

1. THE Simulator SHALL generate ACH_Standard daily volumes in the range of 8,000–15,000 transactions, consistent with a $3B credit union processing profile.
2. THE Simulator SHALL generate ACH_Same_Day daily volumes in the range of 500–2,000 transactions.
3. THE Simulator SHALL generate Wire_Domestic daily volumes in the range of 50–200 transactions.
4. THE Simulator SHALL generate Wire_International daily volumes in the range of 5–30 transactions.
5. THE Simulator SHALL generate RTP daily volumes in the range of 200–800 transactions.
6. THE Simulator SHALL generate FedNow daily volumes in the range of 100–500 transactions.
7. THE Simulator SHALL generate failure rates between 0.5% and 3% for ACH rails, between 0.1% and 1% for wire rails, and between 0.2% and 2% for instant payment rails (RTP, FedNow), consistent with published industry benchmarks.
8. THE Simulator SHALL generate a Settlement_Position and Projected_Daily_Obligation as a correlated pair such that the resulting Funding_Coverage_Ratio always falls within the range [85%, 140%]. The Simulator SHALL first sample a target ratio uniformly from [85%, 140%], then derive Settlement_Position and Projected_Daily_Obligation values consistent with that ratio within realistic absolute ranges ($8M–$25M for Settlement_Position).
9. FOR ALL simulated datasets, the Funding_Coverage_Ratio computed from the generated Settlement_Position and Projected_Daily_Obligation SHALL fall within the range [85%, 140%] (simulation realism invariant — guaranteed by correlated sampling in 15.8).
10. THE Simulator SHALL generate between 15 and 80 total open exceptions across all rails, with at least one exception per rail. To guarantee SLA breach visibility, THE Simulator SHALL explicitly inject at least one exception per rail that has exceeded that rail's breach threshold (FedNow/RTP/ACH_Same_Day: older than 8 hours; Wire_Domestic/Wire_International: older than 48 hours; ACH_Standard: older than 72 hours), regardless of the deterministic seed value.
11. WHEN the Simulator generates exception aging data, the distribution of exception ages SHALL include items in each aging bucket: under 24 hours, 24–48 hours, and over 48 hours.
12. THE Simulator SHALL generate 7 days of historical daily volume data for each Payment_Rail at initialization, using the same volume ranges defined in criteria 15.1–15.6, seeded with a deterministic value derived from the current date so that the same date always produces the same historical baseline.
13. THE Simulator SHALL generate prior-business-day data as the most recent entry in the 7-day history, using the business day immediately preceding the current date (skipping weekends and federal holidays). The prior-business-day dataset SHALL include a closing exception count per rail, used by Req 6.12 for queue growth comparison.
14. Data generated by the Simulator SHALL NOT be used for regulatory reporting, board presentations, NCUA examination preparation, or any compliance purpose. THE Dashboard SHALL include this prohibition in the README and in the Daily_Summary export per Req 13.5.

---

### Requirement 16: Accessibility and Usability

**User Story:** As a Payments Operations Manager, I want the dashboard to be readable and navigable without relying solely on color, so that I can use it effectively regardless of display conditions or accessibility needs.

#### Acceptance Criteria

1. THE Dashboard SHALL convey Rail_Health_Status using both color and a text label or icon, so that status is distinguishable without relying on color alone.
2. THE Dashboard SHALL convey SLA breach status using both color and a text label or icon.
3. THE Dashboard SHALL convey Intraday_Liquidity_Alert severity using both color and a text label.
4. WHEN a user navigates the Dashboard using keyboard-only input, THE Dashboard SHALL allow focus to reach all interactive elements (export button, retry buttons, panel toggles) in a logical tab order.
5. THE Dashboard SHALL display all monetary values in U.S. dollar format with comma-separated thousands and two decimal places (e.g., $12,450,000.00).
6. THE Dashboard SHALL display all percentage values with two decimal places and a percent symbol (e.g., 94.32%).
7. THE Dashboard SHALL display all timestamps in a human-readable format showing date and time in the user's local timezone.
8. WHEN a number value changes due to a data refresh, THE Dashboard SHALL update the displayed value in place without causing a full page re-render or loss of scroll position.

---

### Requirement 17: Payment Cut-Off Time Monitor

**User Story:** As a Payments Operations Manager, I want to see a live countdown to each rail's cut-off time, so that I know exactly how much time I have to submit payments before today's settlement windows close.

#### Acceptance Criteria

1. THE Dashboard SHALL display the cut-off time and a live countdown timer for each Payment_Rail. For ACH_Same_Day, THE Dashboard SHALL display all three submission windows simultaneously in a window strip component: 10:30 AM ET, 2:45 PM ET, and 4:45 PM ET. The next upcoming window SHALL be highlighted; passed windows SHALL be shown as "Closed". For all other rails, the schedule is: ACH_Standard — 2:45 PM ET; Wire_Domestic (Fedwire) — 6:00 PM ET; Wire_International (SWIFT) — 5:00 PM ET; RTP — no cut-off (24/7/365); FedNow — no cut-off (24/7/365).
2. WHEN a cut-off time is more than 2 hours away, THE Dashboard SHALL display the countdown in a neutral state.
3. WHEN a cut-off time is between 30 minutes and 2 hours away, THE Dashboard SHALL display the countdown in a warning state.
4. WHEN a cut-off time is less than 30 minutes away, THE Dashboard SHALL display the countdown in a critical state with a visual pulse indicator.
5. WHEN a cut-off time has passed for the current business day, THE Dashboard SHALL display "Closed" for that window and show the next available window if applicable.
6. FOR RTP and FedNow rails, THE Dashboard SHALL display "24/7 — No Cut-Off" rather than a countdown.
7. WHEN the Dashboard is opened on a weekend or federal holiday, THE Dashboard SHALL display all cut-off countdowns as "Next business day" with the date of the next business day.
8. THE countdown timers SHALL update every second without causing a full re-render of other Dashboard sections.
9. FOR ALL cut-off time calculations, the Dashboard SHALL use Eastern Time (America/New_York) as the reference timezone, accounting for daylight saving time transitions.
10. WHEN all ACH_Same_Day submission windows have passed for the current business day, THE Dashboard SHALL display "All windows closed — next business day: [date]" for the ACH_Same_Day rail.

---

### Requirement 18: Edge Cases and Boundary Conditions

**User Story:** As a developer implementing RailWatch, I need all edge cases and boundary conditions explicitly specified so that the application behaves predictably in all scenarios.

#### Acceptance Criteria

**Happy Path — Normal Operations:**
1. WHEN all six Payment_Rails are Healthy, all SLA thresholds are met, Funding_Coverage_Ratio ≥ 110%, and no cut-off is within 2 hours, THE Dashboard SHALL display the Status Bar in "All Systems Normal" state with no alerts active.
2. WHEN the Simulator generates data on a normal business day with all rails within expected volume ranges, THE Dashboard SHALL render all sections without any error, warning, or anomaly indicators.

**Unhappy Path — Simulation Failures:**
3. IF THE Simulator throws a JavaScript exception during data generation, THE Dashboard SHALL catch the error, display a full-page error state with a "Reload" button, and log the error to the browser console. THE Dashboard SHALL NOT display a partially-rendered state.
4. IF THE Simulator generates data where the sum of per-rail transaction counts does not equal the reported total (violating the Req 1.7 consistency invariant), THE Dashboard SHALL log a console warning and display the per-rail counts as authoritative, recalculating the total from them.

**Unhappy Path — All APIs Down:**
5. WHEN all three external APIs are unavailable and no cached data exists, THE Dashboard SHALL display the standard error state (Req 11) for each API section and SHALL continue to display all simulated payment operations data without degradation.
6. WHEN all three external APIs are unavailable but cached data exists for all three, THE Dashboard SHALL display all cached data with Stale_Data_Indicators and SHALL NOT show any error states.

**Unhappy Path — Partial API Availability:**
7. WHEN FRED_API is unavailable but Frankfurter_API and Marketaux_API are available, THE Dashboard SHALL display the error state for the Fed Rate indicator only, while displaying live data for FX conversions and news.
8. WHEN Marketaux_API is unavailable and a FedNow or RTP rail is in Degraded or Critical status (triggering Req 10.10), THE Dashboard SHALL display the rail health card without a news headline and SHALL NOT display an error within the rail card for the missing headline.

**Unhappy Path — LocalStorage:**
9. WHEN LocalStorage is full and a cache write fails, THE Dashboard SHALL continue operating with in-memory data only and SHALL display the non-blocking notice defined in Req 14.8.
10. WHEN LocalStorage contains data from a previous version of the application with an incompatible schema, THE Dashboard SHALL discard the incompatible data, initialize fresh state, and display the first-run overlay (Req 3).

**Unhappy Path — Cut-Off Time Edge Cases:**
11. WHEN the Dashboard is opened exactly at a cut-off time (0 seconds remaining), THE Dashboard SHALL immediately display "Closed" for that window without displaying a negative countdown.
12. WHEN the system clock changes (e.g., daylight saving time transition) while the Dashboard is open, THE countdown timers SHALL recalculate from the new system time within one timer tick (≤ 1 second).

**Unhappy Path — Exception Queue:**
13. WHEN the Exception_Queue contains exceptions for a Payment_Rail that has zero transaction volume (all transactions failed), THE Dashboard SHALL display the rail as Critical and SHALL include its exceptions in the queue normally.
14. WHEN a Wire_International exception has a Destination_Currency that Frankfurter_API does not support, THE Dashboard SHALL display the missing data indicator for that transaction's converted amount and SHALL NOT prevent the exception from appearing in the queue.

**Unhappy Path — Settlement:**
15. WHEN the Funding_Coverage_Ratio is exactly 100.00%, THE Dashboard SHALL display a critical-level Intraday_Liquidity_Alert (per Req 7.5; clarification: exactly 100.00% SHALL be treated as critical, not warning, as the position is fully consumed with no buffer).
16. WHEN the Funding_Coverage_Ratio is exactly 110.00%, THE Dashboard SHALL display the settlement position as adequately funded with no alert (per Req 7.7).

**Unhappy Path — Daily Summary Export:**
17. WHEN the user clicks "Copy Summary" and the Clipboard API write succeeds, THE Dashboard SHALL display a confirmation message for 3 seconds then automatically dismiss it.
18. WHEN the user clicks "Copy Summary" while a previous copy operation confirmation is still displayed, THE Dashboard SHALL reset the confirmation timer without duplicating the confirmation message.
