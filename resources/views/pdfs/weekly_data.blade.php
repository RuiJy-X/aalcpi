<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Weekly Planters Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family:Arial, Helvetica, sans-serif;
            font-size: 10pt;
            color: #000;
            background: #fff;
            padding: 64px;
        }

        table {
            border-collapse: collapse;
        }

        .text-center { text-align: center; }
        .text-right  { text-align: right; }
        .text-left   { text-align: left; }
        .underline   { text-decoration: underline; }
        .bold        { font-weight: bold; }

        .delivery-table tbody td {
            margin: 0px 8px;
        }
    </style>
</head>
<body>



{{-- Header: company info left/center, factors right --}}
<table width="100%" style="margin-bottom:4px;">
    <tr>
        <td width="70%" style="text-align:center;">
            <div style="font-size:11pt;">Universal Robina Corporation</div>
            <div style="font-size:11pt;">Sugar and Renewables - LA CARLOTA</div>
            <div style="font-size:10pt;">Barangay RSB, La Carlota City 6130, Negros Occidental</div>
            <div style="font-size:10pt;">Crop Year: {{ $production->crop_year ?? '2024-2025' }}</div>
            <div style="font-size:10pt;">
                Week Ending: {{ \Carbon\Carbon::parse($production->production_date)->format('m/d/Y') }}
                &nbsp;&nbsp;&nbsp;
                Week No: {{ $production->week_number ?? '1' }}
            </div>
            <div style="font-size:11pt; font-weight:bold; text-decoration:underline; letter-spacing:0.5px;">
                WEEKLY PLANTERS REPORT
            </div>
        </td>
        <td width="30%" style="vertical-align:bottom; font-size:9pt; padding-left:10px;">
            <table>
                <tr>
                    <td style="padding-right:4px; white-space:nowrap;">Sugar Factor : &nbsp;&nbsp;&nbsp;</td>
                    <td>{{ number_format((float)($production->sugar_factor ?? "NONE"), 8) }}</td>
                </tr>
                <tr>
                    <td style="white-space:nowrap;">Molasses Factor : &nbsp;&nbsp;&nbsp;</td>
                    <td>{{ number_format((float)($production->molasses_factor ?? "NONE"), 8) }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

{{-- Planter code/name (left) and hacienda address (right) --}}
<table width="100%" style="margin-top:4px; font-size:10pt;">
    <tr>
        <td width="50%" style="font-weight:bold;">
            {{ $production->planter_code }} {{ strtoupper($production->planter->name ?? '') }}
        </td>
        <td width="50%" style="text-align:right; font-weight:bold;">
            {{ strtoupper($production->hacienda->address ?? "NO ADDRESS SET") }}
        </td>
    </tr>
</table>

{{-- Main delivery table --}}
<table width="100%" style="margin-top:4px; font-size:9pt; border-collapse: separate; border-spacing: 10px 0;" class="delivery-table">
    <thead>
        <tr>
            <th rowspan="2" width="14%" style="text-align:center; border-bottom: 1px solid black; font-weight: normal;">Date</th>
            <th rowspan="2" width="10%" style="text-align:center; border-bottom: 1px solid black; font-weight: normal;">Number<br>of Trucks</th>
            {{-- This spans the two columns below --}}
            <th colspan="2" style="text-align:center; font-weight: normal;">Average</th>
            <th rowspan="2" width="12%" style="text-align:center; border-bottom: 1px solid black; font-weight: normal;">Gross<br>Cane</th>
            <th rowspan="2" width="12%" style="text-align:center; border-bottom: 1px solid black; font-weight: normal;">Tonnes<br>Net Cane</th>
            <th rowspan="2" width="12%" style="text-align:center; border-bottom: 1px solid black; font-weight: normal;">Calculated<br>Sugar</th>
        </tr>
        <tr>
            {{-- Sub-headers for Average --}}
            <th width="9%" style="text-align:center; border-bottom: 1px solid black; font-weight: normal;">Trash</th>
            <th width="9%" style="text-align:center; border-bottom: 1px solid black; font-weight: normal;">LKg/TC</th>
        </tr>
    </thead>
    <tbody>
        {{-- Date row --}}
        <tr>
            <td style="text-align: center; padding: 4px;  border-bottom: 1px solid black; ">{{ \Carbon\Carbon::parse($production->production_date)->format('m d Y') }}</td>
            <td style="text-align: center; padding: 4px;  border-bottom: 1px solid black; ">{{ $production->trucks ?? "ERR" }}</td>
            <td style="text-align: center; padding: 4px;  border-bottom: 1px solid black; ">{{ number_format((float)($production->trash ?? "ERR"), 2) }}</td>
            <td style="text-align: center; padding: 4px;  border-bottom: 1px solid black; ">{{ number_format((float)($production->Lkg_Tc ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;  border-bottom: 1px solid black; ">{{ number_format((float)($production->gross_cw ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;  border-bottom: 1px solid black; ">{{ number_format((float)($production->net_cw ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;  border-bottom: 1px solid black; ">{{ number_format((float)($production->theoretical_lkg ?? "ERR"), 2) }}</td>
        </tr>
        {{-- This Week --}}
        <tr>
            <td style="text-align: left; padding: 4px;">This Week</td>
            <td style="text-align: center; padding: 4px;">{{ $production->trucks ?? "ERR" }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->trash ?? "ERR"), 2) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->Lkg_Tc ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->gross_cw ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->net_cw ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->theoretical_lkg ?? "ERR"), 2) }}</td>
        </tr>
        {{-- Previous --}}
        <tr>
            <td style="text-align: left; padding: 4px;">Previous</td>
            <td style="text-align: center; padding: 4px;">{{ $production->trucks ?? "ERR" }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->trash ?? "ERR"), 2) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->Lkg_Tc ?? "ERR"), 3) }}</td>
        </tr>
        {{-- To-Date --}}
        <tr>
            <td style="text-align: left; padding: 4px;">To-Date</td>
            <td style="text-align: center; padding: 4px;">{{ $production->trucks ?? "ERR" }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->trash ?? "ERR"), 2) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->theoretical_lkg ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->gross_cw ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->net_cw ?? "ERR"), 3) }}</td>
            <td style="text-align: center; padding: 4px;">{{ number_format((float)($production->theoretical_lkg * $production->gross_cw ?? "ERR"), 2) }}</td>
        </tr>
    </tbody>
</table>
<br/><br/>
{{-- SUGAR + MOLASSES combined row --}}
<table width="100%" style="margin-top:6px; font-size:9.5pt; border-collapse: separate; border-spacing: 10px 0;">
    {{-- Section headers --}}
    <tr>
        <td colspan="5" style="text-align:center; font-weight:bold; border-top:1px dashed #444; border-bottom:1px dashed #444; padding:1px 0; font-size:9pt;">
            ---------------S U G A R---------------
        </td>
        <td width="3%">&nbsp;</td>
        <td colspan="3" style="text-align:center; font-weight:bold; border-top:1px dashed #444; border-bottom:1px dashed #444; padding:1px 0; font-size:9pt;">
            ----MOLASSES----
        </td>
    </tr>
    <br/>
    {{-- Sub-headers --}}
    <tr>
        <td width="13%" style="text-align:center; font-size:8.5pt;">Date</td>
        <td width="13%" style="text-align:center; font-size:8.5pt;">Gross Prod.<br>(KG)</td>
        <td width="13%" style="text-align:center; font-size:8.5pt;">Net Planter<br>Share (KG)</td>
        <td width="13%" style="text-align:center; font-size:8.5pt;">Gross Prod.<br>(LKG)</td>
        <td width="13%" style="text-align:center; font-size:8.5pt;">Net Planter<br>Share (LKG)</td>
        <td width="12%" style="text-align:center; font-size:8.5pt;">Actual<br>LKg/TC</td>
        <td width="3%">&nbsp;</td>
        <td width="13%" style="text-align:center; font-size:8.5pt;">Gross Prod.<br>(KG)</td>
        <td width="13%" style="text-align:center; font-size:8.5pt;">Planter<br>Share (KG)&#x2713;</td>
    </tr>
    {{-- This Week --}}
    <tr>
        <td style="text-decoration:underline; font-size:8.5pt; white-space:nowrap;" >This Week</td>
        <td style="text-align:center;">{{ number_format((float)($production->actual_lkg * 50 ?? "ERR"), 0) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->pshr_net_lkg * 50 ?? "ERR"), 0) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->actual_lkg  ?? "ERR"), 2) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->pshr_net_lkg?? "ERR"), 2) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->Lkg_TC ?? "ERR"), 3) }}</td>
        <td>&nbsp;</td>
        <td style="text-align:center;">{{ number_format((float)($production->actual_mol  ?? "ERR"), 0) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->pshr_net_mol ?? "ERR"), 0) }}</td>
    </tr>
    {{-- Previous --}}
    <tr>
        <td style="text-decoration:underline; font-size:8.5pt;" >Previous</td>
        <td style="text-align:center;">{{ number_format((float)($production->distribution_total ?? "ERR"), 0) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->pshr_net_mol ?? "ERR"), 0) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->pshr_net_lkg ?? "ERR"), 2) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->pdpa_lkg ?? "ERR"), 2) }}</td>
        <td>&nbsp;</td>
        <td style="text-align:center;">{{ number_format((float)($production->actual_mol ?? "ERR"), 0) }}</td>
        <td style="text-align:center;">{{ number_format((float)($production->planter_mol_money ?? "ERR"), 0) }}</td>
    </tr>
    {{-- To-Date --}}
    <tr>
        <td style="text-decoration:underline; font-size:8.5pt;" >To-Date</td>
        <td style="text-align:center; border-top:1px solid #000;">{{ number_format((float)($production->distribution_total ?? "ERR"), 0) }}</td>
        <td style="text-align:center; border-top:1px solid #000;">{{ number_format((float)($production->pshr_net_mol ?? "ERR"), 0) }}</td>
        <td style="text-align:center; border-top:1px solid #000;">{{ number_format((float)($production->pshr_net_lkg ?? "ERR"), 2) }}</td>
        <td style="text-align:center; border-top:1px solid #000;">{{ number_format((float)($production->pdpa_lkg ?? "ERR"), 2) }}</td>
        <td style="text-align:center; border-top:1px solid #000;">{{ number_format((float)($production->actual_lkg ?? "ERR"), 3) }}</td>
        <td>&nbsp;</td>
        <td style="text-align:center; border-top:1px solid #000;">{{ number_format((float)($production->actual_mol ?? "ERR"), 0) }}</td>
        <td style="text-align:center; border-top:1px solid #000;">{{ number_format((float)($production->planter_mol_money ?? "ERR"), 0) }}</td>
    </tr>
</table>

{{-- Signatures --}}
<table width="100%" style="margin-top:16px; font-size:9.5pt;">
    <tr>
        <td width="45%" style="vertical-align:bottom;">
            Noted by:
        </td>
        <td width="10%">&nbsp;</td>
        <td width="45%" style="text-align:center; vertical-align:bottom;">
            Approved by:
        </td>
    </tr>
    <tr>
        <td style="text-align:center; padding-top:20px;">
            <span style="display:block; border-top:1px solid #000; padding-top:2px;">
                AALCPI Representative
            </span>
        </td>
        <td>&nbsp;</td>
        <td style="text-align:center; padding-top:20px;">
            <span style="display:block; border-top:1px solid #000; padding-top:2px;">
                {{ $production->financial_reviewed_by ?? 'Emma E. Abueva' }}
            </span>
            <span style="font-size:9pt;">QA Manager</span>
        </td>
    </tr>
</table>

</body>
</html>
