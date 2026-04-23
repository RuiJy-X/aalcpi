<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Distribution Voucher</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1f2937;
            margin: 20px;
        }

        .header {
            border-bottom: 2px solid #111827;
            margin-bottom: 16px;
            padding-bottom: 8px;
        }

        .title {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .subtitle {
            font-size: 12px;
            color: #4b5563;
            margin-top: 4px;
        }

        .grid {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: collapse;
        }

        .grid td {
            padding: 6px 8px;
            border: 1px solid #e5e7eb;
        }

        .grid .label {
            width: 180px;
            font-weight: 700;
            background: #f9fafb;
        }

        .section-title {
            margin-top: 18px;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 700;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .table th,
        .table td {
            border: 1px solid #e5e7eb;
            padding: 7px 8px;
            text-align: right;
        }

        .table th:first-child,
        .table td:first-child {
            text-align: left;
        }

        .table th {
            background: #f3f4f6;
            font-weight: 700;
        }

        .total-row td {
            font-weight: 700;
            background: #f9fafb;
        }

        .signatures {
            margin-top: 36px;
            width: 100%;
            border-collapse: collapse;
        }

        .signatures td {
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding-top: 32px;
        }

        .line {
            border-top: 1px solid #111827;
            margin: 0 18px 6px;
        }

        .muted {
            color: #6b7280;
            font-size: 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="title">Payout Distribution Voucher</div>
        <div class="subtitle">Financial Distribution Snapshot - Accepted Record</div>
    </div>

    <table class="grid">
        <tr>
            <td class="label">Transaction Code</td>
            <td>{{ $production->trans_code ?? '-' }}</td>
            <td class="label">Voucher Date</td>
            <td>{{ optional($production->financial_reviewed_at)->format('Y-m-d H:i') ?? now()->format('Y-m-d H:i') }}</td>
        </tr>
        <tr>
            <td class="label">Planter</td>
            <td>{{ $production->planter?->name ?? '-' }}</td>
            <td class="label">Hacienda</td>
            <td>{{ $production->hacienda?->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Crop Year / Week</td>
            <td>{{ $production->millingPeriod?->crop_year ?? '-' }} / Week {{ $production->millingPeriod?->week_no ?? '-' }}</td>
            <td class="label">Production Date</td>
            <td>{{ optional($production->production_date)->format('Y-m-d') ?? '-' }}</td>
        </tr>
    </table>

    <div class="section-title">Sugar (LKG) Distribution</div>
    <table class="table">
        <thead>
            <tr>
                <th>Share Type</th>
                <th>Quantity (LKG)</th>
                <th>Amount (PHP)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Planter Share</td>
                <td>{{ number_format((float) $production->pshr_net_lkg, 4) }}</td>
                <td>{{ number_format((float) $production->planter_lkg_money, 2) }}</td>
            </tr>
            <tr>
                <td>PDPA Share</td>
                <td>{{ number_format((float) $production->pdpa_lkg, 4) }}</td>
                <td>{{ number_format((float) $production->pdpa_lkg_money, 2) }}</td>
            </tr>
            <tr>
                <td>Association Dues</td>
                <td>{{ number_format((float) $production->association_dues_lkg, 4) }}</td>
                <td>{{ number_format((float) $production->association_dues_lkg_money, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2">Sugar Distribution Total</td>
                <td>{{ number_format((float) $production->distribution_total, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Molasses (MOL) Distribution</div>
    <table class="table">
        <thead>
            <tr>
                <th>Share Type</th>
                <th>Quantity (MOL)</th>
                <th>Amount (PHP)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Planter Share</td>
                <td>{{ number_format((float) $production->pshr_net_mol, 4) }}</td>
                <td>{{ number_format((float) $production->planter_mol_money, 2) }}</td>
            </tr>
            <tr>
                <td>PDPA Share</td>
                <td>{{ number_format((float) $production->pdpa_mol, 4) }}</td>
                <td>{{ number_format((float) $production->pdpa_mol_money, 2) }}</td>
            </tr>
            <tr>
                <td>Association Dues</td>
                <td>{{ number_format((float) $production->association_dues_mol, 4) }}</td>
                <td>{{ number_format((float) $production->association_dues_mol_money, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2">Molasses Distribution Total</td>
                <td>{{ number_format((float) $production->molasses_total, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <table class="grid">
        <tr>
            <td class="label">Grand Total (PHP)</td>
            <td>{{ number_format((float) $production->distribution_total + (float) $production->molasses_total, 2) }}</td>
            <td class="label">Status</td>
            <td>{{ strtoupper((string) $production->financial_status) }}</td>
        </tr>
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div class="line"></div>
                Prepared By
            </td>
            <td>
                <div class="line"></div>
                Verified By
            </td>
            <td>
                <div class="line"></div>
                Approved By
            </td>
        </tr>
    </table>

    <p class="muted">Generated {{ now()->format('Y-m-d H:i:s') }}. This voucher is separate from the Final Data export and is intended for financial payout verification.</p>
</body>

</html>
