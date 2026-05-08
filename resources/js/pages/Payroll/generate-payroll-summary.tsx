import React from 'react';
import { formatMoney } from './generate-payroll.utils';
import type {
    PayrollPreviewResponse,
    PayrollDraftData,
} from './generate-payroll.types';

export type PayrollSummaryValues = {
    basicPay: number;
    holidayPay: number;
    grossPay: number;
    netPay: number;
};

type GeneratePayrollSummaryProps = {
    preview: PayrollPreviewResponse;
    summary: PayrollSummaryValues | null;
    data: PayrollDraftData;
};

const GeneratePayrollSummary = ({
    preview,
    summary,
}: GeneratePayrollSummaryProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="text-sm font-semibold text-slate-700">
                Payroll Summary
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded border border-slate-200 bg-white p-3 text-sm">
                    <div className="text-xs text-slate-500">Period</div>
                    <div className="font-medium">
                        {preview.period_start ?? 'N/A'} -{' '}
                        {preview.period_end ?? 'N/A'}
                    </div>
                </div>
                <div className="rounded border border-slate-200 bg-white p-3 text-sm">
                    <div className="text-xs text-slate-500">Total Hours</div>
                    <div className="font-medium">
                        {preview.attendance.total_hours}
                    </div>
                </div>
                <div className="rounded border border-slate-200 bg-white p-3 text-sm">
                    <div className="text-xs text-slate-500">Basic Pay</div>
                    <div className="font-medium">
                        ₱{summary ? formatMoney(summary.basicPay) : '0.00'}
                    </div>
                </div>
                <div className="rounded border border-slate-200 bg-white p-3 text-sm">
                    <div className="text-xs text-slate-500">Holiday Pay</div>
                    <div className="font-medium">
                        ₱{summary ? formatMoney(summary.holidayPay) : '0.00'}
                    </div>
                </div>
                <div className="rounded border border-slate-200 bg-white p-3 text-sm">
                    <div className="text-xs text-slate-500">Gross Pay</div>
                    <div className="font-medium">
                        ₱{summary ? formatMoney(summary.grossPay) : '0.00'}
                    </div>
                </div>
                <div className="rounded border border-slate-200 bg-white p-3 text-sm">
                    <div className="text-xs text-slate-500">Net Pay</div>
                    <div className="font-medium">
                        ₱{summary ? formatMoney(summary.netPay) : '0.00'}
                    </div>
                </div>
            </div>

            <div className="text-sm font-semibold text-slate-700">
                Attendance Details
            </div>

            <div className="max-h-56 overflow-auto rounded border border-slate-200 bg-white">
                <div className="grid grid-cols-4 gap-2 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                    <div>Date</div>
                    <div>Time In</div>
                    <div>Time Out</div>
                    <div className="text-right">Hours</div>
                </div>
                {preview.attendance.rows.map((row) => (
                    <div
                        key={`${row.date}-${row.time_in}-${row.time_out}`}
                        className="grid grid-cols-4 gap-2 px-3 py-2 text-xs text-slate-600"
                    >
                        <div>{row.date}</div>
                        <div>{row.time_in ?? '-'}</div>
                        <div>{row.time_out ?? '-'}</div>
                        <div className="text-right">
                            {row.working_time.toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GeneratePayrollSummary;
