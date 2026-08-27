import React, { useState, type ChangeEvent, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Import, FileSpreadsheet, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { importMethod as importRoute } from '@/routes/bank-reconciliation-import';
import {
    bankReconInternalTargets,
    bankReconBankTargets,
    type ImportTarget,
} from '@/components/import/import-config';
import { ImportSummaryModal, type ImportSummaryData } from '@/components/import/import-summary-modal';
import {
    registerJobPoll,
    markJobModalShown,
    unregisterJobPoll,
} from '@/lib/import-poll-tracker';
import {
    ImportAuditPreviewStep,
    type PreImportAnalysisResult,
} from '@/components/import/import-audit-preview-step';

type MappingPreviewResponse = {
    headers: string[];
    signature: string;
    mapping?: Record<string, string>;
    mapping_id?: number;
};

const getCsrfToken = (): string => {
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    return token ?? '';
};

const formatErrorDetails = (data: unknown, fallbackMessage: string): string => {
    if (!data || typeof data !== 'object') {
        return fallbackMessage;
    }
    const detail = JSON.stringify(data);
    return detail ? `${fallbackMessage} ${detail}` : fallbackMessage;
};

const postFormData = async <T,>(
    url: string,
    formData: FormData,
): Promise<T> => {
    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        let data: unknown = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        const errorMessage = formatErrorDetails(
            data,
            `HTTP ${response.status}`,
        );
        throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
};

const postJson = async <T,>(
    url: string,
    payload: Record<string, unknown>,
): Promise<T> => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
        message?: string;
        errors?: Record<string, string | string[]>;
    };

    if (!response.ok) {
        let errorMsg = formatErrorDetails(data, `HTTP ${response.status}`);
        if (data.message) {
            errorMsg = `${data.message} ${JSON.stringify(data)}`.trim();
        }
        throw new Error(errorMsg);
    }

    return data as T;
};

export function BankReconImportDialog({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    initialType,
    initialWeek,
    initialBankMonth,
    initialDateIssued,
    trigger,
}: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialType?: 'internal' | 'bank';
    initialWeek?: number | string;
    initialBankMonth?: string;
    initialDateIssued?: string;
    trigger?: React.ReactNode;
} = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = controlledOnOpenChange || setInternalOpen;

    const [step, setStep] = useState<1 | 2 | 3 | 'mapping' | 'audit'>(1);
    const [isImporting, setIsImporting] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSavingMapping, setIsSavingMapping] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const currentDate = new Date();
    const currentYearStr = currentDate.getFullYear().toString();
    const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'internal' | 'bank'>(initialType || 'internal');
    const [dateIssued, setDateIssued] = useState<string>(initialDateIssued || '');
    const [disbursementWeek, setDisbursementWeek] = useState<string>(
        initialWeek !== undefined ? String(initialWeek) : '',
    );
    const [bankMonth, setBankMonth] = useState<string>(
        initialBankMonth || `${currentYearStr}-${currentMonthStr}`,
    );
    const [error, setError] = useState<string | null>(null);

    // Pre-import analysis and duplicate resolution state
    const [analysisResult, setAnalysisResult] = useState<PreImportAnalysisResult | null>(null);
    const [resolutions, setResolutions] = useState<Record<string, 'update' | 'keep_both' | 'replace'>>({});

    React.useEffect(() => {
        if (isOpen) {
            if (initialType) {
                setImportType(initialType);
            }
            if (initialWeek !== undefined) {
                setDisbursementWeek(String(initialWeek));
            }
            if (initialDateIssued) {
                setDateIssued(initialDateIssued);
            }
            if (initialBankMonth) {
                setBankMonth(initialBankMonth);
            }
            if (initialType || initialWeek !== undefined || initialBankMonth) {
                setStep(2);
            }
        }
    }, [isOpen, initialType, initialWeek, initialDateIssued, initialBankMonth]);

    const [headers, setHeaders] = useState<string[]>([]);
    const [signature, setSignature] = useState<string>('');
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [savedMappingId, setSavedMappingId] = useState<number | null>(null);

    const currentMappingTargets = useMemo<ImportTarget[]>(() => {
        return importType === 'internal'
            ? bankReconInternalTargets
            : bankReconBankTargets;
    }, [importType]);

    const mappingType = useMemo(() => {
        return importType === 'internal'
            ? 'bank_recon_internal'
            : 'bank_recon_bank';
    }, [importType]);

    const requiredMissing = useMemo(() => {
        return currentMappingTargets.filter(
            (target) => target.required && !mapping[target.key],
        );
    }, [currentMappingTargets, mapping]);

    const resetDialog = () => {
        setSelectedFile(null);
        setImportType(initialType || 'internal');
        setDateIssued(initialDateIssued || '');
        setDisbursementWeek(initialWeek !== undefined ? String(initialWeek) : '');
        setBankMonth(initialBankMonth || `${currentYearStr}-${currentMonthStr}`);
        setError(null);
        setStep(initialType || initialWeek !== undefined || initialBankMonth ? 2 : 1);
        setHeaders([]);
        setSignature('');
        setMapping({});
        setSavedMappingId(null);
        setAnalysisResult(null);
        setResolutions({});
        setIsAnalyzing(false);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
        setError(null);
        setAnalysisResult(null);
        setResolutions({});
    };

    const handleNextOrPreview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a file to import.');
            return;
        }

        if (importType === 'internal') {
            if (!dateIssued) {
                setError('Please select the date issued for this batch.');
                setStep(2);
                return;
            }
            if (!disbursementWeek) {
                setError('Please enter the week number for this batch.');
                setStep(2);
                return;
            }
        } else {
            if (!bankMonth) {
                setError('Please select the year and month for this batch.');
                setStep(2);
                return;
            }
        }

        setIsPreviewing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('import_type', mappingType);

            const preview = await postFormData<MappingPreviewResponse>(
                '/Imports/preview',
                formData,
            );

            const nextHeaders = (preview.headers ?? []).filter(
                (header) => header.trim() !== '',
            );
            const nextMapping = currentMappingTargets.reduce(
                (acc, target) => {
                    acc[target.key] = nextHeaders.includes(target.key)
                        ? target.key
                        : '';
                    return acc;
                },
                {} as Record<string, string>,
            );

            const existingMapping = preview.mapping ?? {};
            Object.keys(nextMapping).forEach((key) => {
                if (existingMapping[key]) {
                    nextMapping[key] = existingMapping[key];
                }
            });

            setHeaders(nextHeaders);
            setSignature(preview.signature ?? '');
            setMapping(nextMapping);
            setSavedMappingId(preview.mapping_id ?? null);
            setStep('mapping');
        } catch (err) {
            const error = err as Error;
            setError(
                `Failed to read the file headers: ${error.message || 'Unknown error'}`,
            );
        } finally {
            setIsPreviewing(false);
        }
    };

    const [summaryData, setSummaryData] = useState<ImportSummaryData | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const pollSummary = (jobId: number) => {
        if (!registerJobPoll(jobId)) {
            return;
        }

        let attempts = 0;
        const maxAttempts = 60;

        const interval = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch(`/Imports/status/${jobId}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data: ImportSummaryData = await res.json();
                    if (data.status === 'done' || data.status === 'failed') {
                        clearInterval(interval);
                        markJobModalShown(jobId);
                        setSummaryData(data);
                        setIsSummaryOpen(true);
                    }
                }
            } catch (err) {
                console.error(err);
                unregisterJobPoll(jobId);
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                unregisterJobPoll(jobId);
            }
        }, 1000);
    };

    // Analyze file and advance to Audit step
    const handleRunAnalysis = async (mappingId?: number) => {
        if (!selectedFile) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const computedBankDate = `${bankMonth}-01`;
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('type', importType);
            if (importType === 'internal') {
                formData.append('date_issued', dateIssued);
                formData.append('disbursement_week', disbursementWeek);
            } else {
                formData.append('bank_date', computedBankDate);
            }
            if (mappingId || savedMappingId) {
                formData.append('mapping_id', String(mappingId || savedMappingId));
            }

            // Append mapping fields
            Object.entries(mapping).forEach(([key, val]) => {
                if (val) {
                    formData.append(`mapping[${key}]`, val);
                }
            });

            const result = await postFormData<PreImportAnalysisResult>(
                '/bank-reconciliation-import/analyze',
                formData,
            );

            setAnalysisResult(result);

            // Default resolution: 'update' for each possible duplicate
            const initialResolutions: Record<string, 'update' | 'keep_both' | 'replace'> = {};
            result.possible_duplicates.forEach((item) => {
                initialResolutions[item.row_id] = item.default_action || 'update';
            });
            setResolutions(initialResolutions);

            setStep('audit');
        } catch (err) {
            const error = err as Error;
            setError(`Pre-import analysis failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Save Mapping & Analyze
    const handleSaveMappingAndAnalyze = async () => {
        if (!selectedFile) return;

        if (!signature) {
            setError('Missing header signature.');
            return;
        }

        setIsSavingMapping(true);
        setError(null);

        try {
            const response = await postJson<{ mapping_id: number }>(
                '/Imports/mappings',
                {
                    import_type: mappingType,
                    header_signature: signature,
                    headers,
                    mapping,
                },
            );

            setSavedMappingId(response.mapping_id);
            await handleRunAnalysis(response.mapping_id);
        } catch (err) {
            const error = err as Error;
            setError(
                `Failed to save the mapping: ${error.message || 'Unknown error'}`,
            );
        } finally {
            setIsSavingMapping(false);
        }
    };

    // Confirm and Execute Import
    const handleConfirmImport = () => {
        if (!analysisResult) return;

        setIsImporting(true);
        setError(null);

        const computedBankDate = `${bankMonth}-01`;

        router.post(
            importRoute.url(),
            {
                analysis_token: analysisResult.analysis_token,
                duplicate_resolutions: resolutions,
                type: importType,
                ...(importType === 'internal'
                    ? {
                          date_issued: dateIssued,
                          disbursement_week: disbursementWeek,
                      }
                    : {
                          bank_date: computedBankDate,
                      }),
                ...(savedMappingId ? { mapping_id: savedMappingId } : {}),
            },
            {
                preserveScroll: true,
                onStart: () => setIsImporting(true),
                onFinish: () => setIsImporting(false),
                onSuccess: (page) => {
                    const jobId =
                        (page.props as Record<string, unknown>).import_job_id ||
                        ((page.props as Record<string, unknown>).flash as Record<string, unknown>)?.import_job_id;
                    resetDialog();
                    setIsOpen(false);
                    if (jobId && typeof jobId === 'number') {
                        pollSummary(jobId);
                    }
                },
                onError: (errors) => {
                    setError(
                        errors.analysis_token ||
                            errors.file ||
                            errors.type ||
                            errors.date_issued ||
                            errors.disbursement_week ||
                            errors.bank_date ||
                            'Something went wrong executing the import.',
                    );
                },
            },
        );
    };

    const getDialogHeader = () => {
        switch (step) {
            case 1:
                return {
                    title: 'Import Reconciliation Ledger - Step 1 of 3',
                    description: 'Select whether you want to import internal ledgers or a bank statement.',
                };
            case 2:
                return {
                    title: 'Import Reconciliation Ledger - Step 2 of 3',
                    description:
                        importType === 'internal'
                            ? 'Specify the date issued and week number for the internal ledgers.'
                            : 'Specify the year and month for the bank statement.',
                };
            case 3:
                return {
                    title: 'Import Reconciliation Ledger - Step 3 of 3',
                    description: 'Choose the spreadsheet file (.xlsx, .xls, .csv) to import.',
                };
            case 'mapping':
                return {
                    title: 'Map Column Headers',
                    description: 'Match the columns in your spreadsheet file to system target fields.',
                };
            case 'audit':
                return {
                    title: 'Import Audit & Duplicate Verification',
                    description: 'Review duplicate classification and approve actions before database mutation.',
                };
        }
    };

    const headerInfo = getDialogHeader();

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) resetDialog();
                }}
            >
                {trigger !== null && (
                    <DialogTrigger asChild>
                        {trigger || (
                            <Button className="gap-2">
                                <Import className="h-4 w-4" />
                                Import Datasets
                            </Button>
                        )}
                    </DialogTrigger>
                )}

                <DialogContent
                    className={`bg-card max-h-[90vh] overflow-y-auto transition-all ${
                        step === 'audit' || step === 'mapping' ? 'sm:max-w-2xl' : 'sm:max-w-md'
                    }`}
                >
                    <DialogHeader>
                        <DialogTitle>{headerInfo.title}</DialogTitle>
                        <DialogDescription>{headerInfo.description}</DialogDescription>
                    </DialogHeader>

                    {/* Progress Tracker */}
                    {step !== 'audit' && (
                        <div className="mb-2 flex items-center justify-between border-b pb-3 text-xs pt-1">
                            <div
                                className={`flex items-center gap-1.5 font-medium ${
                                    step === 1 ? 'text-primary' : 'text-muted-foreground'
                                }`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                        step === 1
                                            ? 'bg-primary text-primary-foreground'
                                            : typeof step === 'number' && step > 1
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    1
                                </span>
                                <span>Source</span>
                            </div>
                            <div className="h-[1px] flex-1 bg-border mx-2" />
                            <div
                                className={`flex items-center gap-1.5 font-medium ${
                                    step === 2 ? 'text-primary' : 'text-muted-foreground'
                                }`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                        step === 2
                                            ? 'bg-primary text-primary-foreground'
                                            : typeof step === 'number' && step > 2
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    2
                                </span>
                                <span>Batch</span>
                            </div>
                            <div className="h-[1px] flex-1 bg-border mx-2" />
                            <div
                                className={`flex items-center gap-1.5 font-medium ${
                                    step === 3 || step === 'mapping' ? 'text-primary' : 'text-muted-foreground'
                                }`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                        step === 3 || step === 'mapping'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    3
                                </span>
                                <span>File & Map</span>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Type Selection */}
                    {step === 1 && (
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setImportType('internal')}
                                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                                        importType === 'internal'
                                            ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                            : 'border-border bg-card hover:bg-muted/50 text-foreground'
                                    }`}
                                >
                                    <div
                                        className={`rounded-lg p-2.5 ${
                                            importType === 'internal'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        <FileSpreadsheet className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">Internal Ledger</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            Weekly check disbursements issued by the cooperative.
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setImportType('bank')}
                                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                                        importType === 'bank'
                                            ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                            : 'border-border bg-card hover:bg-muted/50 text-foreground'
                                    }`}
                                >
                                    <div
                                        className={`rounded-lg p-2.5 ${
                                            importType === 'bank'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">Bank Statement</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            Official monthly transaction statements from the bank.
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <DialogFooter className="pt-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="button" onClick={() => setStep(2)}>
                                    Next: Set Batch Context
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {/* Step 2: Context Input */}
                    {step === 2 && (
                        <div className="space-y-4 pt-2">
                            {importType === 'internal' ? (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="date-issued" className="text-xs font-semibold">
                                            Date Issued <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            type="date"
                                            id="date-issued"
                                            value={dateIssued}
                                            onChange={(e) => setDateIssued(e.target.value)}
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            The reference date for this batch of check disbursements.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="disbursement-week" className="text-xs font-semibold">
                                            Disbursement Week Number <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            id="disbursement-week"
                                            min={1}
                                            placeholder="Enter week number (e.g. 1, 2, 15, 32...)"
                                            value={disbursementWeek}
                                            onChange={(e) => setDisbursementWeek(e.target.value)}
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Weekly period assigned to these checks (e.g. 1, 2, 15, 30+).
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bank-month" className="text-xs font-semibold">
                                            Bank Statement Month <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            type="month"
                                            id="bank-month"
                                            value={bankMonth}
                                            onChange={(e) => setBankMonth(e.target.value)}
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Year and month corresponding to this bank statement.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                                    {error}
                                </p>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setError(null);
                                        setStep(1);
                                    }}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (importType === 'internal' && (!dateIssued || !disbursementWeek)) {
                                            setError('Please provide both Date Issued and Week Number.');
                                            return;
                                        }
                                        if (importType === 'bank' && !bankMonth) {
                                            setError('Please select the Bank Statement Month.');
                                            return;
                                        }
                                        setError(null);
                                        setStep(3);
                                    }}
                                >
                                    Next: Select File
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {/* Step 3: File Selection */}
                    {step === 3 && (
                        <form onSubmit={handleNextOrPreview} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="file-input" className="text-xs font-semibold">
                                    Spreadsheet File (.xlsx, .xls, .csv) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="file"
                                    id="file-input"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    {importType === 'internal'
                                        ? 'Recommended: Excel file starting at Row 6 with Check No, Amount, Payee, etc.'
                                        : 'Recommended: Excel file starting at Row 1 with Transaction Date, Debit/Credit, Balance.'}
                                </p>
                            </div>

                            {error && (
                                <p className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                                    {error}
                                </p>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setError(null);
                                        setStep(2);
                                    }}
                                    disabled={isPreviewing}
                                >
                                    Back
                                </Button>
                                <Button type="submit" disabled={!selectedFile || isPreviewing}>
                                    {isPreviewing ? 'Reading Headers...' : 'Next: Map Columns'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}

                    {/* Step: Column Mapping */}
                    {step === 'mapping' && (
                        <div className="space-y-4 pt-2">
                            <div className="rounded-md bg-muted p-3 text-xs leading-5">
                                <p className="font-medium text-foreground">Detected Headers in File:</p>
                                <p className="mt-1 break-words text-muted-foreground">
                                    {headers.length ? headers.join(', ') : 'No headers detected.'}
                                </p>
                            </div>

                            {requiredMissing.length > 0 && (
                                <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs leading-5">
                                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                                        Unmapped Required Fields:
                                    </p>
                                    <p className="mt-1 text-amber-700 dark:text-amber-300">
                                        {requiredMissing.map((t) => t.label).join(', ')}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                                {currentMappingTargets.map((target) => (
                                    <div
                                        key={target.key}
                                        className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-center"
                                    >
                                        <div className="text-sm font-medium">
                                            {target.label}
                                            {target.required && <span className="ml-1 text-red-500">*</span>}
                                        </div>
                                        <div>
                                            <Select
                                                value={mapping[target.key] || '__none__'}
                                                onValueChange={(value) =>
                                                    setMapping((prev) => ({
                                                        ...prev,
                                                        [target.key]: value === '__none__' ? '' : value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger id={target.key}>
                                                    <SelectValue placeholder="Select a header" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">
                                                        <span className="text-red-500">Not Mapped</span>
                                                    </SelectItem>
                                                    {headers.map((header) => (
                                                        <SelectItem key={header} value={header}>
                                                            {header}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <p className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                                    {error}
                                </p>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setError(null);
                                        setStep(3);
                                    }}
                                    disabled={isSavingMapping || isAnalyzing}
                                >
                                    Back
                                </Button>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isSavingMapping || isAnalyzing}
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    onClick={handleSaveMappingAndAnalyze}
                                    disabled={isSavingMapping || isAnalyzing}
                                >
                                    {isSavingMapping || isAnalyzing ? 'Analyzing File...' : 'Review Import Audit'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {/* Step: Import Audit & Duplicate Verification */}
                    {step === 'audit' && analysisResult && (
                        <ImportAuditPreviewStep
                            analysis={analysisResult}
                            resolutions={resolutions}
                            onResolutionsChange={setResolutions}
                            onConfirm={handleConfirmImport}
                            onBack={() => setStep('mapping')}
                            isSubmitting={isImporting}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <ImportSummaryModal
                isOpen={isSummaryOpen}
                onClose={() => setIsSummaryOpen(false)}
                summary={summaryData}
            />
        </>
    );
}