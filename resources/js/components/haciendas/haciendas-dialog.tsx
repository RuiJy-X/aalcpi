import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { PlanterRow } from '@/components/planters/planters-table-types';
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
import { create as createHacienda } from '@/routes/haciendas';
import HaciendaCombobox from '@/components/haciendas/components/haciendacombobox';

export function HaciendaDialog({
    planterNames,
    planters,
}: {
    planterNames: string[];
    planters: Array<Pick<PlanterRow, 'id' | 'name'>>;
}) {
    const [name, setName] = useState<string | undefined>('');
    const [id, setId] = useState<string>('');
    const onValueChange = (value: string) => {
        setName(value);
        setId(String(planters.find((planter) => planter.name === value)?.id));
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <i>
                        <Plus />
                    </i>
                    Add Haciendas
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Choose Planter</DialogTitle>
                    <DialogDescription>
                        Choose a planter that you want to add a Hacienda to.
                    </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                    <Field>
                        <Label htmlFor="name-1">Name</Label>
                        <HaciendaCombobox
                            items={planterNames}
                            value={name}
                            onValueChange={(value) => onValueChange(value)}
                        />
                    </Field>
                </FieldGroup>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            onClick={() => onValueChange('')}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            router.get(createHacienda(id).url);
                        }}
                    >
                        Go
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
