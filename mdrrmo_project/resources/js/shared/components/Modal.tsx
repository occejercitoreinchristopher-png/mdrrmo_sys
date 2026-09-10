import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { ReactNode } from 'react';

const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: keyof typeof sizes;
    footer?: ReactNode;
}

export default function Modal({
    open,
    onClose,
    title,
    description,
    children,
    size = 'md',
    footer,
}: ModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className={clsx(
                        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-50',
                        'bg-slate-800 border border-white/10 rounded-2xl shadow-2xl',
                        'max-h-[90vh] flex flex-col',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
                        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
                        sizes[size],
                    )}
                >
                    {/* Header */}
                    {Boolean(title || description) ? (
                        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                            <div>
                                {title && (
                                    <Dialog.Title className="text-lg font-semibold text-white">
                                        {title}
                                    </Dialog.Title>
                                )}
                                {description && (
                                    <Dialog.Description className="text-sm text-slate-400 mt-1">
                                        {description}
                                    </Dialog.Description>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">{children}</div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 shrink-0">
                            {footer}
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
