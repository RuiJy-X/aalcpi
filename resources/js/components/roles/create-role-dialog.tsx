import React from 'react';
import { useForm } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field } from '@/components/ui/field';
import { PermissionChecklist } from '@/components/permissions/permission-checklist';
import type { PermissionItem } from '@/components/types/usertypes';
import { store as rolesStore } from '@/routes/roles';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    permissionGroups: Record<string, PermissionItem[]>;
    resourceLabels: Record<string, string>;
};

export default function CreateRoleDialog({
    open,
    onOpenChange,
    permissionGroups,
    resourceLabels,
}: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            permissions: [] as string[],
        });

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(nextOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(rolesStore().url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                <DialogHeader className="shrink-0 border-b px-6 py-4">
                    <DialogTitle>Create a new role</DialogTitle>
                    <DialogDescription>
                        Name the role and assign the permissions it should
                        include.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="create-role-form"
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="space-y-5 overflow-y-auto px-6 py-4">
                        <Field>
                            <Label>Role name</Label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g. operations_lead"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </Field>

                        <div>
                            <Label className="mb-2 block">Permissions</Label>
                            <PermissionChecklist
                                permissionGroups={permissionGroups}
                                resourceLabels={resourceLabels}
                                selected={data.permissions}
                                onChange={(permissions) =>
                                    setData('permissions', permissions)
                                }
                            />
                            {errors.permissions && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.permissions}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 border-t px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
