<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Statement of Account - {{ $employee_name }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 30px 40px 30px 40px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5pt;
            line-height: 1.35;
            color: #000000;
            background: #ffffff;
            padding: 30px 40px 30px 40px;
            margin: 0;
        }

        .soa-wrapper {
            width: 100%;
        }

        /* Formal Double Border Header */
        .company-header {
            width: 100%;
            border-bottom: 2px solid #000000;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }

        .company-header td {
            vertical-align: top;
        }

        .company-name {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .company-sub {
            font-size: 8pt;
            text-transform: uppercase;
            margin-top: 2px;
        }

        .doc-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: right;
            letter-spacing: 1px;
        }

        .doc-meta {
            font-size: 8.5pt;
            text-align: right;
            margin-top: 4px;
        }

        /* Minimal Formal Info Table */
        .section-header {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000000;
            padding-bottom: 3px;
            margin-top: 10px;
            margin-bottom: 6px;
            letter-spacing: 0.3px;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 8.5pt;
        }

        .info-table td {
            padding: 4px 6px;
            border: 1px solid #000000;
            vertical-align: middle;
        }

        .info-label {
            font-weight: bold;
            background-color: #f2f2f2;
            width: 18%;
        }

        .info-val {
            width: 32%;
        }

        /* Minimal Table Styles */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 8.5pt;
        }

        .data-table th,
        .data-table td {
            border: 1px solid #000000;
            padding: 4px 6px;
        }

        .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8pt;
            text-align: left;
        }

        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }

        /* Summary Box */
        .summary-wrapper {
            width: 100%;
            margin-top: 6px;
            margin-bottom: 14px;
        }

        .summary-box {
            width: 45%;
            float: right;
            border: 1.5px solid #000000;
            border-collapse: collapse;
        }

        .summary-box td {
            padding: 5px 8px;
            font-size: 9pt;
        }

        .summary-box .total-row td {
            border-top: 1.5px solid #000000;
            font-size: 10pt;
            font-weight: bold;
            background-color: #f2f2f2;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }

        /* Formal Signatures Footer */
        .signatures-table {
            width: 100%;
            margin-top: 25px;
            border-collapse: collapse;
        }

        .signatures-table td {
            width: 50%;
            vertical-align: top;
            padding: 0 15px;
        }

        .sig-line {
            border-top: 1px solid #000000;
            margin-top: 40px;
            padding-top: 4px;
            text-align: center;
            font-size: 8.5pt;
            font-weight: bold;
        }

        .sig-title {
            text-align: center;
            font-size: 8pt;
            color: #333333;
        }

        .declaration {
            font-size: 8pt;
            text-align: justify;
            margin-top: 15px;
            margin-bottom: 15px;
            font-style: italic;
        }
    </style>
</head>
<body>
<div class="soa-wrapper">

    <!-- Header Block -->
    <table class="company-header">
        <tr>
            <td>
                <div class="company-name">AALCPI Payroll & Accounting</div>
                <div class="company-sub">Agro-Industrial Labor Compliance System</div>
            </td>
            <td>
                <div class="doc-title">Statement of Account</div>
                <div class="doc-meta">
                    <strong>Ref No:</strong> {{ $soa_number }}<br>
                    <strong>Date:</strong> {{ $date_issued }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Employee & Account Information -->
    <div class="section-header">I. Account & Employee Profile</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Employee Code</td>
            <td class="info-val font-bold">{{ $employee_code }}</td>
            <td class="info-label">Statement Period</td>
            <td class="info-val">{{ $period_start }} to {{ $period_end }}</td>
        </tr>
        <tr>
            <td class="info-label">Employee Name</td>
            <td class="info-val font-bold">{{ $employee_name }}</td>
            <td class="info-label">Daily Rate / Base</td>
            <td class="info-val">PHP{{ number_format($daily_rate, 2) }} / day</td>
        </tr>
        <tr>
            <td class="info-label">Designation</td>
            <td class="info-val">{{ $position }}</td>
            <td class="info-label">TIN No.</td>
            <td class="info-val">{{ $tin }}</td>
        </tr>
        <tr>
            <td class="info-label">SSS Number</td>
            <td class="info-val">{{ $sss_no }}</td>
            <td class="info-label">Pag-IBIG Number</td>
            <td class="info-val">{{ $pagibig_no }}</td>
        </tr>
    </table>

    <!-- Financial Breakdown: Salary & Earnings -->
    <div class="section-header">II. Earnings & Compensation Summary</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-center">Units / Days</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount (PHP)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Basic Salary Compensation</td>
                <td class="text-center">{{ $days_worked }} days</td>
                <td class="text-right">PHP{{ number_format($daily_rate, 2) }}</td>
                <td class="text-right">PHP{{ number_format($basic_pay, 2) }}</td>
            </tr>
            @if($overtime_hours > 0 || $overtime_pay > 0)
            <tr>
                <td>Overtime Pay</td>
                <td class="text-center">{{ number_format($overtime_hours, 1) }} hrs</td>
                <td class="text-right">—</td>
                <td class="text-right">PHP{{ number_format($overtime_pay, 2) }}</td>
            </tr>
            @endif
            @if($holidays > 0 || $holiday_pay > 0)
            <tr>
                <td>Holiday Premium Pay</td>
                <td class="text-center">{{ $holidays }} holiday(s)</td>
                <td class="text-right">—</td>
                <td class="text-right">PHP{{ number_format($holiday_pay, 2) }}</td>
            </tr>
            @endif
            <tr class="font-bold">
                <td colspan="3" class="text-right">TOTAL GROSS EARNINGS</td>
                <td class="text-right">PHP{{ number_format($gross_pay, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Financial Breakdown: Itemized Deductions -->
    <div class="section-header">III. Itemized Deductions & Contributions</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Deduction Description</th>
                <th class="text-center">Category</th>
                <th class="text-right">Amount (PHP)</th>
            </tr>
        </thead>
        <tbody>
            @if($sss_contribution > 0)
            <tr>
                <td>SSS Contribution (Employee Share)</td>
                <td class="text-center">Statutory Contribution</td>
                <td class="text-right">PHP{{ number_format($sss_contribution, 2) }}</td>
            </tr>
            @endif
            @if($pagibig_contribution > 0)
            <tr>
                <td>Pag-IBIG Contribution (HDMF)</td>
                <td class="text-center">Statutory Contribution</td>
                <td class="text-right">PHP{{ number_format($pagibig_contribution, 2) }}</td>
            </tr>
            @endif
            @if($philhealth_contribution > 0)
            <tr>
                <td>PhilHealth Contribution</td>
                <td class="text-center">Statutory Contribution</td>
                <td class="text-right">PHP{{ number_format($philhealth_contribution, 2) }}</td>
            </tr>
            @endif
            @if($withholding_tax > 0)
            <tr>
                <td>Withholding Tax</td>
                <td class="text-center">Tax Deduction</td>
                <td class="text-right">PHP{{ number_format($withholding_tax, 2) }}</td>
            </tr>
            @endif
            @if($sss_loan > 0)
            <tr>
                <td>SSS Loan Amortization</td>
                <td class="text-center">Government Loan</td>
                <td class="text-right">PHP{{ number_format($sss_loan, 2) }}</td>
            </tr>
            @endif
            @if($emergency_loan > 0)
            <tr>
                <td>Emergency Loan Repayment</td>
                <td class="text-center">Internal Loan</td>
                <td class="text-right">PHP{{ number_format($emergency_loan, 2) }}</td>
            </tr>
            @endif
            @if($cash_advance_deduction > 0)
            <tr>
                <td>Cash Advance Repayment Deduction</td>
                <td class="text-center">Company Advancement</td>
                <td class="text-right">PHP{{ number_format($cash_advance_deduction, 2) }}</td>
            </tr>
            @endif
            @if(($sss_contribution + $pagibig_contribution + $philhealth_contribution + $withholding_tax + $sss_loan + $emergency_loan + $cash_advance_deduction) == 0)
            <tr>
                <td colspan="2" class="text-center font-bold">No Deductions Applied for Period</td>
                <td class="text-right">PHP0.00</td>
            </tr>
            @endif
            <tr class="font-bold">
                <td colspan="2" class="text-right">TOTAL DEDUCTIONS</td>
                <td class="text-right">PHP{{ number_format($deductions, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Active Cash Advancements & Repayment Ledger -->
    @php
        $activeAdvancements = collect($advancements ?? [])->filter(function ($adv) {
            $status = is_object($adv) ? $adv->status : ($adv['status'] ?? '');
            $remBal = (float) (is_object($adv) ? $adv->remaining_balance : ($adv['remaining_balance'] ?? 0));
            return in_array($status, ['pending_payout', 'paid_out', 'partially_deducted'])
                && !in_array($status, ['cancelled', 'deducted', 'fully_repaid']);
        });
    @endphp
    @if(count($activeAdvancements) > 0)
    <div class="section-header">IV. Cash Advancement & Loan Ledger</div>
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center">Date Granted</th>
                <th>Payment Plan / Terms</th>
                <th class="text-right">Original Amount</th>
                <th class="text-right">Installment Rate</th>
                <th class="text-right">Unpaid Balance</th>
                <th class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($activeAdvancements as $adv)
            @php
                $advStatus = is_object($adv) ? $adv->status : ($adv['status'] ?? '');
                $advTermType = is_object($adv) ? $adv->repayment_term_type : ($adv['repayment_term_type'] ?? '');
                $advTerms = is_object($adv) ? $adv->repayment_terms : ($adv['repayment_terms'] ?? null);
                $advDate = is_object($adv) ? ($adv->advancement_date?->format('Y-m-d') ?? $adv->advancement_date) : ($adv['advancement_date'] ?? '');
                $advAmount = (float) (is_object($adv) ? $adv->amount : ($adv['amount'] ?? 0));
                $advRem = (float) (is_object($adv) ? $adv->remaining_balance : ($adv['remaining_balance'] ?? 0));
                $advInst = is_object($adv) && $adv->installment_amount ? (float)$adv->installment_amount : $advAmount;

                $planLabel = 'Next Payroll';
                if ($advTermType === 'months' && $advTerms) {
                    $planLabel = $advTerms . ' Months (' . ($advTerms * 2) . ' Cutoffs)';
                } elseif ($advTermType === 'payrolls' && $advTerms) {
                    $planLabel = $advTerms . ' Cutoffs';
                } elseif ($advTermType === 'fixed_amount') {
                    $planLabel = 'Fixed Amount Plan';
                }
                $statusLabel = strtoupper(str_replace('_', ' ', $advStatus));
            @endphp
            <tr>
                <td class="text-center">{{ $advDate }}</td>
                <td>{{ $planLabel }}</td>
                <td class="text-right">PHP{{ number_format($advAmount, 2) }}</td>
                <td class="text-right">PHP{{ number_format($advInst, 2) }} / cutoff</td>
                <td class="text-right font-bold">PHP{{ number_format($advRem, 2) }}</td>
                <td class="text-center">{{ $statusLabel }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Net Account Payable Summary Box -->
    <div class="summary-wrapper clearfix">
        <table class="summary-box">
            <tr>
                <td>Total Earnings:</td>
                <td class="text-right font-bold">PHP{{ number_format($gross_pay, 2) }}</td>
            </tr>
            <tr>
                <td>Total Deductions:</td>
                <td class="text-right font-bold">(PHP{{ number_format($deductions, 2) }})</td>
            </tr>
            <tr class="total-row">
                <td>NET PAYABLE AMOUNT:</td>
                <td class="text-right">PHP{{ number_format($net_pay, 2) }}</td>
            </tr>
        </table>
    </div>

    <!-- Declaration Statement -->
    <div class="declaration">
        <strong>Statement Declaration:</strong> This Statement of Account serves as an official minimal accounting breakdown of gross earnings, authorized statutory deductions, internal loan repayments, and net compensation payable. All recorded entries are certified accurate based on system payroll registers.
    </div>

    <!-- Signatures Footer -->
    <table class="signatures-table">
        <tr>
            <td>
                <div class="sig-line">Prepared & Verified By</div>
                <div class="sig-title">Payroll Controller / Accounting Officer</div>
            </td>
            <td>
                <div class="sig-line">Acknowledged & Received By</div>
                <div class="sig-title">Employee Signature over Printed Name</div>
            </td>
        </tr>
    </table>

</div>
</body>
</html>
