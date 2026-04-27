import { router } from '@inertiajs/react';
import { Import } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '../ui/input';
import { ImportConfig } from './import-config';

export function ImportDialog({ config }: { config: ImportConfig }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [cropYear, setCropYear] = useState('');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
    };

    const handleImport = () => {
        if (!selectedFile) return;
        if (config.requireCropYear && cropYear.trim() === '') return;

        const payload: { file: File; crop_year?: string } = {
            file: selectedFile,
        };

        if (config.requireCropYear) {
            payload.crop_year = cropYear.trim();
        }

        router.post(config.route, payload, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setIsImporting(true),
            onFinish: () => setIsImporting(false),
            onSuccess: () => {
                setSelectedFile(null);
                setCropYear('');
                setIsOpen(false);
            },
        });
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    setSelectedFile(null);
                    setCropYear('');
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
            <DialogContent className="bg-card sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                    <DialogDescription>
                        Import data and add it to the database
                    </DialogDescription>
                </DialogHeader>
                {config.headerGuide && config.headerGuide.length > 0 && (
                    <div className="rounded-md border p-3 text-xs leading-5">
                        <p className="font-medium">Recommended headers</p>
                        <p className="mt-1 text-muted-foreground">
                            Use snake_case column names when possible.
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
                            <Label htmlFor="crop-year-input">Crop Year</Label>
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
                </FieldGroup>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleImport}
                        disabled={
                            !selectedFile ||
                            isImporting ||
                            (config.requireCropYear && cropYear.trim() === '')
                        }
                    >
                        {isImporting ? 'Importing...' : 'Import'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
