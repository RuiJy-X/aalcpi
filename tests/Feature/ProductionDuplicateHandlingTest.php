<?php

namespace Tests\Feature;

use App\Constants\Permissions;
use App\Models\Hacienda;
use App\Models\ImportJob;
use App\Models\ImportMapping;
use App\Models\Planter;
use App\Models\Production;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class ProductionDuplicateHandlingTest extends TestCase
{
    use RefreshDatabase;

    private function createProductionExcel(array $rows, array $headers = []): UploadedFile
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        if (empty($headers)) {
            $headers = [
                'planter_code',
                'planter_name',
                'hacienda_code',
                'hacienda_name',
                'gross_cw',
                'net_cw',
                'actual_lkg',
                'theoretical_lkg',
                'pshr_net_lkg',
                'actual_mol',
                'pshr_net_mol',
                'trucks',
                'trans_code',
            ];
        }

        // Row 1: Headers
        foreach ($headers as $colIdx => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue("{$colLetter}1", $header);
        }

        // Rows 2+: Data
        foreach ($rows as $rowIdx => $row) {
            $excelRow = $rowIdx + 2;
            foreach ($headers as $colIdx => $header) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                $val = $row[$header] ?? '';
                $sheet->setCellValue("{$colLetter}{$excelRow}", $val);
            }
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'prod_test_').'.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);

        return new UploadedFile(
            $tempFile,
            'test_productions.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );
    }

    public function test_analyze_endpoint_classifies_new_exact_and_possible_duplicates()
    {
        $user = User::factory()->create();
        $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

        $planter = Planter::create([
            'planter_code' => '00101',
            'name' => 'Existing Planter 1',
        ]);
        $hacienda = Hacienda::create([
            'planter_id' => $planter->id,
            'hacienda_code' => '00501',
            'name' => 'Existing Hda 1',
        ]);

        // Existing Production in DB (Exact duplicate candidate)
        Production::create([
            'planter_code' => '00101',
            'hacienda_code' => '00501',
            'crop_year' => '2025-2026',
            'planter_id' => $planter->id,
            'hacienda_id' => $hacienda->id,
            'net_cw' => 100.500,
            'actual_lkg' => 85.200,
            'pshr_net_lkg' => 54.528,
            'actual_mol' => 25.100,
            'pshr_net_mol' => 16.064,
            'gross_cw' => 110.000,
            'trucks' => 4,
            'trans_code' => '1',
        ]);

        // Existing Production in DB (Possible duplicate candidate)
        Production::create([
            'planter_code' => '00102',
            'hacienda_code' => '00502',
            'crop_year' => '2025-2026',
            'planter_id' => $planter->id,
            'hacienda_id' => $hacienda->id,
            'net_cw' => 200.000,
            'actual_lkg' => 150.000,
            'pshr_net_lkg' => 96.000,
            'actual_mol' => 40.000,
            'pshr_net_mol' => 25.600,
            'gross_cw' => 210.000,
            'trucks' => 5,
            'trans_code' => '1',
        ]);

        $file = $this->createProductionExcel([
            // Row 2: Exact Duplicate of 00101/00501
            [
                'planter_code' => '101',
                'planter_name' => 'Existing Planter 1',
                'hacienda_code' => '501',
                'hacienda_name' => 'Existing Hda 1',
                'gross_cw' => '110.00',
                'net_cw' => '100.50',
                'actual_lkg' => '85.20',
                'theoretical_lkg' => '85.00',
                'pshr_net_lkg' => '54.528',
                'actual_mol' => '25.10',
                'pshr_net_mol' => '16.064',
                'trucks' => '4',
                'trans_code' => '1',
            ],
            // Row 3: Possible Duplicate of 00102/00502 (net_cw changed to 250)
            [
                'planter_code' => '102',
                'planter_name' => 'Existing Planter 2',
                'hacienda_code' => '502',
                'hacienda_name' => 'Existing Hda 2',
                'gross_cw' => '260.00',
                'net_cw' => '250.00',
                'actual_lkg' => '180.00',
                'theoretical_lkg' => '180.00',
                'pshr_net_lkg' => '115.200',
                'actual_mol' => '50.00',
                'pshr_net_mol' => '32.000',
                'trucks' => '6',
                'trans_code' => '1',
            ],
            // Row 4: Brand New Planter / Hacienda
            [
                'planter_code' => '103',
                'planter_name' => 'Brand New Planter',
                'hacienda_code' => '503',
                'hacienda_name' => 'Brand New Hda',
                'gross_cw' => '50.00',
                'net_cw' => '45.00',
                'actual_lkg' => '35.00',
                'theoretical_lkg' => '35.00',
                'pshr_net_lkg' => '22.400',
                'actual_mol' => '10.00',
                'pshr_net_mol' => '6.400',
                'trucks' => '2',
                'trans_code' => '1',
            ],
            // Row 5: Blank Row (should be skipped silently)
            [
                'planter_code' => '',
                'planter_name' => '',
                'hacienda_code' => '',
                'hacienda_name' => '',
            ],
            // Row 6: Invalid Row (has text but no planter code)
            [
                'planter_code' => '',
                'planter_name' => 'TOTAL ROW',
                'hacienda_code' => '504',
                'hacienda_name' => 'Hda 504',
            ],
        ]);

        $response = $this->actingAs($user)->postJson('/Productions/analyze', [
            'file' => $file,
            'crop_year' => '2025-2026',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'analysis_token',
                'total_rows',
                'new_rows_count',
                'exact_duplicates_count',
                'possible_duplicates_count',
                'invalid_rows_count',
                'possible_duplicates',
            ]);

        $data = $response->json();
        $this->assertEquals(1, $data['exact_duplicates_count']);
        $this->assertEquals(1, $data['possible_duplicates_count']);
        $this->assertEquals(1, $data['new_rows_count']);
        $this->assertEquals(1, $data['invalid_rows_count']);

        // Verify difference diff payload
        $this->assertCount(1, $data['possible_duplicates']);
        $diffItem = $data['possible_duplicates'][0];
        $this->assertNotEmpty($diffItem['differences']);
    }

    public function test_importing_identical_production_file_twice_produces_zero_duplicate_rows()
    {
        $user = User::factory()->create();
        $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

        $mapping = ImportMapping::create([
            'user_id' => $user->id,
            'name' => 'Productions Mapping',
            'import_type' => 'productions',
            'header_signature' => 'prod_sig',
            'headers' => ['planter_code', 'planter_name', 'hacienda_code', 'hacienda_name', 'net_cw', 'actual_lkg', 'pshr_net_lkg', 'actual_mol', 'pshr_net_mol', 'trucks', 'trans_code'],
            'mapping' => [
                'planter_code' => 'planter_code',
                'planter_name' => 'planter_name',
                'hacienda_code' => 'hacienda_code',
                'hacienda_name' => 'hacienda_name',
                'net_cw' => 'net_cw',
                'actual_lkg' => 'actual_lkg',
                'pshr_net_lkg' => 'pshr_net_lkg',
                'actual_mol' => 'actual_mol',
                'pshr_net_mol' => 'pshr_net_mol',
                'trucks' => 'trucks',
                'trans_code' => 'trans_code',
            ],
        ]);

        $rows = [
            [
                'planter_code' => '201',
                'planter_name' => 'Planter 201',
                'hacienda_code' => '601',
                'hacienda_name' => 'Hda 601',
                'net_cw' => '150.00',
                'actual_lkg' => '120.00',
                'pshr_net_lkg' => '76.80',
                'actual_mol' => '30.00',
                'pshr_net_mol' => '19.20',
                'trucks' => '3',
                'trans_code' => '1',
            ],
            [
                'planter_code' => '202',
                'planter_name' => 'Planter 202',
                'hacienda_code' => '602',
                'hacienda_name' => 'Hda 602',
                'net_cw' => '250.00',
                'actual_lkg' => '200.00',
                'pshr_net_lkg' => '128.00',
                'actual_mol' => '50.00',
                'pshr_net_mol' => '32.00',
                'trucks' => '5',
                'trans_code' => '1',
            ],
        ];

        // 1. First Import
        $file1 = $this->createProductionExcel($rows);
        $this->actingAs($user)->post('/Productions/import', [
            'file' => $file1,
            'crop_year' => '2025-2026',
            'mapping_id' => $mapping->id,
        ]);

        $this->assertEquals(2, Production::count());

        // 2. Second Import (Identical file)
        $file2 = $this->createProductionExcel($rows);
        $this->actingAs($user)->post('/Productions/import', [
            'file' => $file2,
            'crop_year' => '2025-2026',
            'mapping_id' => $mapping->id,
        ]);

        // Total records in database must still be exactly 2
        $this->assertEquals(2, Production::count());

        $latestJob = ImportJob::latest()->first();
        $this->assertEquals(2, $latestJob->context['exact_duplicates_count']);
        $this->assertEquals(2, $latestJob->context['rows_skipped']);
    }
}
