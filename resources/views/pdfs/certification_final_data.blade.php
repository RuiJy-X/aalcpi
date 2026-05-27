<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Final Data</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        
        td {
            padding: 8px;
        }

        p {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.5;
            font-size: 16px;
        }

        .emphasize {
            font-weight: bold;
            text-decoration: underline;
        }

        h3{
            font-family: 'Times New Roman', Times, serif;
        }
    </style>
</head>
<body>
    @php
        $records = isset($productions) ? $productions : collect([$production]);
    @endphp

    @foreach ($records as $production)
    @php
        $compositeSugarPrice = $production->composite_sugar_price;
        $compositeMolassesPrice = $production->composite_molasses_price;
    @endphp
    <h2 style="text-align: center; font-size: 16px;">ASSOCIACION DE AGRICULTORES DE LA CARLOTA Y PONTEVEDRA, INC. P.O Box 18, Brgy. RSB, La Carlota City</h2>
    <br><br>
    <h1 style="text-align: center; font-family: 'Times New Roman', Times, serif;"><strong>C E R T I F I C A T I O N</strong></h1>
    <h3><strong>TO WHOM IT MAY CONCERN:</strong></h3>
    <p style="text-align: justify; text-indent: 40px; padding:0px 32px">This is to certify that according to our records on file with Planter Code No. <span class="emphasize">{{ $production->planter_code}}</span> milling with Universal Robina Corporation, La Carlota City under the name of <span class="emphasize">{{ $production->planter->name }}</span> had the following production in Tons Cane, Lkg, Sugar and Molasses in metric tons for crop year {{ $production->crop_year }}.</p>
    <h3 style="text-align: center; font-family: Arial, Helvetica, sans-serif; font-size: 18px;"><strong>FINAL DATA</strong></h3>



    <table style="border-collapse: collapse; border: 1px solid black; text-align: center; width: 100% ">
    <tr>
        <td rowspan="3" style="border: 1px solid black;">PLANTER Code</td>
        <td colspan="5" style="border: 1px solid black; text-align: center;">PRODUCTION</td>
    </tr>
    <tr>
        <td rowspan="2" style="border: 1px solid black;">TONES CANE (net)</td>
        <td colspan="2" style="border: 1px solid black; text-align: center;">SUGAR, Lkg</td>
        <td colspan="2" style="border: 1px solid black; text-align: center;">MOLASSES, Metric Tons</td>
    </tr>
    <tr>
        <td style="border: 1px solid black;">ACTUAL</td>
        <td style="border: 1px solid black;">PLANTER SHARE</td>
        <td style="border: 1px solid black;">ACTUAL</td>
        <td style="border: 1px solid black;">PLANTER SHARE</td>
    </tr>
    <tr>
        <td style="border: 1px solid black; font-weight: bold">{{$production->planter_code}}</td>
        <td style="border: 1px solid black;font-weight: bold">{{ $production->net_cw }}</td>
        <td style="border: 1px solid black;font-weight: bold">{{$production->actual_lkg}}</td>
        <td style="border: 1px solid black;font-weight: bold">{{$production->pshr_net_lkg}}</td>
        <td style="border: 1px solid black;font-weight: bold">{{$production->actual_mol}}</td>
        <td style="border: 1px solid black;font-weight: bold">{{$production->pshr_net_mol}}</td>
    </tr>

</table>

<p style="text-align: center">This certification is issued for whatever lawful purposes it may serve.</p>

<table style="width: 100%">
    <thead>
        <tr>
            <td colspan="2">Composite Price:</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="width: 60%">
                <p style="padding: 0; margin:0 ">Sugar= Php {{ $compositeSugarPrice !== null ? number_format($compositeSugarPrice, 2) : '-' }}
                <p style="padding: 0; margin:0 ">Molasses= Php {{ $compositeMolassesPrice !== null ? number_format($compositeMolassesPrice, 2) : '-' }}
                
            </td>
            <td style="width: 40%; text-align: center">
                <h5>
                    ASSOCIACION DE AGRICULTORES DE LA CARLOTA Y PONTEVEDRA, INC. BY:<br><br><br>
                    DAVID JOHN THADDEUS P. ALBA<br>
                    General Manager
                </h5>
            </td>
        </tr>
    </tbody>

</table>
<p style="padding: 0; margin:0 ">La Carlota City Philippines</p>
<p style="padding: 0; margin:0 ">{{ now()->format('F j, Y') }}</p>

    @if (! $loop->last)
        <div style="page-break-after: always;"></div>
    @endif
    @endforeach
</body>
</html>