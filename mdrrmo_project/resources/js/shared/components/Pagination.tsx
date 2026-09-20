import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface PaginationProps {
    currentPage?: number;
    current_page?: number;
    lastPage?: number;
    last_page?: number;
    total: number;
    perPage?: number;
    per_page?: number;
    onPageChange: (page: number) => void;
}

export default function Pagination(props: PaginationProps) {
    const currentPage = props.currentPage ?? props.current_page ?? 1;
    const lastPage = props.lastPage ?? props.last_page ?? 1;
    const perPage = props.perPage ?? props.per_page ?? 15;
    const total = props.total ?? 0;
    const onPageChange = props.onPageChange;

    if (lastPage <= 1) return null;

    const from = Math.max(1, (currentPage - 1) * perPage + 1);
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
        'inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer';

    return (
        <div className="flex items-center justify-end gap-4 mt-4">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={clsx(
                        btnBase,
                        'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed',
                    )}
                    title="Previous page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {getPages().map((page, i) =>
                    typeof page === 'string' ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="text-slate-400 px-1 text-xs"
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
                                    ? 'bg-[#F61509] text-white font-bold shadow-md shadow-[#F61509]/25'
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
                    title="Next page"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
