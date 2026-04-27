import { router } from '@inertiajs/react';

import { Eye, Pencil, Printer, Trash2 } from 'lucide-react';
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
import { show as productionShow } from '@/routes/productions';
import { destroy as productionDelete } from '@/routes/productions';
import { certification as productionCertification } from '@/routes/productions';
import type { ProductionRow } from '../planters/planters-table-types';
import { Button } from '../ui/button';

function ProductionActions({ production }: { production: ProductionRow }) {
    const [isDeleteOpen, setDeleteOpen] = React.useState(false);

    const handleDelete = () => {
        router.delete(productionDelete(production.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                window.alert('Production record deleted successfully.');
            },
        });
    };

    const handlePrint = () => {
        const params = new URLSearchParams({
            planter_code: production.planter_code ?? '',
            crop_year: production.crop_year ?? '',
        }).toString();

        const url = `${productionCertification().url}?${params}`;

        window.open(url, '_blank');
    };

    return (
        <div
            className="flex justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
        >
            <Button
                variant="secondary"
                size="xs"
                aria-label="Print yearly PDF"
                onClick={handlePrint}
            >
                <Printer className="size-4" />
            </Button>
            <Button
                variant="blue"
                size="xs"
                aria-label="Edit"
                onClick={() => router.get(productionShow(production.id).url)}
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
                        <DialogTitle>Delete production record</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete the production record.
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

export default ProductionActions;
