<?php

namespace App\Http\Controllers;

use App\Models\ImportMapping;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportMappingController extends Controller
{
    private const IMPORT_TYPES = ['planters', 'productions'];

    private const TARGETS = [
        'planters' => [
            ['key' => 'planter_code', 'required' => true],
            ['key' => 'name', 'required' => true],
            ['key' => 'address'],
            ['key' => 'contact_number'],
            ['key' => 'tin_number'],
            ['key' => 'registration_date'],
            ['key' => 'hacienda_code'],
            ['key' => 'hacienda_name'],
            ['key' => 'hacienda_address'],
            ['key' => 'area_hectares'],
            ['key' => 'distance_from_urc'],
        ],
        'productions' => [
            ['key' => 'planter_code', 'required' => true],
            ['key' => 'planter_name', 'required' => true],
            ['key' => 'hacienda_code'],
            ['key' => 'hacienda_name'],
            ['key' => 'trans_code'],
            ['key' => 'gross_cw'],
            ['key' => 'net_cw', 'required' => true],
            ['key' => 'trucks'],
            ['key' => 'theoretical_lkg'],
            ['key' => 'actual_lkg', 'required' => true],
            ['key' => 'pshr_net_lkg', 'required' => true],
            ['key' => 'pdpa_lkg'],
            ['key' => 'association_dues_lkg'],
            ['key' => 'actual_mol', 'required' => true],
            ['key' => 'pshr_net_mol', 'required' => true],
            ['key' => 'pdpa_mol'],
            ['key' => 'association_dues_mol'],
            ['key' => 'transloading'],
        ],
    ];

    public function preview(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required', 'file'],
            'import_type' => ['required', Rule::in(self::IMPORT_TYPES)],
        ]);

        $headers = $this->extractHeaders($validated['file']);
        $signature = $this->signatureFromHeaders($headers);

        $mapping = ImportMapping::query()
            ->where('import_type', $validated['import_type'])
            ->where('header_signature', $signature)
            ->first();

        return response()->json([
            'headers' => $headers,
            'signature' => $signature,
            'mapping' => $mapping?->mapping,
            'mapping_id' => $mapping?->id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'import_type' => ['required', Rule::in(self::IMPORT_TYPES)],
            'header_signature' => ['required', 'string'],
            'headers' => ['required', 'array', 'min:1'],
            'headers.*' => ['string'],
            'mapping' => ['required', 'array'],
        ]);

        if ($this->signatureFromHeaders($validated['headers']) !== $validated['header_signature']) {
            return response()->json([
                'message' => 'Header signature mismatch',
            ], 422);
        }

        $errors = $this->validateMapping(
            $validated['mapping'],
            $validated['headers'],
            $validated['import_type'],
        );

        if (!empty($errors)) {
            return response()->json([
                'message' => 'Invalid mapping',
                'errors' => $errors,
            ], 422);
        }

        $mapping = ImportMapping::updateOrCreate(
            [
                'import_type' => $validated['import_type'],
                'header_signature' => $validated['header_signature'],
            ],
            [
                'headers' => $validated['headers'],
                'mapping' => $validated['mapping'],
                'created_by' => $request->user()?->id,
            ],
        );

        return response()->json([
            'mapping_id' => $mapping->id,
        ]);
    }

    private function extractHeaders($file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getSheet(0);
        $rows = $sheet->rangeToArray('1:1', null, true, false);
        $firstRow = $rows[0] ?? [];

        $headers = array_map(function ($value) {
            $stringValue = is_string($value) ? trim($value) : (string) $value;
            if ($stringValue === '') {
                return '';
            }

            return Str::of($stringValue)->slug('_')->lower()->toString();
        }, $firstRow);

        $headers = array_values(array_filter($headers, static fn ($value) => $value !== ''));

        return array_values(array_unique($headers));
    }

    private function signatureFromHeaders(array $headers): string
    {
        return hash('sha256', json_encode(array_values($headers)));
    }

    private function validateMapping(array $mapping, array $headers, string $importType): array
    {
        $targets = self::TARGETS[$importType] ?? [];
        $allowedKeys = array_map(static fn (array $target) => $target['key'], $targets);
        $headerSet = array_flip($headers);
        $errors = [];

        $unknownKeys = array_diff(array_keys($mapping), $allowedKeys);
        if (!empty($unknownKeys)) {
            $errors['mapping_unknown'] = array_values($unknownKeys);
        }

        // Validate mapped fields: if a field is mapped, ensure the mapped header exists in the file
        // Note: Required fields may be unmapped (empty) if columns are missing from Excel;
        // importers have fallback defaults (0, false, etc.) for unmapped fields

        foreach ($mapping as $target => $source) {
            if ($source === null || $source === '') {
                continue;
            }

            if (!isset($headerSet[$source])) {
                $errors['mapping_invalid'][$target] = 'Header not found in file.';
            }
        }

        $mappedValues = array_values(array_filter($mapping, static fn ($value) => $value !== null && $value !== ''));
        $duplicates = array_filter(array_count_values($mappedValues), static fn (int $count) => $count > 1);
        if (!empty($duplicates)) {
            $errors['mapping_duplicates'] = array_keys($duplicates);
        }

        return $errors;
    }
}
