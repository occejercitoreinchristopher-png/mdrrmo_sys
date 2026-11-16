import { useState, useEffect } from 'react';
import Modal from '@/shared/components/Modal';
import { Tag, AlertCircle } from 'lucide-react';
import { formatTitleCase } from '@/dispatcher/data/incidentCategories';

interface AddCategoryModalProps {
    open: boolean;
    onClose: () => void;
    onAddCategory: (categoryName: string) => void;
    existingCategories: string[];
}

export default function AddCategoryModal({
    open,
    onClose,
    onAddCategory,
    existingCategories = [],
}: AddCategoryModalProps) {
    const [categoryName, setCategoryName] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setCategoryName('');
            setError(null);
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = categoryName.trim();
        if (!trimmed) {
            setError('Please enter a category name.');
            return;
        }

        const formatted = formatTitleCase(trimmed);

        const isDuplicate = existingCategories.some(
            (c) => c.toLowerCase() === formatted.toLowerCase()
        );
        if (isDuplicate) {
            setError(`Category "${formatted}" already exists.`);
            return;
        }

        onAddCategory(formatted);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add Incident Category"
            description="Define a new incident category to classify emergency and operational records."
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                        Incident Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => {
                                setCategoryName(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="e.g. Public Safety, Search and Rescue"
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all shadow-xs capitalize"
                            autoFocus
                            required
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-500 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                    >
                        Add Category
                    </button>
                </div>
            </form>
        </Modal>
    );
}
