<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class BuildPythonBinaryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:build-binary {--force : Force rebuild even if binary exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Compile pdftoexcel.py into a standalone binary using PyInstaller for desktop packaging';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $binDir = base_path('bin');
        $outputBinary = PHP_OS_FAMILY === 'Windows'
            ? "{$binDir}/pdftoexcel.exe"
            : "{$binDir}/pdftoexcel";

        if (file_exists($outputBinary) && ! $this->option('force')) {
            $this->info("Binary already exists at [{$outputBinary}]. Use --force to rebuild.");

            return self::SUCCESS;
        }

        if (! is_dir($binDir)) {
            mkdir($binDir, 0755, true);
        }

        $this->info('Building standalone Python PDF binary with PyInstaller...');

        $excludes = [
            '--exclude-module', 'torch',
            '--exclude-module', 'tensorflow',
            '--exclude-module', 'cv2',
            '--exclude-module', 'matplotlib',
            '--exclude-module', 'scipy',
            '--exclude-module', 'pandas',
            '--exclude-module', 'IPython',
            '--exclude-module', 'jupyter',
        ];

        $command = array_merge([
            'pyinstaller',
            '--onefile',
            '--name', 'pdftoexcel',
            '--distpath', 'bin',
            '--workpath', 'temp/pybuild',
            '--specpath', 'temp/pyspec',
            '--clean',
        ], $excludes, ['pdftoexcel.py']);

        $result = Process::timeout(300)->run($command);

        if (! $result->successful()) {
            $this->error('Failed to compile Python binary:');
            $this->line($result->errorOutput() ?: $result->output());

            return self::FAILURE;
        }

        $this->info("Successfully compiled binary to [{$outputBinary}]");

        return self::SUCCESS;
    }
}
