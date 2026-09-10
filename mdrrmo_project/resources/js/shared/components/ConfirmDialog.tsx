import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    description = 'Are you sure you want to proceed? This action cannot be undone.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading = false,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{description}</p>
                </div>
            </div>
        </Modal>
    );
}
