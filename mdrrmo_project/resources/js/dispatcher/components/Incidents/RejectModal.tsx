import { useForm } from '@inertiajs/react';
import Button from '@/shared/components/Button';
import Select from '@/shared/components/Select';
import Textarea from '@/shared/components/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/dialog';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

const REJECTION_CATEGORIES = [
    { value: 'prank', label: '🚨 Intentional Prank / Hoax Call' },
    { value: 'false_alarm', label: '⚠️ False Alarm / Accidental Dial' },
    { value: 'duplicate', label: '📋 Duplicate Incident Report' },
    { value: 'out_of_jurisdiction', label: '🗺️ Out of Jurisdiction (Outside Opol)' },
    { value: 'test_drill', label: '🧪 Drill / System Test' },
    { value: 'other', label: '💬 Other Reason' },
];

export default function RejectModal({ incident, open, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        rejection_category: 'prank',
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                        Reject Incident #{incident?.id ?? '...'}
                    </DialogTitle>
                    <DialogDescription>
                        Select the official rejection category and provide a reason. This record will be permanently saved.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <Select
                        label="Rejection Category"
                        value={data.rejection_category}
                        onChange={(val) => setData('rejection_category', val)}
                        options={REJECTION_CATEGORIES}
                        required
                    />

                    {data.rejection_category === 'prank' && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold block">Caller Will Be Flagged</span>
                                This will permanently log a <strong>Confirmed Prank Call</strong> on this caller's record to warn dispatchers during any future reports.
                            </div>
                        </div>
                    )}

                    <Textarea
                        label="Detailed Explanation / Reason"
                        value={data.rejection_reason}
                        onChange={(e) => setData('rejection_reason', e.target.value)}
                        error={errors.rejection_reason}
                        placeholder={
                            data.rejection_category === 'prank'
                                ? 'Describe caller behavior or false information (e.g. Caller was laughing and gave fake address)...'
                                : 'Enter reason for rejection...'
                        }
                        rows={3}
                        required
                        autoFocus
                    />

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

