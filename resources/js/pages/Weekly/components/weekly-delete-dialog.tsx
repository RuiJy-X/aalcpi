import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const weeklyDeleteRoute = '/Weekly/delete-by-crop-year-week';

export function WeeklyDeleteDialog({
    cropYears,
    weeksByCropYear,
    selectedCropYear,
    selectedWeek,
    onDeleted,
}: {
    cropYears: string[];
    weeksByCropYear: Record<string, string[]>;
    selectedCropYear: string;
    selectedWeek: string;
    onDeleted?: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [cropYearToDelete, setCropYearToDelete] = useState('');
    const [weekToDelete, setWeekToDelete] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const weekOptions = useMemo(() => {
        if (!cropYearToDelete) {
            return [];
        }

        return weeksByCropYear[cropYearToDelete] ?? [];
    }, [cropYearToDelete, weeksByCropYear]);

    const handleCropYearChange = (nextCropYear: string) => {
        setCropYearToDelete(nextCropYear);

        const allowedWeeks = weeksByCropYear[nextCropYear] ?? [];
        if (allowedWeeks.includes(weekToDelete)) {
            return;
        }

        setWeekToDelete('');
    };

    const handleDelete = () => {
        if (!cropYearToDelete || !weekToDelete) {
            return;
        }

        router.delete(weeklyDeleteRoute, {
            data: {
                crop_year: cropYearToDelete,
                week: weekToDelete,
            },
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                setIsOpen(false);
                onDeleted?.();
            },
        });
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(nextOpen) => {
                setIsOpen(nextOpen);
                if (nextOpen) {
                    setCropYearToDelete(
                        selectedCropYear !== 'all' ? selectedCropYear : '',
                    );
                    setWeekToDelete(selectedWeek !== 'all' ? selectedWeek : '');
                } else {
                    setCropYearToDelete('');
                    setWeekToDelete('');
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    Delete by week
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete weekly data</DialogTitle>
                    <DialogDescription>
                        This will permanently delete weekly PDFs and records for
                        the selected crop year and week.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="delete-weekly-crop-year">Crop year</Label>
                        <Select
                            value={cropYearToDelete}
                            onValueChange={handleCropYearChange}
                        >
                            <SelectTrigger id="delete-weekly-crop-year">
                                <SelectValue placeholder="Select crop year" />
                            </SelectTrigger>
                            <SelectContent>
                                {cropYears.map((cropYear) => (
                                    <SelectItem key={cropYear} value={cropYear}>
                                        {cropYear}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="delete-weekly-week">Week</Label>
                        <Select
                            value={weekToDelete}
                            onValueChange={setWeekToDelete}
                            disabled={!cropYearToDelete}
                        >
                            <SelectTrigger id="delete-weekly-week">
                                <SelectValue placeholder="Select week" />
                            </SelectTrigger>
                            <SelectContent>
                                {weekOptions.map((week) => (
                                    <SelectItem key={week} value={week}>
                                        Week {week}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!cropYearToDelete || !weekToDelete || isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
