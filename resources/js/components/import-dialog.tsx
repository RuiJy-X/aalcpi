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
import productions from '@/routes/productions';
import { Input } from './ui/input';

export function ImportDialog({}: {}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
    };

    const handleImport = () => {
        if (!selectedFile) return;

        router.post(
            productions.import.url(),
            { file: selectedFile },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setIsImporting(true),
                onFinish: () => setIsImporting(false),
                onSuccess: () => {
                    setSelectedFile(null);
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
                if (!open) setSelectedFile(null);
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
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                    <DialogDescription>
                        Import data and add it to the database
                    </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                    <Field>
                        <Label htmlFor="file-input">File</Label>
                        <Input
                            type="file"
                            id="file-input"
                            onChange={handleFileChange}
                        />
                    </Field>
                </FieldGroup>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleImport}
                        disabled={!selectedFile || isImporting}
                    >
                        {isImporting ? 'Importing...' : 'Import'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
