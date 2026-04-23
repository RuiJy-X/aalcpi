<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('productions', 'production_date')) {
            Schema::table('productions', function (Blueprint $table) {
                $table->date('production_date')->nullable()->after('production_month');
            });
        }

        if (!Schema::hasColumn('productions', 'crop_year')) {
            Schema::table('productions', function (Blueprint $table) {
                $table->string('crop_year', 9)->nullable()->after('production_date');
            });
        }

        DB::table('productions')
            ->select(['id', 'production_date', 'production_year', 'production_month'])
            ->orderBy('id')
            ->chunkById(100, function ($records) {
                foreach ($records as $record) {
                    $productionDate = $record->production_date;

                    if (empty($productionDate)) {
                        $productionDate = $this->buildProductionDate(
                            $record->production_year ?? null,
                            $record->production_month ?? null,
                        );
                    }

                    if (empty($productionDate)) {
                        continue;
                    }

                    $year = (int) date('Y', strtotime((string) $productionDate));
                    if ($year < 1900) {
                        continue;
                    }

                    DB::table('productions')
                        ->where('id', $record->id)
                        ->update([
                            'production_date' => $productionDate,
                            'crop_year' => sprintf('%04d-%04d', $year, $year + 1),
                        ]);
                }
            });

        $fallbackStartYear = (int) date('Y');

        DB::table('productions')
            ->whereNull('production_date')
            ->update([
                'production_date' => date('Y-m-d'),
            ]);

        DB::table('productions')
            ->whereNull('crop_year')
            ->update([
                'crop_year' => sprintf('%04d-%04d', $fallbackStartYear, $fallbackStartYear + 1),
            ]);

        Schema::table('productions', function (Blueprint $table) {
            if (Schema::hasColumn('productions', 'production_year')) {
                $table->dropColumn('production_year');
            }

            if (Schema::hasColumn('productions', 'production_month')) {
                $table->dropColumn('production_month');
            }

            if (Schema::hasColumn('productions', 'crop_year')) {
                $table->string('crop_year', 9)->nullable(false)->change();
            }

            if (Schema::hasColumn('productions', 'production_date')) {
                $table->date('production_date')->nullable(false)->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productions', function (Blueprint $table) {
            if (!Schema::hasColumn('productions', 'production_year')) {
                $table->integer('production_year')->nullable()->after('hacienda_code');
            }

            if (!Schema::hasColumn('productions', 'production_month')) {
                $table->string('production_month')->nullable()->after('production_year');
            }
        });

        DB::table('productions')
            ->select(['id', 'production_date'])
            ->orderBy('id')
            ->chunkById(100, function ($records) {
                foreach ($records as $record) {
                    if (empty($record->production_date)) {
                        continue;
                    }

                    $timestamp = strtotime((string) $record->production_date);
                    if ($timestamp === false) {
                        continue;
                    }

                    DB::table('productions')
                        ->where('id', $record->id)
                        ->update([
                            'production_year' => (int) date('Y', $timestamp),
                            'production_month' => date('F', $timestamp),
                        ]);
                }
            });

        if (Schema::hasColumn('productions', 'crop_year')) {
            Schema::table('productions', function (Blueprint $table) {
                $table->dropColumn('crop_year');
            });
        }
    }

    private function buildProductionDate(mixed $yearValue, mixed $monthValue): ?string
    {
        $year = (int) ($yearValue ?? 0);
        if ($year < 1900) {
            return null;
        }

        $month = $this->parseMonthValue($monthValue);
        if ($month === null) {
            return null;
        }

        return sprintf('%04d-%02d-01', $year, $month);
    }

    private function parseMonthValue(mixed $value): ?int
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
};
