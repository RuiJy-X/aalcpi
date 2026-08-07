import React from 'react';
import { EmployeeType } from './employeeTypes';

import { Link, router } from '@inertiajs/react';
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
import { destroy as employeeDelete, show as employeeShow, edit as employeeEdit } from '@/routes/employees';

const EmployeeActions = ({ employee }: { employee: EmployeeType }) => {
    const [isDeleteOpen, setDeleteOpen] = React.useState(false);

    const handleDelete = () => {
        router.delete(employeeDelete(employee.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
            },
        });
    };

    return (
        <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
        >
            <Button variant="ghost" size="xs" asChild aria-label="View Profile">
                <Link href={employeeShow(employee.id).url}>
                    <Eye className="size-4 text-muted-foreground hover:text-foreground" />
                </Link>
            </Button>

            <Button variant="ghost" size="xs" asChild aria-label="Edit Profile Setup">
                <Link href={employeeEdit(employee.id).url}>
                    <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                </Link>
            </Button>

            <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="xs" aria-label="Delete">
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete employee record</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {employee.name}? This will permanently remove their profile record.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeeActions;
