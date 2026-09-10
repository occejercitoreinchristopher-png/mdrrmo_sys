import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    side?: 'left' | 'right';
    width?: string;
}

export default function Drawer({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    side = 'right',
    width = 'w-full max-w-md',
    noPadding = false,
}: DrawerProps & { noPadding?: boolean }) {
    const slideIn =
        side === 'right'
            ? 'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right'
            : 'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left';

    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-900/30 dark:bg-[#080d1a]/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className={clsx(
                        'fixed top-0 bottom-0 z-50 flex flex-col',
                        'bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-2xl border-slate-200/50 dark:border-white/10 shadow-2xl',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
                        slideIn,
                        width,
                        side === 'right'
                            ? 'right-0 border-l'
                            : 'left-0 border-r',
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-white/10 flex-shrink-0 bg-slate-50/50 dark:bg-white/5">
                        <div>
                            {title && (
                                <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {title}
                                </Dialog.Title>
                            )}
                            {description && (
                                <Dialog.Description className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    {description}
                                </Dialog.Description>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className={clsx("flex-1 overflow-y-auto", !noPadding && "p-6")}>{children}</div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200/50 dark:border-white/10 flex-shrink-0 bg-slate-50/50 dark:bg-white/5">
                            {footer}
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
