# Payroll Management System - Setup & Usage Guide

## Overview

Complete payroll management system with automated calculations, attendance integration, and inline editing capabilities.

## Features

### 1. Data Table Display

- View all payroll records in an organized table
- Sort by any column (Employee, Period, amounts, status)
- Multi-select checkboxes for batch operations
- Status indicators (draft, released, paid)
- Inline editing for deductions field

### 2. Payroll Generation Modal

Generate new payroll records with:

- **Employee Selection** - Dropdown with auto-display of base salary
- **Date Range Picker** - Select period start and end dates
- **Attendance File Upload** - Import XLSX/XLS files with daily time records
- **Holidays Input** - Number of holidays in the period
- **Deductions Input** - Total deductions (taxes, insurance, etc.)

### 3. Automatic Calculations

The system automatically calculates:

- **Basic Pay**: Pro-rated based on attendance and salary
- **Overtime Bonus**: 1.5x multiplier for hours over 8 per day
- **Gross Pay**: Basic pay + overtime bonus
- **Net Pay**: Gross pay - deductions (never negative)

### 4. Inline Editing

- Click on deductions to edit inline
- System automatically recalculates net pay
- Save or cancel changes with dedicated buttons

## Database Schema

### Payrolls Table

```sql
CREATE TABLE payrolls (
    id BIGINT PRIMARY KEY,
    employee_id BIGINT (FK to employees),
    period_start DATE,
    period_end DATE,
    basic_pay DECIMAL(16, 2),
    holidays INTEGER DEFAULT 0,
    gross_pay DECIMAL(16, 2),
    deductions DECIMAL(16, 2),
    net_pay DECIMAL(16, 2),
    status VARCHAR(20) DEFAULT 'draft',
    timestamps
);
```

### Status Values

- `draft` - Initial state after generation
- `released` - Approved for payment
- `paid` - Payment processed

## API Endpoints

### POST `/Payroll/generate`

Generate new payroll record.

**Request:**

```json
{
    "employee_id": 1,
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "holidays": 2,
    "deductions": 5000,
    "attendance_file": <File>
}
```

**Response:**

- Success: Redirect with success message
- Error: Validation errors with messages

**Validation:**

- Employee must exist
- Period end must be ≥ period start
- File must be XLSX or XLS
- Holidays and deductions must be ≥ 0
- At least one attendance record must be imported

### GET `/Payroll`

List all payroll records with employees and calculations.

**Response:**

```json
{
    "payrolls": [
        {
            "id": 1,
            "employee_name": "John Doe",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "basic_pay": 15000.0,
            "holidays": 2,
            "gross_pay": 15750.0,
            "deductions": 2000.0,
            "net_pay": 13750.0,
            "status": "draft"
        }
    ],
    "employees": [
        {
            "id": 1,
            "name": "John Doe",
            "base_salary": 20000
        }
    ]
}
```

### PATCH `/Payroll/{id}`

Update payroll record.

**Request:**

```json
{
    "deductions": 2500,
    "status": "released"
}
```

**Response:**

- Success: Redirect with success message
- Auto-recalculates net pay if deductions changed

### DELETE `/Payroll/{id}`

Remove payroll record.

## Frontend Components

### GeneratePayrollModal

Located: `resources/js/pages/Payroll/generate-payroll-modal.tsx`

**Props:**

```typescript
interface Props {
    employees: Pick<EmployeeType, 'id' | 'name' | 'base_salary'>[];
}
```

**State Management:**

- Uses Inertia useForm for form data
- Local state for date range and selected employee
- File input validation and error display

### PayrollColumnDef

Located: `resources/js/pages/Payroll/payroll-column-def.tsx`

**Features:**

- Sortable columns
- Editable cells with inline editing
- Currency formatting
- Date formatting
- Status badges

### EditableCell

Sub-component for inline field editing.

**Props:**

```typescript
interface Props {
    payrollId: number;
    field: string;
    value: string | number;
}
```

## Backend Services

### PayrollCalculationService

Core business logic for calculations.

**Methods:**

- `generatePayroll()` - Main generation method
- `calculateBasicPay()` - Pro-rated salary
- `calculateOvertimeBonus()` - Overtime calculations
- `updateDeductions()` - Recalculate on deduction changes

### PayrollCalculationHelper

Reusable calculation utilities.

**Methods:**

- `calculateDailyRate()` - Daily rate from salary
- `calculateHourlyRate()` - Hourly rate from salary
- `calculateProratedSalary()` - Period-specific salary
- `countWorkingDays()` - Exclude weekends
- `calculateOvertimePay()` - Overtime bonus
- `calculateNetPay()` - Safe net pay calculation

## Workflow Example

1. **User clicks "Generate Payroll" button**
    - GeneratePayrollModal opens

2. **User fills in form**
    - Select employee (John Doe, salary ₱20,000)
    - Select period (Jan 1-31, 2026)
    - Upload attendance file
    - Enter 2 holidays
    - Enter ₱2,000 deductions

3. **User submits**
    - Form validates on frontend
    - POST request to `/Payroll/generate`

4. **Backend processes**
    - Validates all inputs
    - Imports attendance file
    - Calculates basic pay based on attendance
    - Adds overtime bonus
    - Calculates gross and net pay
    - Creates payroll record in draft status

5. **User sees results**
    - New row appears in data table
    - Shows calculated amounts

6. **User can edit**
    - Click on deductions field to edit
    - System recalculates net pay
    - Click save to persist

## Calculation Examples

### Example 1: Basic Payroll

- Employee: John (₱20,000 salary)
- Period: Jan 1-31 (26 working days)
- Attendance: 20 days
- Holidays: 2
- Deductions: ₱2,000

**Calculations:**

- Daily rate = 20,000 / 26 = ₱769.23
- Basic pay = 769.23 × 20 = ₱15,384.62
- Overtime: 2 days × 8 hours × ₱96.15 × 1.5 = ₱2,307.60
- Gross pay = 15,384.62 + 2,307.60 = ₱17,692.22
- Net pay = 17,692.22 - 2,000 = **₱15,692.22**

## Customization Guide

### Changing Overtime Multiplier

Edit `PayrollCalculationService.php`:

```php
return PayrollCalculationHelper::calculateOvertimePay($hourlyRate, intval($totalOvertimeHours), 2.0); // Changed from 1.5
```

### Changing Working Days Per Month

Edit `PayrollCalculationHelper.php`:

```php
public static function calculateDailyRate(float $monthlySalary, int $workingDaysPerMonth = 22): float
```

### Adding Additional Fields

1. Add to migration
2. Update Payroll model $fillable
3. Update PayrollType interface
4. Add to controller
5. Add column to payroll-column-def.tsx

## Troubleshooting

### "No attendance records were imported"

- Check file format (must be XLSX/XLS)
- Verify employee has attendance data for period
- Check file structure matches AttendanceImport expectations

### Calculations seem incorrect

- Verify employee base_salary is set correctly
- Check attendance records have working_time values
- Verify deductions format (must be numeric)

### Modal validation errors

- All fields are required except optional tooltips
- Date range must be valid (start ≤ end)
- File must be XLSX or XLS format
- Numbers must be ≥ 0

## Performance Considerations

- Payroll list queries include employee relation
- Latest payrolls sorted first
- Use pagination if > 100 records
- Attendance import processes asynchronously

## Security Notes

- Only manager role can access payroll features
- File upload validated server-side
- All calculations done server-side
- Deduction edits trigger database update
