import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field } from '@/components/ui/field';
import { Pencil, DollarSign, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/date-range';
import type { MillingPeriodRow } from './milling-periods-types';
import {
    update as millingPeriodUpdate,
    store as millingPeriodStore,
} from '@/routes/milling-periods';

type MillingPeriodModalProps = {
    isOpen: boolean;
    onClose: () => void;
    millingPeriod: MillingPeriodRow | null;
    initialMode?: 'view' | 'edit' | 'create';
};

export function MillingPeriodModal({
    isOpen,
    onClose,
    millingPeriod,
    initialMode = 'view',
}: MillingPeriodModalProps) {
    const [mode, setMode] = useState<'view' | 'edit' | 'create'>(initialMode);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        week_no: '',
        crop_year: '',
        sugar_price: '',
        mol_price: '',
    });

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    useEffect(() => {
        setMode(initialMode);
        setErrors({});
        if (millingPeriod) {
            setFormData({
                week_no: String(millingPeriod.week_no ?? ''),
                crop_year: millingPeriod.crop_year ?? '',
                sugar_price: String(millingPeriod.sugar_price ?? ''),
                mol_price: String(millingPeriod.mol_price ?? ''),
            });
            if (millingPeriod.start_date) {
                setDateRange({
                    from: new Date(millingPeriod.start_date),
                    to: millingPeriod.end_date
                        ? new Date(millingPeriod.end_date)
                        : undefined,
                });
            } else {
                setDateRange(undefined);
            }
        } else {
            setFormData({
                week_no: '',
                crop_year: '',
                sugar_price: '',
                mol_price: '',
            });
            setDateRange(undefined);
        }
    }, [millingPeriod, initialMode, isOpen]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({});

        const startDateFormatted = dateRange?.from
            ? format(dateRange.from, 'yyyy-MM-dd')
            : '';
        const endDateFormatted = dateRange?.to
            ? format(dateRange.to, 'yyyy-MM-dd')
            : startDateFormatted;

        const payload = {
            week_no: Number(formData.week_no),
            crop_year: formData.crop_year,
            start_date: startDateFormatted,
            end_date: endDateFormatted,
            sugar_price: formData.sugar_price ? Number(formData.sugar_price) : null,
            mol_price: formData.mol_price ? Number(formData.mol_price) : null,
        };

        if (mode === 'create') {
            router.post(
                millingPeriodStore().url,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsSaving(false);
                        onClose();
                    },
                    onError: (errs) => {
                        setIsSaving(false);
                        setErrors(errs);
                    },
                },
            );
        } else if (millingPeriod) {
            router.put(
                millingPeriodUpdate(millingPeriod.id).url,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsSaving(false);
                        onClose();
                    },
                    onError: (errs) => {
                        setIsSaving(false);
                        setErrors(errs);
                    },
                },
            );
        }
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            return format(new Date(dateStr), 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-bold">
                        <div className="flex items-center gap-2">
                            {mode === 'view' ? (
                                <Eye className="h-5 w-5 text-primary" />
                            ) : (
                                <Pencil className="h-5 w-5 text-primary" />
                            )}
                            <span>
                                {mode === 'create'
                                    ? 'Add Milling Period'
                                    : mode === 'edit'
                                      ? `Edit Milling Period (Week ${millingPeriod?.week_no})`
                                      : `Milling Period: Week ${millingPeriod?.week_no} (${millingPeriod?.crop_year})`}
                            </span>
                        </div>
                        {mode === 'view' && millingPeriod && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMode('edit')}
                                className="mr-6 gap-1 text-xs"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </Button>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {mode === 'view' && millingPeriod ? (
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                    Crop Year
                                </span>
                                <p className="mt-0.5 font-medium text-foreground">
                                    {millingPeriod.crop_year || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                    Week Number
                                </span>
                                <p className="mt-0.5 font-medium text-foreground">
                                    Week {millingPeriod.week_no}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                    Period Date Range
                                </span>
                                <p className="mt-0.5 font-medium text-foreground">
                                    {formatDateDisplay(millingPeriod.start_date)} -{' '}
                                    {formatDateDisplay(millingPeriod.end_date)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 text-sm">
                            <div>
                                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase">
                                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                                    Sugar Price / LKG
                                </div>
                                <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                                    ₱{Number(millingPeriod.sugar_price).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase">
                                    <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                                    Molasses Price
                                </div>
                                <p className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400">
                                    ₱{Number(millingPeriod.mol_price).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field>
                                <Label htmlFor="modal_crop_year">Crop Year</Label>
                                <Input
                                    id="modal_crop_year"
                                    value={formData.crop_year}
                                    onChange={(e) =>
                                        handleInputChange('crop_year', e.target.value)
                                    }
                                    placeholder="e.g. 2025-2026"
                                    required
                                />
                                {errors.crop_year && (
                                    <p className="text-xs text-destructive">
                                        {errors.crop_year}
                                    </p>
                                )}
                            </Field>

                            <Field>
                                <Label htmlFor="modal_week_no">Week No.</Label>
                                <Input
                                    id="modal_week_no"
                                    type="number"
                                    min={1}
                                    max={53}
                                    value={formData.week_no}
                                    onChange={(e) =>
                                        handleInputChange('week_no', e.target.value)
                                    }
                                    placeholder="e.g. 14"
                                    required
                                />
                                {errors.week_no && (
                                    <p className="text-xs text-destructive">
                                        {errors.week_no}
                                    </p>
                                )}
                            </Field>

                            <Field className="sm:col-span-2">
                                <Label>Period Date Range</Label>
                                <DatePickerWithRange
                                    value={dateRange}
                                    onChange={(nextRange) => {
                                        setDateRange(nextRange);
                                        if (errors.start_date || errors.end_date) {
                                            setErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.start_date;
                                                delete next.end_date;
                                                return next;
                                            });
                                        }
                                    }}
                                    className="w-full"
                                />
                                {(errors.start_date || errors.end_date) && (
                                    <p className="text-xs text-destructive">
                                        {errors.start_date || errors.end_date}
                                    </p>
                                )}
                            </Field>

                            <Field>
                                <Label htmlFor="modal_sugar_price">Sugar Price / LKG</Label>
                                <Input
                                    id="modal_sugar_price"
                                    type="number"
                                    step="0.0001"
                                    min={0}
                                    value={formData.sugar_price}
                                    onChange={(e) =>
                                        handleInputChange('sugar_price', e.target.value)
                                    }
                                    placeholder="₱ 0.00"
                                />
                                {errors.sugar_price && (
                                    <p className="text-xs text-destructive">
                                        {errors.sugar_price}
                                    </p>
                                )}
                            </Field>

                            <Field>
                                <Label htmlFor="modal_mol_price">Molasses Price</Label>
                                <Input
                                    id="modal_mol_price"
                                    type="number"
                                    step="0.0001"
                                    min={0}
                                    value={formData.mol_price}
                                    onChange={(e) =>
                                        handleInputChange('mol_price', e.target.value)
                                    }
                                    placeholder="₱ 0.00"
                                />
                                {errors.mol_price && (
                                    <p className="text-xs text-destructive">
                                        {errors.mol_price}
                                    </p>
                                )}
                            </Field>
                        </div>

                        <DialogFooter className="mt-4 flex justify-end gap-2">
                            {mode === 'edit' ? (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setMode('view')}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" disabled={isSaving}>
                                {isSaving
                                    ? 'Saving...'
                                    : mode === 'create'
                                      ? 'Create Period'
                                      : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
