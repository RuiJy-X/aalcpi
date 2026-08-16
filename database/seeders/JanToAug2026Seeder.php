<?php

namespace Database\Seeders;

use App\Models\Advancement;
use App\Models\AdvancementDeduction;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\Payroll;
use App\Services\PayrollAuditService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JanToAug2026Seeder extends Seeder
{
    /**
     * Run the database seeds for January 2026 to August 2026.
     */
    public function run(): void
    {
        $this->command->info('Seeding database from January 2026 to August 2026...');

        // 1. Seed Philippine Holidays (Jan 2026 - Aug 2026)
        $holidays = [
            ['date' => '2026-01-01', 'name' => "New Year's Day", 'type' => 'regular'],
            ['date' => '2026-04-02', 'name' => 'Maundy Thursday', 'type' => 'regular'],
            ['date' => '2026-04-03', 'name' => 'Good Friday', 'type' => 'regular'],
            ['date' => '2026-04-09', 'name' => 'Araw ng Kagitingan', 'type' => 'regular'],
            ['date' => '2026-05-01', 'name' => 'Labor Day', 'type' => 'regular'],
            ['date' => '2026-06-12', 'name' => 'Independence Day', 'type' => 'regular'],
            ['date' => '2026-08-21', 'name' => 'Ninoy Aquino Day', 'type' => 'special_non_working'],
            ['date' => '2026-08-31', 'name' => 'National Heroes Day', 'type' => 'regular'],
        ];

        foreach ($holidays as $h) {
            Holiday::updateOrCreate(['date' => $h['date']], $h);
        }

        // 2. Seed Employees
        $names = [
            'Juan Dela Cruz', 'Maria Santos', 'Antonio Reyes', 'Ana Gonzalez', 'Jose Ramos',
            'Rosa Mendoza', 'Manuel Bautista', 'Elena Flores', 'Carlos Garcia', 'Teresa Cruz',
            'Pedro Aquino', 'Luzviminda Villa', 'Ramon Maguindanao', 'Divina Gracia', 'Reynaldo Navarro',
            'Cristina Silverio', 'Eduardo Soriano', 'Consuelo Pangilinan', 'Francisco Del Rosario', 'Imelda Tuazon',
            'Gabriel Roxas', 'Corazon Aquino', 'Benigno Salvador', 'Jacinto Zamora', 'Melchora Aquino',
            'Apolinario Mabini', 'Marcelo Del Pilar', 'Graciano Lopez', 'Mariano Gomez', 'Gregorio Del Pilar',
        ];

        $positions = [
            'Cane Cutter / Harvester', 'Tractor Operator', 'Scale House Clerk', 'Field Supervisor',
            'Sugar Mill Engineer', 'Heavy Equipment Mechanic', 'Loading Ramp Attendant', 'Agronomist',
            'Payroll Clerk', 'Field Auditor', 'Dispatch Controller', 'Maintenance Technician',
        ];

        $cities = [
            'Bacolod City, Negros Occidental', 'Silay City, Negros Occidental',
            'Bago City, Negros Occidental', 'Talisay City, Negros Occidental',
            'Victorias City, Negros Occidental', 'Iloilo City, Iloilo',
            'Kabankalan City, Negros Occidental', 'La Carlota City, Negros Occidental',
        ];

        $employees = [];
        foreach ($names as $index => $name) {
            $empNum = $index + 1;
            $code = 'EMP-' . str_pad((string) $empNum, 3, '0', STR_PAD_LEFT);
            $dailyRate = (float) (450 + ($index % 8) * 50);
            $hourlyRate = round($dailyRate / 8.00, 2);
            $baseSalary = round($dailyRate * 26, 2);

            $employee = Employee::updateOrCreate(
                ['employee_code' => $code],
                [
                    'name'                    => $name,
                    'position'                => $positions[$index % count($positions)],
                    'daily_rate'              => $dailyRate,
                    'hourly_rate'             => $hourlyRate,
                    'base_salary'             => $baseSalary,
                    'address'                 => $cities[$index % count($cities)],
                    'contact_number'          => '09' . sprintf('%09d', 100000000 + $index * 1234567),
                    'tin'                     => sprintf('%03d-%03d-%03d-000', 100 + $index, 200 + $index, 300 + $index),
                    'sss_no'                  => sprintf('%02d-%07d-%01d', 10 + $index, 1000000 + $index * 10, $index % 10),
                    'pagibig_no'              => sprintf('%04d-%04d-%04d', 1000 + $index, 2000 + $index, 3000 + $index),
                    'philhealth_no'           => sprintf('%02d-%09d-%01d', 12 + $index, 100000000 + $index * 100, $index % 10),
                    'sss_contribution'        => $index % 3 === 0 ? 300.00 : 0.00,
                    'pagibig_contribution'    => 200.00,
                    'philhealth_contribution' => $index % 3 === 0 ? 250.00 : 0.00,
                    'emergency_loan'          => $index % 5 === 0 ? 150.00 : 0.00,
                    'withholding_tax'         => $index % 4 === 0 ? 100.00 : 0.00,
                ]
            );

            $employees[] = $employee;
        }

        // 3. Clear existing attendances and payrolls for clean seeding
        $employeeIds = array_column($employees, 'id');
        Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', ['2026-01-01', '2026-08-31'])
            ->delete();

        Payroll::whereIn('employee_id', $employeeIds)
            ->whereBetween('period_start', ['2026-01-01', '2026-08-31'])
            ->delete();

        Advancement::whereIn('employee_id', $employeeIds)->delete();
        AdvancementDeduction::truncate();

        // 4. Generate Attendances (Jan 1, 2026 - Aug 31, 2026)
        $startDate = Carbon::parse('2026-01-01');
        $endDate = Carbon::parse('2026-08-31');
        $now = now()->toDateTimeString();
        $attendanceBatch = [];

        foreach ($employees as $empIndex => $employee) {
            $curr = $startDate->copy();

            while ($curr->lte($endDate)) {
                // Workdays: Mon - Sat (Sunday off)
                if (!$curr->isSunday()) {
                    // Periodic overtime (9-10 hrs) for select days
                    $isOvertime = ($empIndex + $curr->day) % 7 === 0;
                    $workingTime = $isOvertime ? 10.00 : 8.00;
                    $timeOut = $isOvertime ? '19:00:00' : '17:00:00';

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

        foreach (array_chunk($attendanceBatch, 1000) as $chunk) {
            DB::table('attendances')->insert($chunk);
        }

        // 5. Seed Cash Advancements with Payment Plans across the timeline
        $cashAdvancementSetup = [
            // Jan 2026: EMP-001 advances 5000 over 5 months (10 cutoffs @ 500.00)
            [
                'employee_id' => $employees[0]->id,
                'amount' => 5000.00,
                'advancement_date' => '2026-01-05',
                'repayment_term_type' => 'months',
                'repayment_terms' => 5,
                'installment_amount' => 500.00, // 5000 / (5 * 2) = 500
                'notes' => '5-Month Loan for Medical Emergency (₱500/cutoff)',
            ],
            // Mar 2026: EMP-002 advances 3000 over 3 months (6 cutoffs @ 500.00)
            [
                'employee_id' => $employees[1]->id,
                'amount' => 3000.00,
                'advancement_date' => '2026-03-10',
                'repayment_term_type' => 'months',
                'repayment_terms' => 3,
                'installment_amount' => 500.00,
                'notes' => '3-Month Tuition Loan (₱500/cutoff)',
            ],
            // Apr 2026: EMP-003 advances 2400 over 6 cutoffs (@ 400.00)
            [
                'employee_id' => $employees[2]->id,
                'amount' => 2400.00,
                'advancement_date' => '2026-04-12',
                'repayment_term_type' => 'payrolls',
                'repayment_terms' => 6,
                'installment_amount' => 400.00,
                'notes' => '6-Cutoff Advance (₱400/cutoff)',
            ],
            // Jun 2026: EMP-004 advances 4000 fixed 800/cutoff
            [
                'employee_id' => $employees[3]->id,
                'amount' => 4000.00,
                'advancement_date' => '2026-06-05',
                'repayment_term_type' => 'fixed_amount',
                'repayment_terms' => null,
                'installment_amount' => 800.00,
                'notes' => 'Fixed Repayment Plan (₱800/cutoff)',
            ],
            // Jul 2026: EMP-005 advances 1500 full next payroll
            [
                'employee_id' => $employees[4]->id,
                'amount' => 1500.00,
                'advancement_date' => '2026-07-08',
                'repayment_term_type' => 'full',
                'repayment_terms' => null,
                'installment_amount' => 1500.00,
                'notes' => 'Single Cutoff Cash Advance',
            ],
            // Aug 2026: EMP-006 advances 6000 over 6 months (12 cutoffs @ 500.00)
            [
                'employee_id' => $employees[5]->id,
                'amount' => 6000.00,
                'advancement_date' => '2026-08-03',
                'repayment_term_type' => 'months',
                'repayment_terms' => 6,
                'installment_amount' => 500.00,
                'notes' => '6-Month Home Appliance Loan (₱500/cutoff)',
            ],
        ];

        foreach ($cashAdvancementSetup as $advData) {
            Advancement::create([
                'employee_id'         => $advData['employee_id'],
                'amount'              => $advData['amount'],
                'remaining_balance'   => $advData['amount'],
                'advancement_date'    => $advData['advancement_date'],
                'status'              => 'pending_payout',
                'repayment_term_type' => $advData['repayment_term_type'],
                'repayment_terms'     => $advData['repayment_terms'],
                'installment_amount'  => $advData['installment_amount'],
                'notes'               => $advData['notes'],
            ]);
        }

        $this->command->info('Seeding completed successfully! Employees, Holidays, Attendances (Jan-Aug 2026), and Cash Advancements seeded.');
    }
}
