import React from 'react';
import { Link } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    Upload,
    CalendarDays,
    BookOpen,
    Clipboard,
    LandPlot,
    User,
    History,
    ChevronDown,
    Banknote,
} from 'lucide-react';
import { useCan } from '@/hooks/use-can';

export const ImportDataDropdown: React.FC = () => {
    const { can, canAny } = useCan();

    const hasAnyImportPermission = canAny([
        'weekly.create',
        'productions.import',
        'attendance.import',
        'bank_reconciliation.create',
        'planters.import',
        'import_history.view',
    ]);

    if (!hasAnyImportPermission) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl border-slate-200 bg-white font-semibold text-slate-800 shadow-xs hover:bg-slate-50 hover:text-slate-900"
                >
                    <Upload className="size-4 text-emerald-600" />
                    <span>Import Data</span>
                    <ChevronDown className="size-3.5 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-lg border-slate-200">
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Module Ingestion
                </DropdownMenuLabel>

                {canAny(['weekly.create', 'weekly.view']) && (
                    <DropdownMenuItem asChild>
                        <Link
                            href="/Weekly"
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                            <CalendarDays className="size-4 text-teal-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900 leading-none">
                                    Weekly Statement PDF
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Batch planter weekly summaries
                                </p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                )}

                {canAny(['productions.import', 'productions.view']) && (
                    <DropdownMenuItem asChild>
                        <Link
                            href="/Productions"
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                            <BookOpen className="size-4 text-amber-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900 leading-none">
                                    Caneweigh Tickets
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Production delivery records
                                </p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                )}

                {canAny(['attendance.import', 'attendance.view']) && (
                    <DropdownMenuItem asChild>
                        <Link
                            href="/Attendance"
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                            <Clipboard className="size-4 text-orange-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900 leading-none">
                                    Attendance Timesheet
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Daily employee time logs
                                </p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                )}

                {canAny(['bank_reconciliation.create', 'bank_reconciliation.view']) && (
                    <DropdownMenuItem asChild>
                        <Link
                            href="/BankReconciliation"
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                            <Banknote className="size-4 text-blue-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900 leading-none">
                                    Bank Statement / Checks
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Disbursements & bank ledger
                                </p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                )}

                {canAny(['planters.import', 'planters.view']) && (
                    <DropdownMenuItem asChild>
                        <Link
                            href="/Planters"
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                            <User className="size-4 text-emerald-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900 leading-none">
                                    Planters Directory
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Master roster & hacienda links
                                </p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-1 bg-slate-100" />

                <DropdownMenuItem asChild>
                    <Link
                        href="/Imports/history"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                    >
                        <History className="size-4 text-slate-500 shrink-0" />
                        <div>
                            <p className="font-semibold text-slate-700 leading-none">
                                View Ingestion History
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Logs, status & error audits
                            </p>
                        </div>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
