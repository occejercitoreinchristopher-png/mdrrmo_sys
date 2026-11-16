import { useState, useEffect } from 'react';
import Modal from '@/shared/components/Modal';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { formatTitleCase } from '@/dispatcher/data/incidentCategories';

interface AddIncidentTypeModalProps {
    open: boolean;
    onClose: () => void;
    onAddIncidentType: (category: string, incidentName: string) => void;
    categories: string[];
    defaultCategory?: string;
}

export default function AddIncidentTypeModal({
    open,
    onClose,
    onAddIncidentType,
    categories = [],
    defaultCategory = '',
}: AddIncidentTypeModalProps) {
    const [selectedCategory, setSelectedCategory] = useState(defaultCategory || '');
    const [incidentName, setIncidentName] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            let matchedCat = '';
            if (defaultCategory && defaultCategory !== 'all') {
                const found = categories.find(
                    (c) => c.trim().toLowerCase() === defaultCategory.trim().toLowerCase()
                );
                matchedCat = found || defaultCategory;
            } else if (categories.length > 0) {
                matchedCat = categories[0];
            }
            setSelectedCategory(matchedCat);
            setIncidentName('');
            setError(null);
        }
    }, [open, defaultCategory, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = incidentName.trim();

        if (!selectedCategory || selectedCategory === '--Select Category--') {
            setError('Please select an incident category.');
            return;
        }

        if (!trimmedName) {
            setError('Please enter an incident name.');
            return;
        }

        const formattedInc = formatTitleCase(trimmedName);
        onAddIncidentType(selectedCategory, formattedInc);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add Incident Type"
            description="Define a new specific incident or chief complaint under a category."
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* 1. Category Dropdown */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                        Incident Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                if (error) setError(null);
                            }}
                            className="w-full text-xs sm:text-sm py-2.5 pl-3.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-xs"
                            required
                        >
                            <option value="">--Select Category--</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                {/* 2. Incident Name Input */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                        Incident Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={incidentName}
                        onChange={(e) => {
                            setIncidentName(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="e.g. Mountain Search and Rescue, Traffic Incident"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-xs capitalize"
                        required
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

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
                        className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                        Add Incident Type
                    </button>
                </div>
            </form>
        </Modal>
    );
}
