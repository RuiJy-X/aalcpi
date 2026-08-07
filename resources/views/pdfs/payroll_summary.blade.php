<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payroll Summary Register</title>
    <style>
        @page {
            margin: 5mm 6mm 5mm 6mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 7.5pt;
            font-weight: normal;
            color: #000000;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        * {
            font-family: Arial, sans-serif !important;
            font-size: 7.5pt !important;
            font-weight: normal !important;
            color: #000000 !important;
            background: transparent !important;
        }
        .header {
            width: 100%;
            border-bottom: 1px solid #000000;
            padding-bottom: 3px;
            margin-bottom: 6px;
        }
        .payroll-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            table-layout: fixed;
        }
        .payroll-table th,
        .payroll-table td {
            border: 1px solid #000000;
            padding: 2px 2px;
            text-align: right;
            overflow: hidden;
            white-space: nowrap;
        }
        .payroll-table th {
            text-align: center;
            font-size: 7pt !important;
        }
        .text-left { text-align: left !important; }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }

        .signatures {
            width: 100%;
            margin-top: 15px;
            border-collapse: collapse;
        }
        .signatures td {
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding-top: 15px;
        }
        .sign-line {
            border-top: 1px solid #000000;
            margin: 0 25px 3px 25px;
        }
        .footer-note {
            margin-top: 6px;
            font-size: 7pt !important;
        }
    </style>
</head>
<body>
    <div class="header">
        <table style="width: 100%;">
            <tr>
                <td class="text-left" style="border: none;">
                    <div style="font-size: 9pt !important;">AALCPI Payroll Summary Register</div>
                    <div style="font-size: 7.5pt !important;">Official Printed Summary & Financial Payout Breakdown</div>
                </td>
                <td class="text-right" style="border: none; vertical-align: bottom;">
                    <div>
                        PERIOD: {{ \Carbon\Carbon::parse($periodStart ?? now())->format('M d, Y') }} — {{ \Carbon\Carbon::parse($periodEnd ?? now())->format('M d, Y') }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <table class="payroll-table">
        <thead>
            <tr>
                <th style="width: 2%;">#</th>
                <th style="width: 11%;" class="text-left">Employee Name</th>
                <th style="width: 5%;">Desig</th>
                <th style="width: 5.5%;" class="text-right">Daily Rate</th>
                <th style="width: 3%;">Days</th>
                <th style="width: 5.5%;" class="text-right">Gross Earn</th>
                <th style="width: 5%;" class="text-right">OT/Hol</th>
                <th style="width: 6%;" class="text-right">Total Earn</th>
                <th style="width: 4.5%;" class="text-right">Pag-IBIG</th>
                <th style="width: 4.5%;" class="text-right">SSS</th>
                <th style="width: 4.5%;" class="text-right">PhilHealth</th>
                <th style="width: 4.5%;" class="text-right">Tax W/H</th>
                <th style="width: 4.5%;" class="text-right">SSS Loan</th>
                <th style="width: 4.5%;" class="text-right">PagIBIG Loan</th>
                <th style="width: 4.5%;" class="text-right">Emerg Loan</th>
                <th style="width: 5.5%;" class="text-right">Tot Deduct</th>
                <th style="width: 6%;" class="text-right">Net Pay</th>
                <th style="width: 11%;" class="text-center">Signature</th>
            </tr>
        </thead>
        <tbody>
            @forelse($payrolls ?? [] as $index => $p)
                @php
                    $empName = data_get($p, 'name', data_get($p, 'employee_name', 'N/A'));
                    $position = data_get($p, 'position', 'Encoder');
                    $dailyRate = (float) data_get($p, 'daily_rate', 0);
                    $daysWorked = (int) data_get($p, 'days_worked', 0);
                    $basicPay = (float) data_get($p, 'gross_earnings', data_get($p, 'basic_pay', 0));
                    $overtimePay = (float) data_get($p, 'overtime_pay', 0);
                    $totalEarnings = (float) data_get($p, 'total_earnings', data_get($p, 'gross_pay', 0));
                    $pagibigContrib = (float) data_get($p, 'pagibig_contribution', 0);
                    $sssContrib = (float) data_get($p, 'sss_contribution', 0);
                    $philhealthContrib = (float) data_get($p, 'philhealth_contribution', 0);
                    $withholdingTax = (float) data_get($p, 'withholding_tax', 0);
                    $sssLoan = (float) data_get($p, 'sss_loan', 0);
                    $pagibigLoan = (float) data_get($p, 'pagibig_loan', 0);
                    $emergencyLoan = (float) data_get($p, 'emergency_loan', 0);
                    $totalDeduct = (float) data_get($p, 'total_deductions', data_get($p, 'deductions', 0));
                    $netAmount = (float) data_get($p, 'net_amount', data_get($p, 'net_pay', 0));
                @endphp
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td class="text-left">{{ $empName }}</td>
                    <td class="text-center">{{ $position }}</td>
                    <td class="text-right">{{ number_format($dailyRate, 2) }}</td>
                    <td class="text-center">{{ $daysWorked }}</td>
                    <td class="text-right">{{ number_format($basicPay, 2) }}</td>
                    <td class="text-right">{{ number_format($overtimePay, 2) }}</td>
                    <td class="text-right">{{ number_format($totalEarnings, 2) }}</td>
                    <td class="text-right">-{{ number_format($pagibigContrib, 2) }}</td>
                    <td class="text-right">-{{ number_format($sssContrib, 2) }}</td>
                    <td class="text-right">-{{ number_format($philhealthContrib, 2) }}</td>
                    <td class="text-right">-{{ number_format($withholdingTax, 2) }}</td>
                    <td class="text-right">-{{ number_format($sssLoan, 2) }}</td>
                    <td class="text-right">-{{ number_format($pagibigLoan, 2) }}</td>
                    <td class="text-right">-{{ number_format($emergencyLoan, 2) }}</td>
                    <td class="text-right">-{{ number_format($totalDeduct, 2) }}</td>
                    <td class="text-right">{{ number_format($netAmount, 2) }}</td>
                    <td class="text-center font-mono">____________________</td>
                </tr>
            @empty
                <tr>
                    <td colspan="18" class="text-center" style="padding: 10px;">
                        No payroll records found for the selected pay period.
                    </td>
                </tr>
            @endforelse
        </tbody>
        @if(!empty($payrolls) && count($payrolls) > 0)
        <tfoot>
            <tr>
                <td colspan="3" class="text-left">GRAND TOTAL ({{ count($payrolls) }} Employees)</td>
                <td class="text-right">—</td>
                <td class="text-center">{{ data_get($totals, 'total_days_worked', 0) }}</td>
                <td class="text-right">{{ number_format((float)data_get($totals, 'total_basic', 0), 2) }}</td>
                <td class="text-right">{{ number_format((float)data_get($totals, 'total_overtime', 0), 2) }}</td>
                <td class="text-right">{{ number_format((float)data_get($totals, 'total_gross', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_pagibig_contrib', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_sss_contrib', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_philhealth_contrib', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_tax', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_sss_loan', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_pagibig_loan', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_emergency_loan', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_deductions', 0), 2) }}</td>
                <td class="text-right">{{ number_format((float)data_get($totals, 'total_net', 0), 2) }}</td>
                <td class="text-center">—</td>
            </tr>
        </tfoot>
        @endif
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div class="sign-line"></div>
                Prepared By (Payroll Clerk)
            </td>
            <td>
                <div class="sign-line"></div>
                Checked By (Finance Officer)
            </td>
            <td>
                <div class="sign-line"></div>
                Approved By (Management)
            </td>
        </tr>
    </table>

    <div class="footer-note">
        Printed on {{ now()->format('Y-m-d H:i:s') }} | AALCPI Integrated Payroll System.
    </div>
</body>
</html>
