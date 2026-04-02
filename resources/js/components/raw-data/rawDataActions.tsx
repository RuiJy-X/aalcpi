import { router } from '@inertiajs/react';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

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
import {show as rawDataShow} from '@/routes/RawData';
import {destroy as rawDataDelete} from '@/routes/RawData';
import type { RawDataRow } from './raw-data-types';
import { show as productionShow } from '@/routes/productions';
import { destroy as productionDelete } from '@/routes/productions';
import type { ProductionRow } from '../planters/planters-table-types';
import { Button } from '../ui/button';

function RawDataActions({ rawData }: { rawData: RawDataRow }) {
    const [isDeleteOpen, setDeleteOpen] = React.useState(false);

    const handleDelete = () => {
        router.delete(rawDataDelete(rawData.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                window.alert('Raw data record deleted successfully.');
            },
        });
    };

    return (
        <div
            className="flex justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
        >
            <Button variant="secondary" size="xs" aria-label="Preview">
                <Eye className="size-4" />
            </Button>
            <Button
                variant="blue"
                size="xs"
                aria-label="Edit"
                onClick={() => router.get(rawDataShow(rawData.id).url)}
            >
                <Pencil className="size-4" />
            </Button>
            <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" size="xs" aria-label="Delete">
                        <Trash2 className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete raw data record</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete the raw data record.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default RawDataActions;
