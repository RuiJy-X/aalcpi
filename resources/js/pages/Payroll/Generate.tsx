import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Calendar,
    Upload,
    CheckCircle2,
    AlertTriangle,
    ArrowLeft,
    Play,
    Edit3,
    UploadCloud,
    Wallet,
    FileSpreadsheet,
    RefreshCw,
    X,
    Printer,
    HandCoins,
    History,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import {
    index as payrollIndex,
    create as payrollCreate,
} from '@/routes/payroll';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { ConfirmProcessModal } from '@/components/ConfirmProcessModal';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AuditedEmployee {
    employee_id: number;
    employee_code: string;
    name: string;
    position: string;
    daily_rate: number;
    base_salary: number;
    hourly_rate: number;
    days_worked: number;
    hours_worked: number;
    basic_pay?: number;
    gross_earnings: number;
    overtime_hours?: number;
    overtime_pay?: number;
    holidays?: number;
    holiday_pay?: number;
    cash_advance_payout?: number;
    cash_advance_deduction?: number;
    total_earnings: number;
    sss_contribution: number;
    pagibig_contribution: number;
    philhealth_contribution: number;
    emergency_loan: number;
    withholding_tax: number;
    total_deductions: number;
    net_amount: number;
    reasons: string[];
}

interface BatchData {
    period_start: string;
    period_end: string;
    ready: AuditedEmployee[];
    action_required: AuditedEmployee[];
    totals: {
        total_gross: number;
        total_deductions: number;
        total_net: number;
        ready_count: number;
        action_required_count: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll Management', href: payrollIndex().url },
    { title: 'Batch Generation Hub', href: payrollCreate().url },
];

function formatCurrency(val?: number | null, isDeduction: boolean = false) {
    const num = val ?? 0;
    const formatted = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(num);
    return isDeduction && num > 0 ? `-${formatted}` : formatted;
}

export default function GenerateBatchPage({
    initialBatchData,
}: {
    initialBatchData: BatchData;
}) {
    const [batchData, setBatchData] = useState<BatchData>(initialBatchData);
    const [periodStart, setPeriodStart] = useState<string>(
        initialBatchData.period_start,
    );
    const [periodEnd, setPeriodEnd] = useState<string>(
        initialBatchData.period_end,
    );

    const [isLoadingAudit, setIsLoadingAudit] = useState(false);
    const [isUploadingAttendance, setIsUploadingAttendance] = useState(false);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    const [processingEmployeeId, setProcessingEmployeeId] = useState<
        number | null
    >(null);
    const [successNotification, setSuccessNotification] = useState<
        string | null
    >(null);
    const [errorNotification, setErrorNotification] = useState<string | null>(
        null,
    );

    // Confirm Process Modals state
    const [confirmSingleEmp, setConfirmSingleEmp] =
        useState<AuditedEmployee | null>(null);
    const [isBatchProcessModalOpen, setIsBatchProcessModalOpen] =
        useState(false);

    // Derived counts with bulletproof fallbacks
    const readyCount =
        batchData.ready?.length ??
        (batchData.totals as any)?.ready_count ??
        (batchData.totals as any)?.total_ready ??
        0;
    const actionRequiredCount =
        batchData.action_required?.length ??
        (batchData.totals as any)?.action_required_count ??
        (batchData.totals as any)?.total_action_required ??
        0;

    // Process Single Employee Payroll as Draft
    const executeProcessSingle = async (emp: AuditedEmployee) => {
        setProcessingEmployeeId(emp.employee_id);
        setSuccessNotification(null);
        setErrorNotification(null);
        try {
            const res = await axios.post('/Payroll/process-batch', {
                period_start: periodStart,
                period_end: periodEnd,
                employee_ids: [emp.employee_id],
            });

            if (res.data.success) {
                if (res.data.batchData) {
                    setBatchData(res.data.batchData);
                }
                setSuccessNotification(
                    res.data.message ||
                        `Draft payroll processed for ${emp.name}!`,
                );
            }
        } catch (err: any) {
            setErrorNotification(
                err.response?.data?.message ||
                    'Error processing draft payroll.',
            );
        } finally {
            setProcessingEmployeeId(null);
        }
    };

    const handleProcessSingle = (emp: AuditedEmployee) => {
        setConfirmSingleEmp(emp);
    };

    function SortHeader({
        label,
        column,
    }: {
        label: string;
        column: {
            toggleSorting: (desc?: boolean) => void;
            getIsSorted: () => false | 'asc' | 'desc';
        };
    }) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 text-xs font-semibold whitespace-nowrap data-[state=open]:bg-accent"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                <span className="whitespace-nowrap">{label}</span>
                <ArrowUpDown className="ml-1.5 h-3 w-3 shrink-0" />
            </Button>
        );
    }

    const readyColumns = useMemo<ColumnDef<AuditedEmployee>[]>(
        () => [
            {
                id: 'process_action',
                header: () => (
                    <span className="text-xs font-semibold whitespace-nowrap">
                        Action
                    </span>
                ),
                cell: ({ row }) => {
                    const isDraft = (row.original as any).is_draft;
                    const isProcessing =
                        processingEmployeeId === row.original.employee_id;

                    if (isDraft) {
                        return (
                            <div className="flex items-center gap-1.5">
                                <Badge
                                    variant="outline"
                                    className="border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                                >
                                    <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    Draft Ready
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                    disabled={isProcessing || isProcessingBatch}
                                    onClick={() =>
                                        handleProcessSingle(row.original)
                                    }
                                    title="Re-process draft for this employee"
                                >
                                    {isProcessing ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3 w-3" />
                                    )}
                                </Button>
                            </div>
                        );
                    }

                    return (
                        <Button
                            variant="default"
                            size="xs"
                            className="h-7 bg-primary px-2.5 text-xs font-bold whitespace-nowrap text-primary-foreground shadow-xs hover:bg-primary/90"
                            disabled={isProcessing || isProcessingBatch}
                            onClick={() => handleProcessSingle(row.original)}
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-1.5 h-3 w-3 fill-current" />
                                    Process Payroll
                                </>
                            )}
                        </Button>
                    );
                },
            },
            {
                accessorKey: 'employee_code',
                header: ({ column }) => (
                    <SortHeader label="Code" column={column} />
                ),
                cell: ({ row }) => (
                    <div className="font-mono text-xs font-bold text-primary">
                        {row.original.employee_code}
                    </div>
                ),
            },
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <SortHeader label="Employee Name" column={column} />
                ),
                cell: ({ row }) => (
                    <div className="text-xs font-bold text-foreground">
                        {row.original.name}
                    </div>
                ),
            },
            {
                accessorKey: 'position',
                header: ({ column }) => (
                    <SortHeader label="Designation" column={column} />
                ),
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground">
                        {row.original.position}
                    </div>
                ),
            },
            {
                accessorKey: 'daily_rate',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Daily Rate" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(row.original.daily_rate)}
                    </div>
                ),
            },
            {
                accessorKey: 'days_worked',
                header: ({ column }) => (
                    <div className="text-center">
                        <SortHeader label="Days Worked" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                            {row.original.days_worked} days
                        </Badge>
                    </div>
                ),
            },
            {
                accessorKey: 'gross_earnings',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Basic Pay" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right text-xs font-bold text-foreground">
                        {formatCurrency(row.original.gross_earnings)}
                    </div>
                ),
            },
            {
                accessorKey: 'overtime_pay',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Overtime Pay (+)" column={column} />
                    </div>
                ),
                cell: ({ row }) => {
                    const otPay = row.original.overtime_pay ?? 0;
                    const otHrs = row.original.overtime_hours ?? 0;
                    if (!otPay || otPay <= 0)
                        return (
                            <div className="text-right font-mono text-xs text-muted-foreground/40">
                                —
                            </div>
                        );
                    return (
                        <div className="text-right text-xs">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(otPay)}
                            </span>
                            {otHrs > 0 && (
                                <span className="block font-mono text-[10px] text-muted-foreground">
                                    ({otHrs} hrs)
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'holiday_pay',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Holiday Pay (+)" column={column} />
                    </div>
                ),
                cell: ({ row }) => {
                    const holPay = (row.original as any).holiday_pay ?? 0;
                    const holCount = (row.original as any).holidays ?? 0;
                    if (!holPay || holPay <= 0)
                        return (
                            <div className="text-right font-mono text-xs text-muted-foreground/40">
                                —
                            </div>
                        );
                    return (
                        <div className="text-right text-xs">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(holPay)}
                            </span>
                            {holCount > 0 && (
                                <span className="block font-mono text-[10px] text-muted-foreground">
                                    ({holCount} days)
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'cash_advance_payout',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Adv Payout (+)" column={column} />
                    </div>
                ),
                cell: ({ row }) => {
                    const val = (row.original as any).cash_advance_payout ?? 0;
                    if (!val || val <= 0)
                        return (
                            <div className="text-right font-mono text-xs text-muted-foreground/40">
                                —
                            </div>
                        );
                    return (
                        <div className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(val)}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'cash_advance_deduction',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Adv Deduct (-)" column={column} />
                    </div>
                ),
                cell: ({ row }) => {
                    const val =
                        (row.original as any).cash_advance_deduction ?? 0;
                    if (!val || val <= 0)
                        return (
                            <div className="text-right font-mono text-xs text-muted-foreground/40">
                                —
                            </div>
                        );
                    return (
                        <div className="text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(val, true)}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'sss_contribution',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="SSS Deduction" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(
                            row.original.sss_contribution ??
                                row.original.sss_loan,
                            true,
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'pagibig_contribution',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Pag-IBIG Contrib" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(
                            row.original.pagibig_contribution,
                            true,
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'emergency_loan',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Emergency Loan" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(row.original.emergency_loan, true)}
                    </div>
                ),
            },
            {
                accessorKey: 'withholding_tax',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Tax W/Held" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(row.original.withholding_tax, true)}
                    </div>
                ),
            },
            {
                accessorKey: 'total_deductions',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Total Deductions" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {formatCurrency(row.original.total_deductions, true)}
                    </div>
                ),
            },
            {
                accessorKey: 'net_amount',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Net Pay" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(row.original.net_amount)}
                    </div>
                ),
            },
        ],
        [processingEmployeeId, isProcessingBatch],
    );

    const actionRequiredColumns = useMemo<ColumnDef<AuditedEmployee>[]>(
        () => [
            {
                id: 'process_action',
                header: () => (
                    <span className="text-xs font-semibold whitespace-nowrap">
                        Action
                    </span>
                ),
                cell: ({ row }) => (
                    <Button
                        variant="outline"
                        size="xs"
                        className="h-7 cursor-not-allowed px-2.5 text-xs font-semibold whitespace-nowrap opacity-60"
                        disabled
                        title="Resolve audit disqualification issues first before processing"
                    >
                        <Play className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        Process Payroll
                    </Button>
                ),
            },
            {
                accessorKey: 'employee_code',
                header: ({ column }) => (
                    <SortHeader label="Code" column={column} />
                ),
                cell: ({ row }) => (
                    <div className="font-mono text-xs font-bold text-primary">
                        {row.original.employee_code}
                    </div>
                ),
            },
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <SortHeader label="Employee Name" column={column} />
                ),
                cell: ({ row }) => (
                    <div className="text-xs font-bold text-foreground">
                        {row.original.name}
                    </div>
                ),
            },
            {
                accessorKey: 'position',
                header: ({ column }) => (
                    <SortHeader label="Designation" column={column} />
                ),
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground">
                        {row.original.position}
                    </div>
                ),
            },
            {
                accessorKey: 'reasons',
                header: 'Audit Disqualification Reasons',
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1.5">
                        {row.original.reasons.map((reason, idx) => (
                            <Badge
                                key={idx}
                                variant="destructive"
                                className="text-xs font-normal"
                            >
                                ⚠️ {reason}
                            </Badge>
                        ))}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: () => (
                    <div className="text-right text-xs">Quick Resolution</div>
                ),
                cell: ({ row }) => (
                    <div className="flex shrink-0 items-center justify-end gap-2">
                        <label className="cursor-pointer">
                            <span className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs hover:bg-muted">
                                <Upload className="mr-1 h-3 w-3 text-primary" />
                                Attendance
                            </span>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleBatchAttendanceUpload}
                                disabled={isUploadingAttendance}
                            />
                        </label>
                        <Button
                            variant="secondary"
                            size="xs"
                            className="h-8"
                            onClick={() => openQuickFix(row.original)}
                        >
                            <Edit3 className="mr-1 h-3 w-3" />
                            Quick Fix
                        </Button>
                    </div>
                ),
            },
        ],
        [isUploadingAttendance],
    );

    // Quick profile fix drawer/modal state
    const [activeEditEmployee, setActiveEditEmployee] =
        useState<AuditedEmployee | null>(null);
    const [editForm, setEditForm] = useState({
        daily_rate: '',
        sss_contribution: '',
        pagibig_contribution: '',
        philhealth_contribution: '',
        emergency_loan: '',
        withholding_tax: '',
        holidays: '',
    });
    const [isSavingQuickSetup, setIsSavingQuickSetup] = useState(false);

    // Date range preset handlers
    const applyPreset = (type: 'first_cutoff' | 'second_cutoff') => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        let startDate: Date;
        let endDate: Date;

        if (type === 'first_cutoff') {
            // 1st Cutoff: 10th to 25th of current month (e.g. Jan 10 - Jan 25)
            startDate = new Date(year, month, 10);
            endDate = new Date(year, month, 25);
        } else {
            // 2nd Cutoff: 25th of current month to 10th of next month (e.g. Jan 25 - Feb 10)
            startDate = new Date(year, month, 25);
            endDate = new Date(year, month + 1, 10);
        }

        const formatDateStr = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const start = formatDateStr(startDate);
        const end = formatDateStr(endDate);

        setPeriodStart(start);
        setPeriodEnd(end);
        fetchAuditPreview(start, end);
    };

    // Fetch pre-payroll audit preview
    const fetchAuditPreview = async (startStr: string, endStr: string) => {
        setIsLoadingAudit(true);
        try {
            const res = await axios.post('/Payroll/preview-batch', {
                period_start: startStr,
                period_end: endStr,
            });
            setBatchData(res.data);
        } catch (err) {
            console.error('Audit preview error:', err);
        } finally {
            setIsLoadingAudit(false);
        }
    };

    // Handle batch attendance upload
    const handleBatchAttendanceUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('attendance_file', file);
        formData.append('period_start', periodStart);
        formData.append('period_end', periodEnd);

        setIsUploadingAttendance(true);
        try {
            const res = await axios.post(
                '/Payroll/upload-attendance-batch',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                },
            );
            if (res.data.success) {
                setBatchData(res.data.batchData);
                alert('Attendance Excel file imported successfully!');
            }
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                    'Failed to import attendance file.',
            );
        } finally {
            setIsUploadingAttendance(false);
            e.target.value = '';
        }
    };

    // Open Quick Fix Setup Modal
    const openQuickFix = (emp: AuditedEmployee) => {
        setActiveEditEmployee(emp);
        setEditForm({
            daily_rate: String(emp.daily_rate || '550.00'),
            sss_contribution: String(emp.sss_contribution || '0.00'),
            pagibig_contribution: String(emp.pagibig_contribution || '0.00'),
            philhealth_contribution: String(emp.philhealth_contribution || '0.00'),
            emergency_loan: String(emp.emergency_loan || '0.00'),
            withholding_tax: String(emp.withholding_tax || '0.00'),
            holidays: String(emp.holidays || '0'),
        });
    };

    // Save Quick Fix Setup
    const handleSaveQuickFix = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeEditEmployee) return;

        setIsSavingQuickSetup(true);
        try {
            const res = await axios.post(
                `/Payroll/quick-update-employee/${activeEditEmployee.employee_id}`,
                {
                    ...editForm,
                    period_start: periodStart,
                    period_end: periodEnd,
                },
            );

            if (res.data.success) {
                setBatchData(res.data.batchData);
                setActiveEditEmployee(null);
            }
        } catch (err: any) {
            alert(
                err.response?.data?.message || 'Error updating profile setup.',
            );
        } finally {
            setIsSavingQuickSetup(false);
        }
    };

    // Process Payroll Batch
    const executeProcessBatch = async () => {
        setIsProcessingBatch(true);
        setSuccessNotification(null);
        setErrorNotification(null);
        try {
            const res = await axios.post('/Payroll/process-batch', {
                period_start: periodStart,
                period_end: periodEnd,
            });

            if (res.data.success) {
                if (res.data.batchData) {
                    setBatchData(res.data.batchData);
                }
                setSuccessNotification(
                    res.data.message ||
                        'Successfully processed payroll batch as draft!',
                );
            }
        } catch (err: any) {
            setErrorNotification(
                err.response?.data?.message ||
                    'Error processing payroll batch.',
            );
        } finally {
            setIsProcessingBatch(false);
        }
    };

    const handleProcessBatch = () => {
        if (batchData.ready.length === 0) {
            setErrorNotification(
                'No ready employees available to process for this date range.',
            );
            return;
        }
        setIsBatchProcessModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Batch Generation & Pre-Audit Hub" />

            <Container>
                <ContainerHeader>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Payroll Batch Generation & Pre-Audit Hub
                        </h1>
                        <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                            Set pay period dates, review pre-payroll audit
                            results, and resolve missing attendance or profile
                            setups directly on this page.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="mt-2 flex w-full flex-wrap items-center gap-2 sm:mt-0 sm:w-auto sm:gap-3">
                            <Button variant="outline" asChild>
                                <Link href={payrollIndex().url}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Payroll List
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() =>
                                    window.open(
                                        `/Payroll/summary-pdf?period_start=${periodStart}&period_end=${periodEnd}`,
                                        '_blank',
                                    )
                                }
                                className="text-xs font-semibold sm:text-sm"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                Export Summary PDF
                            </Button>

                            <Button
                                onClick={handleProcessBatch}
                                disabled={
                                    isProcessingBatch ||
                                    batchData.ready.length === 0
                                }
                                className="px-6 font-bold"
                            >
                                <Play className="mr-2 h-4 w-4 fill-current" />
                                {isProcessingBatch
                                    ? 'Processing Batch...'
                                    : `Process Batch (${batchData.ready.length})`}
                            </Button>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                {successNotification && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>{successNotification}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="xs"
                            className="h-6 w-6 p-0 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                            onClick={() => setSuccessNotification(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {errorNotification && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span>{errorNotification}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="xs"
                            className="h-6 w-6 p-0 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
                            onClick={() => setErrorNotification(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <ConfirmProcessModal
                    isOpen={!!confirmSingleEmp}
                    onClose={() => setConfirmSingleEmp(null)}
                    onConfirm={() => {
                        if (confirmSingleEmp) {
                            const emp = confirmSingleEmp;
                            setConfirmSingleEmp(null);
                            executeProcessSingle(emp);
                        }
                    }}
                    title={
                        confirmSingleEmp && (confirmSingleEmp as any).is_draft
                            ? 'Re-process Draft Payroll'
                            : 'Process Draft Payroll'
                    }
                    description={
                        confirmSingleEmp
                            ? (confirmSingleEmp as any).is_draft
                                ? `Are you sure you want to re-process draft payroll for ${confirmSingleEmp.name} (${confirmSingleEmp.employee_code})?`
                                : `Are you sure you want to process draft payroll for ${confirmSingleEmp.name} (${confirmSingleEmp.employee_code})?`
                            : ''
                    }
                />

                <ConfirmProcessModal
                    isOpen={isBatchProcessModalOpen}
                    onClose={() => setIsBatchProcessModalOpen(false)}
                    onConfirm={() => {
                        setIsBatchProcessModalOpen(false);
                        executeProcessBatch();
                    }}
                    title="Process Batch Payroll"
                    description={`Are you sure you want to process and generate draft payroll records for ${batchData.ready.length} ready employees?`}
                    isProcessing={isProcessingBatch}
                />

                <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="space-y-1 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                        <p className="text-xs font-bold text-emerald-700 uppercase dark:text-emerald-400">
                            Ready for Payroll
                        </p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                            {readyCount}{' '}
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                        <p className="text-xs font-bold text-rose-700 uppercase dark:text-rose-400">
                            Action Required / Ineligible
                        </p>
                        <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
                            {actionRequiredCount}{' '}
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Est. Batch Gross Income
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(batchData.totals.total_gross)}
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-primary/30 bg-primary/5 p-4">
                        <p className="text-xs font-bold text-primary uppercase">
                            Est. Total Net Payout
                        </p>
                        <p className="text-2xl font-extrabold text-primary">
                            {formatCurrency(batchData.totals.total_net)}
                        </p>
                    </div>
                </div>
                {/* Date Range Selection Bar & Presets */}
                <div className="my-4 space-y-4 rounded-xl border border-border bg-card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-base font-bold text-foreground">
                                Pay Period Date Range Selection
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-xs font-semibold text-muted-foreground">
                                Quick Cutoffs:
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset('first_cutoff')}
                            >
                                1st Cutoff (10th - 25th)
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset('second_cutoff')}
                            >
                                2nd Cutoff (25th - 10th)
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 items-end gap-4 pt-2 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="period_start"
                                className="text-xs font-semibold text-muted-foreground uppercase"
                            >
                                Period Start Date *
                            </Label>
                            <Input
                                id="period_start"
                                type="date"
                                value={periodStart}
                                onChange={(e) => {
                                    setPeriodStart(e.target.value);
                                    if (
                                        periodEnd &&
                                        e.target.value <= periodEnd
                                    ) {
                                        fetchAuditPreview(
                                            e.target.value,
                                            periodEnd,
                                        );
                                    }
                                }}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="period_end"
                                className="text-xs font-semibold text-muted-foreground uppercase"
                            >
                                Period End Date *
                            </Label>
                            <Input
                                id="period_end"
                                type="date"
                                value={periodEnd}
                                onChange={(e) => {
                                    setPeriodEnd(e.target.value);
                                    if (
                                        periodStart &&
                                        e.target.value >= periodStart
                                    ) {
                                        fetchAuditPreview(
                                            periodStart,
                                            e.target.value,
                                        );
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() =>
                                    fetchAuditPreview(periodStart, periodEnd)
                                }
                                disabled={isLoadingAudit}
                            >
                                {isLoadingAudit ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Refresh Pre-Audit
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Pre-Payroll Audit Stat Summary Banner */}

                {/* Pre-Audit Employee Categorization Tabs */}
                <Tabs defaultValue="ready" className="w-full space-y-4">
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/60 p-1 sm:w-auto">
                            <TabsTrigger
                                value="ready"
                                className="gap-2 text-xs font-bold sm:text-sm"
                            >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Ready for Processing
                                <Badge
                                    variant="secondary"
                                    className="py-0.2 ml-1 px-1.5 font-mono text-[11px]"
                                >
                                    {readyCount}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="action_required"
                                className="gap-2 text-xs font-bold sm:text-sm"
                            >
                                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                Action Required
                                <Badge
                                    variant="destructive"
                                    className="py-0.2 ml-1 px-1.5 font-mono text-[11px]"
                                >
                                    {actionRequiredCount}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* TAB 1: READY LIST */}
                    <TabsContent
                        value="ready"
                        className="mt-0 space-y-3 focus-visible:outline-none"
                    >
                        <div className="flex flex-col justify-between gap-2 px-1 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
                                    <span>Audited & Verified Employees</span>
                                    <Badge
                                        variant="outline"
                                        className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300"
                                    >
                                        {batchData.ready.length} Ready
                                    </Badge>
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    All attendance & rate setups verified for
                                    period {periodStart} to {periodEnd}
                                </p>
                            </div>
                        </div>

                        <DataTable
                            data={batchData.ready}
                            columns={readyColumns}
                        />
                    </TabsContent>

                    {/* TAB 2: ACTION REQUIRED LIST */}
                    <TabsContent
                        value="action_required"
                        className="mt-0 space-y-3 focus-visible:outline-none"
                    >
                        <div className="flex flex-col justify-between gap-2 px-1 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-rose-700 dark:text-rose-400">
                                    <span>
                                        Ineligible Employees - In-Page
                                        Resolution Hub
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300"
                                    >
                                        {batchData.action_required.length}{' '}
                                        Disqualified
                                    </Badge>
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Resolve missing attendance or profile setups
                                    directly using Quick Fix below.
                                </p>
                            </div>
                        </div>

                        <DataTable
                            data={batchData.action_required}
                            columns={actionRequiredColumns}
                        />
                    </TabsContent>
                </Tabs>
            </Container>

            {/* Quick Fix Profile Setup Modal / Drawer */}
            <Dialog
                open={!!activeEditEmployee}
                onOpenChange={(open) => !open && setActiveEditEmployee(null)}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Quick Setup Fix: {activeEditEmployee?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSaveQuickFix}
                        className="space-y-4 pt-2"
                    >
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="quick_daily_rate"
                                className="font-bold text-primary"
                            >
                                Daily Rate (₱) *
                            </Label>
                            <Input
                                id="quick_daily_rate"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="550.00"
                                value={editForm.daily_rate}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        daily_rate: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_sss_contrib"
                                    className="text-xs font-semibold"
                                >
                                    SSS Contrib (₱)
                                </Label>
                                <Input
                                    id="quick_sss_contrib"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.sss_contribution}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            sss_contribution: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_pagibig_contrib"
                                    className="text-xs font-semibold"
                                >
                                    Pag-IBIG Contrib (₱)
                                </Label>
                                <Input
                                    id="quick_pagibig_contrib"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.pagibig_contribution}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            pagibig_contribution: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_philhealth_contrib"
                                    className="text-xs font-semibold"
                                >
                                    PhilHealth Contrib (₱)
                                </Label>
                                <Input
                                    id="quick_philhealth_contrib"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.philhealth_contribution}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            philhealth_contribution: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_emergency_loan"
                                    className="text-xs font-semibold"
                                >
                                    Emergency Loan (₱)
                                </Label>
                                <Input
                                    id="quick_emergency_loan"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.emergency_loan}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            emergency_loan: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_tax"
                                    className="text-xs font-semibold"
                                >
                                    Tax W/Held (₱)
                                </Label>
                                <Input
                                    id="quick_tax"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.withholding_tax}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            withholding_tax: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_holidays"
                                    className="text-xs font-semibold text-amber-700 dark:text-amber-400"
                                >
                                    Holidays (Days)
                                </Label>
                                <Input
                                    id="quick_holidays"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editForm.holidays}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            holidays: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveEditEmployee(null)}
                                disabled={isSavingQuickSetup}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSavingQuickSetup}>
                                {isSavingQuickSetup
                                    ? 'Saving...'
                                    : 'Save & Re-Audit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
