<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('productions', 'production_date')) {
            return;
        }

        Schema::table('productions', function (Blueprint $table) {
            $table->date('production_date')->nullable()->after('production_month');
        });

        DB::table('productions')
            ->select(['id', 'production_year', 'production_month'])
            ->orderBy('id')
            ->chunkById(100, function ($records) {
                foreach ($records as $record) {
                    $year = (int) ($record->production_year ?? 0);
                    $month = parseMonthValue($record->production_month);

                    if ($year < 1900 || $month === null) {
                        continue;
                    }

                    DB::table('productions')
                        ->where('id', $record->id)
                        ->update([
                            'production_date' => sprintf('%04d-%02d-01', $year, $month),
                        ]);
                }
            });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('productions', 'production_date')) {
            return;
        }

        Schema::table('productions', function (Blueprint $table) {
            $table->dropColumn('production_date');
        });
    }
};

if (!function_exists('parseMonthValue')) {
    function parseMonthValue(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $month = (int) $value;
            return $month >= 1 && $month <= 12 ? $month : null;
        }

        $normalized = strtolower(trim((string) $value));
        $map = [
            'jan' => 1,
            'january' => 1,
            'feb' => 2,
            'february' => 2,
            'mar' => 3,
            'march' => 3,
            'apr' => 4,
            'april' => 4,
            'may' => 5,
            'jun' => 6,
            'june' => 6,
            'jul' => 7,
            'july' => 7,
            'aug' => 8,
            'august' => 8,
            'sep' => 9,
            'sept' => 9,
            'september' => 9,
            'oct' => 10,
            'october' => 10,
            'nov' => 11,
            'november' => 11,
            'dec' => 12,
            'december' => 12,
        ];

        return $map[$normalized] ?? null;
    }
}
