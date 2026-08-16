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
import { update as updatePasswordRoute } from '@/routes/user-password';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ChangePasswordModal({ open, onOpenChange }: Props) {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
            clearErrors();
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
        onOpenChange(nextOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(updatePasswordRoute().url, {
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
                            <DialogTitle className="text-lg font-bold">Change Password</DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter your current password and set a new secure password.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="modal-current-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Current Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="modal-current-password"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                placeholder="Enter current password"
                                className="pl-9 pr-10"
                                required
                            />
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.current_password && (
                            <p className="text-xs font-medium text-destructive">{errors.current_password}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="modal-new-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="modal-new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Enter new password"
                                className="pl-9 pr-10"
                                required
                            />
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs font-medium text-destructive">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="modal-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Confirm New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="modal-confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Confirm new password"
                                className="pl-9 pr-10"
                                required
                            />
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <p className="text-xs font-medium text-destructive">{errors.password_confirmation}</p>
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
