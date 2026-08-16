---
title: Application Test Cases Checklist
date: 2026-08-12
tags:
  - testing
  - test-cases
  - obsidian-checklist
  - qa
  - laravel
  - nativephp
type: test-plan
status: active
---

# 📋 Application Test Cases Checklist (Obsidian Compatible)

> [!INFO] **Document Purpose**
> This document provides an exhaustive, interactive checklist of manual and automated test cases covering all 16 core modules of the application.
> Designed natively for **Obsidian**, utilizing YAML frontmatter, callouts, tags, hierarchical sections, and interactive checkboxes (`- [ ]`).

> [!TIP] **Obsidian Usage Instructions**
> - Open this file inside your Obsidian Vault.
> - Toggle test case status directly using Obsidian's native checklist preview mode (`- [ ]` to `- [x]`).
> - Use the **Tag Pane** or search for `#test/unit`, `#test/feature`, or `#module/<name>` to filter test cases dynamically.

---

## 📑 Table of Contents

- [[#Module 1: Authentication & User Profile Management]]
- [[#Module 2: Admin & Role-Based Access Control (RBAC)]]
- [[#Module 3: Planters Management]]
- [[#Module 4: Haciendas Management]]
- [[#Module 5: Employees Management]]
- [[#Module 6: Attendance & Working Hours]]
- [[#Module 7: Cash Advancements & Deductions]]
- [[#Module 8: Milling Periods Management]]
- [[#Module 9: Sugar Cane Production & Bulk Updates]]
- [[#Module 10: Weekly Summaries & Reporting]]
- [[#Module 11: Payroll Processing Engine]]
- [[#Module 12: Bank Reconciliation & Internal Disbursements]]
- [[#Module 13: Data Import & Column Mapping Engine]]
- [[#Module 14: PDF Parser & Python Splitter Engine]]
- [[#Module 15: System Settings & Dynamic Database Manager]]
- [[#Module 16: Dashboard & System Health Monitoring]]

---

## Module 1: Authentication & User Profile Management
#module/auth #test/feature #status/pending

> [!SUMMARY] Focus Areas
> Verifies credential authentication, session persistence, password reset flow, Profile updates, and Two-Factor Authentication (2FA).

### 1.1 Authentication & Login
- [ ] **TC-AUTH-001**: Verify successful user login with valid email and password credentials. `#test/feature`
- [ ] **TC-AUTH-002**: Verify error message displayed when logging in with an unregistered email. `#test/feature`
- [ ] **TC-AUTH-003**: Verify error message displayed when entering an incorrect password. `#test/feature`
- [ ] **TC-AUTH-004**: Verify account lock or rate-limiting throttling after repeated failed login attempts. `#test/security`
- [ ] **TC-AUTH-005**: Verify user logout invalidates session and redirects to the login screen. `#test/feature`

### 1.2 Two-Factor Authentication (2FA) & Profile Settings
- [ ] **TC-AUTH-006**: Verify enabling 2FA generates valid QR code and secret key. `#test/security`
- [ ] **TC-AUTH-007**: Verify 2FA challenge is requested during login once enabled. `#test/security`
- [ ] **TC-AUTH-008**: Verify profile update allows changing display name and email address. `#test/feature`
- [ ] **TC-AUTH-009**: Verify current password verification when attempting to update password in settings. `#test/security`

---

## Module 2: Admin & Role-Based Access Control (RBAC)
#module/admin #test/feature #status/pending

> [!SUMMARY] Focus Areas
> Verifies user account administration, custom roles, permission assignments, and route authorization barriers.

### 2.1 User & Role Administration
- [ ] **TC-RBAC-001**: Verify Admin can list, search, and paginate system users. `#test/feature`
- [ ] **TC-RBAC-002**: Verify Admin can create a new user and assign single or multiple roles. `#test/feature`
- [ ] **TC-RBAC-003**: Verify Admin can update user role assignments and status. `#test/feature`
- [ ] **TC-RBAC-004**: Verify creation of custom roles with granular permission selections. `#test/feature`
- [ ] **TC-RBAC-005**: Verify updating role permissions immediately reflects on assigned users upon request. `#test/feature`

### 2.2 Access Enforcement
- [ ] **TC-RBAC-006**: Verify non-admin user receives HTTP 403 Forbidden when attempting to access `/admin/users`. `#test/security`
- [ ] **TC-RBAC-007**: Verify non-manager role cannot access database connection settings. `#test/security`
- [ ] **TC-RBAC-008**: Verify logged-in admin user cannot remove administrative roles (`super_admin`, `manager`, `admin`) or strip all roles from their own account. `#test/security`

---

## Module 3: Planters Management
#module/planters #test/crud #status/pending

> [!SUMMARY] Focus Areas
> Verifies planter entity registration, unique code enforcement, searching, and hacienda linkages.

### 3.1 Planter CRUD & Validation
- [ ] **TC-PLN-001**: Verify successful registration of a new planter with complete details (Code, Name, Contact, Address). `#test/feature`
- [ ] **TC-PLN-002**: Verify error validation when attempting to register a duplicate Planter Code. `#test/validation`
- [ ] **TC-PLN-003**: Verify updating existing planter details correctly saves changes in database. `#test/feature`
- [ ] **TC-PLN-004**: Verify soft deletion or archiving of a planter without orphaned production records. `#test/database`

### 3.2 Search & Relationships
- [ ] **TC-PLN-005**: Verify search bar filters planters dynamically by Code, Name, or Hacienda. `#test/ui`
- [ ] **TC-PLN-006**: Verify planter profile lists all associated haciendas and historical production batches. `#test/integration`

---

## Module 4: Haciendas Management
#module/haciendas #test/crud #status/pending

> [!SUMMARY] Focus Areas
> Verifies hacienda records, address normalization, planter associations, and production tracking.

### 4.1 Hacienda Operations
- [ ] **TC-HAC-001**: Verify creation of a new Hacienda record with valid code, name, and address. `#test/feature`
- [ ] **TC-HAC-002**: Verify unique constraint validation on Hacienda Code. `#test/validation`
- [ ] **TC-HAC-003**: Verify editing Hacienda information updates linked planter and production views. `#test/integration`
- [ ] **TC-HAC-004**: Verify deleting a Hacienda with active linked planters is restricted or handled safely. `#test/security`

---

## Module 5: Employees Management
#module/employees #test/crud #status/pending

> [!SUMMARY] Focus Areas
> Verifies employee master list, employment status, daily wage rates, base salaries, and hacienda assignments.

### 5.1 Profile & Pay Rate Management
- [ ] **TC-EMP-001**: Verify adding employee with complete profile (Name, Role, Base Salary, Daily Rate, Hacienda). `#test/feature`
- [ ] **TC-EMP-002**: Verify validation error when base salary or daily rate is zero or negative. `#test/validation`
- [ ] **TC-EMP-003**: Verify toggling employment status between `Active` and `Inactive`. `#test/feature`
- [ ] **TC-EMP-004**: Verify inactive employees are excluded from new payroll generation selection dropdowns. `#test/integration`

---

## Module 6: Attendance & Working Hours
#module/attendance #test/integration #status/pending

> [!SUMMARY] Focus Areas
> Verifies daily time log entries, overtime multiplier logic (1.5x), XLSX file imports, and duplicate log prevention.

### 6.1 Attendance Tracking & Calculation
- [ ] **TC-ATT-001**: Verify manual attendance logging for an employee on a specific date. `#test/feature`
- [ ] **TC-ATT-002**: Verify regular working hours (up to 8 hrs) calculated accurately per day. `#test/unit`
- [ ] **TC-ATT-003**: Verify overtime hours (> 8 hrs/day) applied with 1.5x rate calculation. `#test/unit`
- [ ] **TC-ATT-004**: Verify error detection when duplicate attendance logs are entered for the same employee on the same date. `#test/validation`

### 6.2 Attendance File Import
- [ ] **TC-ATT-005**: Verify successful parsing and upload of attendance `.xlsx` / `.xls` spreadsheets. `#test/integration`
- [ ] **TC-ATT-006**: Verify import validation errors when spreadsheet contains missing employee IDs or invalid date formats. `#test/validation`

---

## Module 7: Cash Advancements & Deductions
#module/advancements #test/feature #status/pending

> [!SUMMARY] Focus Areas
> Verifies cash advance issuance, balance tracking, payroll auto-deductions, and advance reversion/voiding logic.

### 7.1 Issuance & Tracking
- [ ] **TC-ADV-001**: Verify issuance of cash advance to an active employee with specified amount and reason. `#test/feature`
- [ ] **TC-ADV-002**: Verify outstanding balance calculation updates when cash advance is issued. `#test/unit`
- [ ] **TC-ADV-003**: Verify automatic deduction application when generating payroll for employee with active advance. `#test/integration`

### 7.2 Reversion & Voiding
- [ ] **TC-ADV-004**: Verify Cash Advancement Reversion voids remaining balance and restores previous payroll state (`CashAdvancementReversionTest`). `#test/feature`
- [ ] **TC-ADV-005**: Verify cash advance cannot be edited or deleted once fully paid or attached to locked payroll. `#test/security`

---

## Module 8: Milling Periods Management
#module/milling #test/crud #status/pending

> [!SUMMARY] Focus Areas
> Verifies crop year definitions, start/end date ranges, active period toggles, and locked period protections.

### 8.1 Period Lifecycle
- [ ] **TC-MIL-001**: Verify creation of a new Milling Period with valid Crop Year and date bounds. `#test/feature`
- [ ] **TC-MIL-002**: Verify overlapping date validation prevents creating intersecting milling periods. `#test/validation`
- [ ] **TC-MIL-003**: Verify activating a milling period deactivates all other active periods. `#test/feature`
- [ ] **TC-MIL-004**: Verify closed/locked milling periods prevent addition or modification of production data. `#test/security`

---

## Module 9: Sugar Cane Production & Bulk Updates
#module/production #test/integration #status/pending

> [!SUMMARY] Focus Areas
> Verifies sugar cane delivery logs, gross/tare/net weight calculations, LKG/ton yield figures, and bulk update operations.

### 9.1 Single Entry & Computations
- [ ] **TC-PRD-001**: Verify logging sugar cane delivery with Gross Weight, Tare Weight, and LKG yield. `#test/feature`
- [ ] **TC-PRD-002**: Verify automatic computation of `Net Weight = Gross Weight - Tare Weight`. `#test/unit`
- [ ] **TC-PRD-003**: Verify automatic computation of Total LKG yield based on net tonnage. `#test/unit`

### 9.2 Bulk Updates & Table Grid
- [ ] **TC-PRD-004**: Verify bulk updating multiple production records in the interactive table grid (`ProductionBulkUpdateTest`). `#test/feature`
- [ ] **TC-PRD-005**: Verify batch validation errors highlight invalid cell entries without persisting partial invalid data. `#test/validation`
- [ ] **TC-PRD-006**: Verify filtering production records by planter, hacienda, or date range. `#test/ui`

---

## Module 10: Weekly Summaries & Reporting
#module/weekly #test/feature #status/pending

> [!SUMMARY] Focus Areas
> Verifies weekly planter report generation, aggregate LKG calculations, net payout summaries, and PDF/Excel exports.

### 10.1 Summary Generation & Export
- [ ] **TC-WKY-001**: Verify weekly statement aggregation pools all deliveries within selected date window. `#test/feature`
- [ ] **TC-WKY-002**: Verify total gross payout, deductions, and net payout match sum of individual production tickets. `#test/unit`
- [ ] **TC-WKY-003**: Verify exporting weekly planter summary to Excel spreadsheet. `#test/integration`
- [ ] **TC-WKY-004**: Verify generating printable PDF weekly statement matches visual formatting standards. `#test/ui`

---

## Module 11: Payroll Processing Engine
#module/payroll #test/feature #status/pending

> [!SUMMARY] Focus Areas
> Verifies automated payroll calculation modal, inline deduction edits, net pay constraints, approval status flow (`draft` -> `released` -> `paid`), and audit trail.

### 11.1 Generation & Automated Calculations
- [ ] **TC-PAY-001**: Verify generating payroll for selected employee, date range, and attendance file (`/Payroll/generate`). `#test/feature`
- [ ] **TC-PAY-002**: Verify Basic Pay calculation matches pro-rated rate based on attendance logs. `#test/unit`
- [ ] **TC-PAY-003**: Verify Overtime bonus added to Basic Pay yields accurate `Gross Pay`. `#test/unit`
- [ ] **TC-PAY-004**: Verify `Net Pay = Gross Pay - Deductions` calculation. `#test/unit`
- [ ] **TC-PAY-005**: Verify Net Pay non-negative constraint (`Net Pay` never drops below 0.00). `#test/validation`

### 11.2 Inline Editing & Audit Logging
- [ ] **TC-PAY-006**: Verify inline editing of deductions field dynamically recalculates Net Pay without page refresh. `#test/ui`
- [ ] **TC-PAY-007**: Verify status transitions from `draft` -> `released` -> `paid`. `#test/feature`
- [ ] **TC-PAY-008**: Verify payroll audit log records all modifications, user timestamps, and original vs updated figures (`PayrollAuditTest`). `#test/security`

---

## Module 12: Bank Reconciliation & Internal Disbursements
#module/reconciliation #test/integration #status/pending

> [!SUMMARY] Focus Areas
> Verifies bank statement file uploads, transaction parsing, automated rule matching, manual overrides, and workspace variance calculations.

### 12.1 Statement Upload & Automatic Matching
- [ ] **TC-REC-001**: Verify uploading bank statement CSV/XLS file parses transaction date, description, and amounts. `#test/integration`
- [ ] **TC-REC-002**: Verify automatic matching logic pairs bank transactions with internal disbursements by amount and date window. `#test/feature`
- [ ] **TC-REC-003**: Verify status assignment (`unreconciled`, `matched`, `reconciled`) per transaction. `#test/feature`

### 12.2 Workspace Operations & Overrides
- [ ] **TC-REC-004**: Verify manual override allows force-matching unmatched bank entries with internal records. `#test/ui`
- [ ] **TC-REC-005**: Verify unmatching previously paired transactions restores both items to unreconciled pool. `#test/ui`
- [ ] **TC-REC-006**: Verify reconciliation workspace displays correct ending balance variance. `#test/unit`

---

## Module 13: Data Import & Column Mapping Engine
#module/imports #test/integration #status/pending

> [!SUMMARY] Focus Areas
> Verifies dynamic CSV/XLS column mapping, background job execution, import audit logs, and history rollback capabilities.

### 13.1 Column Mapping & Job Execution
- [ ] **TC-IMP-001**: Verify creating and saving reusable import mapping templates for custom file schemas. `#test/feature`
- [ ] **TC-IMP-002**: Verify async import background job (`ImportJob`) dispatches and updates progress status (`ImportJobStatusController`). `#test/integration`
- [ ] **TC-IMP-003**: Verify error handling when file contains missing mandatory mapped columns. `#test/validation`

### 13.2 Audit Transparency & History
- [ ] **TC-IMP-004**: Verify import audit transparency logs exact row numbers, failure reasons, and success counts (`ImportAuditTransparencyTest`). `#test/security`
- [ ] **TC-IMP-005**: Verify viewing import history list with filtering by status, date, and user (`ImportHistoryTest`). `#test/feature`
- [ ] **TC-IMP-006**: Verify rolling back an import batch removes imported records without corrupting existing data. `#test/database`

---

## Module 14: PDF Parser & Python Splitter Engine
#module/pdf-parser #test/unit #status/pending

> [!SUMMARY] Focus Areas
> Verifies python script (`pdftoexcel.py`) regex extraction, header/footer anchor detection, page splitting, and safe filename creation.

### 14.1 Anchor Detection & Regex Extraction
- [ ] **TC-PDF-001**: Verify `PLANTER_LINE_PATTERN` regex accurately extracts Planter Code, Planter Name, Hacienda Code, and Address. `#test/unit`
- [ ] **TC-PDF-002**: Verify primary header anchor `UNIVERSAL ROBINA CORPORATION` detection normalizes spaces and case. `#test/unit`
- [ ] **TC-PDF-003**: Verify primary footer anchor `EMMA E ABUEVA` and `QA MANAGER` role detection. `#test/unit`

### 14.2 File Processing & Concurrency
- [ ] **TC-PDF-004**: Verify `_safe_filename()` sanitizes output filenames by stripping special characters and replacing spaces with underscores. `#test/unit`
- [ ] **TC-PDF-005**: Verify multi-threaded execution (`ProcessPoolExecutor`) correctly processes multi-page PDF documents without race conditions. `#test/performance`
- [ ] **TC-PDF-006**: Verify handling corrupted or password-protected PDF files with clean error exit codes. `#test/validation`

---

## Module 15: System Settings & Dynamic Database Manager
#module/database-settings #test/integration #status/pending

> [!SUMMARY] Focus Areas
> Verifies dynamic PostgreSQL/MySQL connection setup, PDO connectivity testing, active database switching at runtime, and SQLite fallback.

### 15.1 Connection Management & Verification
- [ ] **TC-DBS-001**: Verify adding PostgreSQL/MySQL connection parameters in Settings UI (`/settings/database`). `#test/feature`
- [ ] **TC-DBS-002**: Verify "Test Connection" button executes PDO probe and reports success or network/auth error. `#test/integration`
- [ ] **TC-DBS-003**: Verify activating a saved database connection switches active config on app boot via `DatabaseConfigurationService`. `#test/integration`

### 15.2 Fallback & Storage
- [ ] **TC-DBS-004**: Verify application falls back safely to SQLite local database if configured remote server is unreachable (`DatabaseFallbackTest`). `#test/resilience`
- [ ] **TC-DBS-005**: Verify deleting an inactive database connection record from settings. `#test/feature`

---

## Module 16: Dashboard & System Health Monitoring
#module/dashboard #test/regression #status/pending

> [!SUMMARY] Focus Areas
> Verifies financial pulse gauge widgets, active navigation badges, health check API (`/health`), and overall application smoke regression.

### 16.1 Financial Pulse & Widgets
- [ ] **TC-DSH-001**: Verify Dashboard renders tax reserve, monthly spending plan, and financial pulse gauge widgets. `#test/ui`
- [ ] **TC-DSH-002**: Verify gauge status pills (e.g. "Comfortable", "Watch", "Overdue") reflect calculated threshold values. `#test/unit`
- [ ] **TC-DSH-003**: Verify system health check endpoint (`/health` / `HealthCheckController`) returns status OK and component diagnostics. `#test/integration`

### 16.2 Regression & Smoke Testing
- [ ] **TC-DSH-004**: Verify full application smoke test suite passes cleanly (`ApplicationSmokeAndRegressionTest`). `#test/regression`
- [ ] **TC-DSH-005**: Verify UI layout responsiveness across desktop and tablet viewports adhering to Tarsi design tokens. `#test/ui`

---

> [!SUCCESS] **Checklist Execution Summary**
> Total Modules: **16** | Total Test Cases: **88**
> Maintainer: Software Engineering QA Team
