import { router } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const weeklyImportRoute = '/Weekly/import';

export function WeeklyImportDialog({
    isImporting,
    setIsImporting,
}: {
    isImporting: boolean;
    setIsImporting: (importing: boolean) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [week, setWeek] = useState('');
    const [cropYear, setCropYear] = useState('');

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(event.target.files?.[0] ?? null);
    };

    const handleImport = () => {
        if (!selectedFile || !week || !cropYear) {
            return;
        }

        router.post(
            weeklyImportRoute,
            {
                file: selectedFile,
                week,
                crop_year: cropYear,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setIsImporting(true),
                onFinish: () => setIsImporting(false),
                onSuccess: () => {
                    setSelectedFile(null);
                    setWeek('');
                    setCropYear('');
                    setIsOpen(false);
                },
            },
        );
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    setSelectedFile(null);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <i>
                        <Upload />
                    </i>
                    Import PDF
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Weekly Data</DialogTitle>
                    <DialogDescription>
                        Upload the weekly report PDF, then split and store the
                        generated planter files.
                    </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                    <Field>
                        <Label htmlFor="weekly-pdf-input">PDF File</Label>
                        <Input
                            id="weekly-pdf-input"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                        />
                    </Field>
                    <Field>
                        <Label htmlFor="weekly-week-input">Week</Label>
                        <Input
                            id="weekly-week-input"
                            type="text"
                            value={week}
                            onChange={(event) => setWeek(event.target.value)}
                            placeholder="1"
                        />
                    </Field>
                    <Field>
                        <Label htmlFor="weekly-crop-year-input">
                            Crop Year
                        </Label>
                        <Input
                            id="weekly-crop-year-input"
                            type="text"
                            value={cropYear}
                            onChange={(event) =>
                                setCropYear(event.target.value)
                            }
                            placeholder="2025-2026"
                        />
                    </Field>
                </FieldGroup>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleImport}
                        disabled={
                            !selectedFile || !week || !cropYear || isImporting
                        }
                    >
                        {isImporting ? 'Importing...' : 'Import'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
