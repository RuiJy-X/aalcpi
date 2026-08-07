<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payroll Voucher - {{ data_get($payroll, 'employee_name', 'Employee') }}</title>
    <style>
        @page {
            margin: 8mm 10mm 8mm 10mm;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9.5px;
            color: #0f172a;
            margin: 0;
            padding: 0;
        }
        .payslip-card {
            border: 1.5px solid #0f172a;
            padding: 10px 12px;
            background: #ffffff;
        }
        .header-table {
            width: 100%;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .subtitle {
            font-size: 8.5px;
            color: #475569;
            margin-top: 1px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 9px;
        }
        .info-table td {
            padding: 3px 6px;
            border: 1px solid #cbd5e1;
        }
        .info-label {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #334155;
            width: 15%;
        }
        .info-value {
            width: 35%;
        }
        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 9px;
        }
        .breakdown-table th,
        .breakdown-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
        }
        .breakdown-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8px;
        }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .emerald-text { color: #047857; }
        .rose-text { color: #be123c; }

        .net-box {
            border: 1.5px solid #047857;
            background-color: #ecfdf5;
            padding: 6px 10px;
            margin-bottom: 10px;
        }
        .net-title {
            font-size: 9px;
            font-weight: bold;
            color: #047857;
            text-transform: uppercase;
        }
        .net-amount {
            font-size: 16px;
            font-weight: bold;
            color: #047857;
            text-align: right;
        }

        .ack-table {
            width: 100%;
            margin-top: 10px;
            border-collapse: collapse;
            font-size: 8.5px;
        }
        .ack-table td {
            vertical-align: bottom;
            padding-top: 18px;
        }
        .sign-line {
            border-top: 1px solid #0f172a;
            margin-top: 18px;
            width: 85%;
        }
        .footer-note {
            font-size: 7.5px;
            color: #64748b;
            margin-top: 6px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 4px;
        }
    </style>
</head>
<body>
    @php
        $empCode = data_get($payroll, 'employee_code', 'EMP-000');
        $empName = data_get($payroll, 'employee_name', data_get($payroll, 'name', 'N/A'));
        $position = data_get($payroll, 'position', 'Encoder');
        $periodStart = data_get($payroll, 'period_start', now());
        $periodEnd = data_get($payroll, 'period_end', now());
        $daysWorked = (int) data_get($payroll, 'days_worked', 0);
        $dailyRate = (float) data_get($payroll, 'daily_rate', 0);
        $basicPay = (float) data_get($payroll, 'basic_pay', 0);
        $overtimePay = (float) data_get($payroll, 'overtime_pay', 0);
        $grossPay = (float) data_get($payroll, 'gross_pay', 0);
        $sssLoan = (float) data_get($payroll, 'sss_loan', 0);
        $pagibigLoan = (float) data_get($payroll, 'pagibig_loan', 0);
        $emergencyLoan = (float) data_get($payroll, 'emergency_loan', 0);
        $pagibigContrib = (float) data_get($payroll, 'pagibig_contribution', 0);
        $sssContrib = (float) data_get($payroll, 'sss_contribution', 0);
        $philhealthContrib = (float) data_get($payroll, 'philhealth_contribution', 0);
        $tax = (float) data_get($payroll, 'withholding_tax', 0);
        $deductions = (float) data_get($payroll, 'deductions', 0);
        $netPay = (float) data_get($payroll, 'net_pay', 0);
    @endphp

    <div class="payslip-card">
        <table class="header-table">
            <tr>
                <td>
                    <div class="title">AALCPI Payroll Voucher / Payslip</div>
                    <div class="subtitle">Official Employee Salary & Deduction Breakdown</div>
                </td>
                <td style="text-align: right; vertical-align: bottom;">
                    <div style="font-size: 9px; font-weight: bold; color: #0f172a;">
                        VOUCHER #: PAY-{{ str_pad((string)data_get($payroll, 'id', '0'), 5, '0', STR_PAD_LEFT) }}
                    </div>
                </td>
            </tr>
        </table>

        <table class="info-table">
            <tr>
                <td class="info-label">Employee Code</td>
                <td class="info-value font-bold">{{ $empCode }}</td>
                <td class="info-label">Pay Period</td>
                <td class="info-value font-bold">
                    {{ \Carbon\Carbon::parse($periodStart)->format('M d, Y') }} — {{ \Carbon\Carbon::parse($periodEnd)->format('M d, Y') }}
                </td>
            </tr>
            <tr>
                <td class="info-label">Full Name</td>
                <td class="info-value font-bold">{{ $empName }}</td>
                <td class="info-label">Days Worked</td>
                <td class="info-value">{{ $daysWorked }} Days</td>
            </tr>
            <tr>
                <td class="info-label">Designation</td>
                <td class="info-value">{{ $position }}</td>
                <td class="info-label">Daily Rate</td>
                <td class="info-value emerald-text font-bold">₱{{ number_format($dailyRate, 2) }}</td>
            </tr>
        </table>

        <table class="breakdown-table">
            <thead>
                <tr>
                    <th class="text-left" style="width: 50%;">EARNINGS BREAKDOWN</th>
                    <th class="text-left" style="width: 50%;">DEDUCTIONS BREAKDOWN</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="vertical-align: top; padding: 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
                            <tr>
                                <td style="border: none; padding: 3px 6px;">Basic Pay ({{ $daysWorked }} Days)</td>
                                <td style="border: none; padding: 3px 6px;" class="text-right">₱{{ number_format($basicPay, 2) }}</td>
                            </tr>
                            <tr>
                                <td style="border: none; padding: 3px 6px;">Overtime / Holiday Pay</td>
                                <td style="border: none; padding: 3px 6px;" class="text-right">₱{{ number_format($overtimePay, 2) }}</td>
                            </tr>
                            <tr style="border-top: 1px solid #cbd5e1; font-weight: bold;">
                                <td style="border: none; padding: 4px 6px;" class="emerald-text">TOTAL GROSS EARNINGS</td>
                                <td style="border: none; padding: 4px 6px;" class="text-right emerald-text">₱{{ number_format($grossPay, 2) }}</td>
                            </tr>
                        </table>
                    </td>

                    <td style="vertical-align: top; padding: 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
                            <tr>
                                <td style="border: none; padding: 2px 6px;">SSS Loan Deduction</td>
                                <td style="border: none; padding: 2px 6px;" class="text-right rose-text">-₱{{ number_format($sssLoan, 2) }}</td>
                            </tr>
                            <tr>
                                <td style="border: none; padding: 2px 6px;">Pag-IBIG Loan Deduction</td>
                                <td style="border: none; padding: 2px 6px;" class="text-right rose-text">-₱{{ number_format($pagibigLoan, 2) }}</td>
                            </tr>
                            <tr>
                                <td style="border: none; padding: 2px 6px;">Emergency Loan Deduction</td>
                                <td style="border: none; padding: 2px 6px;" class="text-right rose-text">-₱{{ number_format($emergencyLoan, 2) }}</td>
                            </tr>
                            <tr>
                                <td style="border: none; padding: 2px 6px;">Pag-IBIG Contribution</td>
                                <td style="border: none; padding: 2px 6px;" class="text-right rose-text">-₱{{ number_format($pagibigContrib, 2) }}</td>
                            </tr>
                            <tr>
                                <td style="border: none; padding: 2px 6px;">SSS / PhilHealth / Tax W/Held</td>
                                <td style="border: none; padding: 2px 6px;" class="text-right rose-text">-₱{{ number_format($sssContrib + $philhealthContrib + $tax, 2) }}</td>
                            </tr>
                            <tr style="border-top: 1px solid #cbd5e1; font-weight: bold;">
                                <td style="border: none; padding: 4px 6px;" class="rose-text">TOTAL DEDUCTIONS</td>
                                <td style="border: none; padding: 4px 6px;" class="text-right rose-text">-₱{{ number_format($deductions, 2) }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="net-box">
            <table style="width: 100%;">
                <tr>
                    <td class="net-title">NET AMOUNT PAYABLE TO EMPLOYEE</td>
                    <td class="net-amount">₱{{ number_format($netPay, 2) }}</td>
                </tr>
            </table>
        </div>

        <table class="ack-table">
            <tr>
                <td style="width: 60%;">
                    I hereby acknowledge receipt of the net salary amount specified above.
                    <div class="sign-line"></div>
                    <strong>Received By: {{ $empName }}</strong>
                </td>
                <td style="width: 40%; text-align: right;">
                    <div className="sign-line" style="margin-left: auto;"></div>
                    <strong>Date Received: {{ now()->format('M d, Y') }}</strong>
                </td>
            </tr>
        </table>

        <div class="footer-note">
            This payslip voucher is computer-generated. AALCPI Payroll System.
        </div>
    </div>
</body>
</html>
