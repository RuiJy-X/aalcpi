# AALCPI MIS Requirements Documentation (As-Built + Expansion Backlog)

Generated from direct inspection of the current codebase.
Date: 2026-03-27

## 1. Product Summary

AALCPI MIS is a Laravel 12 + Inertia + React 19 management information system focused on planter operations, hacienda records, production tracking, certifications, and foundational HR modules (employees, attendance, payroll).

Primary personas currently represented in the code:

- Manager
- Certification Officer
- Employee

Core value currently delivered:

- Secure authentication and account settings
- Role-gated access to operational modules
- Planter/Hacienda/Production/Certification lifecycle management
- Excel imports for planters and productions
- PDF output for production final data

## 2. Technology and Runtime Requirements

## 2.1 Backend

- PHP: 8.2+
- Framework: Laravel 12
- Auth: Laravel Fortify
- Server-side adapter: Inertia Laravel
- Data import: maatwebsite/excel
- PDF generation: barryvdh/laravel-dompdf

## 2.2 Frontend

- React 19
- TypeScript
- Vite 7
- Inertia React
- Tailwind CSS 4
- Radix UI + headless UI primitives
- TanStack React Table

## 2.3 Tooling

- PHP lint/style: Pint
- JS lint/format: ESLint + Prettier
- Testing: Pest + Laravel test plugin

## 3. Architecture Requirements

## 3.1 App Layers

- Routing layer in [routes/web.php](../routes/web.php) and [routes/settings.php](../routes/settings.php)
- Controller layer in [app/Http/Controllers](../app/Http/Controllers)
- Domain model layer in [app/Models](../app/Models)
- Data validation via Form Requests and inline request validation
- Inertia pages in [resources/js/pages](../resources/js/pages)
- Shared UI components in [resources/js/components](../resources/js/components)
- Generated typed route client in [resources/js/routes](../resources/js/routes)

## 3.2 Role Middleware

- Custom role middleware alias role is registered in [bootstrap/app.php](../bootstrap/app.php)
- Role checks implemented in [app/Http/Middleware/RoleManager.php](../app/Http/Middleware/RoleManager.php)

## 4. Functional Requirements by Module (Implemented)

## 4.1 Authentication and Account

Implemented with Fortify, customized views in [app/Providers/FortifyServiceProvider.php](../app/Providers/FortifyServiceProvider.php).

Features currently present:

- Login
- Registration
- Email verification
- Forgot/reset password
- Two-factor challenge
- Confirm password flow

Settings pages and actions:

- Profile edit/update/delete in [app/Http/Controllers/Settings/ProfileController.php](../app/Http/Controllers/Settings/ProfileController.php)
- Password change in [app/Http/Controllers/Settings/PasswordController.php](../app/Http/Controllers/Settings/PasswordController.php)
- Two-factor settings in [app/Http/Controllers/Settings/TwoFactorAuthenticationController.php](../app/Http/Controllers/Settings/TwoFactorAuthenticationController.php)

Validation traits:

- [app/Concerns/ProfileValidationRules.php](../app/Concerns/ProfileValidationRules.php)
- [app/Concerns/PasswordValidationRules.php](../app/Concerns/PasswordValidationRules.php)

Rate limits:

- Login: 5/min per email+IP
- Two-factor: 5/min per session login id
- Password update route throttle: 6/min in settings routes

## 4.2 User Administration

Implemented routes (manager only):

- List users
- Create user
- Show user

Controller: [app/Http/Controllers/Admin/UserController.php](../app/Http/Controllers/Admin/UserController.php)

Requirement currently intended but not implemented:

- Delete user route exists in [routes/web.php](../routes/web.php#L30), but controller has no destroy method.

## 4.3 Planter Management

Controller: [app/Http/Controllers/PlanterController.php](../app/Http/Controllers/PlanterController.php)

Implemented behavior:

- Render planter index, create, and view pages
- Create planter with optional nested haciendas batch
- Update planter profile fields
- Delete planter
- Bulk delete planters
- JSON data endpoint and header endpoint
- Excel import of planter rows
- View planter detail with joined haciendas, productions, certifications

Inertia pages:

- [resources/js/pages/Planters/Index.tsx](../resources/js/pages/Planters/Index.tsx)
- [resources/js/pages/Planters/Create.tsx](../resources/js/pages/Planters/Create.tsx)
- [resources/js/pages/Planters/View.tsx](../resources/js/pages/Planters/View.tsx)

Example edit UI:

- [resources/js/components/planters/planter-view/update-planter-dialog.tsx](../resources/js/components/planters/planter-view/update-planter-dialog.tsx)

## 4.4 Hacienda Management

Controller: [app/Http/Controllers/HaciendaController.php](../app/Http/Controllers/HaciendaController.php)

Implemented behavior:

- List haciendas with planter context
- Create one or many haciendas for a planter
- View hacienda details
- Update hacienda details
- Bulk delete haciendas

Inertia pages:

- [resources/js/pages/Haciendas/Index.tsx](../resources/js/pages/Haciendas/Index.tsx)
- [resources/js/pages/Haciendas/Create.tsx](../resources/js/pages/Haciendas/Create.tsx)
- [resources/js/pages/Haciendas/View.tsx](../resources/js/pages/Haciendas/View.tsx)

## 4.5 Production Management

Controller: [app/Http/Controllers/ProductionController.php](../app/Http/Controllers/ProductionController.php)

Implemented behavior:

- List productions with planter and hacienda enrichment
- View production details
- Create production record
- Update production record
- Delete production
- Bulk delete productions
- Import productions via Excel
- Output final-data PDF for one production
- Bulk PDF download for selected productions
- JSON data and table-header endpoints

Inertia pages:

- [resources/js/pages/Productions/Index.tsx](../resources/js/pages/Productions/Index.tsx)
- [resources/js/pages/Productions/View.tsx](../resources/js/pages/Productions/View.tsx)

## 4.6 Certification Management

Controller: [app/Http/Controllers/CertificationController.php](../app/Http/Controllers/CertificationController.php)

Implemented behavior:

- List certifications page
- JSON listing endpoint with planter/hacienda/production eager loading
- Create certification
- Update certification
- Delete certification
- Bulk delete certifications
- Header endpoint

Inertia page:

- [resources/js/pages/Certifications/Index.tsx](../resources/js/pages/Certifications/Index.tsx)

## 4.7 Employee, Attendance, Payroll Foundations

Controllers exist and expose JSON CRUD-like actions:

- Employees: [app/Http/Controllers/EmployeeController.php](../app/Http/Controllers/EmployeeController.php)
- Attendance: [app/Http/Controllers/AttendanceController.php](../app/Http/Controllers/AttendanceController.php)
- Payroll: [app/Http/Controllers/PayrollController.php](../app/Http/Controllers/PayrollController.php)

Current UI:

- Employees index page exists at [resources/js/pages/Employees/Index.tsx](../resources/js/pages/Employees/Index.tsx)
- No full attendance or payroll pages found under pages directory

Route gap:

- Route points to EmployeeController index method [routes/web.php](../routes/web.php#L33), but EmployeeController does not implement index.

## 4.8 Data Table and Bulk Operations

Generic data table system:

- [resources/js/components/data-table/data-table.tsx](../resources/js/components/data-table/data-table.tsx)
- [resources/js/components/data-table/data-table-column-filter.tsx](../resources/js/components/data-table/data-table-column-filter.tsx)
- [resources/js/components/data-table/pagination.tsx](../resources/js/components/data-table/pagination.tsx)

Column definitions per domain:

- Planter, production, hacienda, certifications, users

Bulk helpers:

- [resources/js/components/data-table/bulk-delete.ts](../resources/js/components/data-table/bulk-delete.ts)
- [resources/js/components/data-table/bulk-download.ts](../resources/js/components/data-table/bulk-download.ts)

## 5. Complete Backend Function Inventory (Code-Level)

## 5.1 Controllers

CertificationController:

- index
- get
- header
- create
- update
- destroy
- bulkDestroy

AttendanceController:

- get
- header
- create
- update
- destroy

Admin UserController:

- index
- store
- show

PayrollController:

- index
- get
- header
- create
- update
- destroy

HaciendaController:

- index
- create
- store
- show
- update
- bulkDestroy

PlanterController:

- index
- create
- viewCertificates
- data
- header
- store
- update
- destroy
- bulkDestroy
- show
- import

ProductionController:

- index
- show
- import
- get
- header
- create
- destroy
- bulkDestroy
- update
- finalData
- bulkDownload

EmployeeController:

- get
- header
- create
- show_with_payroll
- show_with_attendance
- show_with_both
- update
- destroy

Settings ProfileController:

- edit
- update
- destroy

Settings PasswordController:

- edit
- update

Settings TwoFactorAuthenticationController:

- middleware (static)
- show

## 5.2 Models

User model functions:

- casts
- employee
- isManager
- isCertOfficer
- isEmployee

Planter model functions:

- haciendas
- productions
- certifications

Production model functions:

- planter
- hacienda
- certification

Hacienda model functions:

- planter
- productions

Certification model functions:

- production
- planter
- hacienda

Employee model functions:

- attendances
- payrolls

Attendance model functions:

- employee

Payroll model functions:

- employee

## 5.3 Form Requests

PlanterCreateRequest:

- authorize
- rules

Settings ProfileUpdateRequest:

- rules

Settings PasswordUpdateRequest:

- rules

Settings ProfileDeleteRequest:

- rules

Settings TwoFactorAuthenticationRequest:

- authorize
- rules

## 5.4 Concerns, Actions, Imports, Middleware

PasswordValidationRules:

- passwordRules
- currentPasswordRules

ProfileValidationRules:

- profileRules
- nameRules
- emailRules

CreateNewUser action:

- create

ResetUserPassword action:

- reset

PlanterImport:

- model
- uniqueBy

ProductionsImport:

- model
- uniqueBy

RoleManager middleware:

- handle

FortifyServiceProvider functions:

- register
- boot
- configureActions
- configureViews
- configureRateLimiting

## 6. Route Requirements Map (As Built)

Source: [routes/web.php](../routes/web.php), [routes/settings.php](../routes/settings.php)

Public:

- GET / redirects to login

Authenticated + verified:

- GET /dashboard

Manager only:

- Users: list/create/show/delete route registered
- Employees: list route registered

Manager and cert_officer:

- Planters CRUD-ish + import + bulk delete + data endpoint
- Productions CRUD-ish + import + bulk delete + final-data PDF + bulk PDF download
- Haciendas list/create/view/update/bulk delete
- Certifications list/data/bulk delete

Settings (auth and auth+verified groups):

- profile, password, appearance, two-factor

## 7. Data Requirements (Schema and Constraints)

Confirmed migration files:

- [database/migrations/2026_02_04_074425_create_planters_table.php](../database/migrations/2026_02_04_074425_create_planters_table.php)
- [database/migrations/2026_02_04_074555_create_hacienda_table.php](../database/migrations/2026_02_04_074555_create_hacienda_table.php)
- [database/migrations/2026_02_04_075521_create_production_table.php](../database/migrations/2026_02_04_075521_create_production_table.php)
- [database/migrations/2026_02_04_075536_create_certification_table.php](../database/migrations/2026_02_04_075536_create_certification_table.php)
- [database/migrations/2026_02_04_075552_create_employees_table.php](../database/migrations/2026_02_04_075552_create_employees_table.php)
- [database/migrations/2026_02_04_075609_create_attendance_table.php](../database/migrations/2026_02_04_075609_create_attendance_table.php)
- [database/migrations/2026_02_04_075623_create_payroll_table.php](../database/migrations/2026_02_04_075623_create_payroll_table.php)
- [database/migrations/0001_01_01_000000_create_users_table.php](../database/migrations/0001_01_01_000000_create_users_table.php)
- [database/migrations/2025_08_14_170933_add_two_factor_columns_to_users_table.php](../database/migrations/2025_08_14_170933_add_two_factor_columns_to_users_table.php)
- [database/migrations/2026_03_18_225456_add_role_to_users_table.php](../database/migrations/2026_03_18_225456_add_role_to_users_table.php)

Entity relationship requirements:

- Planter has many haciendas
- Planter has many productions
- Planter has many certifications
- Hacienda belongs to planter
- Hacienda has many productions
- Production belongs to planter and hacienda (nullable foreign keys with nullOnDelete)
- Production has one certification
- Certification belongs to planter/hacienda/production (nullable FKs with nullOnDelete)
- Employee has many attendance and payroll entries
- User optionally belongs to employee

Important uniqueness constraints:

- planters.planter_code unique
- planters.contact_number unique
- planters.tin_number unique
- haciendas.hacienda_code unique
- productions.trans_code unique
- users.email unique

## 8. Validation and Business Rules Requirements

## 8.1 Strongly Enforced in Controllers

- Planter create/update validation with nested hacienda fields
- Hacienda create/update validation including unique hacienda_code on update ignore-id
- Production create/update validation for all numeric production metrics
- Certification create/update required references and metadata fields
- Attendance create/update constraints for hours range
- Payroll create/update period and status constraints
- User create validation including role enum and optional employee link

## 8.2 Form Request-Based

- Profile update rules from shared profile trait
- Password update and profile delete require current password
- Two-factor settings request authorization tied to Fortify feature switch

## 9. Frontend Requirements and UI Surface

## 9.1 Inertia Pages (25 discovered)

- Auth pages under [resources/js/pages/auth](../resources/js/pages/auth)
- Settings pages under [resources/js/pages/settings](../resources/js/pages/settings)
- Domain pages under Planters, Haciendas, Productions, Certifications, Employees, Users
- Dashboard and welcome pages

## 9.2 Shell and Navigation

- App bootstrapping in [resources/js/app.tsx](../resources/js/app.tsx)
- Main app layout in [resources/js/layouts/app-layout.tsx](../resources/js/layouts/app-layout.tsx)
- Sidebar navigation in [resources/js/components/nav-main.tsx](../resources/js/components/nav-main.tsx)

## 9.3 Typed Client Routes

- Generated route helpers in [resources/js/routes/index.ts](../resources/js/routes/index.ts) and subfolders
- Frontend uses route helper calls like planters.update route bindings

## 10. Test Requirements and Current Coverage

Feature tests discovered in [tests/Feature](../tests/Feature):

- Auth flows (login, registration, reset, verification, 2FA challenge, confirmation)
- Settings flows (profile update, password update, two-factor settings)
- Dashboard access test
- Example root-route behavior test

Coverage currently strong for:

- Authentication and settings

Coverage currently weak/missing for:

- CRUD for planters/haciendas/productions/certifications
- Employee/attendance/payroll behavior
- Role access enforcement
- Import and PDF export paths
- Bulk operations

## 11. Known Defects and Inconsistencies (Observed)

1. Missing controller methods for declared routes:

- Users delete route points to missing destroy method: [routes/web.php](../routes/web.php#L30), [app/Http/Controllers/Admin/UserController.php](../app/Http/Controllers/Admin/UserController.php)
- Employees index route points to missing index method: [routes/web.php](../routes/web.php#L33), [app/Http/Controllers/EmployeeController.php](../app/Http/Controllers/EmployeeController.php)

2. Import/type issues detected by analysis:

- Employee model import is missing in employee controller: [app/Http/Controllers/EmployeeController.php](../app/Http/Controllers/EmployeeController.php)
- BelongsTo relation type import missing in user model: [app/Models/User.php](../app/Models/User.php)

3. PlanterCreateRequest has invalid variable usage:

- Undefined request variable in rules method: [app/Http/Requests/PlanterCreateRequest.php](../app/Http/Requests/PlanterCreateRequest.php)

4. Production validation field inconsistencies:

- create uses integer/string for values stored as decimals in schema: [app/Http/Controllers/ProductionController.php](../app/Http/Controllers/ProductionController.php), [database/migrations/2026_02_04_075521_create_production_table.php](../database/migrations/2026_02_04_075521_create_production_table.php)

5. Employee module partially wired:

- Controllers exist, but web route exposure for attendance/payroll flows is incomplete
- Commented future work in routes: [routes/web.php](../routes/web.php#L34), [routes/web.php](../routes/web.php#L85)

## 12. Full Feature Expansion Backlog (All Candidate Additions)

## 12.1 Identity and Access

- Granular permission matrix beyond role strings
- Role management UI with permission toggles
- Session management and device login history
- Forced password reset policy
- Login audit trails
- Optional SSO (OIDC/SAML)

## 12.2 User and Employee Administration

- Complete employee CRUD pages
- Employee profile timeline
- Department/team assignment
- Employment contract records
- Employee document uploads
- Offboarding workflow

## 12.3 Attendance

- Full attendance UI (calendar + list)
- Shift templates
- Holiday calendar management
- Leave request and approval flow
- Late/undertime analytics
- Biometric import adapter

## 12.4 Payroll

- Payroll run wizard by cut-off period
- Auto computation from attendance and rates
- Deduction templates (tax, benefits, loans)
- Payslip PDF generation and download
- Employee self-service payroll portal
- Payroll release/approval workflow

## 12.5 Planters

- Planter archival and restore
- Duplicate detection and merge tools
- KYC/compliance document management
- Geotag and map coordinates
- Planter engagement notes

## 12.6 Haciendas

- Geospatial map visualization
- Soil/type metadata fields
- Irrigation and infrastructure profile
- Active/inactive lifecycle with reason codes
- Historical changes audit

## 12.7 Production

- Guided production entry form
- Formula engine for computed fields
- Variance alerts against thresholds
- Season and crop-cycle modeling
- Automated final-data packet generation
- Multi-format export (CSV/XLSX/PDF)

## 12.8 Certifications

- Full create/edit UI and workflow states
- Expiry and renewal reminders
- Certificate template management
- Approval routing and digital signoff
- Compliance checklist per certification type

## 12.9 Imports and Data Exchange

- Strict import templates with downloadable sample files
- Pre-import validation preview and error report
- Async import jobs with queue status
- API ingestion endpoints
- Change reconciliation report

## 12.10 Reporting and Analytics

- Role-specific dashboard KPIs
- Production trend analytics
- Certification status funnel
- Payroll and attendance summaries
- Exportable management reports
- Scheduled report emails

## 12.11 Platform and Operations

- Activity/audit logs per entity change
- Soft delete + restore policies where needed
- Background job monitoring dashboard
- Health checks and runtime diagnostics
- Observability (application metrics)

## 12.12 Data Governance

- Data retention policies
- PII masking for sensitive fields
- Bulk anonymization tooling
- Backup and restore SOP integration
- Master-data quality checks

## 12.13 Frontend UX Improvements

- Unified command palette
- Saved table views per user
- Advanced table filters and presets
- Inline editing for quick updates
- Better empty states and onboarding guides

## 12.14 Testing and Quality

- Feature tests for all CRUD modules
- Role authorization tests
- Import/export integration tests
- API contract tests for JSON endpoints
- End-to-end browser tests for key flows

## 13. Delivery Phasing Recommendation

Phase 1 (stabilization):

- Fix route-method mismatches
- Fix compile/type issues
- Complete employee, attendance, payroll route wiring
- Add tests for current CRUD and auth-role boundaries

Phase 2 (functional completion):

- Build attendance and payroll UI
- Add certification create/edit workflows
- Expand dashboard from placeholder into KPI surfaces

Phase 3 (reporting + governance):

- Reporting center and scheduled exports
- Audit logs and lifecycle controls
- Stronger permissions model

Phase 4 (enterprise extensions):

- Integrations, API hardening, SSO, geospatial mapping, advanced analytics

## 14. Acceptance Criteria Template for New Features

For every new feature in this project, require all:

- Route contract defined with middleware and role requirements
- Validation rules defined and tested
- DB migration and model relation updates if data changes
- Inertia page or component updates linked to typed routes
- Feature test coverage for success and failure paths
- Role authorization test coverage
- User-facing success/error feedback

## 15. Traceability Index (Primary Files)

Core routing:

- [routes/web.php](../routes/web.php)
- [routes/settings.php](../routes/settings.php)

Auth setup:

- [app/Providers/FortifyServiceProvider.php](../app/Providers/FortifyServiceProvider.php)

Domain controllers:

- [app/Http/Controllers/PlanterController.php](../app/Http/Controllers/PlanterController.php)
- [app/Http/Controllers/HaciendaController.php](../app/Http/Controllers/HaciendaController.php)
- [app/Http/Controllers/ProductionController.php](../app/Http/Controllers/ProductionController.php)
- [app/Http/Controllers/CertificationController.php](../app/Http/Controllers/CertificationController.php)
- [app/Http/Controllers/EmployeeController.php](../app/Http/Controllers/EmployeeController.php)
- [app/Http/Controllers/AttendanceController.php](../app/Http/Controllers/AttendanceController.php)
- [app/Http/Controllers/PayrollController.php](../app/Http/Controllers/PayrollController.php)
- [app/Http/Controllers/Admin/UserController.php](../app/Http/Controllers/Admin/UserController.php)

Models and schema:

- [app/Models](../app/Models)
- [database/migrations](../database/migrations)

Frontend pages and components:

- [resources/js/pages](../resources/js/pages)
- [resources/js/components](../resources/js/components)
- [resources/js/routes](../resources/js/routes)

Tests:

- [tests/Feature](../tests/Feature)
