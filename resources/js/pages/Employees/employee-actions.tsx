import React from 'react';
import { EmployeeType } from './employeeTypes';

import { router } from '@inertiajs/react';
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
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { destroy as employeeDelete } from '@/routes/employees';

const EmployeeActions = ({ employee }: { employee: EmployeeType }) => {
    const [isDeleteOpen, setDeleteOpen] = React.useState(false);

    const handleDelete = () => {
        router.delete(employeeDelete(employee.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                window.alert('Employee deleted successfully.');
            },
        });
    };

    return (
        <div
            className="flex justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
        >
            <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" size="xs" aria-label="Delete">
                        <Trash2 className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete employee</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete the employee record.
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
};

export default EmployeeActions;
