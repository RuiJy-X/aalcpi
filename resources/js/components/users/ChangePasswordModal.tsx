import React, { useState } from 'react';
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
import { KeyRound, Eye, EyeOff, Lock, Check } from 'lucide-react';
import { update as userUpdate } from '@/routes/users';
import type { UserRow } from '@/components/types/usertypes';

type Props = {
    user: UserRow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ChangePasswordModal({ user, open, onOpenChange }: Props) {
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm({
            password: '',
            password_confirmation: '',
        });

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
            clearErrors();
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
        onOpenChange(nextOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(userUpdate(user.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F0E5] text-[#1F4B32] dark:bg-emerald-950 dark:text-emerald-400">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">
                                Change Password
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Set a new password for{' '}
                                <span className="font-semibold text-foreground">
                                    {user?.name}
                                </span>{' '}
                                (@{user?.username}).
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* New Password */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="modal-new-password"
                            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                        >
                            New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="modal-new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder="Enter new password (min. 8 characters)"
                                className="pl-9 pr-10"
                                required
                            />
                            <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                }
                                className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
                            >
                                {showNewPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs font-medium text-destructive">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="modal-confirm-password"
                            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                        >
                            Confirm New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="modal-confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                placeholder="Confirm new password"
                                className="pl-9 pr-10"
                                required
                            />
                            <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <p className="text-xs font-medium text-destructive">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="blue"
                            disabled={processing}
                            className="font-semibold"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            {processing ? 'Updating...' : 'Update Password'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
