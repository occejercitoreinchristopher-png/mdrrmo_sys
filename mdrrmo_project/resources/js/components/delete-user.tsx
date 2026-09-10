import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import InputError from '@/components/input-error';

export default function DeleteUser() {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleDelete = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.delete('/settings/profile', {
            data: { password },
            onError: (errors) => {
                setError(errors.password ?? 'Something went wrong.');
                setProcessing(false);
            },
        });
    };

    if (!confirmOpen) {
        return (
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                Delete Account
            </Button>
        );
    }

    return (
        <form onSubmit={handleDelete} className="space-y-4 max-w-sm">
            <p className="text-sm text-muted-foreground">
                Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm.
            </p>
            <div className="space-y-1.5">
                <Label htmlFor="delete-password">Password</Label>
                <Input
                    id="delete-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                />
                <InputError message={error} />
            </div>
            <div className="flex gap-2">
                <Button type="submit" variant="destructive" disabled={processing}>
                    {processing ? 'Deleting...' : 'Confirm Delete'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setConfirmOpen(false); setError(''); }}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
