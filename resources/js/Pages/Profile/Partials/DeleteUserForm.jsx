import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Delete Account
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Once your account is deleted, all of its resources and data will be permanently deleted.
                </p>
            </header>

            <Button variant="destructive" onClick={confirmUserDeletion}>
                Delete Account
            </Button>

            {/* SHADCN DIALOG (MODAL REPLACEMENT) */}
            <Dialog open={confirmingUserDeletion} onOpenChange={setConfirmingUserDeletion}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                    <form onSubmit={deleteUser}>
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 dark:text-white">
                                Are you sure you want to delete your account?
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                                Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-6 space-y-2">
                            <Label htmlFor="password" className="sr-only">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Enter your password"
                                autoFocus
                            />
                            {errors.password && (
                                <p className="text-xs font-medium text-red-500 mt-1">{errors.password}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive" disabled={processing} className="ml-2">
                                Delete Account
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}