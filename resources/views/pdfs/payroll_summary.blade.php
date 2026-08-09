<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AALCPI Payroll Summary Register</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 8mm;
        }

        * {
            box-sizing: border-box;
            font-weight: normal !important;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 8pt;
            color: #000000;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .header-table td {
            padding: 0;
            vertical-align: bottom;
            border: none;
        }

        .title {
            font-size: 8pt;
            text-transform: uppercase;
        }

        .subtitle {
            font-size: 8pt;
        }

        .payroll-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-top: 5px;
        }

        .payroll-table th,
        .payroll-table td {
            border: 1px solid #000000;
            padding: 4px 3px;
            font-size: 8pt;
            color: #000000;
            background: transparent;
        }

        .payroll-table th {
            text-align: center;
            text-transform: uppercase;
        }

        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: monospace; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td>
                <div class="title">AALCPI Payroll Summary Register</div>
                <div class="subtitle">Official Printed Summary & Payout Breakdown</div>
            </td>
            <td class="text-right">
                <div>
                    STATUS: {{ $statusFilter ?? 'ALL' }} &nbsp;|&nbsp; PERIOD: {{ \Carbon\Carbon::parse($periodStart ?? now())->format('M d, Y') }} — {{ \Carbon\Carbon::parse($periodEnd ?? now())->format('M d, Y') }}
                </div>
            </td>
        </tr>
    </table>

    <table class="payroll-table">
        <thead>
            <tr>
                <th style="width: 3%;">#</th>
                <th style="width: 14.5%;" class="text-left">Employee Name</th>
                <th style="width: 5.5%;">Desig</th>
                <th style="width: 6.5%;" class="text-right">Daily Rate</th>
                <th style="width: 3.5%;">Days</th>
                <th style="width: 7%;" class="text-right">Basic Pay</th>
                <th style="width: 6.5%;" class="text-right">Adv Payout</th>
                <th style="width: 7%;" class="text-right">Total Earn</th>
                <th style="width: 6.5%;" class="text-right">Adv Deduct</th>
                <th style="width: 5%;" class="text-right">SSS</th>
                <th style="width: 5%;" class="text-right">Pag-IBIG</th>
                <th style="width: 5%;" class="text-right">PhilHealth</th>
                <th style="width: 5%;" class="text-right">Emerg Loan</th>
                <th style="width: 5%;" class="text-right">Tax W/H</th>
                <th style="width: 6.5%;" class="text-right">Tot Deduct</th>
                <th style="width: 7.5%;" class="text-right">Net Pay</th>
                <th style="width: 3%;" class="text-center">Signature</th>
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
                    $advPayout = (float) data_get($p, 'cash_advance_payout', 0);
                    $advDeduct = (float) data_get($p, 'cash_advance_deduction', 0);
                    $totalEarnings = (float) data_get($p, 'total_earnings', data_get($p, 'gross_pay', 0));
                    $sssContrib = (float) data_get($p, 'sss_contribution', data_get($p, 'sss_loan', 0));
                    $pagibigContrib = (float) data_get($p, 'pagibig_contribution', 0);
                    $philhealthContrib = (float) data_get($p, 'philhealth_contribution', 0);
                    $emergencyLoan = (float) data_get($p, 'emergency_loan', 0);
                    $withholdingTax = (float) data_get($p, 'withholding_tax', 0);
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
                    <td class="text-right">{{ $advPayout > 0 ? number_format($advPayout, 2) : '' }}</td>
                    <td class="text-right">{{ $totalEarnings > 0 ? number_format($totalEarnings, 2) : '' }}</td>
                    <td class="text-right">{{ $advDeduct > 0 ? '' . number_format($advDeduct, 2) : '' }}</td>
                    <td class="text-right">-{{ number_format($sssContrib, 2) }}</td>
                    <td class="text-right">-{{ number_format($pagibigContrib, 2) }}</td>
                    <td class="text-right">-{{ number_format($philhealthContrib, 2) }}</td>
                    <td class="text-right">-{{ number_format($emergencyLoan, 2) }}</td>
                    <td class="text-right">-{{ number_format($withholdingTax, 2) }}</td>
                    <td class="text-right">-{{ number_format($totalDeduct, 2) }}</td>
                    <td class="text-right">{{ number_format($netAmount, 2) }}</td>
                    <td class="text-center font-mono"></td>
                </tr>
            @empty
                <tr>
                    <td colspan="17" class="text-center" style="padding: 10px;">
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
                <td class="text-right">{{ number_format((float)array_sum(array_column($payrolls, 'cash_advance_payout')), 2) }}</td>
                <td class="text-right">{{ number_format((float)data_get($totals, 'total_gross', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)array_sum(array_column($payrolls, 'cash_advance_deduction')), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_sss_contrib', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_pagibig_contrib', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_philhealth_contrib', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_emergency_loan', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_tax', 0), 2) }}</td>
                <td class="text-right">-{{ number_format((float)data_get($totals, 'total_deductions', 0), 2) }}</td>
                <td class="text-right">{{ number_format((float)data_get($totals, 'total_net', 0), 2) }}</td>
                <td class="text-center font-mono">__________________</td>
            </tr>
        </tfoot>
        @endif
    </table>

</body>
</html>
