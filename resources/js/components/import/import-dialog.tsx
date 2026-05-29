import { router } from '@inertiajs/react';
import { Import } from 'lucide-react';
import { useMemo, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
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
import { Field, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '../ui/input';
import {
    ImportConfig,
    type ImportExtraField,
    type ImportTarget,
} from './import-config';

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
        if (data.errors) {
            const errorDetails = Object.entries(data.errors)
                .map(([key, value]) => {
                    const msgs = Array.isArray(value) ? value : [value];
                    return `${key}: ${msgs.join(', ')}`;
                })
                .join('; ');
            if (errorDetails) {
                errorMsg += ` (${errorDetails})`;
            }
        }
        throw new Error(errorMsg);
    }

    return data as Promise<T>;
};

export function ImportDialog({ config }: { config: ImportConfig }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSavingMapping, setIsSavingMapping] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [cropYear, setCropYear] = useState('');
    const [step, setStep] = useState<'select' | 'mapping'>('select');
    const [headers, setHeaders] = useState<string[]>([]);
    const [signature, setSignature] = useState('');
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [extraFields, setExtraFields] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    const canMap = Boolean(
        config.mappingType &&
        config.mappingTargets &&
        config.mappingTargets.length,
    );

    const groupedTargets = useMemo(() => {
        const targets = config.mappingTargets ?? [];
        const groups: Record<string, ImportTarget[]> = {};

        targets.forEach((target) => {
            const group = target.group ?? 'Fields';
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(target);
        });

        return Object.entries(groups);
    }, [config.mappingTargets]);

    const requiredMissing = useMemo(() => {
        if (!config.mappingTargets) return [];

        return config.mappingTargets.filter(
            (target) => target.required && !mapping[target.key],
        );
    }, [config.mappingTargets, mapping]);

    const resetDialog = () => {
        setSelectedFile(null);
        setCropYear('');
        setStep('select');
        setHeaders([]);
        setSignature('');
        setMapping({});
        setExtraFields({});
        setError(null);
        setIsPreviewing(false);
        setIsSavingMapping(false);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
        setStep('select');
        setHeaders([]);
        setSignature('');
        setMapping({});
        setExtraFields({});
        setError(null);
    };

    const submitImport = (mappingId?: number) => {
        if (!selectedFile) return;
        if (config.requireCropYear && cropYear.trim() === '') return;

        if (canMap && !mappingId) {
            setError('Missing mapping.');
            return;
        }

        const payload: {
            file: File;
            crop_year?: string;
            mapping_id?: number;
            [key: string]: unknown;
        } = {
            file: selectedFile,
        };

        if (config.requireCropYear) {
            payload.crop_year = cropYear.trim();
        }

        if (mappingId) {
            payload.mapping_id = mappingId;
        }

        (config.extraFields ?? []).forEach((field) => {
            const value = extraFields[field.key];
            if (value !== undefined && value !== '') {
                payload[field.key] = value;
            }
        });

        router.post(config.route, payload, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setIsImporting(true),
            onFinish: () => setIsImporting(false),
            onSuccess: () => {
                resetDialog();
                setIsOpen(false);
            },
        });
    };

    const handlePreview = async () => {
        if (!selectedFile) return;
        if (config.requireCropYear && cropYear.trim() === '') return;

        if (!canMap) {
            submitImport();
            return;
        }

        setIsPreviewing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('import_type', config.mappingType ?? '');

            const preview = await postFormData<MappingPreviewResponse>(
                '/Imports/preview',
                formData,
            );

            const nextHeaders = (preview.headers ?? []).filter(
                (header) => header.trim() !== '',
            );
            const nextMapping = (config.mappingTargets ?? []).reduce(
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
            setStep('mapping');
        } catch (err) {
            const error = err as Error;
            setError(
                `Failed to read the file headers. ${error.message || ''}`.trim(),
            );
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleSaveMapping = async () => {
        if (!selectedFile) return;
        if (!canMap) return;

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
                    import_type: config.mappingType,
                    header_signature: signature,
                    headers,
                    mapping,
                },
            );

            submitImport(response.mapping_id);
        } catch (err) {
            const error = err as Error;
            setError(
                `Failed to save the mapping: ${error.message || 'Unknown error'}`,
            );
        } finally {
            setIsSavingMapping(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    resetDialog();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline">
                    <i>
                        <Import />
                    </i>
                    Import Data
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'mapping' ? 'Map Columns' : 'Import Data'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'mapping'
                            ? 'Match each database field to a column from the file.'
                            : 'Import data and add it to the database'}
                    </DialogDescription>
                </DialogHeader>
                {step === 'select' && (
                    <>
                        {config.headerGuide &&
                            config.headerGuide.length > 0 && (
                                <div className="rounded-md border p-3 text-xs leading-5">
                                    <p className="font-medium">
                                        Recommended headers
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                        Use snake_case column names when
                                        possible.
                                    </p>
                                    <p className="mt-2 break-words text-muted-foreground">
                                        {config.headerGuide.join(', ')}
                                    </p>
                                </div>
                            )}
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="file-input">File</Label>
                                <Input
                                    type="file"
                                    id="file-input"
                                    onChange={handleFileChange}
                                />
                            </Field>
                            {config.requireCropYear && (
                                <Field>
                                    <Label htmlFor="crop-year-input">
                                        Crop Year
                                    </Label>
                                    <Input
                                        type="text"
                                        id="crop-year-input"
                                        placeholder="2025-2026"
                                        value={cropYear}
                                        onChange={(event) =>
                                            setCropYear(event.target.value)
                                        }
                                    />
                                </Field>
                            )}
                            {config.extraFields?.map(
                                (field: ImportExtraField) => (
                                    <Field key={field.key}>
                                        <Label htmlFor={field.key}>
                                            {field.label}
                                        </Label>
                                        <Input
                                            type={field.type ?? 'text'}
                                            id={field.key}
                                            placeholder={field.placeholder}
                                            step={field.step}
                                            value={extraFields[field.key] ?? ''}
                                            onChange={(event) =>
                                                setExtraFields((prev) => ({
                                                    ...prev,
                                                    [field.key]:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </Field>
                                ),
                            )}
                        </FieldGroup>
                    </>
                )}
                {step === 'mapping' && (
                    <div className="max-h-[400px] space-y-4 overflow-y-auto">
                        <div className="rounded-md border p-3 text-xs leading-5">
                            <p className="font-medium">Detected headers</p>
                            <p className="mt-2 break-words text-muted-foreground">
                                {headers.length
                                    ? headers.join(', ')
                                    : 'No headers detected.'}
                            </p>
                        </div>
                        {requiredMissing.length > 0 && (
                            <div className="rounded-md border border-yellow-500 bg-yellow-50 p-3 text-xs leading-5">
                                <p className="font-medium text-yellow-900">
                                    Unmapped required fields will default to 0
                                </p>
                                <p className="mt-2 text-yellow-800">
                                    {requiredMissing
                                        .map((t) => t.label)
                                        .join(', ')}
                                </p>
                            </div>
                        )}
                        {groupedTargets.map(([group, targets]) => (
                            <div key={group} className="rounded-md border p-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    {group}
                                </p>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="hidden text-xs font-semibold text-muted-foreground uppercase md:grid md:grid-cols-2 md:gap-3">
                                        <span>Target field</span>
                                        <span>File header</span>
                                    </div>
                                    {targets.map((target) => (
                                        <div
                                            key={target.key}
                                            className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-center"
                                        >
                                            <div className="text-sm font-medium">
                                                {target.label}
                                                {target.required && (
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <Label
                                                    className="sr-only"
                                                    htmlFor={target.key}
                                                >
                                                    {target.label}
                                                </Label>
                                                <Select
                                                    value={
                                                        mapping[target.key] ||
                                                        '__none__'
                                                    }
                                                    onValueChange={(value) =>
                                                        setMapping((prev) => ({
                                                            ...prev,
                                                            [target.key]:
                                                                value ===
                                                                '__none__'
                                                                    ? ''
                                                                    : value,
                                                        }))
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={target.key}
                                                    >
                                                        <SelectValue placeholder="Select a header" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">
                                                            <span className="text-red-500">
                                                                Not Mapped
                                                            </span>
                                                        </SelectItem>
                                                        {headers.map(
                                                            (header) => (
                                                                <SelectItem
                                                                    key={header}
                                                                    value={
                                                                        header
                                                                    }
                                                                >
                                                                    {header}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {error && (
                    <p className="text-sm text-red-500" role="alert">
                        {error}
                    </p>
                )}
                <DialogFooter>
                    {step === 'mapping' ? (
                        <Button
                            variant="outline"
                            onClick={() => setStep('select')}
                        >
                            Back
                        </Button>
                    ) : null}
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    {step === 'mapping' ? (
                        <Button
                            onClick={handleSaveMapping}
                            disabled={isImporting || isSavingMapping}
                        >
                            {isSavingMapping ? 'Saving...' : 'Save & Import'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handlePreview}
                            disabled={
                                !selectedFile ||
                                isImporting ||
                                isPreviewing ||
                                (config.requireCropYear &&
                                    cropYear.trim() === '')
                            }
                        >
                            {isPreviewing
                                ? 'Checking...'
                                : canMap
                                  ? 'Continue'
                                  : 'Import'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
