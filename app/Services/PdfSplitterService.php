<?php

namespace App\Services;

class PdfSplitterService
{
    /**
     * Get the absolute path to the compiled standalone executable, if present.
     */
    public static function getBinaryPath(): ?string
    {
        $exe = PHP_OS_FAMILY === 'Windows'
            ? base_path('bin/pdftoexcel.exe')
            : base_path('bin/pdftoexcel');

        return file_exists($exe) ? $exe : null;
    }

    /**
     * Build the command array for processing/indexing a weekly PDF.
     *
     * @return list<string>
     */
    public static function buildProcessCommand(
        string $inputPath,
        string $week,
        string $cropYear,
        string $outputPath,
    ): array {
        $binary = static::getBinaryPath();

        if ($binary !== null) {
            return [$binary, $inputPath, $week, $cropYear, $outputPath];
        }

        $python = PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';

        return [$python, base_path('pdftoexcel.py'), $inputPath, $week, $cropYear, $outputPath];
    }

    /**
     * Build the command array for extracting a single page from a master PDF.
     *
     * @return list<string>
     */
    public static function buildExtractCommand(
        string $masterPdfPath,
        int $page,
        string $outputPath,
    ): array {
        $binary = static::getBinaryPath();

        if ($binary !== null) {
            return [$binary, 'extract', $masterPdfPath, (string) $page, $outputPath];
        }

        $python = PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';

        return [$python, base_path('pdftoexcel.py'), 'extract', $masterPdfPath, (string) $page, $outputPath];
    }
}
