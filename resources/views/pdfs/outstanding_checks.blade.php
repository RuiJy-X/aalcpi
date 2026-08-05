<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Outstanding Checks Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            color: #111;
            background: #fff;
            padding: 25px 30px;
        }

        .header-table {
            width: 100%;

        }

        .company-title {
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
        }

        .report-title {
            font-size: 15pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            margin-top: 4px;
            letter-spacing: 0.5px;
        }

        .date-range {
            font-size: 10pt;
            text-align: center;
            color: #444;
            margin-top: 4px;
        }

        .month-block {
            margin-bottom: 20px;
        }

        .month-header {
            font-size: 11pt;
            text-transform: uppercase;
            margin-bottom: 6px;
            padding-bottom: 2px;
            page-break-after: avoid;
        }

        tr {
            page-break-inside: avoid;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
        }

        .data-table th, .data-table td {

            padding: 5px 7px;
        }

        .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: left;
        }

        .text-center { text-align: center; }
        .text-right  { text-align: right; }
        .text-left   { text-align: left; }
        .bold        { font-weight: bold; }

        .subtotal-row td {
            background-color: #f9f9f9;
            font-weight: bold;
        }

        .grand-total-container {
            margin-top: 25px;
            border-top: 2px solid #000;
            padding-top: 10px;
            page-break-inside: avoid;
        }

        .grand-total-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11pt;
        }

        .grand-total-table td {
            padding: 6px;
            font-weight: bold;
        }

        .no-records {
            text-align: center;
            padding: 30px;
            font-size: 11pt;
            color: #666;
            font-style: italic;
        }
    </style>
</head>
<body>

    @php

        $formattedFrom = $dateFrom ? \Carbon\Carbon::parse($dateFrom)->format('F j, Y') : 'All Dates';
        $formattedTo = $dateTo ? \Carbon\Carbon::parse($dateTo)->format('F j, Y') : 'Present';
        $dateRangeLabel = ($dateFrom || $dateTo) ? "{$formattedFrom} - {$formattedTo}" : "For All Dates";
    @endphp

    <table class="header-table">
        <tr>
            <td style="width: '100%'; vertical-align: middle; text-transform: uppercase;">
                <div>LA CARLOTA MILL DISTRICT MULTI-PURPOSE COOPERATIVE, INC</div>
                <div>OUSTANDING CHECKS</div>
                <div>{{ $dateRangeLabel }}</div>
            </td>
        </tr>
    </table>
    <br/>

    @if (count($months) === 0)
        <div class="no-records">
            No outstanding checks found for the specified criteria.
        </div>
    @else
        @foreach ($months as $month)
            <div class="month-block">
                <div class="month-header">{{ $month['month_label'] }}</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 40px;" class="text-center">No.</th>
                            <th style="width: 85px;">Date</th>
                            <th>Payee's Name</th>
                            <th style="width: 110px;">Check Number</th>
                            <th style="width: 120px; " class="text-right">Amount</th>
                            <th style="width: 95px;">Date Cleared</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($month['items'] as $item)
                            <tr>
                                <td class="text-center">{{ $item['no'] }}</td>
                                <td></td>
                                <td>{{ $item['payee_name'] }}</td>
                                <td>{{ $item['check_no'] }}</td>
                                <td class="text-right">{{ number_format($item['amount'], 2) }}</td>
                                <td>_____________</td>
                            </tr>
                        @endforeach
                        <tr class="subtotal-row">
                            <td colspan="4" class="text-right bold">Subtotal for {{ $month['month_label'] }}:</td>
                            <td class="text-right bold">{{ number_format($month['subtotal'], 2) }}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        @endforeach

        <div class="grand-total-container">
            <table class="grand-total-table">
                <tr>
                    <td class="text-right" style="width: 70%;">GRAND TOTAL OUTSTANDING CHECKS ({{ $totalCount }} check{{ $totalCount === 1 ? '' : 's' }}):</td>
                    <td class="text-right bold" style="width: 30%;">{{ number_format($grandTotal, 2) }}</td>
                </tr>
            </table>
        </div>
    @endif

    @if (!empty($autoPrint))
        <script>
            window.onload = function() {
                window.print();
            };
        </script>
    @endif
</body>
</html>
