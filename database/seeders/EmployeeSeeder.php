<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $names = [
            'Juan Dela Cruz', 'Maria Santos', 'Antonio Reyes', 'Ana Gonzalez', 'Jose Ramos',
            'Rosa Mendoza', 'Manuel Bautista', 'Elena Flores', 'Carlos Garcia', 'Teresa Cruz',
            'Pedro Aquino', 'Luzviminda Villa', 'Ramon Maguindanao', 'Divina Gracia', 'Reynaldo Navarro',
            'Cristina Silverio', 'Eduardo Soriano', 'Consuelo Pangilinan', 'Francisco Del Rosario', 'Imelda Tuazon',
            'Gabriel Roxas', 'Corazon Aquino', 'Benigno Salvador', 'Jacinto Zamora', 'Melchora Aquino',
            'Apolinario Mabini', 'Marcelo Del Pilar', 'Graciano Lopez', 'Mariano Gomez', 'Gregorio Del Pilar'
        ];

        $positions = [
            'Cane Cutter / Harvester', 'Tractor Operator', 'Scale House Clerk', 'Field Supervisor',
            'Sugar Mill Engineer', 'Heavy Equipment Mechanic', 'Loading Ramp Attendant', 'Agronomist',
            'Payroll Clerk', 'Field Auditor', 'Dispatch Controller', 'Maintenance Technician'
        ];

        $cities = [
            'Bacolod City, Negros Occidental', 'Silay City, Negros Occidental',
            'Bago City, Negros Occidental', 'Talisay City, Negros Occidental',
            'Victorias City, Negros Occidental', 'Iloilo City, Iloilo',
            'Kabankalan City, Negros Occidental', 'La Carlota City, Negros Occidental'
        ];

        $startDate = Carbon::parse('2026-07-01');
        $endDate = Carbon::parse('2026-08-30');

        $employees = [];

        foreach ($names as $index => $name) {
            $empNum = $index + 1;
            $code = 'EMP-' . str_pad((string) $empNum, 3, '0', STR_PAD_LEFT);
            $dailyRate = (float) rand(450, 850);
            $hourlyRate = round($dailyRate / 8.00, 2);
            $baseSalary = round($dailyRate * 26, 2);

            $employee = Employee::updateOrCreate(
                ['employee_code' => $code],
                [
                    'name'                    => $name,
                    'position'                => $positions[array_rand($positions)],
                    'daily_rate'              => $dailyRate,
                    'hourly_rate'             => $hourlyRate,
                    'base_salary'             => $baseSalary,
                    'address'                 => $cities[array_rand($cities)],
                    'contact_number'          => '09' . rand(100000009, 999999999),
                    'tin'                     => sprintf('%03d-%03d-%03d-000', rand(100, 999), rand(100, 999), rand(100, 999)),
                    'sss_no'                  => sprintf('%02d-%07d-%01d', rand(10, 99), rand(1000000, 9999999), rand(0, 9)),
                    'pagibig_no'              => sprintf('%04d-%04d-%04d', rand(1000, 9999), rand(1000, 9999), rand(1000, 9999)),
                    'philhealth_no'           => sprintf('%02d-%09d-%01d', rand(10, 99), rand(100000000, 999999999), rand(0, 9)),
                    'sss_loan'                => rand(0, 4) === 0 ? (float) rand(100, 500) : 0.00,
                    'pagibig_contribution'    => 200.00,
                    'emergency_loan'          => rand(0, 5) === 0 ? (float) rand(100, 300) : 0.00,
                    'withholding_tax'         => rand(0, 4) === 0 ? (float) rand(50, 250) : 0.00,
                ]
            );

            $employees[] = $employee;
        }

        // Clear existing attendances for these employees in date range to prevent duplicates
        $employeeIds = array_column($employees, 'id');
        Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->delete();

        // Generate attendances for each employee from July 1, 2026 to August 30, 2026
        $attendanceBatch = [];
        $now = now()->toDateTimeString();

        foreach ($employees as $employee) {
            $curr = $startDate->copy();

            while ($curr->lte($endDate)) {
                // Skip Sundays (working days Monday - Saturday)
                if (!$curr->isSunday()) {
                    // Occasionally generate overtime hours (8.0 to 10.0 hrs)
                    $isOvertime = rand(0, 5) === 0;
                    $workingTime = $isOvertime ? rand(9, 11) : 8.00;
                    $timeOut = $isOvertime ? sprintf('%02d:00:00', 17 + ($workingTime - 8)) : '17:00:00';

                    $attendanceBatch[] = [
                        'employee_id'  => $employee->id,
                        'date'         => $curr->toDateString(),
                        'week'         => 'W' . $curr->weekOfYear,
                        'time_in'      => '08:00:00',
                        'time_out'     => $timeOut,
                        'times'        => 1,
                        'working_time' => $workingTime,
                        'created_at'   => $now,
                        'updated_at'   => $now,
                    ];
                }

                $curr->addDay();
            }
        }

        // Chunk insert for performance
        foreach (array_chunk($attendanceBatch, 500) as $chunk) {
            DB::table('attendances')->insert($chunk);
        }
    }
}
