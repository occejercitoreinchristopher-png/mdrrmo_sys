import { clsx } from 'clsx';

export default function LoadingSpinner({
    size = 'md',
    overlay = false,
    message = 'Loading...',
}) {
    const sizes = {
        sm: 'h-5 w-5 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-4',
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <div
                className={clsx(
                    'rounded-full border-blue-500/30 border-t-blue-500 animate-spin',
                    sizes[size],
                )}
            />
            {message && (
                <p className="text-sm text-slate-400 animate-pulse">{message}</p>
            )}
        </div>
    );

    if (overlay) {
        return (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
                {spinner}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-16">{spinner}</div>
    );
}
