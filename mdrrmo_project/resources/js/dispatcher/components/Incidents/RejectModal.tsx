import { useForm } from '@inertiajs/react';
import Button from '@/shared/components/Button';
import Select from '@/shared/components/Select';
import Textarea from '@/shared/components/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/dialog';

const REJECTION_CATEGORIES = [
    { value: 'prank', label: 'Intentional Prank / Hoax Call' },
    { value: 'false_alarm', label: 'False Alarm / Accidental Dial' },
    { value: 'duplicate', label: 'Duplicate Incident Report' },
    { value: 'other', label: 'Other Reason' },
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
            <DialogContent className="max-w-md p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1120] shadow-2xl">
                <DialogHeader className="pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#F61509]">
                        Incident #{incident?.id ?? '—'}
                    </span>
                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        Reject Incident Report
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Select the official classification and provide an explanation. This action is permanently recorded in the system audit log.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <Select
                        label="Rejection Classification"
                        value={data.rejection_category}
                        onChange={(val) => setData('rejection_category', val)}
                        options={REJECTION_CATEGORIES}
                        required
                    />

                    {data.rejection_category === 'prank' && (
                        <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-xl text-xs space-y-1">
                            <span className="font-semibold text-rose-900 dark:text-rose-200 block">
                                Caller Flagging Notice
                            </span>
                            <p className="text-rose-800/90 dark:text-rose-300 leading-relaxed">
                                This will log a Confirmed Prank Call on this caller's record to alert dispatchers during future reports.
                            </p>
                        </div>
                    )}

                    <Textarea
                        label="Detailed Justification / Explanation"
                        value={data.rejection_reason}
                        onChange={(e) => setData('rejection_reason', e.target.value)}
                        error={errors.rejection_reason}
                        placeholder={
                            data.rejection_category === 'prank'
                                ? 'Specify caller behavior, inaccurate details, or evidence of a hoax report...'
                                : 'State the reason for rejecting this report...'
                        }
                        rows={3}
                        required
                        autoFocus
                    />

                    <DialogFooter className="pt-2 gap-2">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            className="bg-[#F61509] hover:bg-[#d91208] text-white shadow-xs font-semibold"
                            disabled={processing}
                            loading={processing}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
