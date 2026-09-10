import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    lastPage,
    total,
    perPage,
    onPageChange,
}: PaginationProps) {
    if (lastPage <= 1) return null;

    const from = (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, total);

    const getPages = () => {
        const pages: (number | string)[] = [];
        const delta = 2;
        for (
            let i = Math.max(1, currentPage - delta);
            i <= Math.min(lastPage, currentPage + delta);
            i++
        ) {
            pages.push(i);
        }
        
        const firstElement = pages[0];
        if (typeof firstElement === 'number' && firstElement > 1) {
            pages.unshift('...');
            pages.unshift(1);
        }
        
        const lastElement = pages[pages.length - 1];
        if (typeof lastElement === 'number' && lastElement < lastPage) {
            pages.push('...');
            pages.push(lastPage);
        }
        
        return pages;
    };

    const btnBase =
        'inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200';

    return (
        <div className="flex items-center justify-between gap-4 mt-4">
            <p className="text-xs text-slate-500">
                Showing {from}–{to} of {total} records
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={clsx(
                        btnBase,
                        'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed',
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {getPages().map((page, i) =>
                    typeof page === 'string' ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="text-slate-500 px-1"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={clsx(
                                btnBase,
                                page === currentPage
                                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white',
                            )}
                        >
                            {page}
                        </button>
                    ),
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    className={clsx(
                        btnBase,
                        'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed',
                    )}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
