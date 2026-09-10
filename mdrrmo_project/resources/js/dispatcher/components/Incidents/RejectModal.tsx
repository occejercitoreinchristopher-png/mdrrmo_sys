import { useForm } from '@inertiajs/react';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/dialog';

export default function RejectModal({ incident, open, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        rejection_reason: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!incident) return;
        post(`/dispatcher/incidents/${incident.id}/reject`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Incident #{incident?.id ?? '...'}</DialogTitle>
                    <DialogDescription>
                        Please provide a valid reason for rejecting this incident report. This reason will be logged.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <Input
                        label="Rejection Reason"
                        value={data.rejection_reason}
                        onChange={(e) => setData('rejection_reason', e.target.value)}
                        error={errors.rejection_reason}
                        required
                        autoFocus
                    />

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            Reject Incident
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
